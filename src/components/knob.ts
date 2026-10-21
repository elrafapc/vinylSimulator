// Geometria do botão de volume: -135° (0%) a +135° (100%), 0° apontando para cima.
export const MIN_ANGLE = -135;
export const MAX_ANGLE = 135;

export function clampVolume(value: number): number {
  return Math.round(Math.min(100, Math.max(0, value)));
}

export function valueToAngle(value: number): number {
  return MIN_ANGLE + (clampVolume(value) / 100) * (MAX_ANGLE - MIN_ANGLE);
}

// Ponteiro em (dx, dy) relativo ao centro (y para baixo) → volume.
// Na faixa morta de baixo, fica no extremo do lado em que já estava (não pula de 0 para 100).
export function valueFromPointer(dx: number, dy: number, previous: number): number {
  const angle = (Math.atan2(dx, -dy) * 180) / Math.PI;
  if (angle > MAX_ANGLE || angle < MIN_ANGLE) return previous >= 50 ? 100 : 0;
  return clampVolume(((angle - MIN_ANGLE) / (MAX_ANGLE - MIN_ANGLE)) * 100);
}
