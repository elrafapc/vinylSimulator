import { useEffect, useState } from 'react';
import { searchDiscs, type Disc } from '../spotify/api';
import { errorMessage } from '../spotify/errors';
import { PlayOverlay } from './PlayOverlay';

const DEBOUNCE_MS = 350;

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
    if (!q) return;
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
    if (!value.trim()) setResults([]);
  }

  return (
    <section className="album-search">
      <input
        type="search"
        className="album-search__input"
        placeholder="Buscar álbum, artista ou playlist…"
        aria-label="Buscar álbum"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
      />
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
              {disc.imageUrl ? <img src={disc.imageUrl} alt="" width={48} height={48} /> : <span className="album-search__nocover" />}
              <span className="album-search__text">
                <strong>{disc.name}</strong>
                <span>
                  {disc.kind === 'playlist' && <em className="album-search__badge">Playlist</em>}
                  {disc.artist}
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
