import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useSidebar } from './useSidebar';

describe('useSidebar', () => {
  beforeEach(() => localStorage.clear());

  it('começa expandido', () => {
    expect(renderHook(() => useSidebar()).result.current.collapsed).toBe(false);
  });

  it('recolher persiste ao recarregar', () => {
    const { result } = renderHook(() => useSidebar());
    act(() => result.current.toggle());
    expect(result.current.collapsed).toBe(true);
    expect(renderHook(() => useSidebar()).result.current.collapsed).toBe(true);
    act(() => result.current.toggle());
    expect(renderHook(() => useSidebar()).result.current.collapsed).toBe(false);
  });
});
