import { useFullscreen } from '../hooks/useFullscreen';
import { CompressIcon, ExpandIcon } from './MenuIcons';

export function FullscreenToggle() {
  const { fullscreen, supported, toggle } = useFullscreen();
  if (!supported) return null;
  const label = fullscreen ? 'Sair da tela cheia (F)' : 'Tela cheia (F)';
  return (
    <button type="button" className="icon-button" aria-label={label} title={label} aria-pressed={fullscreen} onClick={toggle}>
      {fullscreen ? <CompressIcon /> : <ExpandIcon />}
    </button>
  );
}
