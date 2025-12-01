import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // Disable parallel for stability
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1, // Retry failed tests
  workers: 1, // Single worker for stability
  reporter: 'html',
  timeout: 120000, // 2 minutes per test
  globalTimeout: 600000, // 10 minutes total
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npx kill-port 3000 && npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true, // Reuse if already running
    env: {
      // Single Vercel AI Gateway API key for all providers
      VITE_AI_GATEWAY_API_KEY: 'test-gateway-key',

      // Other configuration
      VITE_DEFAULT_AI_PROVIDER: 'mistral',
      VITE_DEFAULT_AI_MODEL: 'mistral:mistral-medium-latest',
      VITE_TURSO_DATABASE_URL: 'test-url',
      VITE_TURSO_AUTH_TOKEN: 'test-token',
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
