import type { Disc } from '../spotify/api';
import { StarIcon } from './PlayerIcons';

interface ShelfToggleProps {
  disc: Disc | null;
  onShelf: boolean;
  busy?: boolean;
  onToggle: () => void;
  /** Estilo: tecla de madeira do menu (padrão) ou a estrela discreta da tela do console (T56). */
  className?: string;
}

// Ao lado do player (celular) ou na tela do console (desktop): ★ = o disco que está tocando já está na estante; ☆ = não está.
export function ShelfToggle({ disc, onShelf, busy, onToggle, className = 'shelf-toggle' }: ShelfToggleProps) {
  const label = !disc
    ? 'Nenhum disco para guardar'
    : onShelf
      ? `Tirar ${disc.name} da estante`
      : `Guardar ${disc.name} na estante`;
  return (
    <button
      type="button"
      className={className}
      aria-label={label}
      title={label}
      aria-pressed={onShelf}
      disabled={!disc || busy}
      onClick={onToggle}
    >
      <StarIcon filled={onShelf} />
    </button>
  );
}
