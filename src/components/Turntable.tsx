import './Turntable.css';

interface TurntableProps {
  playing: boolean;
  coverUrl?: string;
  albumName?: string;
  disabled?: boolean;
  onNeedleClick?: () => void;
}

export function Turntable({ playing, coverUrl, albumName, disabled, onNeedleClick }: TurntableProps) {
  const state = playing ? 'turntable--playing' : 'turntable--stopped';
  return (
    <div className={`turntable ${state}`} data-testid="turntable">
      <div className="turntable__platter">
        <div className="turntable__record" data-testid="record">
          <div
            className="turntable__label"
            role="img"
            aria-label={albumName ? `Capa de ${albumName}` : 'Sem disco'}
            style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : undefined}
          />
          <span className="turntable__spindle" />
        </div>
      </div>
      <span className="turntable__pivot" />
      <button
        type="button"
        className="turntable__arm"
        data-testid="tonearm"
        aria-label={playing ? 'Levantar agulha' : 'Baixar agulha'}
        disabled={disabled}
        onClick={onNeedleClick}
      >
        <span className="turntable__head" />
      </button>
      <span className="turntable__light" aria-hidden />
    </div>
  );
}
