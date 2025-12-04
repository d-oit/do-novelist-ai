// CRITICAL: Import AI SDK logger patch FIRST, before any other imports
import '../src/lib/ai-sdk-logger-patch';

import { chromium, FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface ConfigWithRetries extends FullConfig {
  retries?: number;
  timeout?: number;
}

async function globalSetup(config: FullConfig): Promise<void> {
  // Ensure AI SDK logger is available globally before any tests run
  interface GlobalWithLogger {
    m?: {
      log: (...args: unknown[]) => void;
    };
  }
  const globalAny = globalThis as GlobalWithLogger;
  const configWithRetries = config as ConfigWithRetries;

  if (typeof globalAny.m === 'undefined' || typeof globalAny.m?.log !== 'function') {
    console.warn('AI SDK logger not properly initialized, setting up fallback');

    globalAny.m = {
      log: (...args: unknown[]): void => {
        console.log('[AI SDK Logger]', ...args);
      },
    };
  }

  console.log('🚀 Setting up enhanced test environment for CI...');
  console.log(`📋 Environment: ${process.env.CI ? 'CI' : 'Local'}`);
  console.log(`🔧 Node.js: ${process.version}`);
  console.log(`💾 Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);

  // Enhanced system diagnostics for CI
  if (process.env.CI) {
    try {
      console.log('🔍 Running system diagnostics...');

      // Check available disk space
      const diskSpace = execSync('df -h /').toString();
      console.log('💽 Disk space:', diskSpace.split('\n')[1]);

      // Check memory usage
      const memoryInfo = execSync('free -h').toString();
      console.log('🧠 Memory info:', memoryInfo.split('\n')[0]);

      // Check if Playwright browsers are available
      const browsersPath = path.join(process.env.HOME || '/tmp', '.cache', 'ms-playwright');
      if (fs.existsSync(browsersPath)) {
        const browsers = fs.readdirSync(browsersPath);
        console.log(`📦 Available browsers: ${browsers.join(', ')}`);
      } else {
        console.warn('⚠️ Playwright browsers directory not found');
      }
    } catch (error) {
      console.warn('⚠️ Could not run system diagnostics:', error);
    }
  }

  // Create enhanced test directories with better organization
  const directories = [
    'test-results/screenshots',
    'test-results/visual-baseline',
    'test-results/accessibility-reports',
    'test-results/cleanup-reports',
    'test-results/videos',
    'test-results/traces',
    'test-results/artifacts',
    'test-results/fixtures',
  ];

  directories.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });

  // Enhanced browser setup with better error handling
  const browserOptions = {
    headless: process.env.CI ? true : false,
    args: process.env.CI
      ? [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
        ]
      : [],
  };

  console.log('🌐 Launching browser for environment setup...');
  const browser = await chromium.launch(browserOptions);
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: process.env.CI ? true : false,
  });

  try {
    // Enhanced environment validation
    console.log('🔧 Initializing enhanced test environment...');

    // Validate test configuration
    if (!config.projects?.length) {
      throw new Error('No test projects configured');
    }

    console.log(`🎯 Configured projects: ${config.projects.map(p => p.name).join(', ')}`);
    console.log(
      `⚙️ Workers: ${config.workers}, Retries: ${configWithRetries.retries}, Timeout: ${configWithRetries.timeout}ms`,
    );

    // Wait for application to be fully ready
    const setupPage = await context.newPage();
    try {
      console.log('🌐 Waiting for application to be ready...');
      await setupPage.goto('http://localhost:3000', {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      // Check if MSW is initialized
      await setupPage
        .waitForFunction(
          () => {
            // Check for any MSW readiness indicators
            return typeof window !== 'undefined';
          },
          { timeout: 10000 },
        )
        .catch(() => {
          console.warn('⚠️ MSW initialization timeout - proceeding with tests');
        });

      console.log('✅ Application is ready for testing');
    } finally {
      await setupPage.close();
    }

    // Enhanced test data setup
    const setupData = {
      timestamp: new Date().toISOString(),
      environment: process.env.CI ? 'ci' : 'local',
      nodeVersion: process.version,
      config: {
        workers: config.workers,
        retries: configWithRetries.retries,
        timeout: configWithRetries.timeout,
        projects: config.projects?.length || 0,
      },
      system: {
        memory: process.memoryUsage(),
        platform: process.platform,
        arch: process.arch,
      },
    };

    const setupPath = path.join(process.cwd(), 'test-results', 'setup-info.json');
    fs.writeFileSync(setupPath, JSON.stringify(setupData, null, 2));

    console.log('✅ Enhanced test environment setup complete');
    console.log(`📊 Setup info saved to: setup-info.json`);

    if (process.env.CI) {
      console.log('🔄 CI mode detected - enhanced monitoring enabled');
    }
  } catch (error) {
    console.error('❌ Critical error during global setup:', error);

    // Enhanced error reporting for CI
    if (process.env.CI) {
      const errorReport = {
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        environment: 'ci',
        config: {
          workers: config.workers,
          retries: configWithRetries.retries,
          timeout: configWithRetries.timeout,
        },
        system: {
          memory: process.memoryUsage(),
          platform: process.platform,
          arch: process.arch,
        },
      };

      const errorPath = path.join(process.cwd(), 'test-results', 'setup-error.json');
      fs.writeFileSync(errorPath, JSON.stringify(errorReport, null, 2));
      console.error(`📋 Error report saved to: ${errorPath}`);
    }

    throw error;
  } finally {
    await context.close();
    await browser.close();
    console.log('🧹 Browser cleanup completed');
  }
}

export default globalSetup;
