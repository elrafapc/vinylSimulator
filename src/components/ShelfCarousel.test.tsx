import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Category, ShelfDisc } from '../library/favorites';
import { ShelfCarousel } from './ShelfCarousel';

const kob: ShelfDisc = { id: 'a1', uri: 'spotify:album:a1', kind: 'album', name: 'Kind of Blue', artist: 'Miles Davis', imageUrl: 'https://img/kob.jpg', categoryId: null };
const jazz: ShelfDisc = { id: 'p1', uri: 'spotify:playlist:p1', kind: 'playlist', name: 'Jazz', artist: 'Rafael', categoryId: null };

function setup(discs: ShelfDisc[] = [kob, jazz], selectedId?: string, categories: Category[] = []) {
  const props = { onSelect: vi.fn(), onExpand: vi.fn() };
  const view = render(<ShelfCarousel discs={discs} categories={categories} selectedId={selectedId} {...props} />);
  return { ...props, ...view };
}

const track = () => screen.getByRole('list', { name: 'Estante (carrossel)' });

describe('ShelfCarousel', () => {
  it('mostra as capas em fila e marca a selecionada', () => {
    setup([kob, jazz], 'p1');
    expect(within(track()).getAllByRole('button')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Abrir Jazz' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('clicar numa capa coloca o disco na vitrola', async () => {
    const { onSelect } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Abrir Kind of Blue' }));
    expect(onSelect).toHaveBeenCalledWith(kob);
  });

  it('setas rolam o carrossel', async () => {
    setup();
    const scrollBy = vi.fn();
    track().scrollBy = scrollBy;
    await userEvent.click(screen.getByRole('button', { name: 'Próximos discos' }));
    await userEvent.click(screen.getByRole('button', { name: 'Discos anteriores' }));
    expect(scrollBy.mock.calls.map(([opts]) => Math.sign(opts.left))).toEqual([1, -1]);
  });

  it('arrastar com o mouse rola e não seleciona o disco', () => {
    const { onSelect } = setup();
    // jsdom: PointerEvent sem clientX; vai como MouseEvent com o tipo de ponteiro.
    const pointer = (type: string, clientX: number) => {
      const event = new MouseEvent(type, { bubbles: true, clientX });
      Object.defineProperty(event, 'pointerType', { value: 'mouse' });
      fireEvent(track(), event);
    };
    track().scrollLeft = 100;
    pointer('pointerdown', 200);
    pointer('pointermove', 150);
    expect(track().scrollLeft).toBe(150);
    pointer('pointerup', 150);
    fireEvent.click(screen.getByRole('button', { name: 'Abrir Kind of Blue' }));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('"Expandir estante" abre o painel grande', async () => {
    const { onExpand } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Expandir estante (2)' }));
    expect(onExpand).toHaveBeenCalled();
  });

  it('estante vazia mostra aviso', () => {
    setup([]);
    expect(screen.getByText(/Sua estante está vazia/)).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Expandir estante' })).toBeInTheDocument();
  });

  describe('filtro por categoria', () => {
    const cats: Category[] = [{ id: 'c1', name: 'Jazz' }, { id: 'c2', name: 'Rock' }];
    const inJazz: ShelfDisc = { ...kob, categoryId: 'c1' };
    const names = () => within(track()).getAllByRole('button').map((b) => b.getAttribute('aria-label'));

    it('chips: "Todas" por padrão, uma por categoria e "Sem categoria" quando há discos soltos', () => {
      setup([inJazz, jazz], undefined, cats);
      const chips = within(screen.getByRole('group', { name: 'Filtrar estante por categoria' })).getAllByRole('button');
      expect(chips.map((c) => c.textContent)).toEqual(['Todas', 'Jazz', 'Rock', 'Sem categoria']);
      expect(screen.getByRole('button', { name: 'Todas' })).toHaveAttribute('aria-pressed', 'true');
      expect(names()).toHaveLength(2);
    });

    it('filtrar mostra só os discos da categoria; vazia avisa', async () => {
      setup([inJazz, jazz], undefined, cats);
      await userEvent.click(screen.getByRole('button', { name: 'Jazz' }));
      expect(names()).toEqual(['Abrir Kind of Blue']);
      await userEvent.click(screen.getByRole('button', { name: 'Sem categoria' }));
      expect(names()).toEqual(['Abrir Jazz']);
      await userEvent.click(screen.getByRole('button', { name: 'Rock' }));
      expect(screen.getByText('Nenhum disco nesta categoria.')).toBeInTheDocument();
      // "Expandir" continua contando a estante toda.
      expect(screen.getByRole('button', { name: 'Expandir estante (2)' })).toBeInTheDocument();
    });

    it('categoria filtrada excluída: volta para "Todas"', async () => {
      const { rerender } = setup([inJazz, jazz], undefined, cats);
      await userEvent.click(screen.getByRole('button', { name: 'Rock' }));
      rerender(<ShelfCarousel discs={[inJazz, jazz]} categories={[cats[0]]} onSelect={vi.fn()} onExpand={vi.fn()} />);
      expect(screen.getByRole('button', { name: 'Todas' })).toHaveAttribute('aria-pressed', 'true');
      expect(names()).toHaveLength(2);
    });

    it('sem categorias criadas, não mostra chips', () => {
      setup();
      expect(screen.queryByRole('group', { name: 'Filtrar estante por categoria' })).not.toBeInTheDocument();
    });
  });
});
