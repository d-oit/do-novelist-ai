import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true, // Enable parallel for performance
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0, // No retries locally for faster feedback
  workers: process.env.CI ? 2 : 4, // Parallel execution for performance
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list'],
  ],
  timeout: 60000, // 1 minute per test
  globalTimeout: 3600000, // 60 minutes total (increased from 5 minutes for CI stability)
  expect: {
    timeout: 10000, // 10 seconds for assertions (increased from default 5s)
  },
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000, // 10 seconds for actions
    navigationTimeout: 30000, // 30 seconds for navigation (AI operations can be slow)
    // Accessibility settings
    bypassCSP: true, // Allow axe-core injection
  },
  webServer: {
    command: process.env.CI ? 'pnpm run preview --host 0.0.0.0' : 'npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      VITE_AI_GATEWAY_API_KEY: 'test-gateway-key',
      VITE_DEFAULT_AI_PROVIDER: 'mistral',
      VITE_DEFAULT_AI_MODEL: 'mistral:mistral-medium-latest',
      VITE_TURSO_DATABASE_URL: 'test-url',
      VITE_TURSO_AUTH_TOKEN: 'test-token',
      // Disable AI SDK logging to prevent "m.log is not a function" error
      AI_SDK_LOG_LEVEL: 'none',
      OPENAI_LOG_LEVEL: 'none',
      ANTHROPIC_LOG_LEVEL: 'none',
      GOOGLE_LOG_LEVEL: 'none',
      // Test environment flags
      NODE_ENV: 'test',
      PLAYWRIGHT_TEST: 'true',
      // Completely disable AI SDK in tests
      VITE_DISABLE_AI_SDK: 'true',
      DISABLE_AI_SDK: 'true',
    },
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Visual regression baseline
        screenshot: 'only-on-failure',
        // Accessibility testing
        bypassCSP: true,
      },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        screenshot: 'only-on-failure',
        bypassCSP: true,
      },
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        screenshot: 'only-on-failure',
        bypassCSP: true,
      },
    },
    // Mobile testing for responsive design
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
        screenshot: 'only-on-failure',
        bypassCSP: true,
      },
    },
    // Tablet testing
    {
      name: 'iPad',
      use: {
        ...devices['iPad Pro'],
        screenshot: 'only-on-failure',
        bypassCSP: true,
      },
    },
  ],
  // Global setup for visual regression and accessibility
  globalSetup: './tests/global-setup.ts',
  globalTeardown: './tests/global-teardown.ts',
});
