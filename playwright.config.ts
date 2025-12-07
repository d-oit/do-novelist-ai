import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  testDir: './tests/specs',
  testMatch: '**/*.spec.ts',

  // Timeout settings optimized for CI vs local environments
  timeout: process.env.CI ? 30000 : 60000,
  expect: { timeout: process.env.CI ? 5000 : 10000 },

  // Execution strategy optimized for parallel CI execution
  fullyParallel: true,
  forbidOnly: process.env.CI ? true : false,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 4 : 2,
  shard: process.env.CI ? { current: 1, total: 3 } : undefined,

  // Production reporting with comprehensive test result generation
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list'],
  ],

  // Global settings with strategic diagnostic collection
  use: {
    baseURL: process.env.CI ? 'http://localhost:3000' : 'http://localhost:3000',
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
    ? {
        command: 'npm run preview -- --port 3000 --host 0.0.0.0',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
        stdout: 'pipe',
        stderr: 'pipe',
        env: {
          NODE_ENV: 'production',
          PLAYWRIGHT_TEST: 'true',
          VITE_AI_GATEWAY_API_KEY: 'test-gateway-key',
          VITE_DEFAULT_AI_PROVIDER: 'mistral',
          VITE_DEFAULT_AI_MODEL: 'mistral:mistral-medium-latest',
          VITE_TURSO_DATABASE_URL: 'test-url',
          VITE_TURSO_AUTH_TOKEN: 'test-token',
          VITE_DISABLE_AI_SDK: 'true',
          DISABLE_AI_SDK: 'true',
        },
      }
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
  globalSetup: resolve(__dirname, './tests/global-setup.ts'),
  globalTeardown: resolve(__dirname, './tests/global-teardown.ts'),
});
