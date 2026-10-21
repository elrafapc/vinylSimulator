import { useCallback, useSyncExternalStore } from 'react';

// Abaixo disso o app usa o layout de celular (T36).
export const MOBILE_QUERY = '(max-width: 767px)';

// true enquanto a media query bater; atualiza ao girar o aparelho ou redimensionar.
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia?.(query);
      list?.addEventListener?.('change', onChange);
      return () => list?.removeEventListener?.('change', onChange);
    },
    [query],
  );
  return useSyncExternalStore(subscribe, () => window.matchMedia?.(query).matches ?? false);
}
