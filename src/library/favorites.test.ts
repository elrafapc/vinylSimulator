import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Disc } from '../spotify/api';
import {
  activeFilter,
  addFavorite,
  addFavorites,
  addTag,
  filterDiscs,
  filterOptions,
  allTags,
  getFavorites,
  getLibrary,
  isFavorite,
  moveDisc,
  removeFavorite,
  removeTag,
  reorderDisc,
  type Library,
} from './favorites';

const disc = (id: string): Disc => ({ id, uri: `spotify:album:${id}`, kind: 'album', name: `Disco ${id}`, artist: 'X' });
const ids = () => getFavorites().map((d) => d.id);
const tagsOf = (id: string) => getFavorites().find((d) => d.id === id)?.tags;
const stored = () => JSON.parse(localStorage.getItem('vinil.library') ?? 'null');

describe('estante', () => {
  beforeEach(() => localStorage.clear());

  it('começa vazia', () => {
    expect(getLibrary()).toEqual({ version: 3, discs: [] });
  });

  it('adiciona na frente, sem etiquetas, e persiste', () => {
    addFavorite(disc('a'));
    addFavorite(disc('b'));
    expect(ids()).toEqual(['b', 'a']);
    expect(tagsOf('b')).toEqual([]);
    expect(isFavorite('a')).toBe(true);
    expect(stored().discs).toHaveLength(2);
  });

  it('favoritar de novo traz para a frente e mantém as etiquetas', () => {
    addFavorite(disc('a'));
    addTag('a', 'Jazz');
    addFavorite(disc('b'));
    addFavorite(disc('a'));
    expect(ids()).toEqual(['a', 'b']);
    expect(tagsOf('a')).toEqual(['Jazz']);
  });

  it('remove', () => {
    addFavorite(disc('a'));
    addFavorite(disc('b'));
    expect(removeFavorite('a').discs.map((d) => d.id)).toEqual(['b']);
    expect(isFavorite('a')).toBe(false);
  });

  it('adiciona vários de uma vez sem duplicar nem perder etiquetas', () => {
    addFavorite(disc('a'));
    addTag('a', 'Jazz');
    addFavorites([disc('b'), disc('a')]);
    expect(ids()).toEqual(['b', 'a']);
    expect(tagsOf('a')).toEqual(['Jazz']);
  });
});

describe('data de entrada (T58)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());
  const addedAt = (id: string) => getFavorites().find((d) => d.id === id)?.addedAt;

  it('guarda quando o disco entrou e persiste', () => {
    vi.setSystemTime(1000);
    addFavorite(disc('a'));
    vi.setSystemTime(2000);
    addFavorites([disc('b'), disc('c')]);
    expect([addedAt('a'), addedAt('b'), addedAt('c')]).toEqual([1000, 2000, 2000]);
    expect(stored().discs.find((d: { id: string }) => d.id === 'a').addedAt).toBe(1000);
  });

  it('favoritar de novo mantém a data original', () => {
    vi.setSystemTime(1000);
    addFavorite(disc('a'));
    vi.setSystemTime(5000);
    addFavorite(disc('a'));
    addFavorites([disc('a')]);
    expect(addedAt('a')).toBe(1000);
  });

  it('discos antigos ficam sem data; data inválida é descartada', () => {
    localStorage.setItem(
      'vinil.library',
      JSON.stringify({ version: 3, discs: [{ ...disc('a'), tags: [] }, { ...disc('b'), tags: [], addedAt: 'ontem' }] }),
    );
    expect(getFavorites().map((d) => 'addedAt' in d)).toEqual([false, false]);
  });
});

