import { useState } from 'react';
import { getMyPlaylists, type Disc } from '../spotify/api';
import { errorMessage, SpotifyError } from '../spotify/errors';
import { DownloadIcon, SearchIcon } from './MenuIcons';
import './Shelf.css';

interface PlaylistImporterProps {
  existingIds: Set<string>;
  onImport: (discs: Disc[]) => void;
}

// Sem acento e sem diferenciar maiúsculas: "cafe" acha "Café".
function normalize(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
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
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function open() {
    setLoading(true);
    setError(null);
    try {
      setPlaylists(await getMyPlaylists());
      setChosen(new Set());
      setQuery('');
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
        <p className="menu-section__lead">Traga suas playlists para a estante.</p>
        {/* Único botão âmbar do menu (T57). */}
        <button type="button" className="button button--primary button--wide" disabled={loading} onClick={() => void open()}>
          <DownloadIcon />
          {loading ? 'Carregando playlists…' : 'Importar playlists'}
        </button>
        {error && <p className="importer__error">{error}</p>}
      </div>
    );
  }

  const available = playlists.filter((p) => !existingIds.has(p.id));
  // Todas as páginas já vieram de uma vez; o filtro é local, a cada tecla.
  const term = normalize(query);
  const shown = term ? available.filter((p) => normalize(p.name).includes(term)) : available;
  return (
    <div className="importer importer--open">
      {available.length > 0 && (
        <label className="field importer__search">
          <SearchIcon />
          <input
            type="search"
            className="field__input"
            placeholder="Filtrar minhas playlists"
            aria-label="Filtrar minhas playlists"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      )}
      {available.length === 0 ? (
        <p className="importer__note">Todas as suas playlists já estão na estante.</p>
      ) : shown.length === 0 ? (
        <p className="importer__note">Nenhuma playlist encontrada para "{query.trim()}".</p>
      ) : (
        <ul className="importer__list" aria-label="Minhas playlists">
          {shown.map((p) => (
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
        <button type="button" className="button" onClick={() => setPlaylists(null)}>
          Cancelar
        </button>
        <button type="button" className="button button--primary" disabled={chosen.size === 0} onClick={confirm}>
          Adicionar {chosen.size || ''} à estante
        </button>
      </div>
    </div>
  );
}
