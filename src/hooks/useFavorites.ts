import { useCallback, useMemo, useState } from 'react';
import { addFavorite, addFavorites, getFavorites, removeFavorite } from '../library/favorites';
import type { Disc } from '../spotify/api';

export function useFavorites() {
  const [favorites, setFavorites] = useState<Disc[]>(getFavorites);
  const favoriteIds = useMemo(() => new Set(favorites.map((f) => f.id)), [favorites]);

  const toggle = useCallback(
    (disc: Disc) => setFavorites(favoriteIds.has(disc.id) ? removeFavorite(disc.id) : addFavorite(disc)),
    [favoriteIds],
  );
  const remove = useCallback((id: string) => setFavorites(removeFavorite(id)), []);
  const addMany = useCallback((discs: Disc[]) => setFavorites(addFavorites(discs)), []);

  return { favorites, favoriteIds, toggle, remove, addMany };
}
