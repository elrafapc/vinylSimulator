import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Category, ShelfDisc } from '../library/favorites';
import { getDiscTracks } from '../spotify/api';
import { DiscDialog } from './DiscDialog';

vi.mock('../spotify/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../spotify/api')>();
  return { parseDiscUri: actual.parseDiscUri, getDiscTracks: vi.fn() };
});

const kob: ShelfDisc = { id: 'a1', uri: 'spotify:album:a1', kind: 'album', name: 'Kind of Blue', artist: 'Miles Davis', imageUrl: 'https://img/kob.jpg', categoryId: null };
const cats: Category[] = [{ id: 'c1', name: 'Jazz' }];

function setup(playing = false) {
  const props = { onPlay: vi.fn(), onRemove: vi.fn(), onMoveDisc: vi.fn(), onClose: vi.fn() };
  render(<DiscDialog disc={kob} categories={cats} playing={playing} currentTrackId="t2" {...props} />);
  return props;
}

describe('DiscDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getDiscTracks).mockResolvedValue([
      { id: 't1', number: 1, name: 'So What', artist: 'Miles Davis', durationMs: 562000 },
      { id: 't2', number: 2, name: 'Freddie Freeloader', artist: 'Miles Davis', durationMs: 586000 },
    ]);
  });

  it('mostra a mesma visão do bloco Disco: capa grande e faixas, com a atual destacada', async () => {
    setup();
    expect(screen.getByRole('dialog', { name: 'Detalhes de Kind of Blue' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Capa de Kind of Blue' })).toBeInTheDocument();
    const current = await screen.findByText('Freddie Freeloader');
    expect(current.closest('li')).toHaveAttribute('aria-current', 'true');
  });

  it('Tocar, categoria e remover chamam as ações', async () => {
    const props = setup();
    expect(screen.getByRole('button', { name: '▶ Tocar' })).toHaveFocus();
    await userEvent.click(screen.getByRole('button', { name: '▶ Tocar' }));
    expect(props.onPlay).toHaveBeenCalledWith(kob);
    await userEvent.selectOptions(screen.getByLabelText('Categoria de Kind of Blue'), 'Jazz');
    expect(props.onMoveDisc).toHaveBeenCalledWith('a1', 'c1');
    await userEvent.click(screen.getByRole('button', { name: 'Remover da estante' }));
    expect(props.onRemove).toHaveBeenCalledWith('a1');
  });

  it('tocando agora: botão vira "Tocando" desabilitado', () => {
    setup(true);
    expect(screen.getByRole('button', { name: 'Tocando' })).toBeDisabled();
  });

  it('fecha com Esc, clique fora e botão fechar; clique dentro não fecha', async () => {
    const { onClose } = setup();
    await userEvent.click(screen.getByText('Kind of Blue', { selector: 'h3' }));
    expect(onClose).not.toHaveBeenCalled();
    await userEvent.keyboard('{Escape}');
    await userEvent.click(screen.getByTestId('disc-dialog-backdrop'));
    await userEvent.click(screen.getByRole('button', { name: 'Fechar detalhes' }));
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('Esc não chega a quem está por baixo (estante/menu)', async () => {
    const below = vi.fn();
    document.addEventListener('keydown', below);
    setup();
    await userEvent.keyboard('{Escape}');
    expect(below).not.toHaveBeenCalled();
    document.removeEventListener('keydown', below);
  });
});
