import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Disc } from '../spotify/api';
import { useFavorites } from './useFavorites';

const kob: Disc = { id: 'a1', uri: 'spotify:album:a1', kind: 'album', name: 'Kind of Blue', artist: 'Miles Davis' };

describe('useFavorites', () => {
  beforeEach(() => localStorage.clear());

  it('favoritar persiste ao recarregar e desfavoritar remove', () => {
    const first = renderHook(() => useFavorites());
    act(() => first.result.current.toggle(kob));
    expect(first.result.current.favoriteIds.has('a1')).toBe(true);
    first.unmount();

    const { result } = renderHook(() => useFavorites());
    expect(result.current.favorites).toEqual([{ ...kob, categoryId: null }]);
    act(() => result.current.toggle(kob));
    expect(result.current.favorites).toEqual([]);
  });

  it('categorias: criar, mover disco, renomear, excluir; erro de nome vira mensagem', () => {
    const { result } = renderHook(() => useFavorites());
    act(() => result.current.toggle(kob));
    let error: string | null = null;
    act(() => {
      error = result.current.addCategory('Jazz');
    });
    expect(error).toBeNull();
    const jazz = result.current.categories[0].id;

    act(() => result.current.moveDisc('a1', jazz));
    expect(result.current.favorites[0].categoryId).toBe(jazz);

    act(() => {
      error = result.current.addCategory('jazz');
    });
    expect(error).toBe('Já existe uma categoria "jazz".');

    act(() => {
      error = result.current.renameCategory(jazz, 'Jazz modal');
    });
    expect(result.current.categories[0].name).toBe('Jazz modal');

    act(() => result.current.removeCategory(jazz));
    expect(result.current.categories).toEqual([]);
    expect(result.current.favorites[0].categoryId).toBeNull();
  });
});
