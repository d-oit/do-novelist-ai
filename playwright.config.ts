import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/specs',
  testMatch: '**/*.spec.ts',

  // Timeout settings optimized for React applications
  timeout: 30000,
  expect: { timeout: 5000 },

  // Execution strategy for stability
  fullyParallel: false,
  forbidOnly: process.env.CI ? true : false,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 2,

  // Production reporting with strategic diagnostics
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list'],
  ],

  // Global settings with strategic diagnostic collection
  use: {
    baseURL: process.env.CI ? 'http://localhost:4173' : 'http://localhost:3000',
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
  webServer: process.env.CI
    ? undefined // In CI, use built application
    : {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
        stdout: 'pipe',
        stderr: 'pipe',
        env: {
          NODE_ENV: 'development',
          PLAYWRIGHT_TEST: 'true',
          VITE_AI_GATEWAY_API_KEY: 'test-gateway-key',
          VITE_DEFAULT_AI_PROVIDER: 'mistral',
          VITE_DEFAULT_AI_MODEL: 'mistral:mistral-medium-latest',
          VITE_TURSO_DATABASE_URL: 'test-url',
          VITE_TURSO_AUTH_TOKEN: 'test-token',
          VITE_DISABLE_AI_SDK: 'true',
          DISABLE_AI_SDK: 'true',
        },
      },

  // Global setup and teardown
  globalSetup: require.resolve('./tests/global-setup.ts'),
  globalTeardown: require.resolve('./tests/global-teardown.ts'),
});
