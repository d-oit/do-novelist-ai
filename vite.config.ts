import path from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react({
        // Enable Fast Refresh for development
        fastRefresh: true,
        // Configure JSX runtime for React 17+
        jsxRuntime: 'automatic',
        // Enable HMR for CSS and other assets
        devTarget: 'es2020',
      }),
    ],
    define: {
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-ui': [
              'framer-motion',
              'lucide-react',
              'class-variance-authority',
              'clsx',
              'tailwind-merge',
            ],
            'vendor-charts': ['recharts'],
            'vendor-ai': ['@google/genai'],
            'vendor-db': ['@libsql/client'],
            'vendor-utils': ['zod', 'zustand', 'jszip'],
          },
        },
      },
      chunkSizeWarningLimit: 600,
      cssCodeSplit: true,
      minify: true,
    },
  };
});
