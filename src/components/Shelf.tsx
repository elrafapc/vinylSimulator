import { useLayoutEffect, useRef, useState, type CSSProperties, type HTMLAttributes } from 'react';
import { rectSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable';
import { MOBILE_QUERY, useMediaQuery } from '../hooks/useMediaQuery';
import { getMyPlaylists, type Disc } from '../spotify/api';
import { errorMessage, SpotifyError } from '../spotify/errors';
import { DownloadIcon, SearchIcon } from './MenuIcons';
import { PlayOverlay } from './PlayOverlay';
import './Shelf.css';

interface ShelfProps {
  discs: Disc[];
  /** Nome da lista para leitores de tela. */
  label?: string;
  selectedId?: string;
  /** Clicar na capa (T40: abre os detalhes do disco). */
  onSelect: (disc: Disc) => void;
  onRemove?: (id: string) => void;
  /** Mostra o botão play sobre o disco selecionado. */
  onPlay?: () => void;
  playingId?: string;
  large?: boolean;
  /** Capas arrastáveis (T39): precisa estar dentro de um DndContext. */
  sortable?: boolean;
}

interface SlotProps extends Omit<ShelfProps, 'discs' | 'label' | 'large' | 'sortable'> {
  disc: Disc;
}

interface DragBindings {
  ref?: (el: HTMLElement | null) => void;
  style?: CSSProperties;
  dragging?: boolean;
  handle?: HTMLAttributes<HTMLButtonElement>;
  /** Na estante de móvel (T45) as capas ficam em vãos/prateleiras: item é <div role="listitem">. */
  asDiv?: boolean;
}

function SlotContent({ disc, selectedId, onSelect, onRemove, onPlay, playingId, ref, style, dragging, handle, asDiv }: SlotProps & DragBindings) {
  const Tag = asDiv ? 'div' : 'li';
  return (
    <Tag
      ref={ref}
      style={style}
      role={asDiv ? 'listitem' : undefined}
      className={`shelf__slot${disc.id === selectedId ? ' shelf__slot--selected' : ''}${dragging ? ' shelf__slot--dragging' : ''}`}
    >
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
    </Tag>
  );
}

// Arrastar pela capa: o clique simples continua abrindo os detalhes (o arrasto só começa depois de ~8px).
function SortableSlot(props: SlotProps & { asDiv?: boolean }) {
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

// Medidas da estante de móvel (T45). As capas e espaços vêm daqui e vão para o CSS como variáveis.
const BOOKCASE = {
  frame: 22, // laterais da moldura
  divider: 18, // divisória central
  bayPadding: 16, // folga dentro de cada vão
  gap: 16, // entre capas
  cover: 132, // capa no desktop
  coverMobile: 96,
  minShelves: 2,
  fallbackWidth: 1000, // antes de medir (e no jsdom)
};

// Largura disponível: medida já na montagem (antes de pintar) e depois acompanhada pelo ResizeObserver (nativo).
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.getBoundingClientRect().width);
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, width };
}

/**
 * Distribui os discos (na ordem da estante) em prateleiras e vãos: prateleira 1 = vão esquerdo, depois o direito;
 * depois prateleira 2... A quantidade de prateleiras acompanha o número de discos (mínimo de 2).
 */
function layoutBookcase<T>(discs: T[], width: number, bays: number) {
  const cover = bays === 1 ? BOOKCASE.coverMobile : BOOKCASE.cover;
  const inner = (width || BOOKCASE.fallbackWidth) - 2 * BOOKCASE.frame - (bays - 1) * BOOKCASE.divider;
  const bayWidth = inner / bays - 2 * BOOKCASE.bayPadding;
  const perBay = Math.max(1, Math.floor((bayWidth + BOOKCASE.gap) / (cover + BOOKCASE.gap)));
  const perShelf = perBay * bays;
  const count = Math.max(BOOKCASE.minShelves, Math.ceil(discs.length / perShelf));
  const shelves = Array.from({ length: count }, (_, s) =>
    Array.from({ length: bays }, (_, b) => discs.slice(s * perShelf + b * perBay, s * perShelf + (b + 1) * perBay)),
  );
  return { cover, shelves };
}

// Estante grande: móvel de madeira com cornija, rodapé, fundo de tábuas, prateleiras grossas e divisória (2 vãos; 1 no celular).
function Bookcase({ discs, label, sortable, ...rest }: Omit<ShelfProps, 'large'> & { label: string }) {
  const mobile = useMediaQuery(MOBILE_QUERY);
  const bays = mobile ? 1 : 2;
  const { ref, width } = useWidth<HTMLDivElement>();
  const { cover, shelves } = layoutBookcase(discs, width, bays);
  const style = {
    '--cover': `${cover}px`,
    '--frame': `${BOOKCASE.frame}px`,
    '--divider': `${BOOKCASE.divider}px`,
    '--bay-padding': `${BOOKCASE.bayPadding}px`,
    '--gap': `${BOOKCASE.gap}px`,
  } as CSSProperties;

  return (
    <div ref={ref} className={`bookcase bookcase--${bays === 1 ? 'single' : 'double'}`} style={style}>
      <div className="bookcase__cornice" aria-hidden />
      <div className="bookcase__body" role="list" aria-label={label}>
        {shelves.map((row, s) => (
          <div key={s} className="bookcase__shelf" role="presentation">
            {row.map((bay, b) => (
              <div key={b} className="bookcase__bay" role="presentation">
                {bay.map((disc) =>
                  sortable ? (
                    <SortableSlot key={disc.id} disc={disc} asDiv {...rest} />
                  ) : (
                    <SlotContent key={disc.id} disc={disc} asDiv {...rest} />
                  ),
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="bookcase__plinth" aria-hidden />
    </div>
  );
}

export function Shelf({ discs, label = 'Estante de discos', large, sortable, ...rest }: ShelfProps) {
  if (discs.length === 0) {
    return <p className="shelf__empty">Sua estante está vazia. Busque um disco e toque na ☆ para guardá-lo aqui.</p>;
  }
  const list = large ? (
    <Bookcase discs={discs} label={label} sortable={sortable} {...rest} />
  ) : (
    <ul className="shelf" aria-label={label}>
      {discs.map((disc) =>
        sortable ? <SortableSlot key={disc.id} disc={disc} {...rest} /> : <SlotContent key={disc.id} disc={disc} {...rest} />,
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
        <p className="menu-section__lead">Traga suas playlists para a estante.</p>
        {/* Único botão âmbar do menu (T57). */}
        <button type="button" className="button button--primary button--wide" disabled={loading} onClick={() => void open()}>
          <DownloadIcon />
          {loading ? 'Carregando playlists…' : 'Importar playlists'}
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
        <label className="field importer__search">
          <SearchIcon />
          <input
            type="search"
            className="field__input"
            placeholder="Filtrar minhas playlists"
            aria-label="Filtrar minhas playlists"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
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
        <button type="button" className="button" onClick={() => setPlaylists(null)}>
          Cancelar
        </button>
        <button type="button" className="button button--primary" disabled={chosen.size === 0} onClick={confirm}>
          Adicionar {chosen.size || ''} à estante
        </button>
      </div>
    </div>
  );
}
