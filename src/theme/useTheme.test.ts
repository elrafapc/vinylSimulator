import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useTheme } from './useTheme';

function mockSystem(prefersDark: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({ matches: prefersDark && query.includes('dark'), media: query })),
  );
}

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
  });
  afterEach(() => vi.unstubAllGlobals());

  it('na primeira visita segue o sistema (escuro)', () => {
    mockSystem(true);
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('na primeira visita segue o sistema (claro)', () => {
    mockSystem(false);
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('alternar troca o tema e aplica no documento', () => {
    mockSystem(true);
    const { result } = renderHook(() => useTheme());
    act(() => result.current.toggle());
    expect(result.current.theme).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
    act(() => result.current.toggle());
    expect(result.current.theme).toBe('dark');
  });

  it('a escolha persiste ao recarregar e vence o sistema', () => {
    mockSystem(true);
    const first = renderHook(() => useTheme());
    act(() => first.result.current.toggle());
    first.unmount();

    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('light');
  });

  it('ignora valor inválido salvo', () => {
    mockSystem(false);
    localStorage.setItem('vinil.theme', 'roxo');
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('light');
  });
});
