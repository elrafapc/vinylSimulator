import { useEffect, useId, useRef, type RefObject } from 'react';
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

// Grade de furos da cápsula.
const GRILLE = Array.from({ length: 24 }, (_, i) => ({ x: 392 + (i % 4) * 4, y: 296 + Math.floor(i / 4) * 4.4 }));
// Mesmo traço do tubo, desenhado três vezes (corpo, borda escura, brilho) para parecer cromado.
const TUBE = 'M412 46 L412 200 C412 236 398 244 398 276 L398 290';

export function Turntable({ playing, coverUrl, albumName, disabled, onNeedleClick }: TurntableProps) {
  const state = playing ? 'turntable--playing' : 'turntable--stopped';
  const recordRef = useRef<HTMLDivElement>(null);
  usePlatterSpin(playing, recordRef);
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const chrome = `chrome-${id}`;
  const knob = `knob-${id}`;

  return (
    <div className={`turntable ${state}`} data-testid="turntable">
      <div className="turntable__platter">
        <div className="turntable__record" data-testid="record" ref={recordRef}>
          <div
            className="turntable__label"
            role="img"
            aria-label={albumName ? `Capa de ${albumName}` : 'Sem disco'}
            style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : undefined}
          />
        </div>
        {/* Luz fixa: só o disco gira por baixo dela. */}
        <div className="turntable__sheen" data-testid="sheen" aria-hidden />
        <span className="turntable__spindle" aria-hidden />
      </div>

      <button
        type="button"
        className="turntable__arm"
        data-testid="tonearm"
        aria-label={playing ? 'Levantar agulha' : 'Baixar agulha'}
        disabled={disabled}
        onClick={onNeedleClick}
      >
        <svg className="tonearm" viewBox="0 0 460 380" aria-hidden focusable="false">
          <defs>
            <linearGradient id={chrome} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" style={{ stopColor: 'var(--metal-dark)' }} />
              <stop offset="0.3" style={{ stopColor: 'var(--metal-light)' }} />
              <stop offset="0.55" style={{ stopColor: 'var(--metal-mid)' }} />
              <stop offset="1" style={{ stopColor: 'var(--metal-dark)' }} />
            </linearGradient>
            <radialGradient id={knob} cx="0.5" cy="0.5" fx="0.35" fy="0.3" r="0.6">
              <stop offset="0" style={{ stopColor: 'var(--metal-light)' }} />
              <stop offset="0.6" style={{ stopColor: 'var(--metal-mid)' }} />
              <stop offset="1" style={{ stopColor: 'var(--metal-dark)' }} />
            </radialGradient>
          </defs>

          {/* Base fixa do braço. */}
          <g className="tonearm__base">
            <circle cx="412" cy="52" r="26" className="tonearm__plate" />
            <rect x="384" y="49" width="6" height="6" rx="1" className="tonearm__notch" />
            <rect x="434" y="49" width="6" height="6" rx="1" className="tonearm__notch" />
            <circle cx="412" cy="52" r="15" fill={`url(#${knob})`} />
          </g>

          {/* Desce (sombra menor) depois de girar até o disco. */}
          <g className="tonearm__lift">
            <g className="tonearm__swing">
              <rect x="409.5" y="10" width="5" height="38" fill={`url(#${chrome})`} />
              <g className="tonearm__counterweight">
                <rect x="401" y="15" width="22" height="24" rx="3" fill={`url(#${chrome})`} />
                {[20, 24, 28, 32].map((y) => (
                  <line key={y} x1="402" x2="422" y1={y} y2={y} className="tonearm__scale" />
                ))}
                <rect x="405" y="8" width="14" height="8" rx="2" className="tonearm__cap" />
              </g>

              <path d={TUBE} className="tonearm__tube-edge" transform="translate(1.4 0.6)" />
              <path d={TUBE} className="tonearm__tube" />
              <path d={TUBE} className="tonearm__tube-shine" transform="translate(-1.2 0)" />
              <circle cx="412" cy="52" r="8" fill={`url(#${knob})`} className="tonearm__collar" />

              <g className="tonearm__headshell">
                <rect x="393" y="282" width="10" height="10" rx="1" className="tonearm__connector" />
                <path d="M406 302 L417 297" className="tonearm__finger" />
                <rect x="388" y="290" width="20" height="36" rx="2" className="tonearm__cartridge" />
                {GRILLE.map(({ x, y }) => (
                  <circle key={`${x}-${y}`} cx={x} cy={y} r="0.9" className="tonearm__grille" />
                ))}
              </g>
            </g>
          </g>
        </svg>
      </button>
      <span className="turntable__light" aria-hidden />
    </div>
  );
}
