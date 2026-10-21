import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from '../spotify/errors';
import { setVolume } from '../spotify/player';

const DEBOUNCE_MS = 300;
// Depois de mexer no volume, ignora o polling por um tempo para o valor não "voltar".
const HOLD_MS = 2500;

export interface VolumeState {
  value: number;
  error: string | null;
  /** Muda o valor na tela; envia ao Spotify depois de 300ms parado. */
  change: (next: number) => void;
  /** Envia já o que estiver pendente (ex.: soltou o knob). */
  commit: () => void;
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

  const pending = useRef<number | null>(null);

  const send = useCallback(async () => {
    clearTimeout(timer.current);
    const next = pending.current;
    pending.current = null;
    if (next === null) return;
    try {
      await setVolume(next);
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
    }
  }, []);

  const change = useCallback(
    (next: number) => {
      setValue(next);
      lastLocalChange.current = Date.now();
      pending.current = next;
      clearTimeout(timer.current);
      timer.current = setTimeout(() => void send(), DEBOUNCE_MS);
    },
    [send],
  );

  const commit = useCallback(() => void send(), [send]);

  return { value, error, change, commit };
}
