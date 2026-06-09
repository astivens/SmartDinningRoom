import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

/** En Docker, el API corre en otro contenedor (p. ej. server-dev), no en localhost del contenedor del cliente. */
const apiProxyTarget =
  process.env.API_PROXY_TARGET ?? process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:3002';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
      },
    },
  },
});
