import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { useLocalProgress } from '../hooks/useLocalProgress';
import type { NowPlaying as NowPlayingState } from '../spotify/player';
import { formatTime } from './lcd';
import './NowPlaying.css';

interface NowPlayingProps {
  nowPlaying: NowPlayingState | null;
  /** Quando `nowPlaying` foi lido do Spotify. */
  fetchedAt?: number;
}

/** Quantidade de blocos da barra de progresso do display. */
export const PROGRESS_BLOCKS = 20;

// Letreiro: o título só rola quando não cabe na largura do vidro.
function Marquee({ text }: { text: string }) {
  const box = useRef<HTMLSpanElement>(null);
  const inner = useRef<HTMLSpanElement>(null);
  const [overflows, setOverflows] = useState(false);

  useLayoutEffect(() => {
    const measure = () => {
      if (box.current && inner.current) setOverflows(inner.current.scrollWidth > box.current.clientWidth);
    };
    measure();
    if (typeof ResizeObserver === 'undefined' || !box.current) return;
    const observer = new ResizeObserver(measure);
    observer.observe(box.current);
    return () => observer.disconnect();
  }, [text]);

  return (
    <span ref={box} className={`lcd__marquee${overflows ? ' lcd__marquee--scroll' : ''}`} style={{ '--marquee-s': `${Math.max(8, text.length * 0.35)}s` } as CSSProperties}>
      <span ref={inner} className="lcd__marquee-text">
        {text}
      </span>
      {overflows && (
        <span className="lcd__marquee-text" aria-hidden>
          {text}
        </span>
      )}
    </span>
  );
}

// Dígitos de 7 segmentos com os "88:88" apagados atrás, como num LCD de verdade.
function Segments({ value }: { value: string }) {
  return (
    <span className="lcd__segments" aria-hidden>
      <span className="lcd__segments-ghost">{value.replace(/[0-9-]/g, '8')}</span>
      <span className="lcd__segments-lit">{value}</span>
    </span>
  );
}

export function NowPlaying({ nowPlaying, fetchedAt = Date.now() }: NowPlayingProps) {
  const progressMs = useLocalProgress(nowPlaying, fetchedAt);
  const progress = nowPlaying?.durationMs ? (progressMs / nowPlaying.durationMs) * 100 : 0;
  const lit = Math.round((progress / 100) * PROGRESS_BLOCKS);
  const elapsed = nowPlaying ? formatTime(progressMs) : '--:--';
  const total = nowPlaying ? formatTime(nowPlaying.durationMs) : '--:--';

  return (
    <div className={`now-playing lcd${nowPlaying ? '' : ' now-playing--idle'}`} aria-live="polite">
      <div className="lcd__glass">
        {nowPlaying ? (
          <>
            <p className="now-playing__track">
              <Marquee text={nowPlaying.trackName} />
            </p>
            <p className="now-playing__artist">{nowPlaying.artist}</p>
            <p className="now-playing__album">{nowPlaying.albumName}</p>
          </>
        ) : (
          <>
            <p className="now-playing__track">SEM SINAL</p>
            <p className="now-playing__album">Nenhuma faixa no Spotify agora.</p>
          </>
        )}
        <p className="lcd__time" data-testid="lcd-time">
          <Segments value={elapsed} />
          <span className="lcd__time-sep" aria-hidden>
            /
          </span>
          <Segments value={total} />
          <span className="lcd__sr">
            {nowPlaying ? `${elapsed} de ${total}` : 'Sem tempo'}
          </span>
        </p>
        <div
          className="now-playing__bar lcd__blocks"
          role="progressbar"
          aria-label="Progresso da faixa"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
        >
          {Array.from({ length: PROGRESS_BLOCKS }, (_, i) => (
            <span key={i} className={`lcd__block${i < lit ? ' lcd__block--on' : ''}`} />
          ))}
        </div>
        {nowPlaying?.deviceName && <p className="now-playing__device">Tocando em: {nowPlaying.deviceName}</p>}
      </div>
    </div>
  );
}
