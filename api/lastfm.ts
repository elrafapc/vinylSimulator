// Vercel Function: GET /api/lastfm?method=artist.getSimilar&artist=...
// A chave vem de LASTFM_API_KEY (variável de ambiente do projeto na Vercel), nunca do navegador.
import { proxyLastfm } from './_proxy';

// Sem @types/node no projeto: só o que a função usa.
declare const process: { env: Record<string, string | undefined> };

export function GET(request: Request): Promise<Response> {
  return proxyLastfm(request.url, process.env.LASTFM_API_KEY);
}
