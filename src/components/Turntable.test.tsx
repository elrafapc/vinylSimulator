import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Turntable } from './Turntable';

describe('Turntable', () => {
  it('parado: disco parado e agulha levantada', () => {
    render(<Turntable playing={false} />);
    expect(screen.getByTestId('turntable')).toHaveClass('turntable--stopped');
    expect(screen.getByRole('button', { name: 'Baixar agulha' })).toBeInTheDocument();
  });

  it('tocando: disco gira e agulha baixa', () => {
    render(<Turntable playing />);
    expect(screen.getByTestId('turntable')).toHaveClass('turntable--playing');
    expect(screen.getByRole('button', { name: 'Levantar agulha' })).toBeInTheDocument();
  });

  it('alterna a classe quando a prop muda', () => {
    const { rerender } = render(<Turntable playing={false} />);
    rerender(<Turntable playing />);
    expect(screen.getByTestId('turntable')).toHaveClass('turntable--playing');
    expect(screen.getByTestId('turntable')).not.toHaveClass('turntable--stopped');
  });

  it('mostra a capa no selo do disco', () => {
    render(<Turntable playing={false} coverUrl="https://img/capa.jpg" albumName="Kind of Blue" />);
    expect(screen.getByRole('img', { name: 'Capa de Kind of Blue' })).toHaveStyle({
      backgroundImage: 'url(https://img/capa.jpg)',
    });
  });

  it('clicar no braço chama onNeedleClick', async () => {
    const onNeedleClick = vi.fn();
    render(<Turntable playing={false} onNeedleClick={onNeedleClick} />);
    await userEvent.click(screen.getByTestId('tonearm'));
    expect(onNeedleClick).toHaveBeenCalledOnce();
  });
});
