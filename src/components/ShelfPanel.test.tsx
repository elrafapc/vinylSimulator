import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ShelfDisc } from '../library/favorites';
import { ShelfPanel } from './ShelfPanel';

vi.mock('../spotify/api', () => ({ getMyPlaylists: vi.fn() }));

const kob: ShelfDisc = { id: 'a1', uri: 'spotify:album:a1', kind: 'album', name: 'Kind of Blue', artist: 'Miles Davis', imageUrl: 'https://img/kob.jpg', tags: ['Jazz'] };
const nevermind: ShelfDisc = { id: 'a2', uri: 'spotify:album:a2', kind: 'album', name: 'Nevermind', artist: 'Nirvana', tags: [] };

function setup({ discs = [kob, nevermind], selectedId }: { discs?: ShelfDisc[]; selectedId?: string } = {}) {
  const props = { onSelect: vi.fn(), onRemove: vi.fn(), onPlay: vi.fn(), onClose: vi.fn(), onDrop: vi.fn() };
  render(<ShelfPanel discs={discs} selectedId={selectedId} {...props} />);
  return props;
}

describe('ShelfPanel', () => {
  it('uma coleção só, com capas grandes e contagem', () => {
    setup();
    expect(screen.getByRole('dialog', { name: /Estante/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Estante (2)' })).toBeInTheDocument();
    expect(screen.getAllByRole('list', { name: 'Estante de discos' })).toHaveLength(1);
    expect(screen.getByRole('list', { name: 'Estante de discos' })).toHaveClass('shelf--large');
  });

  it('sem categorias: nada de "+ Nova categoria", prateleiras nomeadas, seletores ou etiquetas nas capas', () => {
    setup();
    expect(screen.queryByRole('button', { name: /Nova categoria/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: /Prateleira/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.queryByText('Jazz')).not.toBeInTheDocument();
  });

  it('clicar num disco abre os detalhes (onSelect) sem fechar a estante', async () => {
    const { onSelect, onClose } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Abrir Kind of Blue' }));
    expect(onSelect).toHaveBeenCalledWith(kob);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('fecha com Esc e com clique fora, mas não com clique dentro', async () => {
    const { onClose } = setup();
    await userEvent.click(screen.getByRole('heading', { name: 'Estante (2)' }));
    expect(onClose).not.toHaveBeenCalled();
    await userEvent.click(screen.getByTestId('shelf-backdrop'));
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('play sobre o selecionado toca e fecha', async () => {
    const { onPlay, onClose, onSelect } = setup({ selectedId: 'a1' });
    await userEvent.click(screen.getByRole('button', { name: 'Tocar Kind of Blue' }));
    expect(onPlay).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('estante vazia mostra aviso', () => {
    setup({ discs: [] });
    expect(screen.getByText(/Sua estante está vazia/)).toBeInTheDocument();
  });

  describe('arrastar para reordenar', () => {
    it('capas são arrastáveis, com instruções em português para leitor de tela', () => {
      setup();
      const cover = screen.getByRole('button', { name: 'Abrir Kind of Blue' });
      expect(cover).toHaveAttribute('aria-roledescription', 'sortable');
      const help = document.getElementById(cover.getAttribute('aria-describedby') ?? '');
      expect(help).toHaveTextContent('aperte Espaço, use as setas e aperte Espaço de novo para soltar');
    });

    it('teclado: Espaço pega e solta (chama onDrop) sem abrir os detalhes; Enter continua abrindo', async () => {
      const { onDrop, onSelect, onClose } = setup();
      const cover = screen.getByRole('button', { name: 'Abrir Kind of Blue' });
      cover.focus();
      await userEvent.keyboard(' ');
      await userEvent.keyboard(' ');
      expect(onDrop).toHaveBeenCalledWith('a1', 'a1');
      expect(onSelect).not.toHaveBeenCalled();

      await new Promise((r) => setTimeout(r, 300));
      cover.focus();
      await userEvent.keyboard('{Enter}');
      expect(onSelect).toHaveBeenCalledWith(kob);
      expect(onClose).not.toHaveBeenCalled();
    });

    it('Esc durante o arrasto cancela sem fechar a estante', async () => {
      const { onDrop, onClose } = setup();
      screen.getByRole('button', { name: 'Abrir Kind of Blue' }).focus();
      await userEvent.keyboard(' ');
      await userEvent.keyboard('{Escape}');
      expect(onDrop).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('com filtro por etiqueta', () => {
    it('mostra o filtro, só os discos filtrados, e o arrastar fica desligado', () => {
      const props = { onSelect: vi.fn(), onRemove: vi.fn(), onPlay: vi.fn(), onClose: vi.fn(), onDrop: vi.fn() };
      render(<ShelfPanel discs={[kob]} total={2} filtered filter={<div>chips</div>} {...props} />);
      expect(screen.getByText('chips')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Estante (2)' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Abrir Nevermind' })).not.toBeInTheDocument();
      const cover = screen.getByRole('button', { name: 'Abrir Kind of Blue' });
      expect(cover).not.toHaveAttribute('aria-roledescription');
      expect(screen.getByText('Para reorganizar arrastando, limpe o filtro.')).toBeInTheDocument();
    });

    it('nada com essas etiquetas: aviso', () => {
      const props = { onSelect: vi.fn(), onRemove: vi.fn(), onPlay: vi.fn(), onClose: vi.fn(), onDrop: vi.fn() };
      render(<ShelfPanel discs={[]} total={2} filtered {...props} />);
      expect(screen.getByText('Nenhum disco com essas etiquetas.')).toBeInTheDocument();
    });
  });
});
