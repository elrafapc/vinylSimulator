import { useFullscreen } from '../hooks/useFullscreen';

export function FullscreenToggle() {
  const { fullscreen, supported, toggle } = useFullscreen();
  if (!supported) return null;
  const label = fullscreen ? 'Sair da tela cheia (F)' : 'Tela cheia (F)';
  return (
    <button type="button" className="theme-toggle" aria-label={label} title={label} aria-pressed={fullscreen} onClick={toggle}>
      {fullscreen ? '⤡' : '⤢'}
    </button>
  );
}
