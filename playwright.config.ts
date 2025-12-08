import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  testDir: './tests/specs',
  testMatch: '**/*.spec.ts',

  // Timeout settings optimized for CI vs local environments
  timeout: process.env.CI ? 90000 : 60000,
  expect: { timeout: process.env.CI ? 10000 : 10000 },

  // Execution strategy optimized for parallel CI execution
  fullyParallel: true,
  forbidOnly: process.env.CI ? true : false,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : 2,
  // Note: Sharding is handled dynamically by CI via --shard flag

  // Production reporting with comprehensive test result generation
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list'],
  ],

  // Global settings with strategic diagnostic collection and browser optimization
  use: {
    baseURL: process.env.CI ? 'http://localhost:3000' : 'http://localhost:3000',
    // Enhanced timeouts for cross-browser compatibility
    actionTimeout: 15000, // Increased from 10000 for Firefox/WebKit
    navigationTimeout: 45000, // Increased from 30000 for slower browsers
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1280, height: 720 },
    // Cross-browser compatibility settings
    ignoreHTTPSErrors: true,
    javaScriptEnabled: true,
    // Browser-specific optimizations
    bypassCSP: true, // Help with CSP issues in different browsers
  },

  // Multi-browser projects for comprehensive testing with optimized configurations
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Enhanced timeout and stability settings for Chromium
        viewport: { width: 1280, height: 720 },
        ignoreHTTPSErrors: true,
        javaScriptEnabled: true,
      },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        // Enhanced timeout and stability settings for Firefox
        viewport: { width: 1280, height: 720 },
        ignoreHTTPSErrors: true,
        javaScriptEnabled: true,
      },
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        // Enhanced timeout and stability settings for WebKit
        viewport: { width: 1280, height: 720 },
        ignoreHTTPSErrors: true,
        javaScriptEnabled: true,
      },
    },
  ],

  // Optimized web server configuration for React applications
  webServer: process.env.CI
    ? {
        command: 'cd dist && python3 -m http.server 3000',
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
