import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Disc } from '../spotify/api';
import { ShelfPanel } from './ShelfPanel';

vi.mock('../spotify/api', () => ({ getMyPlaylists: vi.fn() }));

const kob: Disc = { id: 'a1', uri: 'spotify:album:a1', kind: 'album', name: 'Kind of Blue', artist: 'Miles Davis', imageUrl: 'https://img/kob.jpg' };

function setup(selectedId?: string) {
  const props = { onSelect: vi.fn(), onRemove: vi.fn(), onPlay: vi.fn(), onClose: vi.fn() };
  render(<ShelfPanel discs={[kob]} selectedId={selectedId} {...props} />);
  return props;
}

describe('ShelfPanel', () => {
  it('abre como diálogo com capas grandes', () => {
    setup();
    expect(screen.getByRole('dialog', { name: 'Estante' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Estante de discos' })).toHaveClass('shelf--large');
  });

  it('clicar num disco coloca no toca-discos e fecha', async () => {
    const { onSelect, onClose } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Colocar Kind of Blue no toca-discos' }));
    expect(onSelect).toHaveBeenCalledWith(kob);
    expect(onClose).toHaveBeenCalled();
  });

  it('fecha com Esc', async () => {
    const { onClose } = setup();
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  it('fecha com clique fora, mas não com clique dentro', async () => {
    const { onClose } = setup();
    await userEvent.click(screen.getByRole('heading', { name: 'Estante' }));
    expect(onClose).not.toHaveBeenCalled();
    await userEvent.click(screen.getByTestId('shelf-backdrop'));
    expect(onClose).toHaveBeenCalled();
  });

  it('play sobre o selecionado toca e fecha', async () => {
    const { onPlay, onClose, onSelect } = setup('a1');
    await userEvent.click(screen.getByRole('button', { name: 'Tocar Kind of Blue' }));
    expect(onPlay).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
    expect(onSelect).not.toHaveBeenCalled();
  });
});
