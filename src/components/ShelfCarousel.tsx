import { useRef, useState, type PointerEvent } from 'react';
import { UNCATEGORIZED, type Category, type ShelfDisc } from '../library/favorites';
import type { Disc } from '../spotify/api';

interface ShelfCarouselProps {
  discs: ShelfDisc[];
  categories: Category[];
  selectedId?: string;
  onSelect: (disc: Disc) => void;
  onExpand: () => void;
}

// Arrastar mais que isso conta como rolagem, não como clique na capa.
const DRAG_THRESHOLD = 5;
// Capa (64px) + espaço: a seta anda pelo menos um disco.
const MIN_STEP = 72;

// Estante compacta do menu: capas pequenas em fila, com setas, rolagem e arrastar.
// Filtro do carrossel: todas, uma categoria (id) ou "Sem categoria" (null). Vale só nesta sessão.
type Filter = 'all' | string | null;

export function ShelfCarousel({ discs, categories, selectedId, onSelect, onExpand }: ShelfCarouselProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const track = useRef<HTMLUListElement>(null);
  const drag = useRef<{ x: number; scroll: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);

  function scrollByPage(direction: 1 | -1) {
    const el = track.current;
    el?.scrollBy?.({ left: direction * Math.max(el.clientWidth * 0.8, MIN_STEP), behavior: 'smooth' });
  }

  function onPointerDown(e: PointerEvent<HTMLUListElement>) {
    if (e.pointerType !== 'mouse') return; // toque e trackpad já rolam sozinhos
    drag.current = { x: e.clientX, scroll: e.currentTarget.scrollLeft, moved: false };
  }

  function onPointerMove(e: PointerEvent<HTMLUListElement>) {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > DRAG_THRESHOLD) d.moved = true;
    if (d.moved) e.currentTarget.scrollLeft = d.scroll - dx;
  }

  function endDrag() {
    suppressClick.current = drag.current?.moved ?? false;
    drag.current = null;
  }

  // Categoria excluída enquanto estava filtrada: volta para "Todas".
  const active: Filter = filter === 'all' || filter === null || categories.some((c) => c.id === filter) ? filter : 'all';
  const hasUncategorized = discs.some((d) => d.categoryId === null);
  const shown = active === 'all' ? discs : discs.filter((d) => d.categoryId === active);
  const chips: Array<{ value: Filter; label: string }> = [
    { value: 'all', label: 'Todas' },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
    ...(hasUncategorized && categories.length > 0 ? [{ value: null, label: UNCATEGORIZED }] : []),
  ];

  return (
    <div className="carousel">
      {discs.length > 0 && chips.length > 1 && (
        <div className="carousel__chips" role="group" aria-label="Filtrar estante por categoria">
          {chips.map((chip) => (
            <button
              key={chip.value ?? 'none'}
              type="button"
              className="carousel__chip"
              aria-pressed={active === chip.value}
              onClick={() => setFilter(chip.value)}
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}
      {discs.length === 0 ? (
        <p className="shelf__empty">Sua estante está vazia. Busque um disco e toque na ☆ para guardá-lo aqui.</p>
      ) : shown.length === 0 ? (
        <p className="shelf__empty">Nenhum disco nesta categoria.</p>
      ) : (
        <div className="carousel__row">
          <button type="button" className="carousel__arrow" aria-label="Discos anteriores" onClick={() => scrollByPage(-1)}>
            ‹
          </button>
          <ul
            ref={track}
            className="carousel__track"
            aria-label="Estante (carrossel)"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerLeave={endDrag}
          >
            {shown.map((disc) => (
              <li key={disc.id}>
                <button
                  type="button"
                  className={`carousel__disc${disc.id === selectedId ? ' carousel__disc--selected' : ''}`}
                  title={`${disc.name} — ${disc.artist}`}
                  aria-label={`Abrir ${disc.name}`}
                  aria-pressed={disc.id === selectedId}
                  draggable={false}
                  onClick={() => {
                    if (suppressClick.current) {
                      suppressClick.current = false;
                      return;
                    }
                    onSelect(disc);
                  }}
                >
                  {disc.imageUrl ? (
                    <img src={disc.imageUrl} alt="" draggable={false} />
                  ) : (
                    <span className="carousel__spine">{disc.name}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="carousel__arrow" aria-label="Próximos discos" onClick={() => scrollByPage(1)}>
            ›
          </button>
        </div>
      )}
      <button type="button" className="importer__open carousel__expand" onClick={onExpand}>
        Expandir estante{discs.length > 0 ? ` (${discs.length})` : ''}
      </button>
    </div>
  );
}
