import { useEffect, useRef } from 'react';
import type { Disc } from '../spotify/api';
import { Shelf } from './Shelf';

interface ShelfPanelProps {
  discs: Disc[];
  selectedId?: string;
  playingId?: string;
  onSelect: (disc: Disc) => void;
  onRemove: (id: string) => void;
  onPlay: () => void;
  onClose: () => void;
}

// Estante grande sobre a tela; fecha com Esc, clique fora ou ao escolher um disco.
export function ShelfPanel({ discs, selectedId, playingId, onSelect, onRemove, onPlay, onClose }: ShelfPanelProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => closeRef.current?.focus(), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="shelf-panel"
      data-testid="shelf-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="shelf-panel__dialog" role="dialog" aria-modal="true" aria-labelledby="shelf-panel-title">
        <header className="shelf-panel__header">
          <h2 id="shelf-panel-title">Estante</h2>
          <button ref={closeRef} type="button" className="shelf-panel__close" aria-label="Fechar estante" onClick={onClose}>
            ×
          </button>
        </header>
        <Shelf
          large
          discs={discs}
          selectedId={selectedId}
          playingId={playingId}
          onRemove={onRemove}
          onSelect={(disc) => {
            onSelect(disc);
            onClose();
          }}
          onPlay={() => {
            onPlay();
            onClose();
          }}
        />
      </div>
    </div>
  );
}
