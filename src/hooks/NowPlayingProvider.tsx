import type { ReactNode } from 'react';
import { NowPlayingContext, usePlayerPolling } from './useNowPlaying';

// Dono do único polling de "tocando agora" (T46). Componentes usam useNowPlaying(), nunca consultam por conta própria.
export function NowPlayingProvider({ children }: { children: ReactNode }) {
  const state = usePlayerPolling();
  return <NowPlayingContext.Provider value={state}>{children}</NowPlayingContext.Provider>;
}
