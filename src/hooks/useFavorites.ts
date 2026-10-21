import { useCallback, useMemo, useState } from 'react';
import {
  addFavorite,
  addFavorites,
  CategoryError,
  createCategory,
  deleteCategory,
  dropTarget,
  getLibrary,
  removeFavorite,
  renameCategory,
  reorderDisc,
  setDiscCategory,
  type Library,
} from '../library/favorites';
import type { Disc } from '../spotify/api';

export function useFavorites() {
  const [library, setLibrary] = useState<Library>(getLibrary);
  const favorites = library.discs;
  const favoriteIds = useMemo(() => new Set(favorites.map((f) => f.id)), [favorites]);

  const toggle = useCallback(
    (disc: Disc) => setLibrary(favoriteIds.has(disc.id) ? removeFavorite(disc.id) : addFavorite(disc)),
    [favoriteIds],
  );
  const remove = useCallback((id: string) => setLibrary(removeFavorite(id)), []);
  const addMany = useCallback((discs: Disc[]) => setLibrary(addFavorites(discs)), []);

  // Ações de categoria: devolvem a mensagem de erro (nome inválido/repetido) ou null.
  const attempt = useCallback((action: () => Library): string | null => {
    try {
      setLibrary(action());
      return null;
    } catch (e) {
      if (e instanceof CategoryError) return e.message;
      throw e;
    }
  }, []);
  const addCategory = useCallback((name: string) => attempt(() => createCategory(name)), [attempt]);
  const renameShelf = useCallback((id: string, name: string) => attempt(() => renameCategory(id, name)), [attempt]);
  const removeCategory = useCallback((id: string) => setLibrary(deleteCategory(id)), []);
  const moveDisc = useCallback(
    (discId: string, categoryId: string | null) => setLibrary(setDiscCategory(discId, categoryId)),
    [],
  );

  // Arrastar e soltar (T39): `overId` é outro disco ou uma prateleira (`shelf:…`).
  const drop = useCallback(
    (activeId: string, overId: string) => {
      const target = dropTarget(library, activeId, overId);
      if (target) setLibrary(reorderDisc(activeId, target.categoryId, target.index));
    },
    [library],
  );

  return {
    favorites,
    categories: library.categories,
    favoriteIds,
    toggle,
    remove,
    addMany,
    addCategory,
    renameCategory: renameShelf,
    removeCategory,
    moveDisc,
    drop,
  };
}
