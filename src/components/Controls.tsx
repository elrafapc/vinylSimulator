interface ControlsProps {
  playing: boolean;
  disabled?: boolean;
  onPlayPause: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export function Controls({ playing, disabled, onPlayPause, onPrev, onNext }: ControlsProps) {
  return (
    <div className="controls">
      <button type="button" className="controls__button" aria-label="Faixa anterior" disabled={disabled} onClick={onPrev}>
        ⏮
      </button>
      <button
        type="button"
        className="controls__button controls__button--main"
        aria-label={playing ? 'Pausar' : 'Tocar'}
        disabled={disabled}
        onClick={onPlayPause}
      >
        {playing ? '❚❚' : '▶'}
      </button>
      <button type="button" className="controls__button" aria-label="Próxima faixa" disabled={disabled} onClick={onNext}>
        ⏭
      </button>
    </div>
  );
}
