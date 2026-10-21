// Cache de respostas do Spotify (T46). Dados de álbum não mudam: memória + localStorage, sem expirar.
// O resto (playlists, busca) só em memória, com validade.

const STORAGE_PREFIX = 'vinil.cache.';

export const FOREVER = Number.POSITIVE_INFINITY;
export const TEN_MINUTES = 10 * 60_000;

interface Entry {
  value: Promise<unknown>;
  expiresAt: number;
}

const memory = new Map<string, Entry>();

function readStored<T>(key: string): T | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw === null ? undefined : (JSON.parse(raw) as T);
  } catch {
    return undefined;
  }
}

function writeStored(key: string, value: unknown): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch {
    // sem espaço/sem storage: fica só na memória
  }
}

/**
 * Devolve o valor guardado ou carrega uma vez. Chamadas simultâneas para a mesma chave compartilham o carregamento.
 * Erro não fica no cache (a próxima chamada tenta de novo).
 */
export function cached<T>(key: string, ttlMs: number, load: () => Promise<T>, persist = false): Promise<T> {
  const now = Date.now();
  const hit = memory.get(key);
  if (hit && hit.expiresAt > now) return hit.value as Promise<T>;

  if (persist) {
    const stored = readStored<T>(key);
    if (stored !== undefined) {
      const value = Promise.resolve(stored);
      memory.set(key, { value, expiresAt: now + ttlMs });
      return value;
    }
  }

  const value = load().then(
    (result) => {
      if (persist) writeStored(key, result);
      return result;
    },
    (error: unknown) => {
      memory.delete(key);
      throw error;
    },
  );
  memory.set(key, { value, expiresAt: now + ttlMs });
  return value;
}

/** Só para testes. */
export function clearCache(): void {
  memory.clear();
}
