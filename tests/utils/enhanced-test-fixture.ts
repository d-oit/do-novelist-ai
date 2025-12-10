/**
 * Enhanced Test Fixture for Novelist.ai E2E Tests
 *
 * Integrates comprehensive test data management, unified mocking, and cross-browser
 * compatibility to provide a robust foundation for all E2E tests.
 */

import type { Page, BrowserContext } from '@playwright/test';
import { test as base, expect } from '@playwright/test';
import { unifiedMockManager } from './unified-mock-manager';
import { randomBytes } from 'crypto';

/**
 * Generate a cryptographically secure random string
 */
function generateSecureId(): string {
  return randomBytes(4).toString('hex');
}
import { testDataManager } from './test-data-manager';
import { setupCrossBrowserTest, BrowserCompatibility } from './browser-compatibility';

export interface EnhancedTestFixtures {
  page: Page;
  context: BrowserContext;
  testData: {
    project: any;
    user: any;
    chapters: any[];
    context: any;
  };
  compatibility: BrowserCompatibility;
  mockManager: typeof unifiedMockManager;
  dataManager: typeof testDataManager;
}

export interface TestOptions {
  enableProjectCreation?: boolean;
  enableUserCreation?: boolean;
  enableChapterCreation?: boolean;
  mocking?: {
    enableNetworkErrors?: boolean;
    enableTimeoutErrors?: boolean;
    mockDelay?: number;
  };
  browser?: {
    enableOptimizations?: boolean;
    timeoutMultiplier?: number;
  };
  performance?: {
    enableMonitoring?: boolean;
    targetDuration?: number;
  };
}

/**
 * Enhanced test fixture with comprehensive data management and mocking
 */
const test = base.extend<EnhancedTestFixtures>({
  page: async ({ page }, use) => {
    // Browser-specific setup
    const browserName = page.context().browser()?.browserType().name() || 'chromium';
    console.log(`🔧 Setting up page for browser: ${browserName}`);

    // Setup cross-browser compatibility
    await setupCrossBrowserTest(page);

    // Configure browser-specific optimizations
    // if (browserName === 'firefox') {
    //   // Firefox-specific optimizations
    //   await page.context().addInitScript(() => {
    //     // Disable Firefox-specific features that might interfere
    //     (window as any).browserName = 'firefox';
    //   });
    // } else if (browserName === 'webkit') {
    //   // WebKit-specific optimizations
    //   await page.context().addInitScript(() => {
    //     (window as any).browserName = 'webkit';
    //   });
    // }

    await use(page);
  },

  context: async ({ context }, use) => {
    console.log('🔧 Setting up browser context...');

    // Ensure context is properly configured
    await context.addInitScript(() => {
      // Set up test environment flags
      (window as any).__IS_PLAYWRIGHT_TEST__ = true;
      (window as any).__TEST_BROWSER_NAME__ = context.browser()?.browserType().name() || 'chromium';
    });

    await use(context);
  },

  testData: async (_fixtures, use, testInfo) => {
    // We'll get testId from testInfo through the browser context
    const testId = `test-${Date.now()}-${generateSecureId()}`;
    console.log(`📊 Setting up test data for: ${testId}`);

    const options = (testInfo as any)?.testOptions || {};

    try {
      // Initialize test data manager for this test
      if (options.testData?.enableProjectCreation !== false) {
        await testDataManager.initializeTestContext(testId);
      }

      // Get comprehensive test data
      const testData = await testDataManager.getTestData(testId);

      console.log(`📊 Test data prepared:`, {
        projectId: testData.project.id,
        userId: testData.user.id,
        chapterCount: testData.chapters.length,
      });

      await use(testData);
    } catch (error) {
      console.error(`📊 Test data setup failed for ${testId}:`, error);
      throw error;
    } finally {
      // Cleanup test data
      if (options.testData?.enableProjectCreation !== false) {
        try {
          await testDataManager.cleanupTestContext(testId);
          console.log(`📊 Test data cleaned up for: ${testId}`);
        } catch (cleanupError) {
          console.error(`📊 Test data cleanup failed for ${testId}:`, cleanupError);
        }
      }
    }
  },

  compatibility: async ({ page }, use) => {
    const compatibility = new BrowserCompatibility(page);
    console.log(`🌐 Browser compatibility initialized`);

    await use(compatibility);
  },

  mockManager: async ({ page }, use, testInfo) => {
    // We'll get testId from test context
    const testId = `test-${Date.now()}-${generateSecureId()}`;
    console.log(`🎭 Setting up unified mock manager for: ${testId}`);

    const options = (testInfo as any)?.testOptions || {};

    try {
      // Initialize unified mock manager with test-specific configuration
      await unifiedMockManager.initializePage(page, testId, options.mocking);

      // Add cleanup function to test data manager
      testDataManager.addCleanupFunction(testId, () =>
        unifiedMockManager.cleanupPageRoutes(page, testId),
      );

      console.log(`🎭 Mock manager initialized for: ${testId}`);
      await use(unifiedMockManager);
    } catch (error) {
      console.error(`🎭 Mock manager setup failed for ${testId}:`, error);
      throw error;
    }
  },

  dataManager: async (_fixtures, use) => {
    console.log(`🗄️ Providing data manager`);
    await use(testDataManager);
  },
});

/**
 * Standardized test setup helper
 */
