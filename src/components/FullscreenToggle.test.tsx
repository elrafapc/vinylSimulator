import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FullscreenToggle } from './FullscreenToggle';

// jsdom não implementa a Fullscreen API: simula o navegador.
let current: Element | null = null;
const changed = () => document.dispatchEvent(new Event('fullscreenchange'));
const request = vi.fn(async () => {
  current = document.documentElement;
  changed();
});
const exit = vi.fn(async () => {
  current = null;
  changed();
});

describe('FullscreenToggle', () => {
  beforeEach(() => {
    current = null;
    vi.clearAllMocks();
    Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => current });
    document.documentElement.requestFullscreen = request;
    document.exitFullscreen = exit;
  });
  afterEach(() => {
    delete (document.documentElement as Partial<HTMLElement>).requestFullscreen;
  });

  it('botão alterna tela cheia e o ícone muda', async () => {
    render(<FullscreenToggle />);
    await userEvent.click(screen.getByRole('button', { name: 'Tela cheia (F)' }));
    expect(request).toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Sair da tela cheia (F)' }));
    expect(exit).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Tela cheia (F)' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('atalho F alterna, mas não enquanto digita', async () => {
    render(
      <>
        <input aria-label="Busca" />
        <FullscreenToggle />
      </>,
    );
    await userEvent.keyboard('f');
    expect(request).toHaveBeenCalledOnce();
    await userEvent.type(screen.getByLabelText('Busca'), 'f');
    expect(exit).not.toHaveBeenCalled();
  });

  it('sair com Esc (pelo navegador) atualiza o ícone', async () => {
    render(<FullscreenToggle />);
    await userEvent.click(screen.getByRole('button', { name: 'Tela cheia (F)' }));
    act(() => {
      current = null;
      changed();
    });
    expect(screen.getByRole('button', { name: 'Tela cheia (F)' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('sem suporte, não mostra o botão', () => {
    delete (document.documentElement as Partial<HTMLElement>).requestFullscreen;
    render(<FullscreenToggle />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
