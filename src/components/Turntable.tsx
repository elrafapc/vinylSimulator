import { useEffect, useRef, type RefObject } from 'react';
import armUrl from '../assets/turntable-arm.png';
import baseUrl from '../assets/turntable-base.png';
import './Turntable.css';

interface TurntableProps {
  playing: boolean;
  coverUrl?: string;
  albumName?: string;
  disabled?: boolean;
  onNeedleClick?: () => void;
}

// 33⅓ rpm ≈ 1,8 s por volta.
const MAX_SPEED = 360 / 1.8;
const SPIN_UP_SECONDS = 1;
const SPIN_DOWN_SECONDS = 1.5;
// Braço chega ao disco (0,9 s) e a agulha desce (0,3 s) antes de o prato girar.
const NEEDLE_DROP_SECONDS = 1.2;

function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

// Prato com inércia: acelera/desacelera a partir do ângulo atual (CSS puro não consegue, ver ADR-017).
// Escreve direto no estilo do disco para não re-renderizar o React a cada quadro.
function usePlatterSpin(playing: boolean, recordRef: RefObject<HTMLDivElement | null>) {
  const angle = useRef(0);
  const speed = useRef(0);

  useEffect(() => {
    const record = recordRef.current;
    if (!record || typeof requestAnimationFrame !== 'function' || prefersReducedMotion()) return;
    const target = playing ? MAX_SPEED : 0;
    const accel = MAX_SPEED / (playing ? SPIN_UP_SECONDS : SPIN_DOWN_SECONDS);
    let start: number | null = null;
    let last = 0;
    let frame = 0;

    const tick = (now: number) => {
      start ??= now;
      const dt = Math.min(0.1, (now - (last || now)) / 1000);
      last = now;
      if (!playing || now - start >= NEEDLE_DROP_SECONDS * 1000) {
        const step = accel * dt;
        speed.current = speed.current < target ? Math.min(target, speed.current + step) : Math.max(target, speed.current - step);
      }
      angle.current = (angle.current + speed.current * dt) % 360;
      record.style.transform = `rotate(${angle.current}deg)`;
      if (playing || speed.current > 0) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, recordRef]);
}

// Área clicável do braço, nas coordenadas do recorte (turntable-arm.png, 384×633):
// contrapeso → torre → tubo → cápsula. Só o desenho responde ao clique, não o retângulo todo.
const ARM_HIT_PATH = 'M341 40 L292 146 L268 199 L249 279 L231 359 L221 399 L204 439 L171 479 L121 524 L70 572';
const HEADSHELL_HIT = '2,589 86,514 129,561 48,630';

export function Turntable({ playing, coverUrl, albumName, disabled, onNeedleClick }: TurntableProps) {
  const state = playing ? 'turntable--playing' : 'turntable--stopped';
  const recordRef = useRef<HTMLDivElement>(null);
  usePlatterSpin(playing, recordRef);

  return (
    <div className={`turntable ${state}`} data-testid="turntable">
      {/* Foto da vitrola sem o braço; os reflexos do disco ficam nela, parados. */}
      <img className="turntable__photo" data-testid="turntable-photo" src={baseUrl} alt="" draggable={false} />

      {/* Selo: a capa gira por cima do selo da foto. */}
      <div className="turntable__record" data-testid="record" ref={recordRef}>
        <div
          className="turntable__label"
          role="img"
          aria-label={albumName ? `Capa de ${albumName}` : 'Sem disco'}
          style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : undefined}
        />
      </div>
      <span className="turntable__spindle" aria-hidden />

      <button
        type="button"
        className="turntable__arm"
        data-testid="tonearm"
        aria-label={playing ? 'Levantar agulha' : 'Baixar agulha'}
        disabled={disabled}
        onClick={onNeedleClick}
      >
        <span className="tonearm__lift">
          <span className="tonearm__swing">
            <img className="tonearm__photo" src={armUrl} alt="" draggable={false} />
            <svg className="tonearm__hit" viewBox="0 0 384 633" aria-hidden focusable="false">
              <path d={ARM_HIT_PATH} />
              <polygon points={HEADSHELL_HIT} />
              <circle cx="292" cy="146.5" r="47" />
            </svg>
          </span>
        </span>
      </button>
    </div>
  );
}
