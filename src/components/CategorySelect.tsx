import { UNCATEGORIZED, type Category } from '../library/favorites';

interface CategorySelectProps {
  discName: string;
  value: string | null;
  categories: Category[];
  onChange: (categoryId: string | null) => void;
  className?: string;
}

// Categoria do disco ("" = Sem categoria). Usado sob a capa na estante e nos detalhes do disco.
export function CategorySelect({ discName, value, categories, onChange, className = 'shelf__category' }: CategorySelectProps) {
  return (
    <select
      className={className}
      aria-label={`Categoria de ${discName}`}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
    >
      <option value="">{UNCATEGORIZED}</option>
      {categories.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}
