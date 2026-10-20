import { useCallback, useState } from 'react';

const STORAGE_KEY = 'vinil.sidebar';

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'collapsed';
  } catch {
    return false;
  }
}

function saveCollapsed(collapsed: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, collapsed ? 'collapsed' : 'open');
  } catch {
    // sem storage: o estado vale só nesta aba
  }
}

export function useSidebar() {
  const [collapsed, setCollapsed] = useState(readCollapsed);

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      saveCollapsed(!prev);
      return !prev;
    });
  }, []);

  return { collapsed, toggle };
}
