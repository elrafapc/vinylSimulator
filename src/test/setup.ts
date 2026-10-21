import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(async () => {
  cleanup();
  // Cache e fila do cliente do Spotify são globais: cada teste começa do zero.
  // Import dinâmico: pega o mesmo módulo do teste (com os mocks dele), sem carregar o auth real antes.
  const [{ clearCache }, { resetClient }] = await Promise.all([import('../spotify/cache'), import('../spotify/client')]);
  clearCache();
  resetClient();
});
