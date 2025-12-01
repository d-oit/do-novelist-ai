import path from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react({
        // Configure JSX runtime for React 17+
        jsxRuntime: 'automatic',
      }),
      ...(mode === 'analyze'
        ? [
            visualizer({
              filename: 'dist/stats.html',
              open: true,
              gzipSize: true,
              brotliSize: true,
            }),
          ]
        : []),
    ],
    define: {
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@/components': path.resolve(__dirname, './src/components'),
        '@/features': path.resolve(__dirname, './src/features'),
        '@/lib': path.resolve(__dirname, './src/lib'),
        '@/types': path.resolve(__dirname, './src/types'),
        '@shared': path.resolve(__dirname, './src/shared'),
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
