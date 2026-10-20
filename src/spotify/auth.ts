import { SpotifyError } from './errors';

export const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID as string | undefined;
export const REDIRECT_URI = 'http://127.0.0.1:5173/callback';
const SCOPES = [
  'user-read-private',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'playlist-read-private',
  'playlist-read-collaborative',
];
const AUTHORIZE_URL = 'https://accounts.spotify.com/authorize';
const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const TOKEN_KEY = 'vinil.token';
const VERIFIER_KEY = 'vinil.verifier';
const EXPIRY_MARGIN_MS = 60_000;

interface StoredToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

const VERIFIER_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';

export function generateCodeVerifier(length = 64): string {
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values, (v) => VERIFIER_CHARS[v % VERIFIER_CHARS.length]).join('');
}

export function base64UrlEncode(bytes: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64UrlEncode(digest);
}

export function buildAuthorizeUrl(clientId: string, codeChallenge: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES.join(' '),
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
  });
  return `${AUTHORIZE_URL}?${params}`;
}

export async function login(): Promise<void> {
  if (!CLIENT_ID) throw new Error('VITE_SPOTIFY_CLIENT_ID não configurado em .env.local');
  const verifier = generateCodeVerifier();
  localStorage.setItem(VERIFIER_KEY, verifier);
  const challenge = await generateCodeChallenge(verifier);
  window.location.assign(buildAuthorizeUrl(CLIENT_ID, challenge));
}

function readToken(): StoredToken | null {
  const raw = localStorage.getItem(TOKEN_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredToken;
  } catch {
    return null;
  }
}

function saveToken(token: StoredToken): void {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(token));
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

async function requestToken(body: URLSearchParams, previousRefresh?: string): Promise<StoredToken> {
  let res: Response;
  try {
    res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
  } catch {
    throw new SpotifyError('network');
  }
  if (!res.ok) throw new SpotifyError('auth', res.status);
  const data = (await res.json()) as TokenResponse;
  const token: StoredToken = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? previousRefresh ?? '',
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  saveToken(token);
  return token;
}

let callbackPromise: Promise<void> | null = null;

// React StrictMode roda efeitos duas vezes; o código só pode ser trocado uma vez.
export function handleCallback(search: string): Promise<void> {
  callbackPromise ??= exchangeCode(search);
  return callbackPromise;
}

async function exchangeCode(search: string): Promise<void> {
  const params = new URLSearchParams(search);
  const error = params.get('error');
  if (error) throw new Error(`Login cancelado (${error})`);
  const code = params.get('code');
  const verifier = localStorage.getItem(VERIFIER_KEY);
  if (!code || !verifier || !CLIENT_ID) throw new SpotifyError('auth');
  await requestToken(
    new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: verifier,
    }),
  );
  localStorage.removeItem(VERIFIER_KEY);
}

let refreshPromise: Promise<string | null> | null = null;

export function refreshAccessToken(): Promise<string | null> {
  refreshPromise ??= doRefresh().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

async function doRefresh(): Promise<string | null> {
  const current = readToken();
  if (!current?.refreshToken || !CLIENT_ID) return null;
  try {
    const token = await requestToken(
      new URLSearchParams({
        client_id: CLIENT_ID,
        grant_type: 'refresh_token',
        refresh_token: current.refreshToken,
      }),
      current.refreshToken,
    );
    return token.accessToken;
  } catch (error) {
    if (error instanceof SpotifyError && error.kind === 'network') throw error;
    logout();
    return null;
  }
}

export async function getAccessToken(): Promise<string | null> {
  const token = readToken();
  if (!token) return null;
  if (token.expiresAt - EXPIRY_MARGIN_MS > Date.now()) return token.accessToken;
  return refreshAccessToken();
}

export function isLoggedIn(): boolean {
  return readToken() !== null;
}

export function logout(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(VERIFIER_KEY);
}
