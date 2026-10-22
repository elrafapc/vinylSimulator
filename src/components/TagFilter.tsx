import { NO_TAG, tagKey } from '../library/favorites';

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
// "Todas" (T57) fica marcada sem filtro e limpa o filtro; no menu (compact) o contador vai para o título da Estante.
export function TagFilter({ options, selected, shown, total, onToggle, onClear, compact }: TagFilterProps) {
  if (options.length === 0) return null;
  const on = new Set(selected.map(tagKey));
  return (
    <div className={`tag-filter${compact ? ' tag-filter--compact' : ''}`}>
      <div className="tag-filter__chips" role="group" aria-label="Filtrar por etiqueta">
        <button type="button" className="chip" aria-pressed={selected.length === 0} onClick={onClear}>
          Todas
        </button>
        {options.map((tag) => (
          <button
            key={tag}
            type="button"
            className={tagKey(tag) === tagKey(NO_TAG) ? 'chip chip--dashed' : 'chip'}
            aria-pressed={on.has(tagKey(tag))}
            onClick={() => onToggle(tag)}
          >
            {tag}
          </button>
        ))}
      </div>
      {!compact && selected.length > 0 && (
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
