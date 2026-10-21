import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from '../spotify/errors';
import { setVolume } from '../spotify/player';

const DEBOUNCE_MS = 300;
// Depois de mexer no volume, ignora o polling por um tempo para o valor não "voltar".
const HOLD_MS = 2500;

export interface VolumeState {
  value: number;
  error: string | null;
  change: (next: number) => void;
}

// Estado único do volume: slider do menu e botão da vitrola mexem no mesmo valor.
export function useVolume(volume?: number): VolumeState {
  const [value, setValue] = useState(volume ?? 50);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastLocalChange = useRef(0);

  useEffect(() => {
    if (volume !== undefined && Date.now() - lastLocalChange.current > HOLD_MS) setValue(volume);
  }, [volume]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const change = useCallback((next: number) => {
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
  }, []);

  return { value, error, change };
}
