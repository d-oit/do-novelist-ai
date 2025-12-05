import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/specs',
  testMatch: '**/*.spec.ts',

  // Timeout settings optimized for React applications
  timeout: 30000,
  expect: { timeout: 5000 },

  // Critical: Execution strategy for context isolation
  fullyParallel: true,
  forbidOnly: process.env.CI ? true : false,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Production reporting with strategic diagnostics
  reporter: [['html'], ['json', { outputFile: 'test-results/results.json' }]],

  // Global settings with strategic diagnostic collection
  use: {
    baseURL: 'http://localhost:3000',
    actionTimeout: 10000,
    navigationTimeout: 30000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1280, height: 720 },
  },

  // Multi-browser projects for comprehensive testing
  projects: process.env.CI
    ? [
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
        },
      ]
    : [
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
        },
        {
          name: 'firefox',
          use: { ...devices['Desktop Firefox'] },
        },
        {
          name: 'webkit',
          use: { ...devices['Desktop Safari'] },
        },
      ],

  // Optimized web server configuration for React applications
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI, // Different logic for CI vs local
    timeout: 120000, // 2 minutes for server startup
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      // Test environment configuration
      NODE_ENV: process.env.CI ? 'test' : 'development',
      PLAYWRIGHT_TEST: process.env.CI ? 'true' : 'false',

      // React application specific settings
      VITE_AI_GATEWAY_API_KEY: 'test-gateway-key',
      VITE_DEFAULT_AI_PROVIDER: 'mistral',
      VITE_DEFAULT_AI_MODEL: 'mistral:mistral-medium-latest',
      VITE_TURSO_DATABASE_URL: 'test-url',
      VITE_TURSO_AUTH_TOKEN: 'test-token',

      // AI SDK configuration for tests
      VITE_DISABLE_AI_SDK: 'true',
      DISABLE_AI_SDK: 'true',

      // Enhanced debugging for CI
      ...(process.env.CI && { DEBUG: 'pw:browser*' }),
    },
  },
});
