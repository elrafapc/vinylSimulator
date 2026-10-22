import { useEffect, useId, useRef, useState, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import { rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import {
  getCollectionSort,
  groupByTag,
  searchCollection,
  setCollectionSort,
  SORT_OPTIONS,
  sortCollection,
  type CollectionSort,
} from '../library/collection';
import { tagKey, type ShelfDisc } from '../library/favorites';
import type { Disc } from '../spotify/api';
import { CloseIcon, SearchIcon } from './MenuIcons';
import { PlayOverlay } from './PlayOverlay';
import './Collection.css';

interface CollectionProps {
  /** Discos a mostrar (já filtrados por etiqueta, se houver filtro). */
  discs: ShelfDisc[];
  /** Total da estante. */
  total?: number;
  /** Chips do filtro por etiqueta (T44), os mesmos do carrossel do menu. */
  filter?: ReactNode;
  filtered?: boolean;
  /** Contexto que o Spotify está tocando agora: esse disco ganha o anel âmbar. */
  playingUri?: string;
  /** Clicar na capa abre os detalhes (T40). */
  onOpen: (disc: Disc) => void;
  /** Botão tocar/pausar sobre a capa. */
  onPlay: (disc: Disc) => void;
  onClose: () => void;
  /** Arrastar e soltar em "Minha ordem" (T39/T43): o disco vai para a posição de `overId`. */
  onDrop: (activeId: string, overId: string) => void;
}

// Teclado: Espaço pega e solta, setas movem, Esc cancela. Enter continua abrindo os detalhes.
const KEYBOARD_CODES = { start: ['Space'], cancel: ['Escape'], end: ['Space'] };

function countLabel(shown: number, total: number, narrowed: boolean): string {
  if (narrowed) return `${shown} de ${total} discos`;
  return `${total} ${total === 1 ? 'disco' : 'discos'}`;
}

interface CoverProps {
  disc: ShelfDisc;
  playing: boolean;
  onOpen: (disc: ShelfDisc) => void;
  onPlay: (disc: ShelfDisc) => void;
}

interface DragBindings {
  ref?: (el: HTMLElement | null) => void;
  style?: CSSProperties;
  dragging?: boolean;
  handle?: HTMLAttributes<HTMLButtonElement>;
}

function Cover({ disc, playing, onOpen, onPlay, ref, style, dragging, handle }: CoverProps & DragBindings) {
  return (
    <li ref={ref} style={style} className={`collection__item${dragging ? ' collection__item--dragging' : ''}`}>
      <div className="collection__cover">
        <button
          type="button"
          {...handle}
          className={`collection__disc${playing ? ' collection__disc--playing' : ''}`}
          title={`${disc.name} — ${disc.artist}`}
          aria-label={`Abrir ${disc.name}`}
          onClick={() => onOpen(disc)}
        >
          {disc.imageUrl ? <img src={disc.imageUrl} alt="" draggable={false} /> : <span className="collection__spine">{disc.name}</span>}
        </button>
        <PlayOverlay discName={disc.name} playing={playing} onPlay={() => onPlay(disc)} />
      </div>
      <span className="collection__name">{disc.name}</span>
      <span className="collection__artist">{disc.artist}</span>
    </li>
  );
}

// Arrastar pela capa: o clique simples continua abrindo os detalhes (o arrasto só começa depois de ~8px).
function SortableCover(props: CoverProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.disc.id });
  const style: CSSProperties = {
    transform: transform ? `translate3d(${Math.round(transform.x)}px, ${Math.round(transform.y)}px, 0)` : undefined,
    transition,
  };
  return (
    <Cover
      {...props}
      ref={setNodeRef}
      style={style}
      dragging={isDragging}
      handle={{ ...attributes, ...listeners } as HTMLAttributes<HTMLButtonElement>}
    />
  );
}

