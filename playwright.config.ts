import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,

  // Minimal reporter
  reporter: 'list',

  // Standard timeouts
  timeout: 30000,

  // Basic browser configuration
  use: {
    baseURL: 'http://localhost:3000',
  },

  // Simple web server setup
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },

  // Minimal project configuration
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
