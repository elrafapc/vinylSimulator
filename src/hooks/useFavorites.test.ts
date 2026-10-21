import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Disc } from '../spotify/api';
import { useFavorites } from './useFavorites';

const kob: Disc = { id: 'a1', uri: 'spotify:album:a1', kind: 'album', name: 'Kind of Blue', artist: 'Miles Davis' };
const blue: Disc = { id: 'a2', uri: 'spotify:album:a2', kind: 'album', name: 'Blue Train', artist: 'John Coltrane' };

describe('useFavorites', () => {
  beforeEach(() => localStorage.clear());

  it('favoritar persiste ao recarregar e desfavoritar remove', () => {
    const first = renderHook(() => useFavorites());
    act(() => first.result.current.toggle(kob));
    expect(first.result.current.favoriteIds.has('a1')).toBe(true);
    first.unmount();

    const { result } = renderHook(() => useFavorites());
    expect(result.current.favorites).toEqual([{ ...kob, tags: [] }]);
    act(() => result.current.toggle(kob));
    expect(result.current.favorites).toEqual([]);
  });

  it('etiquetas: adicionar, erro vira mensagem, lista derivada e remover', () => {
    const { result } = renderHook(() => useFavorites());
    act(() => result.current.toggle(kob));
    let error: string | null = null;
    act(() => {
      error = result.current.tagDisc('a1', 'Jazz');
    });
    expect(error).toBeNull();
    expect(result.current.favorites[0].tags).toEqual(['Jazz']);
    expect(result.current.tags).toEqual(['Jazz']);

    act(() => {
      error = result.current.tagDisc('a1', '   ');
    });
    expect(error).toBe('Digite o nome da etiqueta.');

    act(() => result.current.untagDisc('a1', 'jazz'));
    expect(result.current.tags).toEqual([]);
  });

  it('arrastar reordena a coleção', () => {
    const { result } = renderHook(() => useFavorites());
    act(() => result.current.toggle(kob));
    act(() => result.current.toggle(blue));
    expect(result.current.favorites.map((d) => d.id)).toEqual(['a2', 'a1']);
    act(() => result.current.drop('a2', 'a1'));
    expect(result.current.favorites.map((d) => d.id)).toEqual(['a1', 'a2']);
  });
});
