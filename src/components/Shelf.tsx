import { useState, type CSSProperties, type HTMLAttributes } from 'react';
import { rectSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable';
import type { Category } from '../library/favorites';
import { getMyPlaylists, type Disc } from '../spotify/api';
import { errorMessage, SpotifyError } from '../spotify/errors';
import { CategorySelect } from './CategorySelect';
import { PlayOverlay } from './PlayOverlay';
import './Shelf.css';

type ShelfItem = Disc & { categoryId?: string | null };

interface ShelfProps {
  discs: ShelfItem[];
  /** Nome da lista para leitores de tela (ex.: uma prateleira por categoria). */
  label?: string;
  selectedId?: string;
  /** Clicar na capa (T40: abre os detalhes do disco). */
  onSelect: (disc: Disc) => void;
  onRemove?: (id: string) => void;
  /** Mostra o botão play sobre o disco selecionado. */
  onPlay?: () => void;
  playingId?: string;
  large?: boolean;
  /** Com as duas: seletor de categoria sob cada capa. */
  categories?: Category[];
  onMoveDisc?: (discId: string, categoryId: string | null) => void;
  /** Capas arrastáveis (T39): precisa estar dentro de um DndContext. */
  sortable?: boolean;
}

interface SlotProps extends Omit<ShelfProps, 'discs' | 'label' | 'large' | 'sortable'> {
  disc: ShelfItem;
  tagged: boolean;
}

interface DragBindings {
  ref?: (el: HTMLElement | null) => void;
  style?: CSSProperties;
  dragging?: boolean;
  handle?: HTMLAttributes<HTMLButtonElement>;
}

function SlotContent({ disc, tagged, selectedId, onSelect, onRemove, onPlay, playingId, categories, onMoveDisc, ref, style, dragging, handle }: SlotProps & DragBindings) {
  return (
    <li
      ref={ref}
      style={style}
      className={`shelf__slot${disc.id === selectedId ? ' shelf__slot--selected' : ''}${dragging ? ' shelf__slot--dragging' : ''}`}
    >
      {tagged && onMoveDisc && (
        <CategorySelect
          discName={disc.name}
          value={disc.categoryId ?? null}
          categories={categories ?? []}
          onChange={(categoryId) => onMoveDisc(disc.id, categoryId)}
        />
      )}
      <button
        type="button"
        {...handle}
        className="shelf__disc"
        title={`${disc.name} — ${disc.artist}`}
        aria-label={`Abrir ${disc.name}`}
        aria-pressed={disc.id === selectedId}
        onClick={() => onSelect(disc)}
      >
        {disc.imageUrl ? <img src={disc.imageUrl} alt="" draggable={false} /> : <span className="shelf__spine">{disc.name}</span>}
      </button>
      {onPlay && disc.id === selectedId && (
        <PlayOverlay discName={disc.name} playing={disc.id === playingId} onPlay={onPlay} />
      )}
      {onRemove && (
        <button
          type="button"
          className="shelf__remove"
          aria-label={`Tirar ${disc.name} da estante`}
          onClick={() => onRemove(disc.id)}
        >
          ×
        </button>
      )}
    </li>
  );
}

// Arrastar pela capa: o clique simples continua abrindo os detalhes (o arrasto só começa depois de ~8px).
function SortableSlot(props: SlotProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.disc.id });
  const style: CSSProperties = {
    transform: transform ? `translate3d(${Math.round(transform.x)}px, ${Math.round(transform.y)}px, 0)` : undefined,
    transition,
  };
  return (
    <SlotContent
      {...props}
      ref={setNodeRef}
      style={style}
      dragging={isDragging}
      handle={{ ...attributes, ...listeners } as HTMLAttributes<HTMLButtonElement>}
    />
  );
}

export function Shelf({ discs, label = 'Estante de discos', large, sortable, ...rest }: ShelfProps) {
  const tagged = Boolean(rest.categories && rest.onMoveDisc);
  if (discs.length === 0) {
    return <p className="shelf__empty">Sua estante está vazia. Busque um disco e toque na ☆ para guardá-lo aqui.</p>;
  }
  const list = (
    <ul className={`shelf${large ? ' shelf--large' : ''}${tagged ? ' shelf--tagged' : ''}`} aria-label={label}>
      {discs.map((disc) =>
        sortable ? (
          <SortableSlot key={disc.id} disc={disc} tagged={tagged} {...rest} />
        ) : (
          <SlotContent key={disc.id} disc={disc} tagged={tagged} {...rest} />
        ),
      )}
    </ul>
  );
  return sortable ? (
    <SortableContext items={discs.map((d) => d.id)} strategy={rectSortingStrategy}>
      {list}
    </SortableContext>
  ) : (
    list
  );
}

interface PlaylistImporterProps {
  existingIds: Set<string>;
  onImport: (discs: Disc[]) => void;
}

// Sem acento e sem diferenciar maiúsculas: "cafe" acha "Café".
function normalize(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function importErrorMessage(error: unknown): string {
  if (error instanceof SpotifyError && error.status === 403) {
    return 'Saia e entre de novo para permitir o acesso às suas playlists.';
  }
  return errorMessage(error);
}

export function PlaylistImporter({ existingIds, onImport }: PlaylistImporterProps) {
  const [playlists, setPlaylists] = useState<Disc[] | null>(null);
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function open() {
    setLoading(true);
    setError(null);
    try {
      setPlaylists(await getMyPlaylists());
      setChosen(new Set());
      setQuery('');
    } catch (e) {
      setError(importErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  function toggle(id: string) {
    const next = new Set(chosen);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setChosen(next);
  }

  function confirm() {
    onImport(playlists?.filter((p) => chosen.has(p.id)) ?? []);
    setPlaylists(null);
  }

  if (!playlists) {
    return (
      <div className="importer">
        <button type="button" className="importer__open" disabled={loading} onClick={() => void open()}>
          {loading ? 'Carregando playlists…' : 'Importar do Spotify'}
        </button>
        {error && <p className="importer__error">{error}</p>}
      </div>
    );
  }

  const available = playlists.filter((p) => !existingIds.has(p.id));
  // Todas as páginas já vieram de uma vez; o filtro é local, a cada tecla.
  const term = normalize(query);
  const shown = term ? available.filter((p) => normalize(p.name).includes(term)) : available;
  return (
    <div className="importer importer--open">
      {available.length > 0 && (
        <input
          type="search"
          className="album-search__input importer__search"
          placeholder="Filtrar minhas playlists…"
          aria-label="Filtrar minhas playlists"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      )}
      {available.length === 0 ? (
        <p className="importer__note">Todas as suas playlists já estão na estante.</p>
      ) : shown.length === 0 ? (
        <p className="importer__note">Nenhuma playlist encontrada para "{query.trim()}".</p>
      ) : (
        <ul className="importer__list" aria-label="Minhas playlists">
          {shown.map((p) => (
            <li key={p.id}>
              <label>
                <input type="checkbox" checked={chosen.has(p.id)} onChange={() => toggle(p.id)} />
                {p.name}
              </label>
            </li>
          ))}
        </ul>
      )}
      <div className="importer__actions">
        <button type="button" className="importer__open" onClick={() => setPlaylists(null)}>
          Cancelar
        </button>
        <button type="button" className="importer__confirm" disabled={chosen.size === 0} onClick={confirm}>
          Adicionar {chosen.size || ''} à estante
        </button>
      </div>
    </div>
  );
}
