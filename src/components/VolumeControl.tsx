import { useEffect, useRef, useState } from 'react';
import { errorMessage } from '../spotify/errors';
import { setVolume } from '../spotify/player';

const DEBOUNCE_MS = 300;
// Depois de mexer no slider, ignora o polling por um tempo para o valor não "voltar".
const HOLD_MS = 2500;

interface VolumeControlProps {
  volume?: number;
  /** undefined = nenhum dispositivo ativo ainda. */
  supported?: boolean;
}

export function VolumeControl({ volume, supported }: VolumeControlProps) {
  const [value, setValue] = useState(volume ?? 50);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastLocalChange = useRef(0);

  useEffect(() => {
    if (volume !== undefined && Date.now() - lastLocalChange.current > HOLD_MS) setValue(volume);
  }, [volume]);

  useEffect(() => () => clearTimeout(timer.current), []);

  function handleChange(next: number) {
    setValue(next);
    lastLocalChange.current = Date.now();
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        await setVolume(next);
        setError(null);
      } catch (e) {
        setError(errorMessage(e));
      }
    }, DEBOUNCE_MS);
  }

  return (
    <div className="volume">
      <span aria-hidden>🔈</span>
      <input
        type="range"
        className="volume__slider"
        aria-label="Volume do Spotify"
        min={0}
        max={100}
        step={1}
        value={value}
        disabled={!supported}
        onChange={(e) => handleChange(Number(e.target.value))}
      />
      <span aria-hidden>🔊</span>
      {supported === false && <p className="volume__note">Este dispositivo não permite mudar o volume pelo app.</p>}
      {error && <p className="volume__note volume__note--error">{error}</p>}
    </div>
  );
}
