import { describe, expect, it } from 'vitest';
import { ARM_END, ARM_START, armAngle, discProgress } from './tonearm';

const track = (id: string, minutes: number) => ({ id, number: 1, name: id, artist: 'X', durationMs: minutes * 60_000 });
const side = [track('t1', 2), track('t2', 4), track('t3', 4)];

describe('braço do console', () => {
  it('vai da borda (-6,75°) ao selo (+16°) conforme o progresso', () => {
    expect(armAngle(0)).toBe(ARM_START);
    expect(armAngle(1)).toBe(ARM_END);
    expect(armAngle(0.5)).toBeCloseTo((ARM_START + ARM_END) / 2);
  });

  it('não passa dos limites', () => {
    expect(armAngle(-1)).toBe(ARM_START);
    expect(armAngle(2)).toBe(ARM_END);
    expect(armAngle(Number.NaN)).toBe(ARM_START);
  });
});

describe('discProgress', () => {
  it('soma as faixas anteriores ao tempo da atual', () => {
    // 2 min (t1) + 2 min de t2 = 4 de 10 min.
    expect(discProgress(side, 't2', 120_000, 240_000)).toBeCloseTo(0.4);
    expect(discProgress(side, 't1', 0, 120_000)).toBe(0);
  });

  it('faixa fora da lista ou sem lista: usa o progresso da faixa', () => {
    expect(discProgress(side, 'outra', 60_000, 240_000)).toBeCloseTo(0.25);
    expect(discProgress(undefined, 't2', 60_000, 240_000)).toBeCloseTo(0.25);
    expect(discProgress(undefined, undefined, 0, 0)).toBe(0);
  });
});
