import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SpotifyError } from '../spotify/errors';
import { setVolume } from '../spotify/player';
import { VolumeControl } from './VolumeControl';

vi.mock('../spotify/player', () => ({ setVolume: vi.fn() }));

const slider = () => screen.getByLabelText('Volume do Spotify');

describe('VolumeControl', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(setVolume).mockResolvedValue();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.mocked(setVolume).mockReset();
  });

  it('inicia com o volume atual do dispositivo', () => {
    render(<VolumeControl volume={65} supported />);
    expect(slider()).toHaveValue('65');
    expect(slider()).toBeEnabled();
  });

  it('envia ao Spotify com debounce de 300ms, só o último valor', async () => {
    render(<VolumeControl volume={50} supported />);
    fireEvent.change(slider(), { target: { value: '60' } });
    fireEvent.change(slider(), { target: { value: '70' } });
    await act(() => vi.advanceTimersByTimeAsync(299));
    expect(setVolume).not.toHaveBeenCalled();
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(setVolume).toHaveBeenCalledOnce();
    expect(setVolume).toHaveBeenCalledWith(70);
  });

  it('acompanha mudanças de volume feitas fora do app', () => {
    const { rerender } = render(<VolumeControl volume={50} supported />);
    rerender(<VolumeControl volume={20} supported />);
    expect(slider()).toHaveValue('20');
  });

  it('não volta para o valor antigo logo depois de mexer', async () => {
    const { rerender } = render(<VolumeControl volume={50} supported />);
    fireEvent.change(slider(), { target: { value: '80' } });
    await act(() => vi.advanceTimersByTimeAsync(300));
    rerender(<VolumeControl volume={51} supported />);
    expect(slider()).toHaveValue('80');
  });

  it('dispositivo sem volume remoto: slider desabilitado com aviso', () => {
    render(<VolumeControl supported={false} />);
    expect(slider()).toBeDisabled();
    expect(screen.getByText('Este dispositivo não permite mudar o volume pelo app.')).toBeInTheDocument();
  });

  it('sem dispositivo: desabilitado sem aviso', () => {
    render(<VolumeControl />);
    expect(slider()).toBeDisabled();
    expect(screen.queryByText(/não permite/)).not.toBeInTheDocument();
  });

  it('mostra erro do Spotify', async () => {
    vi.mocked(setVolume).mockRejectedValue(new SpotifyError('network'));
    render(<VolumeControl volume={50} supported />);
    fireEvent.change(slider(), { target: { value: '60' } });
    await act(() => vi.advanceTimersByTimeAsync(300));
    expect(screen.getByText('Falha de rede. Verifique sua conexão.')).toBeInTheDocument();
  });
});
