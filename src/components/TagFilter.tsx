import { tagKey } from '../library/favorites';

interface TagFilterProps {
  /** Etiquetas em uso + "Sem etiqueta". */
  options: string[];
  selected: string[];
  shown: number;
  total: number;
  onToggle: (tag: string) => void;
  onClear: () => void;
  compact?: boolean;
}

// Chips de etiqueta (T44): marcar várias mostra só os discos que têm TODAS. Mesmo filtro na estante e no carrossel.
export function TagFilter({ options, selected, shown, total, onToggle, onClear, compact }: TagFilterProps) {
  if (options.length === 0) return null;
  const on = new Set(selected.map(tagKey));
  return (
    <div className={`tag-filter${compact ? ' tag-filter--compact' : ''}`}>
      <div className="tag-filter__chips" role="group" aria-label="Filtrar por etiqueta">
        {options.map((tag) => (
          <button
            key={tag}
            type="button"
            className="carousel__chip"
            aria-pressed={on.has(tagKey(tag))}
            onClick={() => onToggle(tag)}
          >
            {tag}
          </button>
        ))}
      </div>
      {selected.length > 0 && (
        <div className="tag-filter__status">
          <span aria-live="polite">
            {shown} de {total} discos
          </span>
          <button type="button" className="link tag-filter__clear" onClick={onClear}>
            Limpar filtro
          </button>
        </div>
      )}
    </div>
  );
}
