import { useEffect, useState } from 'react';
import { searchAlbums, type Album } from '../spotify/api';
import { errorMessage } from '../spotify/errors';

const DEBOUNCE_MS = 350;

interface AlbumSearchProps {
  selectedId?: string;
  onSelect: (album: Album) => void;
}

export function AlbumSearch({ selectedId, onSelect }: AlbumSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Album[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (!q) return;
    let cancelled = false;
    const id = setTimeout(async () => {
      setLoading(true);
      try {
        const albums = await searchAlbums(q);
        if (cancelled) return;
        setResults(albums);
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
        placeholder="Buscar álbum ou artista…"
        aria-label="Buscar álbum"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
      />
      {loading && <p className="album-search__status">Procurando na estante…</p>}
      {error && <p className="album-search__status album-search__status--error">{error}</p>}
      <ul className="album-search__list">
        {results.map((album) => (
          <li key={album.id}>
            <button
              type="button"
              className={`album-search__item${album.id === selectedId ? ' album-search__item--selected' : ''}`}
              aria-pressed={album.id === selectedId}
              onClick={() => onSelect(album)}
            >
              {album.imageUrl ? <img src={album.imageUrl} alt="" width={48} height={48} /> : <span className="album-search__nocover" />}
              <span className="album-search__text">
                <strong>{album.name}</strong>
                <span>{album.artist}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
