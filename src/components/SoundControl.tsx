import { useEffect, useRef, useState } from 'react';
import type { SoundEngine, SoundPrefs } from '../audio/loop';

interface SoundControlProps {
  /** Toca quando ligado e `active` (ex.: chiado só com música tocando). */
  active: boolean;
  labelOn: string;
  labelOff: string;
  volumeLabel: string;
  load: () => SoundPrefs;
  save: (prefs: SoundPrefs) => void;
  create: (volume: number) => SoundEngine;
}

export function SoundControl({ active, labelOn, labelOff, volumeLabel, load, save, create }: SoundControlProps) {
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
  }

  return (
    <div className="crackle">
      <button
        type="button"
        className="crackle__toggle"
        aria-pressed={prefs.enabled}
        onClick={() => update({ ...prefs, enabled: !prefs.enabled })}
      >
        {prefs.enabled ? labelOn : labelOff}
      </button>
      <input
        type="range"
        className="crackle__volume"
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
