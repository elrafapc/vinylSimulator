import type { Disc } from '../spotify/api';

interface ShelfToggleProps {
  disc: Disc | null;
  onShelf: boolean;
  busy?: boolean;
  onToggle: () => void;
}

// Ao lado do player: ★ = o disco que está tocando já está na estante; ☆ = não está.
export function ShelfToggle({ disc, onShelf, busy, onToggle }: ShelfToggleProps) {
  const label = !disc
    ? 'Nenhum disco para guardar'
    : onShelf
      ? `Tirar ${disc.name} da estante`
      : `Guardar ${disc.name} na estante`;
  return (
    <button
      type="button"
      className="shelf-toggle"
      aria-label={label}
      title={label}
      aria-pressed={onShelf}
      disabled={!disc || busy}
      onClick={onToggle}
    >
      {onShelf ? '★' : '☆'}
    </button>
  );
}
