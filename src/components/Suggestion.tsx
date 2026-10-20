import { useRef, useState } from 'react';
import type { Disc } from '../spotify/api';
import { suggestAlbum, SuggestError, type Suggestion as SuggestionResult } from '../suggest/suggest';

interface SuggestionProps {
  shelf: Disc[];
  favoriteIds: Set<string>;
  onPlay: (disc: Disc) => void;
  onAdd: (disc: Disc) => void;
}

export function Suggestion({ shelf, favoriteIds, onPlay, onAdd }: SuggestionProps) {
  const [suggestion, setSuggestion] = useState<SuggestionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Não repete sugestões já mostradas nesta sessão.
  const seen = useRef(new Set<string>());

  async function suggest() {
    setLoading(true);
    setError(null);
    try {
      const next = await suggestAlbum(shelf, seen.current);
      seen.current.add(next.disc.id);
      setSuggestion(next);
    } catch (e) {
      setError(e instanceof SuggestError ? e.message : 'Não foi possível sugerir um álbum agora.');
    } finally {
      setLoading(false);
    }
  }

  const disc = suggestion?.disc;
  const onShelf = disc ? favoriteIds.has(disc.id) : false;

  return (
    <div className="suggestion">
      {disc && suggestion && (
        <div className="suggestion__card">
          {disc.imageUrl ? <img src={disc.imageUrl} alt={`Capa de ${disc.name}`} /> : <span className="suggestion__nocover" />}
          <div className="suggestion__text">
            <strong>{disc.name}</strong>
            <span>{disc.artist}</span>
            <em>{suggestion.reason}</em>
          </div>
          <div className="suggestion__actions">
            <button type="button" className="importer__confirm" onClick={() => onPlay(disc)}>
              Tocar
            </button>
            <button type="button" className="importer__open" disabled={onShelf} onClick={() => onAdd(disc)}>
              {onShelf ? 'Na estante' : 'Adicionar à estante'}
            </button>
          </div>
        </div>
      )}
      <button type="button" className="importer__open" disabled={loading} onClick={() => void suggest()}>
        {loading ? 'Procurando…' : suggestion ? 'Outra sugestão' : 'Sugerir um álbum'}
      </button>
      {error && <p className="importer__error">{error}</p>}
    </div>
  );
}
