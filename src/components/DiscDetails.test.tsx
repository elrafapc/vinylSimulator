import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getDiscTracks } from '../spotify/api';
import { SpotifyError } from '../spotify/errors';
import { DiscDetails } from './DiscDetails';

vi.mock('../spotify/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../spotify/api')>();
  return { parseDiscUri: actual.parseDiscUri, getDiscTracks: vi.fn() };
});

const kob = { uri: 'spotify:album:a1', name: 'Kind of Blue', imageUrl: 'https://img/kob.jpg' };
const tracks = [
  { id: 't1', number: 1, name: 'So What', artist: 'Miles Davis', durationMs: 562000 },
  { id: 't2', number: 2, name: 'Freddie Freeloader', artist: 'Miles Davis', durationMs: 586000 },
];

describe('DiscDetails', () => {
  beforeEach(() => vi.clearAllMocks());

  it('começa só com a miniatura e não busca nada', () => {
    render(<DiscDetails disc={kob} />);
    expect(screen.getByRole('button', { name: 'Ver detalhes de Kind of Blue' })).toHaveAttribute('aria-expanded', 'false');
    expect(getDiscTracks).not.toHaveBeenCalled();
  });

  it('expande capa grande e faixas, com a atual destacada', async () => {
    vi.mocked(getDiscTracks).mockResolvedValue(tracks);
    render(<DiscDetails disc={kob} currentTrackId="t2" />);
    await userEvent.click(screen.getByRole('button', { name: 'Ver detalhes de Kind of Blue' }));
    expect(screen.getByRole('img', { name: 'Capa de Kind of Blue' })).toBeInTheDocument();
    const list = await screen.findByRole('list', { name: 'Faixas' });
    const items = within(list).getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('1So What9:22');
    expect(items[1]).toHaveAttribute('aria-current', 'true');
    expect(items[0]).not.toHaveAttribute('aria-current');
    expect(getDiscTracks).toHaveBeenCalledWith('spotify:album:a1');
  });

  it('playlist que não é minha mostra só a capa com aviso', async () => {
    vi.mocked(getDiscTracks).mockRejectedValue(new SpotifyError('unknown', 403));
    render(<DiscDetails disc={{ uri: 'spotify:playlist:p9', name: 'Jazz', imageUrl: 'https://img/j.jpg' }} />);
    await userEvent.click(screen.getByRole('button', { name: 'Ver detalhes de Jazz' }));
    expect(await screen.findByText('Faixas indisponíveis.')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Capa de Jazz' })).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Faixas' })).not.toBeInTheDocument();
  });
});
