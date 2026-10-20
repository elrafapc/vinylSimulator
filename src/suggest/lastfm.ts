const BASE_URL = 'https://ws.audioscrobbler.com/2.0/';

export class SuggestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SuggestError';
  }
}

function apiKey(): string | undefined {
  return import.meta.env.VITE_LASTFM_API_KEY as string | undefined;
}

async function call<T>(method: string, params: Record<string, string>): Promise<T> {
  const key = apiKey();
  if (!key) throw new SuggestError('Configure VITE_LASTFM_API_KEY em .env.local para receber sugestões.');
  const query = new URLSearchParams({ method, ...params, format: 'json' });
  const url = `${BASE_URL}?${query}`;
  let res: Response;
  try {
    res = await fetch(`${url}&api_key=${encodeURIComponent(key)}`);
  } catch {
    throw new SuggestError('Falha de rede ao falar com o Last.fm.');
  }
  const body = (await res.json().catch(() => null)) as (T & { error?: number }) | null;
  if (!res.ok || !body || body.error) {
    console.error('Last.fm', 'GET', url, res.status, body);
    throw new SuggestError('O Last.fm não respondeu. Tente de novo.');
  }
  return body;
}

interface SimilarResponse {
  similarartists?: { artist?: Array<{ name: string }> };
}

export async function getSimilarArtists(artist: string, limit = 10): Promise<string[]> {
  const data = await call<SimilarResponse>('artist.getsimilar', { artist, limit: String(limit), autocorrect: '1' });
  return (data.similarartists?.artist ?? []).map((a) => a.name);
}

interface TopAlbumsResponse {
  topalbums?: { album?: Array<{ name: string }> };
}

export async function getTopAlbums(artist: string, limit = 5): Promise<string[]> {
  const data = await call<TopAlbumsResponse>('artist.gettopalbums', { artist, limit: String(limit), autocorrect: '1' });
  return (data.topalbums?.album ?? []).map((a) => a.name).filter((name) => name && name !== '(null)');
}
