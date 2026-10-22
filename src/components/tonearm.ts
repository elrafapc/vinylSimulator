import type { Track } from '../spotify/api';

// Ângulos do braço do console (T55), a partir da posição de tonearm.webp (0° = como no design; positivo = horário).
export const ARM_REST = -24;
/** Agulha na borda externa do disco (início do lado). */
export const ARM_START = -6.75;
/** Agulha perto do selo (fim do lado). */
export const ARM_END = 16;

/** Progresso 0–1 → ângulo do braço sobre o disco. */
export function armAngle(progress: number): number {
  const p = Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0));
  return ARM_START + p * (ARM_END - ARM_START);
}

/**
 * Quanto do disco já tocou (0–1): faixas anteriores + o tempo da faixa atual, sobre a duração total.
 * Sem a lista de faixas (ou a faixa fora dela, ex.: playlist de terceiros), usa só o progresso da faixa.
 */
export function discProgress(tracks: Track[] | undefined, trackId: string | undefined, progressMs: number, durationMs: number): number {
  const index = tracks && trackId ? tracks.findIndex((t) => t.id === trackId) : -1;
  if (tracks && index >= 0) {
    const total = tracks.reduce((sum, t) => sum + t.durationMs, 0);
    const before = tracks.slice(0, index).reduce((sum, t) => sum + t.durationMs, 0);
    if (total > 0) return Math.min(1, (before + progressMs) / total);
  }
  return durationMs > 0 ? Math.min(1, progressMs / durationMs) : 0;
}
