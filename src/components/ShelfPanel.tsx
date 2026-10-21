import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  pointerWithin,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragCancelEvent,
  type DragEndEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { MAX_CATEGORY_NAME, shelfDropId, UNCATEGORIZED, type Category, type ShelfDisc } from '../library/favorites';
import type { Disc } from '../spotify/api';
import { Shelf } from './Shelf';

interface ShelfPanelProps {
  discs: ShelfDisc[];
  categories: Category[];
  selectedId?: string;
  playingId?: string;
  onSelect: (disc: Disc) => void;
  onRemove: (id: string) => void;
  onPlay: () => void;
  onClose: () => void;
  /** Devolvem a mensagem de erro (nome inválido/repetido) ou null. */
  onCreateCategory: (name: string) => string | null;
  onRenameCategory: (id: string, name: string) => string | null;
  onDeleteCategory: (id: string) => void;
  onMoveDisc: (discId: string, categoryId: string | null) => void;
  /** Arrastar e soltar (T39): `overId` é outro disco ou uma prateleira (`shelf:…`). */
  onDrop: (activeId: string, overId: string) => void;
}

// Esc dentro de um campo cancela só a edição, sem fechar a estante.
function stopEscape(e: KeyboardEvent, cancel: () => void) {
  if (e.key !== 'Escape') return;
  e.stopPropagation();
  e.nativeEvent.stopImmediatePropagation();
  cancel();
}

function NewCategory({ onCreate }: { onCreate: (name: string) => string | null }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  function close() {
    setOpen(false);
    setName('');
    setError(null);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const problem = onCreate(name);
    if (problem) setError(problem);
    else close();
  }

  if (!open) {
    return (
      <button type="button" className="importer__open" onClick={() => setOpen(true)}>
        + Nova categoria
      </button>
    );
  }
  return (
    <form className="category-form" onSubmit={submit}>
      <input
        autoFocus
        className="album-search__input"
        aria-label="Nome da nova categoria"
        placeholder="Ex.: Jazz, Para trabalhar…"
        maxLength={MAX_CATEGORY_NAME}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => stopEscape(e, close)}
      />
      <button type="submit" className="importer__confirm">
        Criar
      </button>
      <button type="button" className="importer__open" onClick={close}>
        Cancelar
      </button>
      {error && <p className="importer__error category-form__error">{error}</p>}
    </form>
  );
}

interface ShelfRowProps extends Omit<ShelfPanelProps, 'discs' | 'onClose' | 'onCreateCategory'> {
  category: Category | null;
  discs: ShelfDisc[];
  pick: (disc: Disc) => void;
  play: () => void;
}

function ShelfRow({ category, discs, categories, selectedId, playingId, onRemove, onRenameCategory, onDeleteCategory, onMoveDisc, pick, play }: ShelfRowProps) {
  // A prateleira toda aceita soltar (vazia ou no fim dela).
  const { setNodeRef, isOver } = useDroppable({ id: shelfDropId(category?.id ?? null) });
  const [mode, setMode] = useState<'view' | 'rename' | 'delete'>('view');
  const [name, setName] = useState(category?.name ?? '');
  const [error, setError] = useState<string | null>(null);
  const title = category?.name ?? UNCATEGORIZED;

  function cancel() {
    setMode('view');
    setName(category?.name ?? '');
    setError(null);
  }

  function rename(e: FormEvent) {
    e.preventDefault();
    if (!category) return;
    const problem = onRenameCategory(category.id, name);
    if (problem) setError(problem);
    else cancel();
  }

  return (
    <section ref={setNodeRef} className={`shelf-row${isOver ? ' shelf-row--over' : ''}`} aria-label={`Prateleira ${title}`}>
      <header className="shelf-row__header">
        {mode === 'rename' && category ? (
          <form className="category-form" onSubmit={rename}>
            <input
              autoFocus
              className="album-search__input"
              aria-label={`Novo nome para ${category.name}`}
              maxLength={MAX_CATEGORY_NAME}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => stopEscape(e, cancel)}
            />
            <button type="submit" className="importer__confirm">
              Salvar
            </button>
            <button type="button" className="importer__open" onClick={cancel}>
              Cancelar
            </button>
            {error && <p className="importer__error category-form__error">{error}</p>}
          </form>
        ) : (
          <h3 className="shelf-row__title">
            {title} <span className="shelf-row__count">({discs.length})</span>
          </h3>
        )}
        {category && mode === 'view' && (
          <div className="shelf-row__actions">
            <button type="button" className="link" onClick={() => setMode('rename')}>
              Renomear
            </button>
            <button type="button" className="link" onClick={() => setMode('delete')}>
              Excluir
            </button>
          </div>
        )}
      </header>

      {mode === 'delete' && category && (
        <div className="shelf-row__confirm" role="alertdialog" aria-label={`Excluir ${category.name}`}>
          <p>
            Excluir "{category.name}"?{' '}
            {discs.length > 0
              ? `${discs.length === 1 ? 'O disco vai' : `Os ${discs.length} discos vão`} para "${UNCATEGORIZED}".`
              : 'A prateleira está vazia.'}
          </p>
          <button type="button" className="importer__confirm" onClick={() => onDeleteCategory(category.id)}>
            Excluir
          </button>
          <button type="button" className="importer__open" onClick={cancel}>
            Cancelar
          </button>
        </div>
      )}

      {discs.length === 0 ? (
        <p className="shelf-row__empty">Nenhum disco nesta prateleira. Arraste uma capa para cá ou use o seletor sob ela.</p>
      ) : (
        <Shelf
          large
          sortable
          label={`Discos em ${title}`}
          discs={discs}
          selectedId={selectedId}
          playingId={playingId}
          onRemove={onRemove}
          onSelect={pick}
          onPlay={play}
          categories={categories}
          onMoveDisc={onMoveDisc}
        />
      )}
    </section>
  );
}