class TestSetup {
  /**
   * Setup test environment with all optimizations
   */
  static async setupTestEnvironment(
    page: Page,
    testId: string,
    options: {
      url?: string;
      waitForSelector?: string;
      enableMocks?: boolean;
    } = {},
  ): Promise<void> {
    const { url = '/', waitForSelector } = options;

    console.log(`🚀 Setting up test environment: ${testId}`);

    try {
      // Clear all existing state
      await page.unroute('**/*');
      await page.evaluate(() => {
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (error) {
          console.log('Storage clear failed (expected in some contexts):', error);
        }
      });
      await page.context().clearCookies();

      // Navigate to test URL with cross-browser compatibility
      const browserName = page.context().browser()?.browserType().name() || 'chromium';
      const timeout = browserName === 'firefox' ? 45000 : 30000;

      await page.goto(url, {
        waitUntil: 'networkidle',
        timeout,
      });

      // Wait for app to be ready
      await page.waitForLoadState('domcontentloaded');

      // Wait for specific selector if provided
      if (waitForSelector) {
        await page.waitForSelector(waitForSelector, { timeout: 10000 });
      } else {
        // Default wait for navigation elements
        await page.waitForSelector('[data-testid], nav, main', { timeout: 10000 });
      }

      // Set default viewport
      await page.setViewportSize({ width: 1280, height: 720 });

      console.log(`✅ Test environment setup complete: ${testId}`);
    } catch (error) {
      console.error(`❌ Test environment setup failed: ${testId}`, error);
      throw error;
    }
  }

  /**
   * Setup AI mocks specifically for this test
   */
  static async setupAIMocks(testId: string): Promise<void> {
    console.log(`🤖 Setting up AI mocks for: ${testId}`);

    try {
      // Setup Gemini mock - placeholder for now
      // await setupGeminiMock(page);
      console.log(`✅ AI mocks configured for: ${testId}`);
    } catch (error) {
      console.error(`❌ AI mock setup failed: ${testId}`, error);
      throw error;
    }
  }

  /**
   * Wait for async operations to complete
   */
  static async waitForAsyncOperations(
    page: Page,
    testId: string,
    timeout: number = 5000,
  ): Promise<void> {
    await unifiedMockManager.waitForAsyncOperations(page, testId, timeout);
  }

  /**
   * Get performance metrics for current test
   */
  static async getPerformanceMetrics(page: Page): Promise<any> {
    return await page.evaluate(() => {
      const navigation = performance.getEntriesByType(
        'navigation',
      )[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');

      return {
        domContentLoaded: navigation?.domContentLoadedEventEnd || 0,
        loadComplete: navigation?.loadEventEnd || 0,
        firstPaint: paint.find(entry => entry.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint:
          paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
      };
    });
  }
}

/**
 * Standardized test cleanup helper
 */
export class TestCleanup {
  /**
   * Comprehensive test cleanup
   */
  static async cleanupTest(
    page: Page,
    testId: string,
    options: {
      captureScreenshot?: boolean;
      takePerformanceSnapshot?: boolean;
    } = {},
  ): Promise<void> {
    const { captureScreenshot = true, takePerformanceSnapshot = true } = options;

    console.log(`🧹 Cleaning up test: ${testId}`);

    try {
      // Capture performance snapshot if requested
      if (takePerformanceSnapshot) {
        try {
          const metrics = await TestSetup.getPerformanceMetrics(page);
          console.log(`📊 Performance metrics for ${testId}:`, metrics);
        } catch (error) {
          console.warn(`📊 Failed to capture performance metrics:`, error);
        }
      }

      // Take screenshot on failure if requested
      if (captureScreenshot) {
        try {
          await page.screenshot({
            path: `test-results/failure-${testId.replace(/[:/]/g, '-')}.png`,
            fullPage: true,
          });
        } catch (error) {
          console.warn('📸 Screenshot capture failed:', error);
        }
      }

      // Clear all state
      await page.unroute('**/*');
      await page.evaluate(() => {
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (error) {
          console.log('Storage clear failed (expected in some contexts):', error);
        }
      });
      await page.context().clearCookies();

      // Navigate to blank page to clear DOM state
      await page.goto('about:blank', { waitUntil: 'domcontentloaded' });

      console.log(`✅ Test cleanup complete: ${testId}`);
    } catch (error) {
      console.error(`❌ Test cleanup failed: ${testId}`, error);
    }
  }
}

/**
 * Helper functions for common test operations
 */
export class TestHelpers {
  /**
   * Safe navigation with cross-browser compatibility
   */
  static async safeNavigate(
    page: Page,
    url: string,
    compatibility: BrowserCompatibility,
    options?: { timeout?: number; waitForSelector?: string },
  ): Promise<void> {
    await compatibility.safeNavigate(page, url, options);

    if (options?.waitForSelector) {
      await compatibility.enhancedWaitForElement(page, options.waitForSelector);
    }
  }

  /**
   * Safe click with cross-browser compatibility
   */
  static async safeClick(
    page: Page,
    selector: string,
    compatibility: BrowserCompatibility,
    options?: { timeout?: number; force?: boolean },
  ): Promise<void> {
    await compatibility.safeClick(page, selector, options);
  }

  /**
   * Fill form field with cross-browser compatibility
   */
  static async fillFormField(
    page: Page,
    selector: string,
    value: string,
    compatibility: BrowserCompatibility,
    options?: { timeout?: number },
  ): Promise<void> {
    await compatibility.fillFormField(page, selector, value, options);
  }

  /**
   * Wait for element with cross-browser compatibility
   */
  static async waitForElement(
    page: Page,
    selector: string,
    compatibility: BrowserCompatibility,
    options?: { timeout?: number; state?: 'visible' | 'attached' | 'detached' | 'hidden' },
  ): Promise<void> {
    await compatibility.enhancedWaitForElement(page, selector, options);
  }
}

// Export commonly used test utilities
export { test, expect };
