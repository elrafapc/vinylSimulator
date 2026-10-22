import { useState } from 'react';
import { useDiscTracks } from '../hooks/useDiscTracks';
import { parseDiscUri } from '../spotify/api';
import './DiscFrame.css';
import { formatDuration } from './lcd';

export interface DiscOnTable {
  uri?: string;
  name?: string;
  imageUrl?: string;
}

interface DiscDetailsProps {
  disc: DiscOnTable;
  currentTrackId?: string;
}

interface DiscFrameProps {
  imageUrl?: string;
  /** Texto alternativo da capa; vazio quando o nome já está no botão em volta. */
  alt: string;
  size: 'small' | 'large';
}

// Quadro de parede (T51): moldura preta, passe-partout, capa à esquerda e o vinil saindo pela direita.
export function DiscFrame({ imageUrl, alt, size }: DiscFrameProps) {
  return (
    <span className={`disc-frame disc-frame--${size}`} data-testid="disc-frame">
      <span className="disc-frame__mat">
        <span className="disc-frame__window">
          <span className="disc-frame__vinyl" aria-hidden>
            <span className="disc-frame__label" style={imageUrl ? { backgroundImage: `url("${imageUrl}")` } : undefined} />
          </span>
          {imageUrl ? (
            <img className="disc-frame__cover" src={imageUrl} alt={alt} />
          ) : (
            <span className="disc-frame__cover disc-frame__cover--empty" />
          )}
        </span>
      </span>
    </span>
  );
}

interface DiscInfoProps {
  disc: DiscOnTable;
  currentTrackId?: string;
}

// Capa grande + faixas (busca as faixas ao aparecer). Usado no bloco "Disco" e nos detalhes da estante (T40).
export function DiscInfo({ disc, currentTrackId }: DiscInfoProps) {
  const { uri } = disc;
  const ref = parseDiscUri(uri);
  const state = useDiscTracks(uri);

  const name = disc.name ?? 'disco';

  return (
    <div className="details__body">
      {disc.imageUrl && <DiscFrame imageUrl={disc.imageUrl} alt={`Capa de ${name}`} size="large" />}
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
  );
}

// Miniatura abaixo do toca-discos; expandida mostra a capa grande e as faixas.
export function DiscDetails({ disc, currentTrackId }: DiscDetailsProps) {
  const [expanded, setExpanded] = useState(false);
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
        <DiscFrame imageUrl={disc.imageUrl} alt="" size="small" />
      </button>
      {expanded && <DiscInfo disc={disc} currentTrackId={currentTrackId} />}
    </section>
  );
}