describe('etiquetas', () => {
  beforeEach(() => {
    localStorage.clear();
    addFavorite(disc('b'));
    addFavorite(disc('a'));
  });

  it('várias por disco; cria ao adicionar', () => {
    addTag('a', 'Jazz');
    addTag('a', '  Para trabalhar ');
    expect(tagsOf('a')).toEqual(['Jazz', 'Para trabalhar']);
  });

  it('sem duplicadas: ignora maiúsculas/acentos e mantém a 1ª grafia na coleção', () => {
    addTag('a', 'Jázz');
    addTag('a', 'jazz');
    expect(tagsOf('a')).toEqual(['Jázz']);
    addTag('b', 'JAZZ');
    expect(tagsOf('b')).toEqual(['Jázz']);
  });

  it('recusa vazia, longa ou reservada', () => {
    expect(() => addTag('a', '   ')).toThrow('Digite o nome da etiqueta.');
    expect(() => addTag('a', 'x'.repeat(41))).toThrow('Use até 40 caracteres.');
    expect(() => addTag('a', 'sem etiqueta')).toThrow(/reservado/);
    expect(tagsOf('a')).toEqual([]);
  });

  it('remover (ignora maiúsculas/acentos)', () => {
    addTag('a', 'Jazz');
    addTag('a', 'Rock');
    removeTag('a', 'JAZZ');
    expect(tagsOf('a')).toEqual(['Rock']);
  });

  it('lista derivada dos discos, em ordem alfabética, e some quando ninguém usa', () => {
    addTag('a', 'Rock');
    addTag('b', 'Ária');
    addTag('b', 'jazz');
    expect(allTags(getLibrary())).toEqual(['Ária', 'jazz', 'Rock']);
    removeTag('b', 'jazz');
    expect(allTags(getLibrary())).toEqual(['Ária', 'Rock']);
    removeFavorite('a');
    expect(allTags(getLibrary())).toEqual(['Ária']);
  });
});

describe('reordenar a coleção', () => {
  const lib = (...list: string[]): Library => ({ version: 3, discs: list.map((id) => ({ ...disc(id), tags: [] })) });
  const order = (l: Library) => l.discs.map((d) => d.id);

  it('para frente e para trás (tirar e pôr na posição do outro)', () => {
    expect(order(moveDisc(lib('a', 'b', 'c', 'd'), 'a', 'c'))).toEqual(['b', 'c', 'a', 'd']);
    expect(order(moveDisc(lib('a', 'b', 'c', 'd'), 'd', 'b'))).toEqual(['a', 'd', 'b', 'c']);
  });

  it('em cima de si mesmo ou alvo desconhecido: nada muda', () => {
    const l = lib('a', 'b');
    expect(moveDisc(l, 'a', 'a')).toBe(l);
    expect(moveDisc(l, 'a', 'zzz')).toBe(l);
    expect(moveDisc(l, 'zzz', 'a')).toBe(l);
  });

  it('persiste (e o carrossel segue a mesma ordem)', () => {
    localStorage.clear();
    addFavorite(disc('b'));
    addFavorite(disc('a'));
    reorderDisc('a', 'b');
    expect(ids()).toEqual(['b', 'a']);
    expect(stored().discs.map((d: { id: string }) => d.id)).toEqual(['b', 'a']);
  });
});

