import path from 'path';

import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  // Get AI Gateway API key for dev proxy
  const aiGatewayApiKey = env.AI_GATEWAY_API_KEY || env.VITE_AI_GATEWAY_API_KEY;

  // Get default model from environment (format: "provider/model" e.g., "mistral/mistral-medium")
  const defaultModel = env.VITE_DEFAULT_AI_MODEL || 'mistral/mistral-small-latest';

  return {
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
              return next();
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
          // Optimize chunk file names for better caching
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
      },
      target: 'esnext',
      chunkSizeWarningLimit: 500,
      cssCodeSplit: true,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info'],
        },
      },
      sourcemap: false,
    },
  };
});
