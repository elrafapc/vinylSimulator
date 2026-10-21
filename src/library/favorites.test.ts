import { beforeEach, describe, expect, it } from 'vitest';
import type { Disc } from '../spotify/api';
import {
  addFavorite,
  dropTarget,
  moveDiscTo,
  reorderDisc,
  shelfDropId,
  type Library,
  addFavorites,
  createCategory,
  deleteCategory,
  getFavorites,
  getLibrary,
  isFavorite,
  removeFavorite,
  renameCategory,
  setDiscCategory,
} from './favorites';

const disc = (id: string): Disc => ({ id, uri: `spotify:album:${id}`, kind: 'album', name: `Disco ${id}`, artist: 'X' });
const ids = () => getFavorites().map((d) => d.id);
const stored = () => JSON.parse(localStorage.getItem('vinil.library') ?? 'null');

describe('estante', () => {
  beforeEach(() => localStorage.clear());

  it('começa vazia', () => {
    expect(getLibrary()).toEqual({ version: 2, categories: [], discs: [] });
  });

  it('adiciona na frente, em "Sem categoria", e persiste', () => {
    addFavorite(disc('a'));
    addFavorite(disc('b'));
    expect(ids()).toEqual(['b', 'a']);
    expect(getFavorites()[0].categoryId).toBeNull();
    expect(isFavorite('a')).toBe(true);
    expect(stored().discs).toHaveLength(2);
  });

  it('não duplica: favoritar de novo traz para a frente e mantém a categoria', () => {
    const jazz = createCategory('Jazz').categories[0].id;
    addFavorite(disc('a'), jazz);
    addFavorite(disc('b'));
    addFavorite(disc('a'));
    expect(ids()).toEqual(['a', 'b']);
    expect(getFavorites()[0].categoryId).toBe(jazz);
  });

  it('remove', () => {
    addFavorite(disc('a'));
    addFavorite(disc('b'));
    expect(removeFavorite('a').discs.map((d) => d.id)).toEqual(['b']);
    expect(isFavorite('a')).toBe(false);
  });

  it('adiciona vários de uma vez sem duplicar nem perder categoria', () => {
    const jazz = createCategory('Jazz').categories[0].id;
    addFavorite(disc('a'), jazz);
    addFavorites([disc('b'), disc('a')]);
    expect(ids()).toEqual(['b', 'a']);
    expect(getFavorites()[1].categoryId).toBe(jazz);
  });
});

describe('categorias', () => {
  beforeEach(() => localStorage.clear());

  it('cria no fim, com nome limpo', () => {
    createCategory('Jazz');
    const lib = createCategory('  Para trabalhar ');
    expect(lib.categories.map((c) => c.name)).toEqual(['Jazz', 'Para trabalhar']);
    expect(new Set(lib.categories.map((c) => c.id)).size).toBe(2);
  });

  it('recusa nome vazio, longo, repetido (sem acento/maiúsculas) ou reservado', () => {
    createCategory('Jazz');
    expect(() => createCategory('   ')).toThrow('Dê um nome à categoria.');
    expect(() => createCategory('x'.repeat(41))).toThrow('Use até 40 caracteres.');
    expect(() => createCategory('JÁZZ')).toThrow('Já existe uma categoria "JÁZZ".');
    expect(() => createCategory('sem categoria')).toThrow(/reservado/);
    expect(getLibrary().categories).toHaveLength(1);
  });

  it('renomeia (inclusive mudando só maiúsculas) e recusa nome de outra', () => {
    const [jazz] = createCategory('Jazz').categories;
    createCategory('Rock');
    expect(renameCategory(jazz.id, 'JAZZ').categories[0].name).toBe('JAZZ');
    expect(() => renameCategory(jazz.id, 'rock')).toThrow(/Já existe/);
  });

  it('cada disco tem uma categoria; mover troca a categoria', () => {
    const jazz = createCategory('Jazz').categories[0].id;
    addFavorite(disc('a'));
    expect(setDiscCategory('a', jazz).discs[0].categoryId).toBe(jazz);
    expect(setDiscCategory('a', null).discs[0].categoryId).toBeNull();
    expect(setDiscCategory('a', 'nao-existe').discs[0].categoryId).toBeNull();
  });

  it('excluir move os discos para "Sem categoria", na mesma ordem, sem apagar nenhum', () => {
    const jazz = createCategory('Jazz').categories[0].id;
    addFavorite(disc('a'), jazz);
    addFavorite(disc('b'));
    addFavorite(disc('c'), jazz);
    const lib = deleteCategory(jazz);
    expect(lib.categories).toEqual([]);
    expect(lib.discs.map((d) => [d.id, d.categoryId])).toEqual([
      ['c', null],
      ['b', null],
      ['a', null],
    ]);
  });
});

