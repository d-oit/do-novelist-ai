import path from 'path';

import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig, loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  // Get AI Gateway API key for dev proxy
  const aiGatewayApiKey = env.AI_GATEWAY_API_KEY || env.VITE_AI_GATEWAY_API_KEY;

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

                const response = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${aiGatewayApiKey}`,
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
                  console.error('AI Gateway error:', response.status, errorText);
                  res.statusCode = response.status;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(
                    JSON.stringify({ error: 'AI Gateway request failed', details: errorText }),
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

                const response = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${aiGatewayApiKey}`,
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
                  console.error('AI Gateway error:', response.status, errorText);
                  res.statusCode = response.status;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(
                    JSON.stringify({ error: 'AI Gateway request failed', details: errorText }),
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
            // React ecosystem
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
              return 'vendor-react';
            }

            // AI-related dependencies
            if (
              id.includes('@google/genai') ||
              id.includes('@ai-sdk') ||
              id.includes('node_modules/ai')
            ) {
              return 'vendor-ai';
            }

            // Chart libraries
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

            // UI utilities (small, always needed)
            if (
              id.includes('lucide-react') ||
              id.includes('class-variance-authority') ||
              id.includes('clsx') ||
              id.includes('tailwind-merge')
            ) {
              return 'vendor-ui';
            }

            // Utility libraries
            if (id.includes('zod') || id.includes('zustand') || id.includes('jszip')) {
              return 'vendor-utils';
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

            // Utility libraries (additional)
            if (id.includes('dayjs') || id.includes('lodash') || id.includes('uuid')) {
              return 'vendor-utils';
            }

            // Date/time libraries
            if (id.includes('date-fns') || id.includes('dayjs')) {
              return 'vendor-date';
            }

            // Small, commonly used utilities
            if (
              id.includes('lodash.get') ||
              id.includes('lodash.set') ||
              id.includes('lodash.has') ||
              id.includes('tiny-invariant') ||
              id.includes('is-hotkey')
            ) {
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
      chunkSizeWarningLimit: 300, // More aggressive chunk size limit
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
