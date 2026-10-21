import { useCallback, useMemo, useState } from 'react';
import {
  activeFilter,
  addFavorite,
  addFavorites,
  addTag,
  allTags,
  filterDiscs,
  filterOptions,
  getLibrary,
  removeFavorite,
  removeTag,
  reorderDisc,
  TagError,
  type Library,
} from '../library/favorites';
import type { Disc } from '../spotify/api';

export function useFavorites() {
  const [library, setLibrary] = useState<Library>(getLibrary);
  const favorites = library.discs;
  const favoriteIds = useMemo(() => new Set(favorites.map((f) => f.id)), [favorites]);
  // Etiquetas em uso (derivadas dos discos): alimentam o autocompletar.
  const tags = useMemo(() => allTags(library), [library]);
  // Filtro por etiquetas (T44): opções disponíveis e o resultado para uma seleção.
  const options = useMemo(() => filterOptions(library), [library]);
  const applyFilter = useCallback(
    (selected: string[]) => {
      const active = activeFilter(library, selected);
      return { active, discs: filterDiscs(library.discs, active) };
    },
    [library],
  );

  const toggle = useCallback(
    (disc: Disc) => setLibrary(favoriteIds.has(disc.id) ? removeFavorite(disc.id) : addFavorite(disc)),
    [favoriteIds],
  );
  const remove = useCallback((id: string) => setLibrary(removeFavorite(id)), []);
  const addMany = useCallback((discs: Disc[]) => setLibrary(addFavorites(discs)), []);

  /** Devolve a mensagem de erro (nome inválido) ou null. */
  const tagDisc = useCallback((discId: string, tag: string): string | null => {
    try {
      setLibrary(addTag(discId, tag));
      return null;
    } catch (e) {
      if (e instanceof TagError) return e.message;
      throw e;
    }
  }, []);
  const untagDisc = useCallback((discId: string, tag: string) => setLibrary(removeTag(discId, tag)), []);

  // Arrastar e soltar (T39/T43): o disco vai para a posição do disco `overId`.
  const drop = useCallback((activeId: string, overId: string) => setLibrary(reorderDisc(activeId, overId)), []);

  return { favorites, favoriteIds, tags, options, applyFilter, toggle, remove, addMany, tagDisc, untagDisc, drop };
}
