import { useId, useState, type KeyboardEvent } from 'react';
import { MAX_TAG, tagKey } from '../library/favorites';

interface TagInputProps {
  discName: string;
  tags: string[];
  /** Etiquetas já usadas na estante (autocompletar). */
  suggestions: string[];
  /** Devolve a mensagem de erro ou null. */
  onAdd: (tag: string) => string | null;
  onRemove: (tag: string) => void;
}

// Etiquetas do disco (T43): Enter adiciona (cria se não existir), × ou Backspace com o campo vazio remove.
export function TagInput({ discName, tags, suggestions, onAdd, onRemove }: TagInputProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const listId = useId();
  const own = new Set(tags.map(tagKey));
  const options = suggestions.filter((t) => !own.has(tagKey(t)));

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!text.trim()) return;
      const problem = onAdd(text);
      setError(problem);
      if (!problem) setText('');
    } else if (e.key === 'Backspace' && text === '' && tags.length > 0) {
      onRemove(tags[tags.length - 1]);
    }
  }

  return (
    <div className="tags">
      <span className="tags__label">Etiquetas</span>
      {tags.length > 0 && (
        <ul className="tags__list" aria-label={`Etiquetas de ${discName}`}>
          {tags.map((tag) => (
            <li key={tag} className="tags__chip">
              {tag}
              <button type="button" className="tags__remove" aria-label={`Remover etiqueta ${tag}`} onClick={() => onRemove(tag)}>
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <input
        className="tags__input"
        aria-label={`Adicionar etiqueta a ${discName}`}
        placeholder={tags.length ? 'Mais uma etiqueta…' : 'Ex.: Jazz, Para trabalhar…'}
        list={listId}
        maxLength={MAX_TAG}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setError(null);
        }}
        onKeyDown={handleKey}
      />
      <datalist id={listId}>
        {options.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>
      {error && <p className="importer__error tags__error">{error}</p>}
    </div>
  );
}
