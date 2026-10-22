import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Disc } from '../spotify/api';
import { Controls } from './Controls';
import { ShelfToggle } from './ShelfToggle';

const icon = (name: string) => screen.getByRole('button', { name }).querySelector('svg');

describe('Controls — teclas de madeira (T50)', () => {
  it('ícones em SVG escondidos do leitor de tela; nomes acessíveis mantidos', () => {
    render(<Controls playing={false} onPlayPause={vi.fn()} onPrev={vi.fn()} onNext={vi.fn()} />);
    expect(icon('Faixa anterior')).toHaveAttribute('data-icon', 'prev');
    expect(icon('Tocar')).toHaveAttribute('data-icon', 'play');
    expect(icon('Próxima faixa')).toHaveAttribute('data-icon', 'next');
    for (const name of ['Faixa anterior', 'Tocar', 'Próxima faixa']) {
      expect(icon(name)).toHaveAttribute('aria-hidden', 'true');
      expect(screen.getByRole('button', { name })).toHaveTextContent('');
    }
  });

  it('tocando mostra pausa; cada tecla chama sua ação', async () => {
    const actions = { onPlayPause: vi.fn(), onPrev: vi.fn(), onNext: vi.fn() };
    render(<Controls playing {...actions} />);
    expect(icon('Pausar')).toHaveAttribute('data-icon', 'pause');
    await userEvent.click(screen.getByRole('button', { name: 'Pausar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Faixa anterior' }));
    await userEvent.click(screen.getByRole('button', { name: 'Próxima faixa' }));
    expect(actions.onPlayPause).toHaveBeenCalledOnce();
    expect(actions.onPrev).toHaveBeenCalledOnce();
    expect(actions.onNext).toHaveBeenCalledOnce();
  });

  it('desabilitadas não respondem', async () => {
    const onNext = vi.fn();
    render(<Controls playing={false} disabled onPlayPause={vi.fn()} onPrev={vi.fn()} onNext={onNext} />);
    await userEvent.click(screen.getByRole('button', { name: 'Próxima faixa' }));
    expect(onNext).not.toHaveBeenCalled();
  });
});

describe('ShelfToggle — estrela gravada (T50)', () => {
  const kob: Disc = { id: 'a1', uri: 'spotify:album:a1', kind: 'album', name: 'Kind of Blue', artist: 'Miles Davis' };

  it('preenchida = na estante; contorno = fora', () => {
    const { rerender } = render(<ShelfToggle disc={kob} onShelf onToggle={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Tirar Kind of Blue da estante' })).toHaveAttribute('aria-pressed', 'true');
    expect(icon('Tirar Kind of Blue da estante')).toHaveAttribute('data-icon', 'star-filled');
    rerender(<ShelfToggle disc={kob} onShelf={false} onToggle={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Guardar Kind of Blue na estante' })).toHaveAttribute('aria-pressed', 'false');
    expect(icon('Guardar Kind of Blue na estante')).toHaveAttribute('data-icon', 'star-empty');
  });
});
