import { useVolume, type VolumeState } from '../hooks/useVolume';

interface VolumeControlProps {
  volume?: number;
  /** undefined = nenhum dispositivo ativo ainda. */
  supported?: boolean;
  /** Estado compartilhado (ex.: com o botão da vitrola); sem ele, o slider cuida do próprio estado. */
  control?: VolumeState;
}

export function VolumeControl({ volume, supported, control }: VolumeControlProps) {
  const own = useVolume(volume);
  const { value, error, change } = control ?? own;

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
        onChange={(e) => change(Number(e.target.value))}
      />
      <span aria-hidden>🔊</span>
      {supported === false && <p className="volume__note">Este dispositivo não permite mudar o volume pelo app.</p>}
      {error && <p className="volume__note volume__note--error">{error}</p>}
    </div>
  );
}
