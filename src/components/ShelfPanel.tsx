import { useEffect, useRef, useState, type ReactNode } from 'react';
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
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { ShelfDisc } from '../library/favorites';
import type { Disc } from '../spotify/api';
import { Shelf } from './Shelf';

interface ShelfPanelProps {
  /** Discos a mostrar (já filtrados por etiqueta, se houver filtro). */
  discs: ShelfDisc[];
  /** Total da estante. */
  total?: number;
  /** Chips do filtro por etiqueta (T44). */
  filter?: ReactNode;
  /** Com filtro ativo, arrastar fica desligado (reordenar só vendo a coleção toda). */
  filtered?: boolean;
  selectedId?: string;
  playingId?: string;
  onSelect: (disc: Disc) => void;
  onRemove: (id: string) => void;
  onPlay: () => void;
  onClose: () => void;
  /** Arrastar e soltar (T39/T43): o disco vai para a posição de `overId`. */
  onDrop: (activeId: string, overId: string) => void;
}

// Teclado: Espaço pega e solta, setas movem, Esc cancela. Enter continua abrindo os detalhes.
const KEYBOARD_CODES = { start: ['Space'], cancel: ['Escape'], end: ['Space'] };

// Estante grande sobre a tela: uma coleção só (T43), em prateleiras de madeira contínuas.
// Fecha com Esc, clique fora ou no ×. Capas arrastáveis para reordenar (T39).
export function ShelfPanel({
  discs,
  total = discs.length,
  filter,
  filtered,
  selectedId,
  playingId,
  onSelect,
  onRemove,
  onPlay,
  onClose,
  onDrop,
}: ShelfPanelProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  // Arrasto em andamento (ou recém-terminado): Esc e o clique da soltura não fecham/abrem nada.
  const dragging = useRef(false);
  const lastDragEnd = useRef(0);

  const sensors = useSensors(
    // Mouse: só vira arrasto depois de mover 8px; antes disso é clique.
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    // Toque: segurar ~0,2s pega o disco; arrastar o dedo direto continua rolando a estante.
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

  // Clicar na capa abre os detalhes por cima da estante (T40); a estante continua aberta por baixo.
  const pick = (disc: Disc) => {
    if (dragging.current || Date.now() - lastDragEnd.current < 250) return;
    onSelect(disc);
  };
  const play = () => {
    onPlay();
    onClose();
  };

  function finish(event: DragEndEvent, dropped: boolean) {
    dragging.current = false;
    lastDragEnd.current = Date.now();
    setActiveId(null);
    if (dropped && event.over) onDrop(String(event.active.id), String(event.over.id));
  }

  const nameOf = (id: UniqueIdentifier | undefined) => discs.find((d) => d.id === id)?.name ?? 'disco';
  const positionOf = (id: UniqueIdentifier | undefined) => discs.findIndex((d) => d.id === id) + 1;
  const active = discs.find((d) => d.id === activeId) ?? null;

  return (
    <div
      className="shelf-panel"
      data-testid="shelf-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="shelf-panel__dialog" role="dialog" aria-modal="true" aria-labelledby="shelf-panel-title">
        <header className="shelf-panel__header">
          <h2 id="shelf-panel-title">
            Estante {total > 0 && <span className="shelf-panel__count">({total})</span>}
          </h2>
          <button ref={closeRef} type="button" className="shelf-panel__close" aria-label="Fechar estante" onClick={onClose}>
            ×
          </button>
        </header>

        {total > 0 && filter}
        {total === 0 ? (
          <p className="shelf__empty">Sua estante está vazia. Busque um disco e toque na ☆ para guardá-lo aqui.</p>
        ) : discs.length === 0 && filtered ? (
          <p className="shelf__empty">Nenhum disco com essas etiquetas.</p>
        ) : (
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
                onDragStart: ({ active: a }) => `Pegou ${nameOf(a.id)}, posição ${positionOf(a.id)} de ${discs.length}.`,
                onDragOver: ({ active: a, over }) =>
                  over ? `${nameOf(a.id)} sobre a posição ${positionOf(over.id)} de ${discs.length}.` : `${nameOf(a.id)} fora da estante.`,
                onDragEnd: ({ active: a, over }) =>
                  over ? `${nameOf(a.id)} solto na posição ${positionOf(over.id)} de ${discs.length}.` : `${nameOf(a.id)} voltou ao lugar.`,
                onDragCancel: ({ active: a }) => `Movimento cancelado. ${nameOf(a.id)} voltou ao lugar.`,
              },
            }}
          >
            {filtered && <p className="shelf-panel__note">Para reorganizar arrastando, limpe o filtro.</p>}
            <Shelf
              large
              sortable={!filtered}
              discs={discs}
              selectedId={selectedId}
              playingId={playingId}
              onRemove={onRemove}
              onSelect={pick}
              onPlay={play}
            />
            <DragOverlay>
              {active ? (
                <div className="shelf-drag" aria-hidden>
                  {active.imageUrl ? <img src={active.imageUrl} alt="" /> : <span className="shelf__spine">{active.name}</span>}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </div>
  );
}
