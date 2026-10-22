import { NO_TAG, tagKey, type ShelfDisc } from './favorites';

// Tela "Sua coleção" (T58): buscar, ordenar e agrupar os discos da estante. Nada aqui muda a estante.
const SORT_KEY = 'vinil.collection.sort';

export type CollectionSort = 'tags' | 'artist' | 'recent' | 'custom';

export const SORT_OPTIONS: Array<{ value: CollectionSort; label: string }> = [
  { value: 'tags', label: 'Etiquetas' },
  { value: 'artist', label: 'Artista' },
  { value: 'recent', label: 'Adicionados recentemente' },
  { value: 'custom', label: 'Minha ordem' },
];

const DEFAULT_SORT: CollectionSort = 'tags';

function isSort(value: unknown): value is CollectionSort {
  return SORT_OPTIONS.some((o) => o.value === value);
}

/** Modo "Organizar por" escolhido da última vez (Etiquetas na 1ª visita). */
export function getCollectionSort(): CollectionSort {
  try {
    const saved = localStorage.getItem(SORT_KEY);
    return isSort(saved) ? saved : DEFAULT_SORT;
  } catch {
    return DEFAULT_SORT;
  }
}

export function setCollectionSort(sort: CollectionSort): void {
  try {
    localStorage.setItem(SORT_KEY, sort);
  } catch {
    // sem storage: o modo vale só enquanto a tela estiver aberta
  }
}

const compare = (a: string, b: string) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });

/** Busca na coleção por nome ou artista, sem acento e sem diferenciar maiúsculas. Vazio = todos. */
export function searchCollection<T extends Pick<ShelfDisc, 'name' | 'artist'>>(discs: T[], query: string): T[] {
  const term = tagKey(query);
  if (!term) return discs;
  return discs.filter((d) => tagKey(d.name).includes(term) || tagKey(d.artist ?? '').includes(term));
}

/**
 * Ordem da grade: Artista = artista e depois nome (A–Z); Recentes = entrada mais nova primeiro, discos sem data
 * (guardados antes da T58) no fim, na ordem da estante; Etiquetas e Minha ordem = ordem da estante.
 */
export function sortCollection<T extends ShelfDisc>(discs: T[], sort: CollectionSort): T[] {
  if (sort === 'artist') {
    return [...discs].sort((a, b) => compare(a.artist ?? '', b.artist ?? '') || compare(a.name, b.name));
  }
  if (sort === 'recent') {
    // sort() é estável: empates (mesma importação, ou ambos sem data) mantêm a ordem da estante.
    return [...discs].sort((a, b) => (b.addedAt ?? 0) - (a.addedAt ?? 0));
  }
  return discs;
}

export interface TagGroup<T> {
  tag: string;
  discs: T[];
}

/**
 * Uma seção por etiqueta (A–Z, sem acento), com os discos na ordem da estante; "Sem etiqueta" por último.
 * Disco com várias etiquetas aparece em cada uma delas. Seções vazias não aparecem.
 */
export function groupByTag<T extends Pick<ShelfDisc, 'tags'>>(discs: T[]): Array<TagGroup<T>> {
  const groups = new Map<string, TagGroup<T>>();
  const untagged: T[] = [];
  for (const disc of discs) {
    if (disc.tags.length === 0) untagged.push(disc);
    for (const tag of disc.tags) {
      const key = tagKey(tag);
      if (!groups.has(key)) groups.set(key, { tag, discs: [] });
      groups.get(key)!.discs.push(disc);
    }
  }
  const sorted = [...groups.values()].sort((a, b) => compare(a.tag, b.tag));
  return untagged.length > 0 ? [...sorted, { tag: NO_TAG, discs: untagged }] : sorted;
}
