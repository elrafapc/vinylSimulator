import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TagFilter } from './TagFilter';

function setup(selected: string[] = []) {
  const props = { onToggle: vi.fn(), onClear: vi.fn() };
  const view = render(
    <TagFilter options={['Jazz', 'Rock', 'Sem etiqueta']} selected={selected} shown={2} total={5} {...props} />,
  );
  return { ...props, ...view };
}

describe('TagFilter', () => {
  it('chips com todas as etiquetas + "Sem etiqueta", marcando as selecionadas (ignora maiúsculas)', () => {
    setup(['jazz']);
    const chips = screen.getAllByRole('button', { pressed: undefined }).filter((b) => b.hasAttribute('aria-pressed'));
    expect(chips.map((c) => c.textContent)).toEqual(['Todas', 'Jazz', 'Rock', 'Sem etiqueta']);
    expect(screen.getByRole('button', { name: 'Todas' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Sem etiqueta' })).toHaveClass('chip--dashed');
    expect(screen.getByRole('button', { name: 'Jazz' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Rock' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('clicar alterna a etiqueta', async () => {
    const { onToggle } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Rock' }));
    expect(onToggle).toHaveBeenCalledWith('Rock');
  });

  it('com filtro: contador "X de Y discos" e "Limpar filtro"', async () => {
    const { onClear } = setup(['Jazz']);
    expect(screen.getByText('2 de 5 discos')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Limpar filtro' }));
    expect(onClear).toHaveBeenCalled();
  });

  it('sem filtro: sem contador nem limpar', () => {
    setup();
    expect(screen.queryByText(/de 5 discos/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Limpar filtro' })).not.toBeInTheDocument();
  });

  it('T57: "Todas" fica marcada sem filtro e limpa o filtro', async () => {
    const { onClear, unmount } = setup();
    expect(screen.getByRole('button', { name: 'Todas' })).toHaveAttribute('aria-pressed', 'true');
    unmount();
    const view = setup(['Jazz']);
    await userEvent.click(screen.getByRole('button', { name: 'Todas' }));
    expect(view.onClear).toHaveBeenCalled();
    expect(onClear).not.toHaveBeenCalled();
  });

  it('T57: no menu (compact) o contador fica de fora (vai para o título da Estante)', () => {
    render(<TagFilter compact options={['Jazz']} selected={['Jazz']} shown={1} total={5} onToggle={vi.fn()} onClear={vi.fn()} />);
    expect(screen.queryByText('1 de 5 discos')).not.toBeInTheDocument();
  });

  it('ninguém usa etiqueta: não mostra nada', () => {
    const { container } = render(<TagFilter options={[]} selected={[]} shown={0} total={0} onToggle={vi.fn()} onClear={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });
});
