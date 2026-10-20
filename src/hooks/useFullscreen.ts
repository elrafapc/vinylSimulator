import { useCallback, useEffect, useState } from 'react';

function isFullscreen(): boolean {
  return Boolean(document.fullscreenElement);
}

// Não rouba o "F" de quem está digitando (ex.: busca).
function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return Boolean(el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)));
}

export function useFullscreen() {
  const [fullscreen, setFullscreen] = useState(isFullscreen);
  const supported = typeof document.documentElement.requestFullscreen === 'function';

  const toggle = useCallback(() => {
    const request = isFullscreen() ? document.exitFullscreen() : document.documentElement.requestFullscreen();
    // Recusado pelo navegador (ex.: sem gesto do usuário): só mantém o estado atual.
    void request?.catch(() => setFullscreen(isFullscreen()));
  }, []);

  useEffect(() => {
    // Também cobre sair com Esc, que o navegador trata sozinho.
    const onChange = () => setFullscreen(isFullscreen());
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'f' || e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) return;
      e.preventDefault();
      toggle();
    };
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('keydown', onKey);
    };
  }, [toggle]);

  return { fullscreen, supported, toggle };
}
