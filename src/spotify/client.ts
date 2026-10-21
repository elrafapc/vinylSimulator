import { getAccessToken, refreshAccessToken } from './auth';
import { SpotifyError } from './errors';

// Cliente único da Web API (T46): toda chamada ao Spotify passa por aqui.
// - 429: pausa TODAS as chamadas pelo tempo do Retry-After (sem repetir na hora); as próximas esperam a pausa.
// - GETs iguais em andamento viram uma requisição só.
// - Em dev, conta chamadas/min no console.

const BASE_URL = 'https://api.spotify.com/v1';
/** Sem Retry-After no 429, espera este tanto. */
const DEFAULT_RETRY_AFTER_S = 5;
const MINUTE = 60_000;

let pausedUntil = 0;
const inflight = new Map<string, Promise<Response>>();
let calls: number[] = [];

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function waitIfPaused(): Promise<void> {
  while (Date.now() < pausedUntil) await sleep(pausedUntil - Date.now());
}

function count(method: string, path: string): void {
  const now = Date.now();
  calls = calls.filter((t) => now - t < MINUTE);
  calls.push(now);
  if (import.meta.env.DEV && import.meta.env.MODE !== 'test') {
    console.debug(`[Spotify] ${calls.length} chamadas no último minuto — ${method} ${path.split('?')[0]}`);
  }
}

/** Chamadas feitas nos últimos 60s (para o contador e para testes). */
export function callsLastMinute(): number {
  const now = Date.now();
  calls = calls.filter((t) => now - t < MINUTE);
  return calls.length;
}

/** Até quando as chamadas estão pausadas por 429 (0 = livre). */
export function rateLimitedUntil(): number {
  return pausedUntil > Date.now() ? pausedUntil : 0;
}

/** Só para testes: zera pausa, deduplicação e contador. */
export function resetClient(): void {
  pausedUntil = 0;
  inflight.clear();
  calls = [];
}

interface ApiErrorBody {
  error?: { status?: number; message?: string; reason?: string };
}

async function toSpotifyError(method: string, path: string, res: Response): Promise<SpotifyError> {
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    body = null; // corpo vazio ou não-JSON
  }
  console.error('Spotify', method, `${BASE_URL}${path}`, res.status, body);
  const reason = (body as ApiErrorBody | null)?.error?.reason;
  if (reason === 'NO_ACTIVE_DEVICE') return new SpotifyError('no-device', res.status);
  if (res.status === 404 && path.startsWith('/me/player')) return new SpotifyError('no-device', 404);
  if (reason === 'PREMIUM_REQUIRED') return new SpotifyError('premium', res.status);
  if (res.status === 401) return new SpotifyError('auth', 401);
  if (res.status === 429) return new SpotifyError('rate-limit', 429);
  return new SpotifyError('unknown', res.status, `Erro do Spotify (${res.status}).`);
}

function retryAfterMs(res: Response): number {
  const seconds = Number(res.headers.get('Retry-After'));
  return (Number.isFinite(seconds) && seconds > 0 ? seconds : DEFAULT_RETRY_AFTER_S) * 1000;
}

async function send(path: string, init: RequestInit, retry: boolean): Promise<Response> {
  await waitIfPaused();
  const token = await getAccessToken();
  if (!token) throw new SpotifyError('auth');
  const method = (init.method ?? 'GET').toUpperCase();
  count(method, path);
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, { ...init, headers: { ...init.headers, Authorization: `Bearer ${token}` } });
  } catch {
    throw new SpotifyError('network');
  }
  if (res.status === 429) {
    // Pausa global; não repete esta chamada (quem chamou decide, e o polling volta sozinho depois).
    pausedUntil = Math.max(pausedUntil, Date.now() + retryAfterMs(res));
    throw await toSpotifyError(method, path, res);
  }
  if (res.status === 401 && retry) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) throw new SpotifyError('auth', 401);
    return send(path, init, false);
  }
  if (!res.ok) throw await toSpotifyError(method, path, res);
  return res;
}

export async function spotifyFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const method = (init.method ?? 'GET').toUpperCase();
  if (method !== 'GET') return send(path, init, true);
  // GET igual já em andamento: espera o mesmo resultado (cada um lê sua cópia do corpo).
  let shared = inflight.get(path);
  if (!shared) {
    shared = send(path, init, true).finally(() => inflight.delete(path));
    inflight.set(path, shared);
  }
  return (await shared).clone();
}