describe('migração e dados ruins', () => {
  beforeEach(() => localStorage.clear());

  it('migra a lista antiga sem perda: mesma ordem, tudo em "Sem categoria", e guarda no formato novo', () => {
    localStorage.setItem('vinil.favorites', JSON.stringify([disc('b'), disc('a')]));
    const lib = getLibrary();
    expect(lib.categories).toEqual([]);
    expect(lib.discs).toEqual([
      { ...disc('b'), categoryId: null },
      { ...disc('a'), categoryId: null },
    ]);
    expect(stored()).toEqual(lib);
    // A antiga fica como cópia de segurança e não é mais lida.
    expect(localStorage.getItem('vinil.favorites')).not.toBeNull();
    localStorage.setItem('vinil.favorites', JSON.stringify([disc('z')]));
    expect(ids()).toEqual(['b', 'a']);
  });

  it('ignora dados corrompidos', () => {
    localStorage.setItem('vinil.favorites', '{quebrado');
    expect(getFavorites()).toEqual([]);
    localStorage.clear();
    localStorage.setItem('vinil.favorites', JSON.stringify([disc('a'), { id: 1 }, null]));
    expect(ids()).toEqual(['a']);
  });

  it('formato novo: descarta repetidos e solta discos de categoria inexistente', () => {
    localStorage.setItem(
      'vinil.library',
      JSON.stringify({
        version: 2,
        categories: [{ id: 'c1', name: 'Jazz' }, { id: 'c2', name: 'jazz' }, { id: 'c3', name: '' }],
        discs: [
          { ...disc('a'), categoryId: 'c1' },
          { ...disc('a'), categoryId: null },
          { ...disc('b'), categoryId: 'c2' },
        ],
      }),
    );
    const lib = getLibrary();
    expect(lib.categories).toEqual([{ id: 'c1', name: 'Jazz' }]);
    expect(lib.discs.map((d) => [d.id, d.categoryId])).toEqual([
      ['a', 'c1'],
      ['b', null],
    ]);
  });
});

describe('reordenar (T39)', () => {
  beforeEach(() => localStorage.clear());
  const lib = (discs: Array<[string, string | null]>): Library => ({
    version: 2,
    categories: [{ id: 'c1', name: 'Jazz' }, { id: 'c2', name: 'Rock' }],
    discs: discs.map(([id, categoryId]) => ({ ...disc(id), categoryId })),
  });
  const order = (l: Library) => l.discs.map((d) => `${d.id}:${d.categoryId ?? '-'}`);

  // Estante: a1 b1 (Jazz)  r1 (Rock)  x (Sem)  c1 (Jazz)
  const base = lib([['a1', 'c1'], ['b1', 'c1'], ['r1', 'c2'], ['x', null], ['c1d', 'c1']]);

  it('dentro da prateleira: para frente e para trás (como arrayMove)', () => {
    // Jazz = a1, b1, c1d. Arrastar a1 para cima de c1d → b1, c1d, a1.
    const t = dropTarget(base, 'a1', 'c1d')!;
    expect(t).toEqual({ categoryId: 'c1', index: 2 });
    expect(order(moveDiscTo(base, 'a1', t.categoryId, t.index)).filter((s) => s.endsWith(':c1'))).toEqual(['b1:c1', 'c1d:c1', 'a1:c1']);
    // c1d para cima de a1 → c1d, a1, b1.
    const back = dropTarget(base, 'c1d', 'a1')!;
    expect(order(moveDiscTo(base, 'c1d', back.categoryId, back.index)).filter((s) => s.endsWith(':c1'))).toEqual(['c1d:c1', 'a1:c1', 'b1:c1']);
  });

  it('entre prateleiras: entra no lugar do disco de destino e troca de categoria', () => {
    const t = dropTarget(base, 'x', 'r1')!;
    expect(t).toEqual({ categoryId: 'c2', index: 0 });
    const moved = moveDiscTo(base, 'x', t.categoryId, t.index);
    expect(order(moved)).toEqual(['a1:c1', 'b1:c1', 'x:c2', 'r1:c2', 'c1d:c1']);
  });

  it('soltar na prateleira (vazia ou no fim dela)', () => {
    const empty = lib([['a1', 'c1'], ['b1', 'c1']]);
    const t = dropTarget(empty, 'a1', shelfDropId('c2'))!;
    expect(t).toEqual({ categoryId: 'c2', index: 0 });
    expect(order(moveDiscTo(empty, 'a1', 'c2', 0))).toEqual(['b1:c1', 'a1:c2']);
    // Fim de "Sem categoria".
    expect(dropTarget(base, 'a1', shelfDropId(null))).toEqual({ categoryId: null, index: 1 });
    expect(order(moveDiscTo(base, 'a1', null, 1))).toEqual(['b1:c1', 'r1:c2', 'x:-', 'a1:-', 'c1d:c1']);
  });

  it('soltar em cima de si mesmo ou em alvo desconhecido não faz nada', () => {
    expect(dropTarget(base, 'a1', 'a1')).toBeNull();
    expect(dropTarget(base, 'a1', 'nao-existe')).toBeNull();
    expect(moveDiscTo(base, 'nao-existe', 'c1', 0)).toBe(base);
  });

  it('categoria inexistente vira "Sem categoria"; índice fora do limite vai para o fim', () => {
    expect(order(moveDiscTo(base, 'a1', 'zzz', 99)).at(-2)).toBe('a1:-');
  });

  it('a ordem persiste e o carrossel (ordem da estante) segue', () => {
    createCategory('Jazz');
    const jazz = getLibrary().categories[0].id;
    addFavorite(disc('b'), jazz);
    addFavorite(disc('a'), jazz);
    expect(ids()).toEqual(['a', 'b']);
    reorderDisc('a', jazz, 1);
    expect(ids()).toEqual(['b', 'a']);
    expect(stored().discs.map((d: { id: string }) => d.id)).toEqual(['b', 'a']);
  });
});
