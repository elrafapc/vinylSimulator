import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { ARM_START } from './tonearm';
import './Turntable.css';

// Camadas do console (T55), em public/console/ — coordenadas em public/console/CONSOLE.md.
const BASE_URL = '/console/console-base.webp';
const RECORD_URL = '/console/record.webp';
const ARM_URL = '/console/tonearm.webp';

interface TurntableProps {
  playing: boolean;
  coverUrl?: string;
  albumName?: string;
  disabled?: boolean;
  onNeedleClick?: () => void;
  /** Ângulo do braço tocando (ver armAngle); parado, vai para o descanso. */
  armAngle?: number;
  /** Tela do console e o que mais fica por cima da foto. */
  children?: ReactNode;
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

// Área clicável do braço, nas coordenadas de tonearm.webp (638×879):
// contrapeso → pivô → tubo → cápsula. Só o desenho responde ao clique, não o retângulo todo.
const ARM_HIT_PATH = 'M560 50 L485 172 L470 300 L430 450 L370 590 L300 660 L215 700';
const HEADSHELL_HIT = '0,775 165,680 230,750 75,870';

export function Turntable({
  playing,
  coverUrl,
  albumName,
  disabled,
  onNeedleClick,
  armAngle = ARM_START,
  children,
}: TurntableProps) {
  const state = playing ? 'turntable--playing' : 'turntable--stopped';
  const recordRef = useRef<HTMLDivElement>(null);
  usePlatterSpin(playing, recordRef);

  return (
    <div className={`turntable ${state}`} data-testid="turntable" style={{ '--arm-angle': `${armAngle}deg` } as CSSProperties}>
      {/* Foto do console sem disco nem braço (prato, painéis da tela e corpo dos botões já desenhados). */}
      <img className="turntable__photo" data-testid="turntable-photo" src={BASE_URL} alt="" draggable={false} />

      {/* Gira primeiro (elemento interno), achata depois (contêiner): a foto não é 100% de cima. */}
      <div className="turntable__platter">
        <div className="turntable__record" data-testid="record" ref={recordRef}>
          <img className="turntable__vinyl" src={RECORD_URL} alt="" draggable={false} />
          <div
            className="turntable__label"
            role="img"
            aria-label={albumName ? `Capa de ${albumName}` : 'Sem disco'}
            style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : undefined}
          />
        </div>
        {/* Reflexo fixo: não gira com o disco. */}
        <span className="turntable__sheen" aria-hidden />
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
        <span className="tonearm__lift">
          <span className="tonearm__swing">
            <img className="tonearm__photo" src={ARM_URL} alt="" draggable={false} />
            <svg className="tonearm__hit" viewBox="0 0 638 879" aria-hidden focusable="false">
              <path d={ARM_HIT_PATH} />
              <polygon points={HEADSHELL_HIT} />
              <circle cx="485" cy="172" r="70" />
            </svg>
          </span>
        </span>
      </button>

      {children}
    </div>
  );
}
