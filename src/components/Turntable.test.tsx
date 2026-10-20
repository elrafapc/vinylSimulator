import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
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

  it('braço é o recorte da foto, com área de clique só no desenho', () => {
    render(<Turntable playing={false} />);
    const arm = screen.getByTestId('tonearm');
    expect(arm.querySelector('img.tonearm__photo')).not.toBeNull();
    expect(arm.querySelector('svg.tonearm__hit path')).not.toBeNull();
  });

  it('foto (com os reflexos) fica fora do selo que gira', () => {
    render(<Turntable playing />);
    expect(screen.getByTestId('record')).not.toContainElement(screen.getByTestId('turntable-photo'));
  });

  describe('giro do prato', () => {
    let frames = new Map<number, (now: number) => void>();
    let nextId = 1;
    let now = 0;

    function setup(reducedMotion = false) {
      frames = new Map();
      now = 0;
      vi.stubGlobal('requestAnimationFrame', (cb: (now: number) => void) => {
        frames.set(nextId, cb);
        return nextId++;
      });
      vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
      vi.stubGlobal('matchMedia', () => ({ matches: reducedMotion }));
    }

    // Avança o relógio quadro a quadro (60 fps).
    function advance(seconds: number) {
      act(() => {
        for (let t = 0; t < seconds * 60 && frames.size; t++) {
          const pending = [...frames.values()];
          frames.clear();
          pending.forEach((cb) => cb(now));
          now += 1000 / 60;
        }
      });
    }

    const angle = () => Number(/rotate\(([\d.]+)deg\)/.exec(screen.getByTestId('record').style.transform)?.[1] ?? 0);

    afterEach(() => vi.unstubAllGlobals());

    it('só gira depois de a agulha descer, acelera e para aos poucos', () => {
      setup();
      const { rerender } = render(<Turntable playing />);
      advance(1.1);
      expect(angle()).toBe(0);

      advance(0.5);
      const early = angle();
      advance(0.5);
      const accelerating = angle() - early;
      expect(accelerating).toBeGreaterThan(early);

      rerender(<Turntable playing={false} />);
      const atStop = angle();
      advance(0.5);
      expect(angle()).not.toBe(atStop);
      advance(2);
      expect(frames.size).toBe(0);
    });

    it('com movimento reduzido, não gira', () => {
      setup(true);
      render(<Turntable playing />);
      advance(3);
      expect(screen.getByTestId('record').style.transform).toBe('');
    });
  });
});
