import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  
 // Configurações para debug
  build: {
    sourcemap: true,  // Habilita source maps
    minify: false,    // Temporariamente desabilita minificação
  },
  // Para desenvolvimento
  server: {
    host: true,  // Permite acesso externo
    port: 5173,
  },
})
