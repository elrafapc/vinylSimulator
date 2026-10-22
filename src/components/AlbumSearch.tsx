import { useEffect, useState } from 'react';
import { searchDiscs, type Disc } from '../spotify/api';
import { errorMessage } from '../spotify/errors';
import { SearchIcon } from './MenuIcons';
import { PlayOverlay } from './PlayOverlay';

// T46: espera o usuário parar de digitar e só busca a partir de 2 letras (o resultado fica em cache por termo).
const DEBOUNCE_MS = 400;
const MIN_CHARS = 2;

interface AlbumSearchProps {
  selectedId?: string;
  favoriteIds?: Set<string>;
  onSelect: (disc: Disc) => void;
  onToggleFavorite?: (disc: Disc) => void;
  /** Mostra o botão play sobre a capa do disco selecionado. */
  onPlay?: () => void;
  playingId?: string;
}

export function AlbumSearch({ selectedId, favoriteIds, onSelect, onToggleFavorite, onPlay, playingId }: AlbumSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Disc[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < MIN_CHARS) return;
    let cancelled = false;
    const id = setTimeout(async () => {
      setLoading(true);
      try {
        const discs = await searchDiscs(q);
        if (cancelled) return;
        setResults(discs);
        setError(null);
      } catch (e) {
        if (!cancelled) setError(errorMessage(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [query]);

  function handleChange(value: string) {
    setQuery(value);
    if (value.trim().length < MIN_CHARS) setResults([]);
  }

  return (
    <section className="album-search">
      <label className="field">
        <SearchIcon />
        <input
          type="search"
          className="field__input"
          placeholder="Álbum, artista ou playlist"
          aria-label="Buscar álbum"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
        />
      </label>
      {loading && <p className="album-search__status">Procurando na estante…</p>}
      {error && <p className="album-search__status album-search__status--error">{error}</p>}
      <ul className="album-search__list">
        {results.map((disc) => (
          <li key={disc.id} className="album-search__row">
            <button
              type="button"
              className={`album-search__item${disc.id === selectedId ? ' album-search__item--selected' : ''}`}
              aria-pressed={disc.id === selectedId}
              onClick={() => onSelect(disc)}
            >
              {disc.imageUrl ? <img src={disc.imageUrl} alt="" width={40} height={40} /> : <span className="album-search__nocover" />}
              <span className="album-search__text">
                <strong>{disc.name}</strong>
                <span>
                  {disc.artist} · {disc.kind === 'playlist' ? 'playlist' : 'álbum'}
                </span>
              </span>
            </button>
            {onPlay && disc.id === selectedId && (
              <PlayOverlay discName={disc.name} playing={disc.id === playingId} onPlay={onPlay} />
            )}
            {onToggleFavorite && (
              <button
                type="button"
                className="album-search__fav"
                aria-label={favoriteIds?.has(disc.id) ? `Remover ${disc.name} da estante` : `Guardar ${disc.name} na estante`}
                aria-pressed={favoriteIds?.has(disc.id) ?? false}
                onClick={() => onToggleFavorite(disc)}
              >
                {favoriteIds?.has(disc.id) ? '★' : '☆'}
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
