import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import UnoCSS from 'unocss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), UnoCSS()],
  build: {
    target: ['chrome61', 'safari11', 'firefox60'],
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'markdown-vendor': ['react-markdown', 'remark-gfm'],
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    proxy: {
        '/dev': {
          target: 'https://data3.site/dev',
          secure: false,
          ws: true,
          changeOrigin: true,
          rewrite: path => path.replace(/^\/dev/, ''),
        },
        '/api': {
          target: 'https://data3.site/api',
          secure: false,
          ws: true,
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api/, ''),
        },
    },
  },
  base: './',
  resolve: {
    alias: {
      '@/': `${path.resolve(__dirname, 'src')}/`,
    },
  },
});
