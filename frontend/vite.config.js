import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: ['sgec.localhost', 'localhost'],
    watch: { usePolling: process.env.VITE_POLLING === 'true', interval: 300 },
    hmr: { clientPort: Number(process.env.SGEC_PORTA) || 80 },
  },
  build: {
    sourcemap: false,
  },
});
