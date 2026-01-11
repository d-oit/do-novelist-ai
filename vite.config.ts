import path from 'path';

import { VitePWA } from 'vite-plugin-pwa';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig, loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  // Get OpenRouter API key for dev proxy
  const openRouterApiKey = env.OPENROUTER_API_KEY || env.VITE_OPENROUTER_API_KEY;

  // Get default model from environment (format: "provider/model" e.g., "mistral/mistral-medium")
  const defaultModel = env.VITE_DEFAULT_AI_MODEL || 'mistral/mistral-small-latest';

  // CI-specific optimizations
  const isCI = process.env.CI === 'true';

  return {
    // Ensure TypeScript checking during build
    esbuild: {
      logOverride: { 'this-is-undefined-in-esm': 'silent' },
      // Optimize for CI builds
      minifyIdentifiers: isCI,
      minifySyntax: isCI,
      minifyWhitespace: isCI,
      // Reduce memory usage in CI
      keepNames: !isCI,
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      VitePWA({
        registerType: 'autoUpdate',
        useCredentials: true,
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'Novelist.ai - AI-Powered Writing Assistant',
          short_name: 'Novelist.ai',
          description:
            'Write novels with AI assistance. Organize characters, world-building, and chapters in one place.',
          theme_color: '#7c3aed',
          background_color: '#1a1a2e',
          display: 'standalone',
          orientation: 'portrait-primary',
          scope: '/',
          start_url: '/',
          // Attempt to fix 401 by ensuring manifest is requested correctly
          // Note: vite-plugin-pwa doesn't have a direct "useCredentials" but we can try to influence it
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/openrouter\.ai\/api\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'openrouter-api-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'images-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: false,
          type: 'module',
        },
      }) as any,
      // Custom middleware plugin for API routes during development
      {
        name: 'api-middleware',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            // Only handle /api/ai/* routes
            if (!req.url?.startsWith('/api/ai/')) {
              return void next();
            }

            // Parse request body
            let body = '';
            for await (const chunk of req) {
              body += chunk;
            }

            let data: Record<string, unknown>;
            try {
              data = JSON.parse(body);
            } catch {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Invalid JSON body' }));
              return;
            }

            // Handle brainstorm endpoint
            if (req.url === '/api/ai/brainstorm') {
              const { context, field } = data;

              let prompt = '';
              if (field === 'title') {
                prompt = `Generate a catchy book title for: "${String(context).substring(0, 500)}". Output ONLY the title.`;
              } else if (field === 'style') {
                prompt = `Suggest a genre/style for: "${String(context).substring(0, 500)}". Output ONLY the style.`;
              } else {
                prompt = `Enhance this concept: "${String(context).substring(0, 1000)}"`;
              }

              try {
                // Use the configured default model from environment
                // Format: "provider/model" e.g., "mistral/mistral-medium"

                const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${openRouterApiKey}`,
                    'HTTP-Referer': 'https://novelist.ai',
                    'X-Title': 'Novelist.ai',
                  },
                  body: JSON.stringify({
                    model: defaultModel,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.8,
                    stream: false,
                  }),
                });

                if (!response.ok) {
                  const errorText = await response.text();
                  console.error('OpenRouter error:', response.status, errorText);
                  res.statusCode = response.status;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(
                    JSON.stringify({ error: 'OpenRouter request failed', details: errorText }),
                  );
                  return;
                }

                const aiData = await response.json();
                const text =
                  aiData.choices?.[0]?.message?.content?.trim().replace(/^"|"$/g, '') || '';

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ text }));
              } catch (error) {
                console.error('Brainstorm error:', error);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Internal server error' }));
              }
              return;
            }

            // Handle generate endpoint
            if (req.url === '/api/ai/generate') {
              const { provider, model, prompt, system, temperature = 0.7 } = data;

              try {
                const messages: Array<{ role: string; content: string }> = [];
                if (system) messages.push({ role: 'system', content: String(system) });
                messages.push({ role: 'user', content: String(prompt) });

                const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${openRouterApiKey}`,
                    'HTTP-Referer': 'https://novelist.ai',
                    'X-Title': 'Novelist.ai',
                  },
                  body: JSON.stringify({
                    model: `${provider}/${model}`,
                    messages,
                    temperature,
                    stream: false,
                  }),
                });

                if (!response.ok) {
                  const errorText = await response.text();
                  console.error('OpenRouter error:', response.status, errorText);
                  res.statusCode = response.status;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(
                    JSON.stringify({ error: 'OpenRouter request failed', details: errorText }),
                  );
                  return;
                }

                const aiData = await response.json();
                const text = aiData.choices?.[0]?.message?.content || '';

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ text }));
              } catch (error) {
                console.error('Generate error:', error);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Internal server error' }));
              }
              return;
            }

            // Unknown API route
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Not found' }));
          });
        },
      },
      // Enable TypeScript path mapping from tsconfig.json
      tsconfigPaths(),
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
      // Force test environment detection for Playwright
      'import.meta.env.PLAYWRIGHT_TEST': JSON.stringify(env.PLAYWRIGHT_TEST || 'false'),
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
      // Optimize for CI environment
      outDir: 'dist',
      assetsDir: 'assets',
      assetsInlineLimit: 4096, // 4kb threshold for inline assets
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Consolidate core React into a single chunk to prevent dependency cycles
            if (
              id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/scheduler/') ||
              id.includes('node_modules/react-is/')
            ) {
              return 'vendor-core';
            }

            // AI SDKs in separate chunks
            if (id.includes('@openrouter/sdk')) {
              return 'vendor-openrouter';
            }
            if (id.includes('@google/genai')) {
              return 'vendor-genai';
            }

            // Router (can be significant size)
            if (id.includes('react-router-dom') || id.includes('react-router')) {
              return 'vendor-router';
            }

            // Chart libraries (recharts is large)
            if (id.includes('recharts')) {
              return 'vendor-charts';
            }

            // Database and storage
            if (id.includes('@libsql/client') || id.includes('node_modules/libsql')) {
              return 'vendor-db';
            }

            // Animation library (large, can be lazy loaded)
            if (id.includes('framer-motion')) {
              return 'vendor-animation';
            }

            // Editor libraries (MDEditor can be large)
            if (id.includes('@uiw/react-md-editor') || id.includes('react-markdown')) {
              return 'vendor-editor';
            }

            // UI utilities (small, always needed)
            if (
              id.includes('lucide-react') ||
              id.includes('class-variance-authority') ||
              id.includes('clsx') ||
              id.includes('tailwind-merge')
            ) {
              return 'vendor-ui';
            }

            // Validation and state management
            if (id.includes('zod')) {
              return 'vendor-zod';
            }
            if (id.includes('zustand')) {
              return 'vendor-zustand';
            }

            // Utility libraries
            if (id.includes('jszip') || id.includes('file-saver')) {
              return 'vendor-file-utils';
            }
            if (id.includes('lodash') || id.includes('uuid')) {
              return 'vendor-utils';
            }

            // Date/time libraries
            if (id.includes('date-fns') || id.includes('dayjs')) {
              return 'vendor-date';
            }

            // AI libraries (can be large)
            if (id.includes('@google/genai') || id.includes('google-ai')) {
              return 'vendor-google-ai';
            }
            if (id.includes('sanitize-html')) {
              return 'vendor-sanitize';
            }
            if (id.includes('posthog')) {
              return 'vendor-analytics';
            }

            // Large feature chunks - split by major features
            if (id.includes('src/features/analytics')) {
              return 'feature-analytics';
            }
            if (id.includes('src/features/editor') || id.includes('src/features/generation')) {
              return 'feature-editor';
            }
            if (id.includes('src/features/publishing')) {
              return 'feature-publishing';
            }
            if (
              id.includes('src/features/world-building') ||
              id.includes('src/features/characters')
            ) {
              return 'feature-world';
            }
            if (id.includes('src/features/writing-assistant')) {
              return 'feature-writing-assistant';
            }

            // Small, commonly used utilities
            if (id.includes('tiny-invariant') || id.includes('is-hotkey') || id.includes('ms')) {
              return 'vendor-small-utils';
            }

            // All other node_modules (should be much smaller now)
            if (id.includes('node_modules')) {
              return 'vendor-misc';
            }

            // Return undefined for application code to go into main bundle
            return undefined;
          },
          // Optimize chunk file names for better caching
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
        // Optimize rollup options for CI
        onwarn(warning, warn) {
          // Skip certain warnings in CI to reduce noise
          if (warning.code === 'UNUSED_EXTERNAL_IMPORT' && isCI) return;
          warn(warning);
        },
      },
      target: 'esnext',
      cssCodeSplit: true,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: isCI, // Drop console logs in CI
          drop_debugger: true,
          pure_funcs: isCI
            ? ['console.log', 'console.info', 'console.debug']
            : ['console.log', 'console.info'],
          // Reduce memory usage
          keep_infinity: !isCI,
          hoist_funs: isCI,
          hoist_vars: isCI,
        },
        mangle: isCI, // Optimize variable names in CI
        format: {
          comments: isCI ? false : 'some',
        },
      },
      sourcemap: false,
      // Optimize for CI build performance
      reportCompressedSize: !isCI, // Skip size report in CI for speed
      // Increase chunk size warning limit for large AI dependencies
      chunkSizeWarningLimit: 500,
    },
  };
});
