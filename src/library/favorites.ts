import type { Disc } from '../spotify/api';

const STORAGE_KEY = 'vinil.favorites';

function isDisc(value: unknown): value is Disc {
  const v = value as Partial<Disc> | null;
  return (
    typeof v === 'object' &&
    v !== null &&
    typeof v.id === 'string' &&
    typeof v.uri === 'string' &&
    typeof v.name === 'string' &&
    (v.kind === 'album' || v.kind === 'playlist')
  );
}

export function getFavorites(): Disc[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter(isDisc) : [];
  } catch {
    return [];
  }
}

function saveFavorites(favorites: Disc[]): Disc[] {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  } catch {
    // sem storage: favoritos valem só nesta aba
  }
  return favorites;
}

// O mais recente entra na frente da estante.
export function addFavorite(disc: Disc): Disc[] {
  const favorites = getFavorites().filter((f) => f.id !== disc.id);
  return saveFavorites([disc, ...favorites]);
}

export function addFavorites(discs: Disc[]): Disc[] {
  const ids = new Set(discs.map((d) => d.id));
  return saveFavorites([...discs, ...getFavorites().filter((f) => !ids.has(f.id))]);
}

export function removeFavorite(id: string): Disc[] {
  return saveFavorites(getFavorites().filter((f) => f.id !== id));
}

export function isFavorite(id: string): boolean {
  return getFavorites().some((f) => f.id === id);
}
