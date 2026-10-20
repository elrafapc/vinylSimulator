import { beforeEach, describe, expect, it } from 'vitest';
import type { Disc } from '../spotify/api';
import { addFavorite, addFavorites, getFavorites, isFavorite, removeFavorite } from './favorites';

const disc = (id: string): Disc => ({ id, uri: `spotify:album:${id}`, kind: 'album', name: `Disco ${id}`, artist: 'X' });

describe('favorites', () => {
  beforeEach(() => localStorage.clear());

  it('começa vazio', () => {
    expect(getFavorites()).toEqual([]);
  });

  it('adiciona na frente e persiste', () => {
    addFavorite(disc('a'));
    addFavorite(disc('b'));
    expect(getFavorites().map((d) => d.id)).toEqual(['b', 'a']);
    expect(isFavorite('a')).toBe(true);
  });

  it('não duplica: favoritar de novo só traz para a frente', () => {
    addFavorite(disc('a'));
    addFavorite(disc('b'));
    addFavorite(disc('a'));
    expect(getFavorites().map((d) => d.id)).toEqual(['a', 'b']);
  });

  it('remove', () => {
    addFavorite(disc('a'));
    addFavorite(disc('b'));
    expect(removeFavorite('a').map((d) => d.id)).toEqual(['b']);
    expect(isFavorite('a')).toBe(false);
  });

  it('adiciona vários de uma vez sem duplicar', () => {
    addFavorite(disc('a'));
    addFavorites([disc('b'), disc('a')]);
    expect(getFavorites().map((d) => d.id)).toEqual(['b', 'a']);
  });

  it('ignora dados corrompidos', () => {
    localStorage.setItem('vinil.favorites', '{quebrado');
    expect(getFavorites()).toEqual([]);
    localStorage.setItem('vinil.favorites', JSON.stringify([disc('a'), { id: 1 }, null]));
    expect(getFavorites().map((d) => d.id)).toEqual(['a']);
  });
});
