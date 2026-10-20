interface PlayOverlayProps {
  discName: string;
  playing?: boolean;
  onPlay: () => void;
}

// Botão sobre a capa do disco selecionado; Enter/Espaço funcionam por ser um <button>.
export function PlayOverlay({ discName, playing, onPlay }: PlayOverlayProps) {
  return (
    <button
      type="button"
      className="play-overlay"
      aria-label={playing ? `Pausar ${discName}` : `Tocar ${discName}`}
      onClick={(e) => {
        e.stopPropagation();
        onPlay();
      }}
    >
      {playing ? '❚❚' : '▶'}
    </button>
  );
}
