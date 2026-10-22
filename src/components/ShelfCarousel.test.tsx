import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ShelfDisc } from '../library/favorites';
import { ShelfCarousel } from './ShelfCarousel';

const kob: ShelfDisc = { id: 'a1', uri: 'spotify:album:a1', kind: 'album', name: 'Kind of Blue', artist: 'Miles Davis', imageUrl: 'https://img/kob.jpg', tags: [] };
const jazz: ShelfDisc = { id: 'p1', uri: 'spotify:playlist:p1', kind: 'playlist', name: 'Jazz', artist: 'Rafael', tags: [] };

function setup(discs: ShelfDisc[] = [kob, jazz], selectedId?: string) {
  const props = { onSelect: vi.fn(), onExpand: vi.fn() };
  const view = render(<ShelfCarousel discs={discs} selectedId={selectedId} {...props} />);
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

  it('"Abrir estante inteira" abre o painel grande', async () => {
    const { onExpand } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Abrir estante inteira' }));
    expect(onExpand).toHaveBeenCalled();
  });

  it('T57: título "Estante" com contador (e "X de Y" com filtro)', () => {
    const { rerender } = setup();
    expect(screen.getByRole('heading', { name: 'Estante' })).toBeInTheDocument();
    expect(screen.getByText('2 discos')).toBeInTheDocument();
    rerender(<ShelfCarousel discs={[kob]} total={2} filtered onSelect={vi.fn()} onExpand={vi.fn()} />);
    expect(screen.getByText('1 de 2 discos')).toBeInTheDocument();
  });

  it('estante vazia mostra aviso', () => {
    setup([]);
    expect(screen.getByText(/Sua estante está vazia/)).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.getByText('0 discos')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Próximos discos' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Abrir estante inteira' })).toBeInTheDocument();
  });
});
