import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCrackle, loadCracklePrefs, saveCracklePrefs } from '../audio/crackle';
import { CrackleControl } from './CrackleControl';

const engine = { start: vi.fn(), stop: vi.fn(), setVolume: vi.fn(), running: false };

vi.mock('../audio/crackle', () => ({
  createCrackle: vi.fn(() => engine),
  loadCracklePrefs: vi.fn(),
  saveCracklePrefs: vi.fn(),
}));

describe('CrackleControl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(loadCracklePrefs).mockReturnValue({ enabled: true, volume: 0.4 });
  });

  it('toca só com a música tocando e para no pause', () => {
    const { rerender } = render(<CrackleControl playing={false} />);
    expect(engine.start).not.toHaveBeenCalled();
    rerender(<CrackleControl playing />);
    expect(engine.start).toHaveBeenCalledOnce();
    rerender(<CrackleControl playing={false} />);
    expect(engine.stop).toHaveBeenCalled();
    expect(createCrackle).toHaveBeenCalledOnce();
  });

  it('desligar para o chiado e salva a preferência', async () => {
    render(<CrackleControl playing />);
    engine.stop.mockClear();
    await userEvent.click(screen.getByRole('button', { name: 'Chiado ligado' }));
    expect(engine.stop).toHaveBeenCalled();
    expect(saveCracklePrefs).toHaveBeenLastCalledWith({ enabled: false, volume: 0.4 });
    expect(screen.getByRole('button', { name: 'Chiado desligado' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('desligado não toca mesmo com música', () => {
    vi.mocked(loadCracklePrefs).mockReturnValue({ enabled: false, volume: 0.4 });
    render(<CrackleControl playing />);
    expect(engine.start).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Volume do chiado')).toBeDisabled();
  });

  it('mudar o volume ajusta o som e salva', () => {
    render(<CrackleControl playing />);
    fireEvent.change(screen.getByLabelText('Volume do chiado'), { target: { value: '0.8' } });
    expect(engine.setVolume).toHaveBeenLastCalledWith(0.8);
    expect(saveCracklePrefs).toHaveBeenLastCalledWith({ enabled: true, volume: 0.8 });
  });
});