// Estante grande sobre a tela: uma prateleira por categoria + "Sem categoria" por último.
// Fecha com Esc, clique fora ou no ×.
// Disco solto em cima de outro disco ganha do alvo "prateleira" que o contém; sem ponteiro (teclado), o mais próximo.
const collision: CollisionDetection = (args) => {
  const within = pointerWithin(args);
  if (within.length) return [within.find((c) => !String(c.id).startsWith('shelf:')) ?? within[0]];
  return closestCenter(args);
};

// Teclado: Espaço pega e solta, setas movem, Esc cancela. Enter continua abrindo os detalhes.
const KEYBOARD_CODES = { start: ['Space'], cancel: ['Escape'], end: ['Space'] };

// Estante grande sobre a tela: uma prateleira por categoria + "Sem categoria" por último.
// Fecha com Esc, clique fora ou no ×. Capas arrastáveis para reordenar e trocar de prateleira (T39).
export function ShelfPanel(props: ShelfPanelProps) {
  const { discs, categories, onSelect, onPlay, onClose, onCreateCategory, onDrop } = props;
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
  const where = (id: UniqueIdentifier | undefined) => {
    const raw = String(id ?? '');
    if (raw.startsWith('shelf:')) {
      const cat = categories.find((c) => c.id === raw.slice(6));
      return `prateleira ${cat?.name ?? UNCATEGORIZED}`;
    }
    return `posição de ${nameOf(id)}`;
  };

  const active = discs.find((d) => d.id === activeId) ?? null;
  const uncategorized = discs.filter((d) => d.categoryId === null);
  // Durante o arrasto, "Sem categoria" aparece mesmo vazia, para dar para soltar lá.
  const showUncategorized = uncategorized.length > 0 || (active !== null && active.categoryId !== null);

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
          <h2 id="shelf-panel-title">Estante</h2>
          <div className="shelf-panel__tools">
            <NewCategory onCreate={onCreateCategory} />
            <button ref={closeRef} type="button" className="shelf-panel__close" aria-label="Fechar estante" onClick={onClose}>
              ×
            </button>
          </div>
        </header>

        {discs.length === 0 && categories.length === 0 ? (
          <p className="shelf__empty">Sua estante está vazia. Busque um disco e toque na ☆ para guardá-lo aqui.</p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={collision}
            onDragStart={(e: DragStartEvent) => {
              dragging.current = true;
              setActiveId(String(e.active.id));
            }}
            onDragEnd={(e) => finish(e, true)}
            onDragCancel={(e: DragCancelEvent) => finish(e, false)}
            accessibility={{
              screenReaderInstructions: {
                draggable: 'Para mover este disco: aperte Espaço, use as setas e aperte Espaço de novo para soltar. Esc cancela. Enter abre os detalhes.',
              },
              announcements: {
                onDragStart: ({ active: a }) => `Pegou ${nameOf(a.id)}.`,
                onDragOver: ({ active: a, over }) => (over ? `${nameOf(a.id)} sobre ${where(over.id)}.` : `${nameOf(a.id)} fora das prateleiras.`),
                onDragEnd: ({ active: a, over }) => (over ? `${nameOf(a.id)} solto na ${where(over.id)}.` : `${nameOf(a.id)} voltou ao lugar.`),
                onDragCancel: ({ active: a }) => `Movimento cancelado. ${nameOf(a.id)} voltou ao lugar.`,
              },
            }}
          >
            {categories.map((category) => (
              <ShelfRow
                key={category.id}
                {...props}
                category={category}
                discs={discs.filter((d) => d.categoryId === category.id)}
                pick={pick}
                play={play}
              />
            ))}
            {showUncategorized && <ShelfRow {...props} category={null} discs={uncategorized} pick={pick} play={play} />}
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
