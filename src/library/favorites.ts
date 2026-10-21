import type { Disc } from '../spotify/api';

// v2 (T38): discos + categorias (prateleiras). A chave antiga fica como cópia de segurança, sem ser lida de novo.
const STORAGE_KEY = 'vinil.library';
const LEGACY_KEY = 'vinil.favorites';

export const UNCATEGORIZED = 'Sem categoria';
export const MAX_CATEGORY_NAME = 40;

export interface Category {
  id: string;
  name: string;
}

/** Disco da estante: `categoryId` null = "Sem categoria". */
export type ShelfDisc = Disc & { categoryId: string | null };

export interface Library {
  version: 2;
  /** Ordem das prateleiras. */
  categories: Category[];
  /** Ordem dos discos = ordem na estante. */
  discs: ShelfDisc[];
}

export class CategoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CategoryError';
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

function isCategory(value: unknown): value is Category {
  const v = value as Partial<Category> | null;
  return typeof v === 'object' && v !== null && typeof v.id === 'string' && typeof v.name === 'string';
}

// Sem acento e sem diferenciar maiúsculas: "Jazz" e "jázz" são o mesmo nome.
function nameKey(name: string): string {
  return name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

function toShelfDisc(disc: Disc, categoryId: string | null): ShelfDisc {
  const { id, uri, kind, name, artist, imageUrl } = disc;
  return { id, uri, kind, name, artist, imageUrl, categoryId };
}

// Leitura defensiva: ignora entradas inválidas, discos repetidos, categorias de nome repetido
// e aponta para "Sem categoria" discos cuja categoria não existe mais.
function sanitize(rawCategories: unknown, rawDiscs: unknown): Library {
  const categories: Category[] = [];
  const names = new Set<string>();
  for (const c of Array.isArray(rawCategories) ? rawCategories : []) {
    if (!isCategory(c) || !c.name.trim() || names.has(nameKey(c.name)) || nameKey(c.name) === nameKey(UNCATEGORIZED)) continue;
    names.add(nameKey(c.name));
    categories.push({ id: c.id, name: c.name.trim() });
  }
  const ids = new Set(categories.map((c) => c.id));
  const seen = new Set<string>();
  const discs: ShelfDisc[] = [];
  for (const d of Array.isArray(rawDiscs) ? rawDiscs : []) {
    if (!isDisc(d) || seen.has(d.id)) continue;
    seen.add(d.id);
    const categoryId = (d as Partial<ShelfDisc>).categoryId;
    discs.push(toShelfDisc(d, typeof categoryId === 'string' && ids.has(categoryId) ? categoryId : null));
  }
  return { version: 2, categories, discs };
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

export function getLibrary(): Library {
  const current = parse(STORAGE_KEY) as Partial<Library> | null | undefined;
  if (current && typeof current === 'object' && current.version === 2) {
    return sanitize(current.categories, current.discs);
  }
  // Migração v1 → v2: a lista antiga vira a estante, na mesma ordem, tudo em "Sem categoria".
  const legacy = parse(LEGACY_KEY);
  if (legacy !== undefined) return save(sanitize([], legacy));
  return { version: 2, categories: [], discs: [] };
}

export function getFavorites(): ShelfDisc[] {
  return getLibrary().discs;
}

export function isFavorite(id: string): boolean {
  return getFavorites().some((f) => f.id === id);
}

// O mais recente entra na frente da estante; se já estava, mantém a categoria.
export function addFavorite(disc: Disc, categoryId: string | null = null): Library {
  const lib = getLibrary();
  const existing = lib.discs.find((d) => d.id === disc.id);
  const target = existing ? existing.categoryId : lib.categories.some((c) => c.id === categoryId) ? categoryId : null;
  return save({ ...lib, discs: [toShelfDisc(disc, target), ...lib.discs.filter((d) => d.id !== disc.id)] });
}

export function addFavorites(discs: Disc[]): Library {
  const lib = getLibrary();
  const byId = new Map(lib.discs.map((d) => [d.id, d]));
  const added = discs.map((d) => toShelfDisc(d, byId.get(d.id)?.categoryId ?? null));
  const ids = new Set(added.map((d) => d.id));
  return save({ ...lib, discs: [...added, ...lib.discs.filter((d) => !ids.has(d.id))] });
}

export function removeFavorite(id: string): Library {
  const lib = getLibrary();
  return save({ ...lib, discs: lib.discs.filter((d) => d.id !== id) });
}

function validName(name: string, categories: Category[], exceptId?: string): string {
  const trimmed = name.trim();
  if (!trimmed) throw new CategoryError('Dê um nome à categoria.');
  if (trimmed.length > MAX_CATEGORY_NAME) throw new CategoryError(`Use até ${MAX_CATEGORY_NAME} caracteres.`);
  const key = nameKey(trimmed);
  if (key === nameKey(UNCATEGORIZED)) throw new CategoryError(`"${UNCATEGORIZED}" é reservado.`);
  if (categories.some((c) => c.id !== exceptId && nameKey(c.name) === key)) {
    throw new CategoryError(`Já existe uma categoria "${trimmed}".`);
  }
  return trimmed;
}

function newCategoryId(): string {
  return `cat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/** Nova prateleira no fim. Lança CategoryError se o nome for inválido ou repetido. */
export function createCategory(name: string): Library {
  const lib = getLibrary();
  const category = { id: newCategoryId(), name: validName(name, lib.categories) };
  return save({ ...lib, categories: [...lib.categories, category] });
}

export function renameCategory(id: string, name: string): Library {
  const lib = getLibrary();
  if (!lib.categories.some((c) => c.id === id)) throw new CategoryError('Categoria não encontrada.');
  const valid = validName(name, lib.categories, id);
  return save({ ...lib, categories: lib.categories.map((c) => (c.id === id ? { ...c, name: valid } : c)) });
}

// Excluir não apaga discos: eles vão para "Sem categoria", na mesma ordem.
export function deleteCategory(id: string): Library {
  const lib = getLibrary();
  return save({
    ...lib,
    categories: lib.categories.filter((c) => c.id !== id),
    discs: lib.discs.map((d) => (d.categoryId === id ? { ...d, categoryId: null } : d)),
  });
}

export function setDiscCategory(discId: string, categoryId: string | null): Library {
  const lib = getLibrary();
  const target = categoryId !== null && lib.categories.some((c) => c.id === categoryId) ? categoryId : null;
  return save({ ...lib, discs: lib.discs.map((d) => (d.id === discId ? { ...d, categoryId: target } : d)) });
}

/**
 * Coloca o disco na prateleira `categoryId` (null = "Sem categoria"), na posição `index` dela (T39).
 * A ordem do array é a ordem da estante: o disco entra antes do disco que hoje ocupa `index` na prateleira
 * de destino (contando sem ele mesmo), ou logo depois do último dela; prateleira vazia → fim da estante.
 */
export function moveDiscTo(library: Library, discId: string, categoryId: string | null, index: number): Library {
  const disc = library.discs.find((d) => d.id === discId);
  if (!disc) return library;
  const target = categoryId !== null && library.categories.some((c) => c.id === categoryId) ? categoryId : null;
  const rest = library.discs.filter((d) => d.id !== discId);
  const shelf = rest.filter((d) => d.categoryId === target);
  const moved = { ...disc, categoryId: target };
  const clamped = Math.max(0, Math.min(index, shelf.length));
  let at: number;
  if (clamped < shelf.length) at = rest.indexOf(shelf[clamped]);
  else if (shelf.length > 0) at = rest.indexOf(shelf[shelf.length - 1]) + 1;
  else at = rest.length;
  return { ...library, discs: [...rest.slice(0, at), moved, ...rest.slice(at)] };
}

/** Versão que lê e grava a estante. */
export function reorderDisc(discId: string, categoryId: string | null, index: number): Library {
  return save(moveDiscTo(getLibrary(), discId, categoryId, index));
}

/** Id da prateleira como alvo de soltura (prateleira vazia ou o fim dela). */
export function shelfDropId(categoryId: string | null): string {
  return `shelf:${categoryId ?? ''}`;
}

/**
 * Onde soltar: `overId` é um disco (entra no lugar dele) ou uma prateleira (`shelf:…`, entra no fim).
 * Dentro da mesma prateleira, equivale a "tirar e pôr na posição do outro" (como arrayMove).
 */
export function dropTarget(library: Library, activeId: string, overId: string): { categoryId: string | null; index: number } | null {
  if (activeId === overId) return null;
  if (overId.startsWith('shelf:')) {
    const raw = overId.slice('shelf:'.length);
    const categoryId = raw === '' ? null : raw;
    const size = library.discs.filter((d) => d.categoryId === categoryId && d.id !== activeId).length;
    return { categoryId, index: size };
  }
  const over = library.discs.find((d) => d.id === overId);
  if (!over) return null;
  const shelf = library.discs.filter((d) => d.categoryId === over.categoryId);
  return { categoryId: over.categoryId, index: shelf.findIndex((d) => d.id === overId) };
}
