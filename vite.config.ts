import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
       define: {
         'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
       },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
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
                'tailwind-merge'
              ],
              'vendor-charts': ['recharts'],
              'vendor-ai': ['@google/genai'],
              'vendor-db': ['@libsql/client'],
              'vendor-utils': ['zod', 'zustand', 'jszip']
            }
          }
        },
        chunkSizeWarningLimit: 600,
        cssCodeSplit: true,
        minify: true
      }
    };
});
