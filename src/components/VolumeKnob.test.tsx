import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useVolume } from '../hooks/useVolume';
import { setVolume } from '../spotify/player';
import { valueFromPointer, valueToAngle } from './knob';
import { VolumeControl } from './VolumeControl';
import { VolumeKnob } from './VolumeKnob';

vi.mock('../spotify/player', () => ({ setVolume: vi.fn() }));

const knob = () => screen.getByRole('slider', { name: 'Volume (botão da vitrola)' });

describe('geometria do botão', () => {
  it('-135° é 0% e +135° é 100%', () => {
    expect(valueToAngle(0)).toBe(-135);
    expect(valueToAngle(50)).toBe(0);
    expect(valueToAngle(100)).toBe(135);
  });

  it('ponteiro em cima = 50%, à direita = 83%; faixa morta mantém o extremo do lado atual', () => {
    expect(valueFromPointer(0, -10, 50)).toBe(50);
    expect(valueFromPointer(10, 0, 50)).toBe(83);
    expect(valueFromPointer(1, 10, 90)).toBe(100);
    expect(valueFromPointer(-1, 10, 10)).toBe(0);
  });
});

describe('VolumeKnob', () => {
  it('slider acessível com o valor atual e a rotação correspondente', () => {
    const { container } = render(<VolumeKnob value={75} onChange={vi.fn()} />);
    expect(knob()).toHaveAttribute('aria-valuenow', '75');
    expect(knob()).toHaveAttribute('aria-valuemin', '0');
    expect(knob()).toHaveAttribute('aria-valuemax', '100');
    expect(container.querySelector('.knob__cap')).toHaveStyle({ transform: 'rotate(67.5deg)' });
    expect(screen.getByText('mín.')).toBeInTheDocument();
    expect(screen.getByText('máx.')).toBeInTheDocument();
  });

  it('setas, PageUp/PageDown, Home/End', () => {
    const onChange = vi.fn();
    render(<VolumeKnob value={50} onChange={onChange} />);
    fireEvent.keyDown(knob(), { key: 'ArrowUp' });
    fireEvent.keyDown(knob(), { key: 'ArrowLeft' });
    fireEvent.keyDown(knob(), { key: 'PageUp' });
    fireEvent.keyDown(knob(), { key: 'Home' });
    fireEvent.keyDown(knob(), { key: 'End' });
    expect(onChange.mock.calls.map(([v]) => v)).toEqual([55, 45, 60, 0, 100]);
  });

  it('scroll para cima aumenta, para baixo diminui, sem passar dos limites', () => {
    const onChange = vi.fn();
    const { rerender } = render(<VolumeKnob value={50} onChange={onChange} />);
    fireEvent.wheel(knob(), { deltaY: -100 });
    fireEvent.wheel(knob(), { deltaY: 100 });
    rerender(<VolumeKnob value={100} onChange={onChange} />);
    fireEvent.wheel(knob(), { deltaY: -100 });
    expect(onChange.mock.calls.map(([v]) => v)).toEqual([52, 48, 100]);
  });

  it('arrastar gira até o ângulo do ponteiro', () => {
    const onChange = vi.fn();
    render(<VolumeKnob value={50} onChange={onChange} />);
    // jsdom: caixa com tamanho 0 em (0, 0), então o centro é a origem. O PointerEvent do jsdom
    // não leva clientX/clientY, por isso o evento vai como MouseEvent com o tipo de ponteiro.
    const pointer = (type: string, clientX: number, clientY: number) =>
      fireEvent(knob(), new MouseEvent(type, { bubbles: true, clientX, clientY }));
    pointer('pointerdown', 10, 0);
    expect(onChange).toHaveBeenLastCalledWith(83);
    pointer('pointermove', -10, 0);
    expect(onChange).toHaveBeenLastCalledWith(17);
    pointer('pointerup', -10, 0);
    pointer('pointermove', 0, -10);
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('desabilitado não responde', () => {
    const onChange = vi.fn();
    render(<VolumeKnob value={50} disabled onChange={onChange} />);
    fireEvent.keyDown(knob(), { key: 'ArrowUp' });
    fireEvent.wheel(knob(), { deltaY: -100 });
    expect(onChange).not.toHaveBeenCalled();
    expect(knob()).toHaveAttribute('aria-disabled', 'true');
  });
});

describe('botão e slider juntos', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(setVolume).mockResolvedValue();
  });
  afterEach(() => vi.useRealTimers());

  function Both() {
    const volume = useVolume(40);
    return (
      <>
        <VolumeControl supported control={volume} />
        <VolumeKnob value={volume.value} onChange={volume.change} />
      </>
    );
  }

  it('mexer num atualiza o outro e envia uma vez, com o mesmo debounce', async () => {
    render(<Both />);
    fireEvent.keyDown(knob(), { key: 'ArrowUp' });
    expect(screen.getByLabelText('Volume do Spotify')).toHaveValue('45');
    fireEvent.change(screen.getByLabelText('Volume do Spotify'), { target: { value: '70' } });
    expect(knob()).toHaveAttribute('aria-valuenow', '70');
    await act(() => vi.advanceTimersByTimeAsync(300));
    expect(setVolume).toHaveBeenCalledOnce();
    expect(setVolume).toHaveBeenCalledWith(70);
  });
});
