import { beforeEach, describe, expect, it } from 'vitest';
import { getCollectionSort, groupByTag, searchCollection, setCollectionSort, sortCollection } from './collection';
import type { ShelfDisc } from './favorites';

const disc = (id: string, name: string, artist: string, tags: string[] = [], addedAt?: number): ShelfDisc => ({
  id,
  uri: `spotify:album:${id}`,
  kind: 'album',
  name,
  artist,
  tags,
  ...(addedAt === undefined ? {} : { addedAt }),
});

const ids = (discs: ShelfDisc[]) => discs.map((d) => d.id);

const kob = disc('kob', 'Kind of Blue', 'Miles Davis', ['Jazz', 'Para trabalhar'], 100);
const nevermind = disc('nev', 'Nevermind', 'Nirvana', ['Rock'], 300);
const cafe = disc('caf', 'Café Society', 'Ângela Ro Ro', [], undefined);
const inUtero = disc('inu', 'In Utero', 'Nirvana', ['rock', 'Ébano'], 200);
const old = disc('old', 'Antigo', 'Zé', [], undefined);
const collection = [kob, nevermind, cafe, inUtero, old];

describe('busca na coleção', () => {
  it('por nome ou artista, sem acento e sem diferenciar maiúsculas', () => {
    expect(ids(searchCollection(collection, 'CAFE'))).toEqual(['caf']);
    expect(ids(searchCollection(collection, 'angela'))).toEqual(['caf']);
    expect(ids(searchCollection(collection, 'nirv'))).toEqual(['nev', 'inu']);
  });

  it('vazia ou só espaços: todos, na mesma ordem', () => {
    expect(searchCollection(collection, '  ')).toBe(collection);
  });

  it('nada encontrado: lista vazia', () => {
    expect(searchCollection(collection, 'xyz')).toEqual([]);
  });
});

describe('ordenar', () => {
  it('Artista: A–Z sem acento, e depois o nome do disco', () => {
    expect(ids(sortCollection(collection, 'artist'))).toEqual(['caf', 'kob', 'inu', 'nev', 'old']);
  });

  it('Adicionados recentemente: mais novo primeiro; sem data no fim, na ordem da estante', () => {
    expect(ids(sortCollection(collection, 'recent'))).toEqual(['nev', 'inu', 'kob', 'caf', 'old']);
  });

  it('Minha ordem e Etiquetas: a ordem da estante, sem copiar', () => {
    expect(sortCollection(collection, 'custom')).toBe(collection);
    expect(sortCollection(collection, 'tags')).toBe(collection);
  });

  it('não altera a lista recebida', () => {
    const copy = [...collection];
    sortCollection(collection, 'artist');
    expect(collection).toEqual(copy);
  });
});

describe('agrupar por etiqueta', () => {
  it('uma seção por etiqueta em ordem alfabética, "Sem etiqueta" por último', () => {
    const groups = groupByTag(collection);
    expect(groups.map((g) => g.tag)).toEqual(['Ébano', 'Jazz', 'Para trabalhar', 'Rock', 'Sem etiqueta']);
  });

  it('disco com várias etiquetas aparece em cada seção; ordem da estante dentro da seção', () => {
    const groups = groupByTag(collection);
    const of = (tag: string) => ids(groups.find((g) => g.tag === tag)!.discs);
    expect(of('Jazz')).toEqual(['kob']);
    expect(of('Para trabalhar')).toEqual(['kob']);
    expect(of('Rock')).toEqual(['nev', 'inu']);
    expect(of('Sem etiqueta')).toEqual(['caf', 'old']);
  });

  it('sem disco sem etiqueta, não há "Sem etiqueta"; coleção vazia, nenhuma seção', () => {
    expect(groupByTag([kob]).map((g) => g.tag)).toEqual(['Jazz', 'Para trabalhar']);
    expect(groupByTag([])).toEqual([]);
  });
});

describe('modo escolhido', () => {
  beforeEach(() => localStorage.clear());

  it('Etiquetas na 1ª visita', () => {
    expect(getCollectionSort()).toBe('tags');
  });

  it('persiste', () => {
    setCollectionSort('artist');
    expect(getCollectionSort()).toBe('artist');
  });

  it('valor salvo inválido volta para Etiquetas', () => {
    localStorage.setItem('vinil.collection.sort', 'qualquer');
    expect(getCollectionSort()).toBe('tags');
  });
});
