// Proxy no servidor (api/lastfm.ts): a chave do Last.fm nunca chega ao navegador (T31).
const PROXY_URL = '/api/lastfm';

export class SuggestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SuggestError';
  }
}

async function call<T>(method: string, params: Record<string, string>): Promise<T> {
  const url = `${PROXY_URL}?${new URLSearchParams({ method, ...params })}`;
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new SuggestError('Falha de rede ao buscar sugestões.');
  }
  const body = (await res.json().catch(() => null)) as (T & { error?: number | string }) | null;
  if (body?.error === 'missing-key') {
    throw new SuggestError('Sugestões indisponíveis: configure LASTFM_API_KEY no servidor (.env.local ou Vercel).');
  }
  if (!res.ok || !body || body.error) {
    console.error('Last.fm (proxy)', 'GET', url, res.status, body);
    throw new SuggestError('O Last.fm não respondeu. Tente de novo.');
  }
  return body;
}

interface SimilarResponse {
  similarartists?: { artist?: Array<{ name: string }> };
}

export async function getSimilarArtists(artist: string, limit = 10): Promise<string[]> {
  const data = await call<SimilarResponse>('artist.getsimilar', { artist, limit: String(limit) });
  return (data.similarartists?.artist ?? []).map((a) => a.name);
}

interface TopAlbumsResponse {
  topalbums?: { album?: Array<{ name: string }> };
}

export async function getTopAlbums(artist: string, limit = 5): Promise<string[]> {
  const data = await call<TopAlbumsResponse>('artist.gettopalbums', { artist, limit: String(limit) });
  return (data.topalbums?.album ?? []).map((a) => a.name).filter((name) => name && name !== '(null)');
}
