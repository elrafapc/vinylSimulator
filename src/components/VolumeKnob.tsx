import { useEffect, useRef, type KeyboardEvent, type PointerEvent } from 'react';
import { clampVolume, valueFromPointer, valueToAngle } from './knob';

interface VolumeKnobProps {
  value: number;
  disabled?: boolean;
  onChange: (value: number) => void;
  /** Soltou o knob: envia o volume já, sem esperar os 300ms (T46). */
  onCommit?: () => void;
}

const WHEEL_STEP = 2;
const KEY_STEPS: Record<string, (v: number) => number> = {
  ArrowUp: (v) => v + 5,
  ArrowRight: (v) => v + 5,
  ArrowDown: (v) => v - 5,
  ArrowLeft: (v) => v - 5,
  PageUp: (v) => v + 10,
  PageDown: (v) => v - 10,
  Home: () => 0,
  End: () => 100,
};

// Botão da vitrola (no lugar do 33/45 da foto) controla o volume do Spotify.
export function VolumeKnob({ value, disabled, onChange, onCommit }: VolumeKnobProps) {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const latest = useRef({ value, disabled, onChange });
  latest.current = { value, disabled, onChange };

  // Listener nativo: o onWheel do React é passivo e não impede a página de rolar.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const { value: v, disabled: off, onChange: change } = latest.current;
      if (off || e.deltaY === 0) return;
      e.preventDefault();
      change(clampVolume(v + (e.deltaY < 0 ? WHEEL_STEP : -WHEEL_STEP)));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  function fromPointer(e: PointerEvent<HTMLDivElement>) {
    const box = e.currentTarget.getBoundingClientRect();
    const next = valueFromPointer(e.clientX - (box.left + box.width / 2), e.clientY - (box.top + box.height / 2), value);
    if (next !== value) onChange(next);
  }

  function handleKey(e: KeyboardEvent<HTMLDivElement>) {
    const step = KEY_STEPS[e.key];
    if (!step || disabled) return;
    e.preventDefault();
    const next = clampVolume(step(value));
    if (next !== value) onChange(next);
  }

  return (
    <div
      ref={ref}
      className="knob"
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label="Volume (botão da vitrola)"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      aria-valuetext={`${value}%`}
      aria-disabled={disabled || undefined}
      onKeyDown={handleKey}
      onPointerDown={(e) => {
        if (disabled) return;
        dragging.current = true;
        e.currentTarget.setPointerCapture?.(e.pointerId);
        fromPointer(e);
      }}
      onPointerMove={(e) => dragging.current && fromPointer(e)}
      onPointerUp={() => {
        if (dragging.current) onCommit?.();
        dragging.current = false;
      }}
      onPointerCancel={() => {
        if (dragging.current) onCommit?.();
        dragging.current = false;
      }}
    >
      <span className="knob__cap" style={{ transform: `rotate(${valueToAngle(value)}deg)` }} />
      <span className="knob__mark knob__mark--min" aria-hidden>
        mín.
      </span>
      <span className="knob__mark knob__mark--max" aria-hidden>
        máx.
      </span>
    </div>
  );
}
