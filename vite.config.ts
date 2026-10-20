import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Node 22+ expõe um localStorage nativo que sobrepõe o do jsdom.
    poolOptions: { forks: { execArgv: ['--no-experimental-webstorage'] } },
  },
});