// "Sua coleção" (T58): substitui a estante de madeira. Busca, "Organizar por" (Etiquetas agrupa em seções;
// os outros modos são uma grade só) e chips de etiqueta. Fecha com Esc, clique fora ou no ×.
export function Collection({
  discs,
  total = discs.length,
  filter,
  filtered = false,
  playingUri,
  onOpen,
  onPlay,
  onClose,
  onDrop,
}: CollectionProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const ids = useId();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<CollectionSort>(getCollectionSort);
  const [activeId, setActiveId] = useState<string | null>(null);
  // Arrasto em andamento (ou recém-terminado): Esc e o clique da soltura não fecham/abrem nada.
  const dragging = useRef(false);
  const lastDragEnd = useRef(0);

  const sensors = useSensors(
    // Mouse: só vira arrasto depois de mover 8px; antes disso é clique.
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    // Toque: segurar ~0,2s pega o disco; arrastar o dedo direto continua rolando.
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates, keyboardCodes: KEYBOARD_CODES }),
  );

  useEffect(() => closeRef.current?.focus(), []);

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape' && !dragging.current) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  function changeSort(next: CollectionSort) {
    setSort(next);
    setCollectionSort(next);
  }

  // Clicar na capa abre os detalhes por cima da coleção (T40); a coleção continua aberta por baixo.
  const open = (disc: ShelfDisc) => {
    if (dragging.current || Date.now() - lastDragEnd.current < 250) return;
    onOpen(disc);
  };

  function finish(event: DragEndEvent, dropped: boolean) {
    dragging.current = false;
    lastDragEnd.current = Date.now();
    setActiveId(null);
    if (dropped && event.over) onDrop(String(event.active.id), String(event.over.id));
  }

  const searching = query.trim() !== '';
  const shown = sortCollection(searchCollection(discs, query), sort);
  // Reordenar só vendo a coleção inteira, na ordem dela (com filtro ou busca, a posição seria ambígua).
  const canDrag = sort === 'custom' && !filtered && !searching;
  const coverProps = (disc: ShelfDisc) => ({ disc, playing: disc.uri === playingUri, onOpen: open, onPlay });

  const nameOf = (id: UniqueIdentifier | undefined) => shown.find((d) => d.id === id)?.name ?? 'disco';
  const positionOf = (id: UniqueIdentifier | undefined) => shown.findIndex((d) => d.id === id) + 1;
  const active = shown.find((d) => d.id === activeId) ?? null;

  function body() {
    if (total === 0) {
      return <p className="collection__empty">Sua coleção está vazia. Busque um disco e toque na ☆ para guardá-lo aqui.</p>;
    }
    if (shown.length === 0) {
      return (
        <p className="collection__empty">
          {searching ? `Nenhum disco encontrado para "${query.trim()}".` : 'Nenhum disco com essas etiquetas.'}
        </p>
      );
    }
    if (sort === 'tags') {
      return groupByTag(shown).map((group, i) => (
        <section key={tagKey(group.tag)} className="collection__group" aria-labelledby={`${ids}-group-${i}`}>
          <h3 id={`${ids}-group-${i}`} className="collection__group-title">
            {group.tag} · {group.discs.length}
          </h3>
          <ul className="collection__row" aria-label={group.tag}>
            {group.discs.map((disc) => (
              <Cover key={disc.id} {...coverProps(disc)} />
            ))}
          </ul>
        </section>
      ));
    }
    const grid = (
      <ul className="collection__grid" aria-label="Discos da coleção">
        {shown.map((disc) =>
          canDrag ? <SortableCover key={disc.id} {...coverProps(disc)} /> : <Cover key={disc.id} {...coverProps(disc)} />,
        )}
      </ul>
    );
    if (!canDrag) {
      return (
        <>
          {sort === 'custom' && <p className="collection__note">Para reorganizar arrastando, limpe o filtro e a busca.</p>}
          {grid}
        </>
      );
    }
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(e: DragStartEvent) => {
          dragging.current = true;
          setActiveId(String(e.active.id));
        }}
        onDragEnd={(e) => finish(e, true)}
        onDragCancel={(e) => finish(e, false)}
        accessibility={{
          screenReaderInstructions: {
            draggable: 'Para mover este disco: aperte Espaço, use as setas e aperte Espaço de novo para soltar. Esc cancela. Enter abre os detalhes.',
          },
          announcements: {
            onDragStart: ({ active: a }) => `Pegou ${nameOf(a.id)}, posição ${positionOf(a.id)} de ${shown.length}.`,
            onDragOver: ({ active: a, over }) =>
              over ? `${nameOf(a.id)} sobre a posição ${positionOf(over.id)} de ${shown.length}.` : `${nameOf(a.id)} fora da coleção.`,
            onDragEnd: ({ active: a, over }) =>
              over ? `${nameOf(a.id)} solto na posição ${positionOf(over.id)} de ${shown.length}.` : `${nameOf(a.id)} voltou ao lugar.`,
            onDragCancel: ({ active: a }) => `Movimento cancelado. ${nameOf(a.id)} voltou ao lugar.`,
          },
        }}
      >
        <SortableContext items={shown.map((d) => d.id)} strategy={rectSortingStrategy}>
          {grid}
        </SortableContext>
        <DragOverlay>
          {active ? (
            <div className="collection__drag" aria-hidden>
              {active.imageUrl ? <img src={active.imageUrl} alt="" /> : <span className="collection__spine">{active.name}</span>}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    );
  }

  return (
    <div
      className="collection"
      data-testid="collection-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="collection__dialog" role="dialog" aria-modal="true" aria-labelledby={`${ids}-title`}>
        <header className="collection__header">
          <div className="collection__titlebar">
            <h2 id={`${ids}-title`} className="collection__title">
              Sua coleção
            </h2>
            <span className="collection__count" aria-live="polite">
              {countLabel(shown.length, total, filtered || searching)}
            </span>
            <button ref={closeRef} type="button" className="icon-button collection__close" aria-label="Fechar coleção" onClick={onClose}>
              <CloseIcon />
            </button>
          </div>
          {total > 0 && (
            <div className="collection__tools">
              <label className="field collection__search">
                <SearchIcon />
                <input
                  type="search"
                  className="field__input"
                  placeholder="Buscar na coleção"
                  aria-label="Buscar na coleção"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    // Esc com texto só limpa a busca; com o campo vazio, fecha a coleção.
                    if (e.key === 'Escape' && query) {
                      e.preventDefault();
                      e.stopPropagation();
                      setQuery('');
                    }
                  }}
                />
              </label>
              <label className="collection__sort">
                <span>Organizar por</span>
                <select className="collection__select" value={sort} onChange={(e) => changeSort(e.target.value as CollectionSort)}>
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
          {total > 0 && filter}
        </header>
        <div className="collection__body">{body()}</div>
      </div>
    </div>
  );
}
