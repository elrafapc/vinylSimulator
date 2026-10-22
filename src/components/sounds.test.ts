import { describe, expect, it } from 'vitest';
import { soundsSummary } from './sounds';

const all = (crackle: boolean, rain: boolean, fire: boolean) => [
  { name: 'Chiado', enabled: crackle },
  { name: 'Chuva', enabled: rain, feminine: true },
  { name: 'Lareira', enabled: fire, feminine: true },
];

describe('soundsSummary', () => {
  it('liga e desliga com concordância', () => {
    expect(soundsSummary(all(true, false, false))).toBe('Chiado ligado · chuva e lareira desligadas');
    expect(soundsSummary(all(false, true, false))).toBe('Chuva ligada · chiado e lareira desligados');
    expect(soundsSummary(all(true, true, true))).toBe('Chiado, chuva e lareira ligados');
    expect(soundsSummary(all(false, false, false))).toBe('Chiado, chuva e lareira desligados');
  });
});
