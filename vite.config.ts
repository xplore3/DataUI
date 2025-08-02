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
          // target: 'https://test.data3.site/dev',
          target: 'http://97.64.21.158:3021',
          secure: false,
          ws: true,
          changeOrigin: true,
          rewrite: path => path.replace(/^\/dev/, ''),
        },
        '/api': {
          // target: 'https://test.data3.site/api',
          target: 'https://ipbot.chat',
          secure: false,
          ws: true,
          changeOrigin: true,
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
