import { defineConfig } from 'vitest/config';
import { loadEnv, type Connect, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { proxyLastfm } from './api/_proxy';

// No dev/preview, /api/lastfm roda aqui com o mesmo código da Vercel Function (api/lastfm.ts).
// A chave vem de LASTFM_API_KEY em .env.local (sem prefixo VITE_, então não vai para o navegador).
function lastfmDevApi(apiKey: string | undefined): Plugin {
  const handle: Connect.NextHandleFunction = (req, res, next) => {
    // Sem @types/node no projeto, o tipo do request vem vazio.
    const url = (req as { url?: string }).url;
    if (!url?.startsWith('/api/lastfm')) return next();
    void proxyLastfm(`http://127.0.0.1${url}`, apiKey)
      .then(async (response) => {
        res.statusCode = response.status;
        response.headers.forEach((value, key) => res.setHeader(key, value));
        res.end(await response.text());
      })
      .catch(next);
  };
  return {
    name: 'lastfm-dev-api',
    configureServer: (server) => void server.middlewares.use(handle),
    configurePreviewServer: (server) => void server.middlewares.use(handle),
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), lastfmDevApi(env.LASTFM_API_KEY)],
    server: { host: '127.0.0.1', port: 5173, strictPort: true },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      // Node 22+ expõe um localStorage nativo que sobrepõe o do jsdom.
      poolOptions: { forks: { execArgv: ['--no-experimental-webstorage'] } },
    },
  };
});
