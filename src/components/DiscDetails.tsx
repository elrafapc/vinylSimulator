import { useEffect, useState } from 'react';
import { getDiscTracks, parseDiscUri, type Track } from '../spotify/api';
import { errorMessage } from '../spotify/errors';

export interface DiscOnTable {
  uri?: string;
  name?: string;
  imageUrl?: string;
}

interface DiscDetailsProps {
  disc: DiscOnTable;
  currentTrackId?: string;
}

type TracksState = { status: 'loading' } | { status: 'ok'; tracks: Track[] } | { status: 'error'; message: string };

function formatDuration(ms: number): string {
  const total = Math.round(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

// Miniatura abaixo do toca-discos; expandida mostra a capa grande e as faixas.
export function DiscDetails({ disc, currentTrackId }: DiscDetailsProps) {
  const [expanded, setExpanded] = useState(false);
  const [state, setState] = useState<TracksState>({ status: 'loading' });
  const { uri } = disc;
  const ref = parseDiscUri(uri);

  useEffect(() => {
    if (!expanded || !uri || !parseDiscUri(uri)) return;
    let cancelled = false;
    setState({ status: 'loading' });
    getDiscTracks(uri)
      .then((tracks) => !cancelled && setState({ status: 'ok', tracks }))
      .catch((error: unknown) => {
        if (cancelled) return;
        // Playlists de outras pessoas não liberam as faixas em Development Mode.
        const message = parseDiscUri(uri)?.kind === 'album' ? errorMessage(error) : 'Faixas indisponíveis.';
        setState({ status: 'error', message });
      });
    return () => {
      cancelled = true;
    };
  }, [expanded, uri]);

  const name = disc.name ?? 'disco';

  return (
    <section className={`details${expanded ? ' details--open' : ''}`}>
      <button
        type="button"
        className="details__toggle"
        aria-expanded={expanded}
        aria-label={expanded ? `Fechar detalhes de ${name}` : `Ver detalhes de ${name}`}
        onClick={() => setExpanded(!expanded)}
      >
        {disc.imageUrl ? <img src={disc.imageUrl} alt="" /> : <span className="details__nocover" />}
      </button>
      {expanded && (
        <div className="details__body">
          {disc.imageUrl && <img className="details__cover" src={disc.imageUrl} alt={`Capa de ${name}`} />}
          <div className="details__tracks">
            <h3>{name}</h3>
            {!ref && <p className="details__note">Faixas indisponíveis.</p>}
            {ref && state.status === 'loading' && <p className="details__note">Lendo a contracapa…</p>}
            {ref && state.status === 'error' && <p className="details__note">{state.message}</p>}
            {ref && state.status === 'ok' && (
              <ol className="details__list" aria-label="Faixas">
                {state.tracks.map((track) => {
                  const current = Boolean(currentTrackId) && track.id === currentTrackId;
                  return (
                    <li
                      key={`${track.number}-${track.id}`}
                      className={current ? 'details__track details__track--current' : 'details__track'}
                      aria-current={current ? 'true' : undefined}
                    >
                      <span className="details__num">{track.number}</span>
                      <span className="details__name">{track.name}</span>
                      <span className="details__time">{formatDuration(track.durationMs)}</span>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
