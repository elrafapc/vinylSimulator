import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildAuthorizeUrl,
  generateCodeChallenge,
  generateCodeVerifier,
  getAccessToken,
  isLoggedIn,
  REDIRECT_URI,
} from './auth';

describe('PKCE', () => {
  it('gera code verifier com tamanho e caracteres válidos', () => {
    const verifier = generateCodeVerifier();
    expect(verifier).toHaveLength(64);
    expect(verifier).toMatch(/^[A-Za-z0-9\-._~]+$/);
    expect(generateCodeVerifier()).not.toBe(verifier);
  });

  it('gera code challenge S256 conforme RFC 7636', async () => {
    const challenge = await generateCodeChallenge('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk');
    expect(challenge).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
  });

  it('monta URL de autorização com PKCE e redirect em 127.0.0.1', () => {
    const url = new URL(buildAuthorizeUrl('client123', 'challenge'));
    expect(url.origin + url.pathname).toBe('https://accounts.spotify.com/authorize');
    expect(url.searchParams.get('client_id')).toBe('client123');
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('code_challenge')).toBe('challenge');
    expect(url.searchParams.get('redirect_uri')).toBe(REDIRECT_URI);
    expect(url.searchParams.get('scope')).toContain('user-modify-playback-state');
  });
});

describe('token', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.unstubAllGlobals());

  it('sem token, não está logado', async () => {
    expect(isLoggedIn()).toBe(false);
    expect(await getAccessToken()).toBeNull();
  });

  it('retorna token válido sem renovar', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    localStorage.setItem(
      'vinil.token',
      JSON.stringify({ accessToken: 'abc', refreshToken: 'r', expiresAt: Date.now() + 3_600_000 }),
    );
    expect(await getAccessToken()).toBe('abc');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('renova token expirado e mantém o refresh token anterior', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ access_token: 'novo', expires_in: 3600 }))),
    );
    localStorage.setItem(
      'vinil.token',
      JSON.stringify({ accessToken: 'velho', refreshToken: 'r1', expiresAt: Date.now() - 1000 }),
    );
    expect(await getAccessToken()).toBe('novo');
    expect(JSON.parse(localStorage.getItem('vinil.token')!).refreshToken).toBe('r1');
  });

  it('desloga se a renovação for recusada', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 400 })));
    localStorage.setItem(
      'vinil.token',
      JSON.stringify({ accessToken: 'velho', refreshToken: 'r1', expiresAt: Date.now() - 1000 }),
    );
    expect(await getAccessToken()).toBeNull();
    expect(isLoggedIn()).toBe(false);
  });
});
