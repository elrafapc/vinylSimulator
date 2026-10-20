import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Disc } from '../spotify/api';
import { suggestAlbum, SuggestError } from '../suggest/suggest';
import { Suggestion } from './Suggestion';

vi.mock('../suggest/suggest', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../suggest/suggest')>();
  return { SuggestError: actual.SuggestError, suggestAlbum: vi.fn() };
});

const kob: Disc = { id: 'a1', uri: 'spotify:album:a1', kind: 'album', name: 'Kind of Blue', artist: 'Miles Davis' };
const blueTrain: Disc = { id: 'a2', uri: 'spotify:album:a2', kind: 'album', name: 'Blue Train', artist: 'John Coltrane', imageUrl: 'https://img/bt.jpg' };
const giantSteps: Disc = { id: 'a3', uri: 'spotify:album:a3', kind: 'album', name: 'Giant Steps', artist: 'John Coltrane' };

describe('Suggestion', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lê a estante e mostra capa, nome, artista e motivo', async () => {
    vi.mocked(suggestAlbum).mockResolvedValue({ disc: blueTrain, reason: 'Parecido com Miles Davis' });
    render(<Suggestion shelf={[kob]} favoriteIds={new Set(['a1'])} onPlay={vi.fn()} onAdd={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Sugerir um álbum' }));
    expect(await screen.findByText('Blue Train')).toBeInTheDocument();
    expect(screen.getByText('John Coltrane')).toBeInTheDocument();
    expect(screen.getByText('Parecido com Miles Davis')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Capa de Blue Train' })).toBeInTheDocument();
    expect(suggestAlbum).toHaveBeenCalledWith([kob], expect.any(Set));
  });

  it('Tocar e Adicionar à estante', async () => {
    vi.mocked(suggestAlbum).mockResolvedValue({ disc: blueTrain, reason: 'Parecido com Miles Davis' });
    const onPlay = vi.fn();
    const onAdd = vi.fn();
    render(<Suggestion shelf={[kob]} favoriteIds={new Set()} onPlay={onPlay} onAdd={onAdd} />);
    await userEvent.click(screen.getByRole('button', { name: 'Sugerir um álbum' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Tocar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar à estante' }));
    expect(onPlay).toHaveBeenCalledWith(blueTrain);
    expect(onAdd).toHaveBeenCalledWith(blueTrain);
  });

  it('"Outra sugestão" gera uma nova sem repetir', async () => {
    vi.mocked(suggestAlbum)
      .mockResolvedValueOnce({ disc: blueTrain, reason: 'Parecido com Miles Davis' })
      .mockResolvedValueOnce({ disc: giantSteps, reason: 'Parecido com Miles Davis' });
    render(<Suggestion shelf={[kob]} favoriteIds={new Set()} onPlay={vi.fn()} onAdd={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Sugerir um álbum' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Outra sugestão' }));
    expect(await screen.findByText('Giant Steps')).toBeInTheDocument();
    const seen = vi.mocked(suggestAlbum).mock.calls[1][1];
    expect(seen?.has('a2')).toBe(true);
  });

  it('mostra erro claro', async () => {
    vi.mocked(suggestAlbum).mockRejectedValue(new SuggestError('Guarde pelo menos um álbum na estante para receber sugestões.'));
    render(<Suggestion shelf={[]} favoriteIds={new Set()} onPlay={vi.fn()} onAdd={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Sugerir um álbum' }));
    expect(await screen.findByText('Guarde pelo menos um álbum na estante para receber sugestões.')).toBeInTheDocument();
  });
});
