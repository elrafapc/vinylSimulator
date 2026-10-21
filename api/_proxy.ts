// Proxy do Last.fm: a chave fica no servidor (Vercel Function em produção, middleware do Vite no dev).
// Arquivos de api/ que começam com "_" não viram rota na Vercel.

const LASTFM_URL = 'https://ws.audioscrobbler.com/2.0/';
// Só o que a sugestão de álbum usa; qualquer outro método é recusado.
export const ALLOWED_METHODS = new Set(['artist.getsimilar', 'artist.gettopalbums']);
const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 10;
// Respostas do Last.fm mudam pouco: CDN da Vercel guarda por 1 dia.
const CACHE_OK = 'public, s-maxage=86400, stale-while-revalidate=3600';

function json(status: number, body: object): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

export async function proxyLastfm(
  requestUrl: string,
  apiKey: string | undefined,
  fetchImpl: typeof fetch = fetch,
): Promise<Response> {
  const query = new URL(requestUrl).searchParams;
  const method = (query.get('method') ?? '').toLowerCase();
  if (!ALLOWED_METHODS.has(method)) return json(400, { error: 'method-not-allowed' });
  const artist = query.get('artist')?.trim();
  if (!artist) return json(400, { error: 'missing-artist' });
  if (!apiKey) return json(500, { error: 'missing-key' });

  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(query.get('limit')) || DEFAULT_LIMIT));
  const params = new URLSearchParams({ method, artist, limit: String(limit), autocorrect: '1', format: 'json' });
  const logUrl = `${LASTFM_URL}?${params}`; // sem a chave
  params.set('api_key', apiKey);

  let upstream: Response;
  try {
    upstream = await fetchImpl(`${LASTFM_URL}?${params}`);
  } catch (error) {
    console.error('Last.fm', 'GET', logUrl, 'falha de rede', error);
    return json(502, { error: 'upstream-unreachable' });
  }
  const body = await upstream.text();
  if (!upstream.ok) console.error('Last.fm', 'GET', logUrl, upstream.status, body);
  return new Response(body, {
    status: upstream.status,
    headers: { 'content-type': 'application/json', 'cache-control': upstream.ok ? CACHE_OK : 'no-store' },
  });
}
