import { useState } from 'react';
import { getMyPlaylists, type Disc } from '../spotify/api';
import { errorMessage, SpotifyError } from '../spotify/errors';
import { PlayOverlay } from './PlayOverlay';
import './Shelf.css';

interface ShelfProps {
  discs: Disc[];
  selectedId?: string;
  onSelect: (disc: Disc) => void;
  onRemove?: (id: string) => void;
  /** Mostra o botão play sobre o disco selecionado. */
  onPlay?: () => void;
  playingId?: string;
  large?: boolean;
}

export function Shelf({ discs, selectedId, onSelect, onRemove, onPlay, playingId, large }: ShelfProps) {
  if (discs.length === 0) {
    return <p className="shelf__empty">Sua estante está vazia. Busque um disco e toque na ☆ para guardá-lo aqui.</p>;
  }
  return (
    <ul className={`shelf${large ? ' shelf--large' : ''}`} aria-label="Estante de discos">
      {discs.map((disc) => (
        <li key={disc.id} className={`shelf__slot${disc.id === selectedId ? ' shelf__slot--selected' : ''}`}>
          <button
            type="button"
            className="shelf__disc"
            title={`${disc.name} — ${disc.artist}`}
            aria-label={`Colocar ${disc.name} no toca-discos`}
            aria-pressed={disc.id === selectedId}
            onClick={() => onSelect(disc)}
          >
            {disc.imageUrl ? <img src={disc.imageUrl} alt="" /> : <span className="shelf__spine">{disc.name}</span>}
          </button>
          {onPlay && disc.id === selectedId && (
            <PlayOverlay discName={disc.name} playing={disc.id === playingId} onPlay={onPlay} />
          )}
          {onRemove && (
            <button
              type="button"
              className="shelf__remove"
              aria-label={`Tirar ${disc.name} da estante`}
              onClick={() => onRemove(disc.id)}
            >
              ×
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

interface PlaylistImporterProps {
  existingIds: Set<string>;
  onImport: (discs: Disc[]) => void;
}

function importErrorMessage(error: unknown): string {
  if (error instanceof SpotifyError && error.status === 403) {
    return 'Saia e entre de novo para permitir o acesso às suas playlists.';
  }
  return errorMessage(error);
}

export function PlaylistImporter({ existingIds, onImport }: PlaylistImporterProps) {
  const [playlists, setPlaylists] = useState<Disc[] | null>(null);
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function open() {
    setLoading(true);
    setError(null);
    try {
      setPlaylists(await getMyPlaylists());
      setChosen(new Set());
    } catch (e) {
      setError(importErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  function toggle(id: string) {
    const next = new Set(chosen);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setChosen(next);
  }

  function confirm() {
    onImport(playlists?.filter((p) => chosen.has(p.id)) ?? []);
    setPlaylists(null);
  }

  if (!playlists) {
    return (
      <div className="importer">
        <button type="button" className="importer__open" disabled={loading} onClick={() => void open()}>
          {loading ? 'Carregando playlists…' : 'Importar do Spotify'}
        </button>
        {error && <p className="importer__error">{error}</p>}
      </div>
    );
  }

  const available = playlists.filter((p) => !existingIds.has(p.id));
  return (
    <div className="importer importer--open">
      {available.length === 0 ? (
        <p className="importer__note">Todas as suas playlists já estão na estante.</p>
      ) : (
        <ul className="importer__list" aria-label="Minhas playlists">
          {available.map((p) => (
            <li key={p.id}>
              <label>
                <input type="checkbox" checked={chosen.has(p.id)} onChange={() => toggle(p.id)} />
                {p.name}
              </label>
            </li>
          ))}
        </ul>
      )}
      <div className="importer__actions">
        <button type="button" className="importer__open" onClick={() => setPlaylists(null)}>
          Cancelar
        </button>
        <button type="button" className="importer__confirm" disabled={chosen.size === 0} onClick={confirm}>
          Adicionar {chosen.size || ''} à estante
        </button>
      </div>
    </div>
  );
}
