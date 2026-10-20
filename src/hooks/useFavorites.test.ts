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
    expect(result.current.favorites).toEqual([kob]);
    act(() => result.current.toggle(kob));
    expect(result.current.favorites).toEqual([]);
  });
});
