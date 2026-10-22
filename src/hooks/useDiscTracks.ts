import { useEffect, useState } from 'react';
import { getDiscTracks, parseDiscUri, type Track } from '../spotify/api';
import { errorMessage } from '../spotify/errors';

export type TracksState = { status: 'loading' } | { status: 'ok'; tracks: Track[] } | { status: 'error'; message: string };

// Faixas do disco (álbum em cache para sempre, playlist por 10 min — ver T46). Sem uri válida, fica "loading".
export function useDiscTracks(uri: string | undefined): TracksState {
  // Guarda de qual disco é o resultado: ao trocar de disco, não mostra as faixas do anterior.
  const [state, setState] = useState<{ uri?: string; tracks: TracksState }>({ tracks: { status: 'loading' } });

  useEffect(() => {
    if (!uri || !parseDiscUri(uri)) return;
    let cancelled = false;
    getDiscTracks(uri)
      .then((tracks) => !cancelled && setState({ uri, tracks: { status: 'ok', tracks } }))
      .catch((error: unknown) => {
        if (cancelled) return;
        // Playlists de outras pessoas não liberam as faixas em Development Mode.
        const message = parseDiscUri(uri)?.kind === 'album' ? errorMessage(error) : 'Faixas indisponíveis.';
        setState({ uri, tracks: { status: 'error', message } });
      });
    return () => {
      cancelled = true;
    };
  }, [uri]);

  return state.uri === uri ? state.tracks : { status: 'loading' };
}
