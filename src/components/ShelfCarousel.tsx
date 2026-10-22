import { useRef, type PointerEvent, type ReactNode } from 'react';
import type { Disc } from '../spotify/api';
import { ChevronIcon, GridIcon } from './MenuIcons';

interface ShelfCarouselProps {
  /** Discos a mostrar (já filtrados por etiqueta, se houver filtro). */
  discs: Disc[];
  /** Total da estante (o "Expandir" conta todos). */
  total?: number;
  /** Chips do filtro por etiqueta (T44), o mesmo da estante expandida. */
  filter?: ReactNode;
  filtered?: boolean;
  selectedId?: string;
  onSelect: (disc: Disc) => void;
  onExpand: () => void;
}

// Arrastar mais que isso conta como rolagem, não como clique na capa.
const DRAG_THRESHOLD = 5;
// Capa (76px) + espaço: a seta anda pelo menos um disco.
const MIN_STEP = 86;

function countLabel(shown: number, total: number, filtered?: boolean): string {
  if (filtered) return `${shown} de ${total} discos`;
  return `${total} ${total === 1 ? 'disco' : 'discos'}`;
}

// Estante compacta do menu: título com contador e setas, chips, capas em fila (rolagem e arrastar) e "Abrir estante inteira".
export function ShelfCarousel({ discs, total = discs.length, filter, filtered, selectedId, onSelect, onExpand }: ShelfCarouselProps) {
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

  const hasDiscs = discs.length > 0;
  return (
    <div className="carousel">
      <div className="menu-section__head">
        <h2 className="menu-section__title">Estante</h2>
        <span className="menu-section__count" aria-live="polite">
          {countLabel(discs.length, total, filtered)}
        </span>
        {hasDiscs && (
          <span className="carousel__arrows">
            <button type="button" className="round-button" aria-label="Discos anteriores" onClick={() => scrollByPage(-1)}>
              <ChevronIcon direction="left" />
            </button>
            <button type="button" className="round-button" aria-label="Próximos discos" onClick={() => scrollByPage(1)}>
              <ChevronIcon direction="right" />
            </button>
          </span>
        )}
      </div>
      {total > 0 && filter}
      {total === 0 ? (
        <p className="shelf__empty">Sua estante está vazia. Busque um disco e toque na ☆ para guardá-lo aqui.</p>
      ) : discs.length === 0 && filtered ? (
        <p className="shelf__empty">Nenhum disco com essas etiquetas.</p>
      ) : (
        <div className="carousel__row">
          <ul
            ref={track}
            className="carousel__track"
            aria-label="Estante (carrossel)"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerLeave={endDrag}
          >
            {discs.map((disc) => (
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
        </div>
      )}
      <button type="button" className="button button--wide" onClick={onExpand}>
        <GridIcon />
        Abrir estante inteira
      </button>
    </div>
  );
}
