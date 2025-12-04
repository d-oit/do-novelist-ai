// CRITICAL: Import AI SDK logger patch FIRST, before any other imports
import '../src/lib/ai-sdk-logger-patch';

import { chromium, FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function globalSetup(_config: FullConfig): Promise<void> {
  // Ensure AI SDK logger is available globally before any tests run
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globalAny = globalThis as any;

  if (typeof globalAny.m === 'undefined' || typeof globalAny.m?.log !== 'function') {
    console.warn('AI SDK logger not properly initialized, setting up fallback');

    globalAny.m = {
      log: (...args: unknown[]): void => {
        console.log('[AI SDK Logger]', ...args);
      },
    };
  }

  console.log('🚀 Setting up test environment...');

  // Start MSW mock server for API interception

  // Create necessary directories
  const directories = [
    'test-results/screenshots',
    'test-results/visual-baseline',
    'test-results/accessibility-reports',
    'test-results/cleanup-reports',
    'test-results/videos',
  ];

  directories.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });

  // Set up global test data
  const browser = await chromium.launch();
  const context = await browser.newContext();

  try {
    // Initialize any global state needed for tests
    console.log('🔧 Initializing test environment...');

    // You could pre-populate test data here
    // await page.goto(config.projects[0].use.baseURL || 'http://localhost:4173');
    // await page.waitForLoadState('networkidle');

    console.log('✅ Test environment setup complete');
  } catch (error) {
    console.error('❌ Error during global setup:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}

export default globalSetup;