describe('migração', () => {
  beforeEach(() => localStorage.clear());

  it('v2 → v3: categoria vira etiqueta, "Sem categoria" vira nenhuma, na ordem da estante expandida', () => {
    const v2 = {
      version: 2,
      categories: [{ id: 'c1', name: 'Jazz' }, { id: 'c2', name: 'Rock' }],
      // Ordem crua (misturada): x(sem) r1(Rock) a1(Jazz) y(sem) b1(Jazz)
      discs: [
        { ...disc('x'), categoryId: null },
        { ...disc('r1'), categoryId: 'c2' },
        { ...disc('a1'), categoryId: 'c1' },
        { ...disc('y'), categoryId: null },
        { ...disc('b1'), categoryId: 'c1' },
      ],
    };
    localStorage.setItem('vinil.library', JSON.stringify(v2));
    const lib = getLibrary();
    // Prateleira Jazz (a1, b1), depois Rock (r1), depois Sem categoria (x, y).
    expect(lib.discs.map((d) => [d.id, d.tags])).toEqual([
      ['a1', ['Jazz']],
      ['b1', ['Jazz']],
      ['r1', ['Rock']],
      ['x', []],
      ['y', []],
    ]);
    expect(stored()).toEqual(lib);
    expect(JSON.parse(localStorage.getItem('vinil.library.v2-backup') ?? 'null')).toEqual(v2);
  });

  it('v2: disco de categoria que não existe mais vira sem etiqueta', () => {
    localStorage.setItem(
      'vinil.library',
      JSON.stringify({ version: 2, categories: [], discs: [{ ...disc('a'), categoryId: 'sumiu' }] }),
    );
    expect(getLibrary().discs[0].tags).toEqual([]);
  });

  it('v1 → v3: mesma ordem, sem etiquetas; a chave antiga fica e não é mais lida', () => {
    localStorage.setItem('vinil.favorites', JSON.stringify([disc('b'), disc('a')]));
    expect(getLibrary().discs).toEqual([
      { ...disc('b'), tags: [] },
      { ...disc('a'), tags: [] },
    ]);
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

  it('v3: descarta discos repetidos e etiquetas vazias/repetidas, unificando a grafia', () => {
    localStorage.setItem(
      'vinil.library',
      JSON.stringify({
        version: 3,
        discs: [
          { ...disc('a'), tags: ['Jazz', 'jazz', '', 7, 'Sem etiqueta'] },
          { ...disc('a'), tags: ['Rock'] },
          { ...disc('b'), tags: ['JAZZ'] },
        ],
      }),
    );
    expect(getLibrary().discs.map((d) => [d.id, d.tags])).toEqual([
      ['a', ['Jazz']],
      ['b', ['Jazz']],
    ]);
  });
});

describe('filtro por etiquetas (T44)', () => {
  const d = (id: string, ...tags: string[]) => ({ ...disc(id), tags });
  const lib: Library = { version: 3, discs: [d('a', 'Jazz', 'Modal'), d('b', 'Jazz'), d('c'), d('d', 'Rock')] };
  const ids2 = (list: { id: string }[]) => list.map((x) => x.id);

  it('nada selecionado: todos', () => {
    expect(ids2(filterDiscs(lib.discs, []))).toEqual(['a', 'b', 'c', 'd']);
  });

  it('uma ou mais: só os discos com TODAS (ignora maiúsculas/acentos)', () => {
    expect(ids2(filterDiscs(lib.discs, ['jazz']))).toEqual(['a', 'b']);
    expect(ids2(filterDiscs(lib.discs, ['Jazz', 'MODAL']))).toEqual(['a']);
    expect(ids2(filterDiscs(lib.discs, ['Jazz', 'Rock']))).toEqual([]);
  });

  it('"Sem etiqueta": discos sem nenhuma; junto com outra, ninguém', () => {
    expect(ids2(filterDiscs(lib.discs, ['Sem etiqueta']))).toEqual(['c']);
    expect(ids2(filterDiscs(lib.discs, ['Sem etiqueta', 'Jazz']))).toEqual([]);
  });

  it('opções: etiquetas em uso + "Sem etiqueta" quando há disco sem; nada quando ninguém usa etiqueta', () => {
    expect(filterOptions(lib)).toEqual(['Jazz', 'Modal', 'Rock', 'Sem etiqueta']);
    expect(filterOptions({ version: 3, discs: [d('a', 'Jazz')] })).toEqual(['Jazz']);
    expect(filterOptions({ version: 3, discs: [d('a')] })).toEqual([]);
  });

  it('seleção perde etiquetas que sumiram', () => {
    expect(activeFilter({ version: 3, discs: [d('a', 'Jazz')] }, ['Jazz', 'Rock', 'Sem etiqueta'])).toEqual(['Jazz']);
  });
});
