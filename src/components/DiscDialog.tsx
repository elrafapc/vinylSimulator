import { useEffect, useRef } from 'react';
import type { Category, ShelfDisc } from '../library/favorites';
import { CategorySelect } from './CategorySelect';
import { DiscInfo } from './DiscDetails';

interface DiscDialogProps {
  disc: ShelfDisc;
  categories: Category[];
  /** O disco já está tocando agora (o botão vira "Tocando"). */
  playing?: boolean;
  currentTrackId?: string;
  onPlay: (disc: ShelfDisc) => void;
  onRemove: (id: string) => void;
  onMoveDisc: (discId: string, categoryId: string | null) => void;
  onClose: () => void;
}

// Detalhes de um disco da estante (T40): capa grande + faixas, Tocar, Remover e categoria.
// Abre por cima da estante expandida; Esc fecha só ele.
export function DiscDialog({ disc, categories, playing, currentTrackId, onPlay, onRemove, onMoveDisc, onClose }: DiscDialogProps) {
  const playRef = useRef<HTMLButtonElement>(null);

  useEffect(() => playRef.current?.focus(), []);

  useEffect(() => {
    // Fase de captura + stopPropagation: o Esc não chega à estante nem ao painel do menu por baixo.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      onClose();
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  return (
    <div
      className="disc-dialog"
      data-testid="disc-dialog-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="disc-dialog__box" role="dialog" aria-modal="true" aria-label={`Detalhes de ${disc.name}`}>
        <button type="button" className="shelf-panel__close disc-dialog__close" aria-label="Fechar detalhes" onClick={onClose}>
          ×
        </button>
        <DiscInfo disc={disc} currentTrackId={currentTrackId} />
        <p className="disc-dialog__artist">
          {disc.kind === 'playlist' ? 'Playlist' : 'Álbum'}
          {disc.artist && ` · ${disc.artist}`}
        </p>
        <div className="disc-dialog__actions">
          <button
            ref={playRef}
            type="button"
            className="primary disc-dialog__play"
            disabled={playing}
            onClick={() => onPlay(disc)}
          >
            {playing ? 'Tocando' : '▶ Tocar'}
          </button>
          <label className="disc-dialog__category">
            Categoria
            <CategorySelect
              className="disc-dialog__select"
              discName={disc.name}
              value={disc.categoryId}
              categories={categories}
              onChange={(categoryId) => onMoveDisc(disc.id, categoryId)}
            />
          </label>
          <button type="button" className="link disc-dialog__remove" onClick={() => onRemove(disc.id)}>
            Remover da estante
          </button>
        </div>
      </div>
    </div>
  );
}
