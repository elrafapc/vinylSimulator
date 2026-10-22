import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { SoundEngine, SoundPrefs } from '../audio/loop';

interface SoundControlProps {
  /** Toca quando ligado e `active` (ex.: chiado só com música tocando). */
  active: boolean;
  /** Nome do som (rótulo da linha e do interruptor), ex.: "Chiado". */
  name: string;
  volumeLabel: string;
  load: () => SoundPrefs;
  save: (prefs: SoundPrefs) => void;
  create: (volume: number) => SoundEngine;
  /** Avisa quem mostra o resumo do bloco Sons (T57). */
  onEnabledChange?: (enabled: boolean) => void;
}

// Uma linha por som (T57): nome, interruptor e volume; desligado fica esmaecido, com o volume preservado.
export function SoundControl({ active, name, volumeLabel, load, save, create, onEnabledChange }: SoundControlProps) {
  const [prefs, setPrefs] = useState(load);
  const engineRef = useRef<SoundEngine | null>(null);

  useEffect(() => {
    const engine = (engineRef.current ??= create(prefs.volume));
    engine.setVolume(prefs.volume);
    if (prefs.enabled && active) engine.start();
    else engine.stop();
  }, [prefs, active, create]);

  useEffect(() => () => engineRef.current?.stop(), []);

  function update(next: SoundPrefs) {
    setPrefs(next);
    save(next);
    if (next.enabled !== prefs.enabled) onEnabledChange?.(next.enabled);
  }

  return (
    <div className={`sound${prefs.enabled ? '' : ' sound--off'}`}>
      <span className="sound__name" aria-hidden>
        {name}
      </span>
      <button
        type="button"
        role="switch"
        className="switch"
        aria-label={name}
        aria-checked={prefs.enabled}
        onClick={() => update({ ...prefs, enabled: !prefs.enabled })}
      >
        <span className="switch__thumb" />
      </button>
      <input
        type="range"
        className="sound__volume"
        style={{ '--fill': `${prefs.volume * 100}%` } as CSSProperties}
        aria-label={volumeLabel}
        min={0}
        max={1}
        step={0.05}
        value={prefs.volume}
        disabled={!prefs.enabled}
        onChange={(e) => update({ ...prefs, volume: Number(e.target.value) })}
      />
    </div>
  );
}
