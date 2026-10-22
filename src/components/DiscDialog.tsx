import { useEffect, useRef } from 'react';
import type { ShelfDisc } from '../library/favorites';
import { DiscInfo } from './DiscDetails';
import { CloseIcon } from './MenuIcons';
import { TagInput } from './TagInput';

interface DiscDialogProps {
  disc: ShelfDisc;
  /** Etiquetas já usadas na estante (autocompletar). */
  allTags: string[];
  /** O disco já está tocando agora (o botão vira "Tocando"). */
  playing?: boolean;
  currentTrackId?: string;
  onPlay: (disc: ShelfDisc) => void;
  onRemove: (id: string) => void;
  onAddTag: (discId: string, tag: string) => string | null;
  onRemoveTag: (discId: string, tag: string) => void;
  onClose: () => void;
}

// Detalhes de um disco da estante (T40): capa grande + faixas, Tocar, Remover e etiquetas (T43).
// Abre por cima da estante expandida; Esc fecha só ele.
export function DiscDialog({ disc, allTags, playing, currentTrackId, onPlay, onRemove, onAddTag, onRemoveTag, onClose }: DiscDialogProps) {
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
        <button type="button" className="icon-button disc-dialog__close" aria-label="Fechar detalhes" onClick={onClose}>
          <CloseIcon />
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
          <button type="button" className="link disc-dialog__remove" onClick={() => onRemove(disc.id)}>
            Remover da estante
          </button>
        </div>
        <TagInput
          discName={disc.name}
          tags={disc.tags}
          suggestions={allTags}
          onAdd={(tag) => onAddTag(disc.id, tag)}
          onRemove={(tag) => onRemoveTag(disc.id, tag)}
        />
      </div>
    </div>
  );
}
