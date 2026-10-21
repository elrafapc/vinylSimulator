import type { Disc } from '../spotify/api';

// v3 (T43): uma coleção só; cada disco tem várias etiquetas. A lista de etiquetas é derivada dos discos.
const STORAGE_KEY = 'vinil.library';
const V2_BACKUP_KEY = 'vinil.library.v2-backup';
const LEGACY_KEY = 'vinil.favorites';

/** Reservado para o filtro "Sem etiqueta" (T44). */
export const NO_TAG = 'Sem etiqueta';
export const MAX_TAG = 40;

/** Disco da estante com suas etiquetas (`[]` = sem etiqueta). */
export type ShelfDisc = Disc & { tags: string[] };

export interface Library {
  version: 3;
  /** Ordem dos discos = ordem na estante e no carrossel. */
  discs: ShelfDisc[];
}

export class TagError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TagError';
  }
}

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

// Sem acento e sem diferenciar maiúsculas: "Jazz" e "jázz" são a mesma etiqueta.
export function tagKey(tag: string): string {
  return tag.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

function toShelfDisc(disc: Disc, tags: string[]): ShelfDisc {
  const { id, uri, kind, name, artist, imageUrl } = disc;
  return { id, uri, kind, name, artist, imageUrl, tags };
}

// Leitura defensiva: discos inválidos/repetidos saem; etiquetas vazias, longas ou repetidas também.
// Na coleção toda vale a 1ª grafia vista de cada etiqueta.
function sanitize(rawDiscs: Array<{ disc: unknown; tags: unknown }>): Library {
  const spelling = new Map<string, string>();
  const seen = new Set<string>();
  const discs: ShelfDisc[] = [];
  for (const { disc, tags } of rawDiscs) {
    if (!isDisc(disc) || seen.has(disc.id)) continue;
    seen.add(disc.id);
    const own = new Set<string>();
    const clean: string[] = [];
    for (const t of Array.isArray(tags) ? tags : []) {
      if (typeof t !== 'string') continue;
      const trimmed = t.trim();
      const key = tagKey(trimmed);
      if (!trimmed || trimmed.length > MAX_TAG || key === tagKey(NO_TAG) || own.has(key)) continue;
      own.add(key);
      if (!spelling.has(key)) spelling.set(key, trimmed);
      clean.push(spelling.get(key)!);
    }
    discs.push(toShelfDisc(disc, clean));
  }
  return { version: 3, discs };
}

function parse(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? undefined : JSON.parse(raw);
  } catch {
    return null;
  }
}

function save(library: Library): Library {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
  } catch {
    // sem storage: a estante vale só nesta aba
  }
  return library;
}

interface V2 {
  version: 2;
  categories?: Array<{ id?: unknown; name?: unknown }>;
  discs?: Array<Disc & { categoryId?: unknown }>;
}

// v2 → v3: categoria vira etiqueta; "Sem categoria" vira nenhuma. Ordem = a da estante expandida da v2:
// prateleira por prateleira (na ordem das categorias), "Sem categoria" por último; dentro de cada uma, a ordem salva.
function fromV2(v2: V2): Library {
  const categories = (Array.isArray(v2.categories) ? v2.categories : []).filter(
    (c): c is { id: string; name: string } => typeof c?.id === 'string' && typeof c?.name === 'string' && c.name.trim() !== '',
  );
  const discs = Array.isArray(v2.discs) ? v2.discs : [];
  const known = new Set(categories.map((c) => c.id));
  const ordered = [
    ...categories.flatMap((c) => discs.filter((d) => d?.categoryId === c.id).map((d) => ({ disc: d, tags: [c.name] }))),
    ...discs.filter((d) => !known.has(d?.categoryId as string)).map((d) => ({ disc: d, tags: [] })),
  ];
  return sanitize(ordered);
}

export function getLibrary(): Library {
  const current = parse(STORAGE_KEY) as { version?: unknown; discs?: unknown } | null | undefined;
  if (current && typeof current === 'object') {
    if (current.version === 3) {
      const discs = Array.isArray(current.discs) ? current.discs : [];
      return sanitize(discs.map((d: { tags?: unknown }) => ({ disc: d, tags: d?.tags })));
    }
    if (current.version === 2) {
      try {
        localStorage.setItem(V2_BACKUP_KEY, JSON.stringify(current));
      } catch {
        // sem storage: segue só com a migração em memória
      }
      return save(fromV2(current as V2));
    }
  }
  // v1 → v3: a lista antiga vira a estante, na mesma ordem, sem etiquetas.
  const legacy = parse(LEGACY_KEY);
  if (legacy !== undefined) {
    return save(sanitize((Array.isArray(legacy) ? legacy : []).map((d) => ({ disc: d, tags: [] }))));
  }
  return { version: 3, discs: [] };
}

export function getFavorites(): ShelfDisc[] {
  return getLibrary().discs;
}

export function isFavorite(id: string): boolean {
  return getFavorites().some((f) => f.id === id);
}

