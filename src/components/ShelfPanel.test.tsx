import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Category, ShelfDisc } from '../library/favorites';
import { ShelfPanel } from './ShelfPanel';

vi.mock('../spotify/api', () => ({ getMyPlaylists: vi.fn() }));

const jazz: Category = { id: 'c1', name: 'Jazz' };
const rock: Category = { id: 'c2', name: 'Rock' };
const kob: ShelfDisc = { id: 'a1', uri: 'spotify:album:a1', kind: 'album', name: 'Kind of Blue', artist: 'Miles Davis', imageUrl: 'https://img/kob.jpg', categoryId: 'c1' };
const loose: ShelfDisc = { id: 'a2', uri: 'spotify:album:a2', kind: 'album', name: 'Nevermind', artist: 'Nirvana', categoryId: null };

function setup({ discs = [kob, loose], categories = [jazz, rock], selectedId }: { discs?: ShelfDisc[]; categories?: Category[]; selectedId?: string } = {}) {
  const props = {
    onSelect: vi.fn(),
    onRemove: vi.fn(),
    onPlay: vi.fn(),
    onClose: vi.fn(),
    onCreateCategory: vi.fn<(name: string) => string | null>(() => null),
    onRenameCategory: vi.fn<(id: string, name: string) => string | null>(() => null),
    onDeleteCategory: vi.fn(),
    onMoveDisc: vi.fn(),
    onDrop: vi.fn(),
  };
  render(<ShelfPanel discs={discs} categories={categories} selectedId={selectedId} {...props} />);
  return props;
}

const shelf = (name: string) => screen.getByRole('region', { name: `Prateleira ${name}` });

describe('ShelfPanel', () => {
  it('abre como diálogo com capas grandes', () => {
    setup();
    expect(screen.getByRole('dialog', { name: 'Estante' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Discos em Jazz' })).toHaveClass('shelf--large');
  });

  it('uma prateleira por categoria, com nome e contagem, e "Sem categoria" por último', () => {
    setup();
    const titles = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(titles).toEqual(['Jazz (1)', 'Rock (0)', 'Sem categoria (1)']);
    expect(within(shelf('Rock')).getByText(/Nenhum disco nesta prateleira/)).toBeInTheDocument();
    expect(within(shelf('Sem categoria')).queryByRole('button', { name: 'Renomear' })).not.toBeInTheDocument();
  });

  it('"Sem categoria" some quando não tem discos', () => {
    setup({ discs: [kob] });
    expect(screen.queryByRole('region', { name: 'Prateleira Sem categoria' })).not.toBeInTheDocument();
  });

  it('criar categoria; erro de nome aparece e mantém o formulário', async () => {
    const props = setup();
    props.onCreateCategory.mockReturnValueOnce('Já existe uma categoria "jazz".');
    await userEvent.click(screen.getByRole('button', { name: '+ Nova categoria' }));
    await userEvent.type(screen.getByLabelText('Nome da nova categoria'), 'jazz{Enter}');
    expect(screen.getByText('Já existe uma categoria "jazz".')).toBeInTheDocument();
    await userEvent.clear(screen.getByLabelText('Nome da nova categoria'));
    await userEvent.type(screen.getByLabelText('Nome da nova categoria'), 'Samba{Enter}');
    expect(props.onCreateCategory).toHaveBeenLastCalledWith('Samba');
    expect(screen.queryByLabelText('Nome da nova categoria')).not.toBeInTheDocument();
  });

  it('renomear; Esc no campo cancela sem fechar a estante', async () => {
    const props = setup();
    await userEvent.click(within(shelf('Jazz')).getByRole('button', { name: 'Renomear' }));
    await userEvent.keyboard('{Escape}');
    expect(props.onClose).not.toHaveBeenCalled();
    expect(screen.queryByLabelText('Novo nome para Jazz')).not.toBeInTheDocument();

    await userEvent.click(within(shelf('Jazz')).getByRole('button', { name: 'Renomear' }));
    const input = screen.getByLabelText('Novo nome para Jazz');
    await userEvent.clear(input);
    await userEvent.type(input, 'Jazz modal{Enter}');
    expect(props.onRenameCategory).toHaveBeenCalledWith('c1', 'Jazz modal');
  });

  it('excluir pede confirmação dizendo para onde vão os discos', async () => {
    const props = setup();
    await userEvent.click(within(shelf('Jazz')).getByRole('button', { name: 'Excluir' }));
    const confirm = screen.getByRole('alertdialog', { name: 'Excluir Jazz' });
    expect(confirm).toHaveTextContent('O disco vai para "Sem categoria".');
    await userEvent.click(within(confirm).getByRole('button', { name: 'Cancelar' }));
    expect(props.onDeleteCategory).not.toHaveBeenCalled();
    await userEvent.click(within(shelf('Jazz')).getByRole('button', { name: 'Excluir' }));
    await userEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Excluir' }));
    expect(props.onDeleteCategory).toHaveBeenCalledWith('c1');
  });

  it('seletor sob a capa move o disco de categoria, sem fechar a estante', async () => {
    const props = setup();
    await userEvent.selectOptions(screen.getByLabelText('Categoria de Nevermind'), 'Rock');
    expect(props.onMoveDisc).toHaveBeenCalledWith('a2', 'c2');
    await userEvent.selectOptions(screen.getByLabelText('Categoria de Kind of Blue'), 'Sem categoria');
    expect(props.onMoveDisc).toHaveBeenLastCalledWith('a1', null);
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it('clicar num disco abre os detalhes (onSelect) sem fechar a estante', async () => {
    const { onSelect, onClose } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Abrir Kind of Blue' }));
    expect(onSelect).toHaveBeenCalledWith(kob);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('fecha com Esc e com clique fora, mas não com clique dentro', async () => {
    const { onClose } = setup();
    await userEvent.click(screen.getByRole('heading', { name: 'Estante' }));
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
    setup({ discs: [], categories: [] });
    expect(screen.getByText(/Sua estante está vazia/)).toBeInTheDocument();
  });

  describe('arrastar (T39)', () => {
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
});
