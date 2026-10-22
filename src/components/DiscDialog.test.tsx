import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ShelfDisc } from '../library/favorites';
import { getDiscTracks } from '../spotify/api';
import { DiscDialog } from './DiscDialog';

vi.mock('../spotify/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../spotify/api')>();
  return { parseDiscUri: actual.parseDiscUri, getDiscTracks: vi.fn() };
});

const kob: ShelfDisc = { id: 'a1', uri: 'spotify:album:a1', kind: 'album', name: 'Kind of Blue', artist: 'Miles Davis', imageUrl: 'https://img/kob.jpg', tags: ['Jazz'] };

function setup(playing = false, disc: ShelfDisc = kob) {
  const props = {
    onPlay: vi.fn(),
    onRemove: vi.fn(),
    onAddTag: vi.fn<(discId: string, tag: string) => string | null>(() => null),
    onRemoveTag: vi.fn(),
    onClose: vi.fn(),
  };
  render(<DiscDialog disc={disc} allTags={['Jazz', 'Modal', 'Para trabalhar']} playing={playing} currentTrackId="t2" {...props} />);
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
    // T51: o mesmo quadro do bloco Disco, em tamanho grande.
    expect(screen.getByRole('img', { name: 'Capa de Kind of Blue' }).closest('.disc-frame')).toHaveClass('disc-frame--large');
    const current = await screen.findByText('Freddie Freeloader');
    expect(current.closest('li')).toHaveAttribute('aria-current', 'true');
  });

  it('Tocar e remover chamam as ações', async () => {
    const props = setup();
    expect(screen.getByRole('button', { name: '▶ Tocar' })).toHaveFocus();
    await userEvent.click(screen.getByRole('button', { name: '▶ Tocar' }));
    expect(props.onPlay).toHaveBeenCalledWith(kob);
    await userEvent.click(screen.getByRole('button', { name: 'Remover da estante' }));
    expect(props.onRemove).toHaveBeenCalledWith('a1');
  });

  describe('etiquetas', () => {
    const input = () => screen.getByLabelText('Adicionar etiqueta a Kind of Blue');

    it('mostra as do disco como chips', () => {
      setup();
      const list = screen.getByRole('list', { name: 'Etiquetas de Kind of Blue' });
      expect(list).toHaveTextContent('Jazz');
    });

    it('digitar + Enter adiciona e limpa o campo', async () => {
      const props = setup();
      await userEvent.type(input(), 'Modal{Enter}');
      expect(props.onAddTag).toHaveBeenCalledWith('a1', 'Modal');
      expect(input()).toHaveValue('');
    });

    it('erro de nome aparece e mantém o texto', async () => {
      const props = setup();
      props.onAddTag.mockReturnValueOnce('"Sem etiqueta" é reservado.');
      await userEvent.type(input(), 'Sem etiqueta{Enter}');
      expect(screen.getByText('"Sem etiqueta" é reservado.')).toBeInTheDocument();
      expect(input()).toHaveValue('Sem etiqueta');
    });

    it('autocompletar sugere as etiquetas já usadas que o disco ainda não tem', () => {
      setup();
      const list = document.getElementById(input().getAttribute('list') ?? '');
      expect([...(list?.querySelectorAll('option') ?? [])].map((o) => o.value)).toEqual(['Modal', 'Para trabalhar']);
    });

    it('× remove; Backspace com o campo vazio remove a última', async () => {
      const props = setup(false, { ...kob, tags: ['Jazz', 'Modal'] });
      await userEvent.click(screen.getByRole('button', { name: 'Remover etiqueta Jazz' }));
      expect(props.onRemoveTag).toHaveBeenCalledWith('a1', 'Jazz');
      input().focus();
      await userEvent.keyboard('{Backspace}');
      expect(props.onRemoveTag).toHaveBeenLastCalledWith('a1', 'Modal');
    });

    it('Enter com o campo vazio não faz nada', async () => {
      const props = setup();
      input().focus();
      await userEvent.keyboard('{Enter}');
      expect(props.onAddTag).not.toHaveBeenCalled();
    });
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