// O mais recente entra na frente da estante; se já estava, mantém as etiquetas.
export function addFavorite(disc: Disc): Library {
  const lib = getLibrary();
  const tags = lib.discs.find((d) => d.id === disc.id)?.tags ?? [];
  return save({ ...lib, discs: [toShelfDisc(disc, tags), ...lib.discs.filter((d) => d.id !== disc.id)] });
}

export function addFavorites(discs: Disc[]): Library {
  const lib = getLibrary();
  const byId = new Map(lib.discs.map((d) => [d.id, d]));
  const added = discs.map((d) => toShelfDisc(d, byId.get(d.id)?.tags ?? []));
  const ids = new Set(added.map((d) => d.id));
  return save({ ...lib, discs: [...added, ...lib.discs.filter((d) => !ids.has(d.id))] });
}

export function removeFavorite(id: string): Library {
  const lib = getLibrary();
  return save({ ...lib, discs: lib.discs.filter((d) => d.id !== id) });
}

/** Todas as etiquetas em uso (1ª grafia), em ordem alfabética sem acento. Some quando nenhum disco usa. */
export function allTags(library: Library): string[] {
  const byKey = new Map<string, string>();
  for (const d of library.discs) for (const t of d.tags) if (!byKey.has(tagKey(t))) byKey.set(tagKey(t), t);
  return [...byKey.values()].sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
}

/**
 * Adiciona a etiqueta ao disco (cria se não existir). Usa a grafia já existente na coleção.
 * Lança TagError se o nome for inválido; repetida no mesmo disco não faz nada.
 */
export function addTag(discId: string, tag: string): Library {
  const lib = getLibrary();
  const trimmed = tag.trim();
  if (!trimmed) throw new TagError('Digite o nome da etiqueta.');
  if (trimmed.length > MAX_TAG) throw new TagError(`Use até ${MAX_TAG} caracteres.`);
  const key = tagKey(trimmed);
  if (key === tagKey(NO_TAG)) throw new TagError(`"${NO_TAG}" é reservado.`);
  const existing = allTags(lib).find((t) => tagKey(t) === key) ?? trimmed;
  return save({
    ...lib,
    discs: lib.discs.map((d) =>
      d.id === discId && !d.tags.some((t) => tagKey(t) === key) ? { ...d, tags: [...d.tags, existing] } : d,
    ),
  });
}

export function removeTag(discId: string, tag: string): Library {
  const lib = getLibrary();
  const key = tagKey(tag);
  return save({
    ...lib,
    discs: lib.discs.map((d) => (d.id === discId ? { ...d, tags: d.tags.filter((t) => tagKey(t) !== key) } : d)),
  });
}

/**
 * Reordena a coleção (T39/T43): o disco arrastado vai para a posição do disco `overId`
 * (tirar e pôr, como arrayMove). Alvo desconhecido ou o próprio disco: nada muda.
 */
export function moveDisc(library: Library, activeId: string, overId: string): Library {
  const from = library.discs.findIndex((d) => d.id === activeId);
  const to = library.discs.findIndex((d) => d.id === overId);
  if (from < 0 || to < 0 || from === to) return library;
  const discs = [...library.discs];
  const [moved] = discs.splice(from, 1);
  discs.splice(to, 0, moved);
  return { ...library, discs };
}

/** Versão que lê e grava a estante. */
export function reorderDisc(activeId: string, overId: string): Library {
  return save(moveDisc(getLibrary(), activeId, overId));
}

/**
 * Filtro por etiquetas (T44): o disco precisa ter TODAS as selecionadas (ignora maiúsculas/acentos).
 * `NO_TAG` ("Sem etiqueta") seleciona discos sem nenhuma etiqueta. Nada selecionado = todos.
 */
export function filterDiscs<T extends { tags: string[] }>(discs: T[], selected: string[]): T[] {
  if (selected.length === 0) return discs;
  const wanted = selected.map(tagKey);
  const untagged = wanted.includes(tagKey(NO_TAG));
  const others = wanted.filter((k) => k !== tagKey(NO_TAG));
  return discs.filter((d) => {
    const own = new Set(d.tags.map(tagKey));
    if (untagged && own.size > 0) return false;
    return others.every((k) => own.has(k));
  });
}

/** Opções do filtro: as etiquetas em uso + "Sem etiqueta" (se algum disco não tem). Vazio se ninguém usa etiqueta. */
export function filterOptions(library: Library): string[] {
  const tags = allTags(library);
  if (tags.length === 0) return [];
  return library.discs.some((d) => d.tags.length === 0) ? [...tags, NO_TAG] : tags;
}

/** Tira do filtro as etiquetas que deixaram de existir (ex.: removidas do último disco). */
export function activeFilter(library: Library, selected: string[]): string[] {
  const options = new Set(filterOptions(library).map(tagKey));
  return selected.filter((t) => options.has(tagKey(t)));
}
