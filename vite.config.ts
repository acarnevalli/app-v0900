import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    sourcemap: true,
    minify: false,
  },
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    allowedHosts: ['app-v0900.onrender.com'],
  }
})
