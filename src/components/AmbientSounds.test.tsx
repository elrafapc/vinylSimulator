import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAmbient, loadAmbientPrefs, saveAmbientPrefs, type AmbientSound } from '../audio/ambient';
import { loadCracklePrefs } from '../audio/crackle';
import { AmbientSounds } from './AmbientSounds';

const engines: Record<string, { start: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn>; setVolume: ReturnType<typeof vi.fn>; running: boolean }> = {};
const engineFor = (name: string) => (engines[name] ??= { start: vi.fn(), stop: vi.fn(), setVolume: vi.fn(), running: false });

vi.mock('../audio/ambient', () => ({
  createAmbient: vi.fn((name: string) => engineFor(name)),
  loadAmbientPrefs: vi.fn(),
  saveAmbientPrefs: vi.fn(),
}));
vi.mock('../audio/crackle', () => ({
  createCrackle: vi.fn(() => engineFor('crackle')),
  loadCracklePrefs: vi.fn(),
  saveCracklePrefs: vi.fn(),
}));

describe('AmbientSounds', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(loadCracklePrefs).mockReturnValue({ enabled: true, volume: 0.35 });
    vi.mocked(loadAmbientPrefs).mockImplementation((name: AmbientSound) =>
      name === 'rain' ? { enabled: true, volume: 0.5 } : { enabled: false, volume: 0.4 },
    );
  });

  it('chuva toca mesmo sem música; agulha não', () => {
    render(<AmbientSounds playing={false} />);
    expect(engineFor('rain').start).toHaveBeenCalled();
    expect(engineFor('crackle').start).not.toHaveBeenCalled();
    expect(engineFor('fire').start).not.toHaveBeenCalled();
  });

  it('os três tocam juntos com volumes independentes', async () => {
    render(<AmbientSounds playing />);
    await userEvent.click(screen.getByRole('switch', { name: 'Lareira', hidden: true }));
    expect(engineFor('crackle').start).toHaveBeenCalled();
    expect(engineFor('rain').start).toHaveBeenCalled();
    expect(engineFor('fire').start).toHaveBeenCalled();
    expect(saveAmbientPrefs).toHaveBeenLastCalledWith('fire', { enabled: true, volume: 0.4 });
    expect(screen.getByLabelText('Volume da chuva')).toHaveValue('0.5');
    expect(screen.getByLabelText('Volume da lareira')).toHaveValue('0.4');
    expect(createAmbient).toHaveBeenCalledTimes(2);
  });

  it('T57: começa fechado, com o resumo do estado; o resumo acompanha os interruptores', async () => {
    render(<AmbientSounds playing />);
    const toggle = screen.getByRole('button', { name: /Sons ambiente/ });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveTextContent('Chiado e chuva ligados · lareira desligada');
    expect(screen.getByRole('switch', { name: 'Chiado', hidden: true })).not.toBeVisible();
    await userEvent.click(toggle);
    await userEvent.click(screen.getByRole('switch', { name: 'Chiado' }));
    expect(toggle).toHaveTextContent('Chuva ligada · chiado e lareira desligados');
  });

  it('pausar a música para só a agulha', () => {
    const { rerender } = render(<AmbientSounds playing />);
    engineFor('rain').stop.mockClear();
    rerender(<AmbientSounds playing={false} />);
    expect(engineFor('crackle').stop).toHaveBeenCalled();
    expect(engineFor('rain').stop).not.toHaveBeenCalled();
  });
});
