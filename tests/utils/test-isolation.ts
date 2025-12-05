/**
 * Test Isolation and State Management Utilities
 *
 * Provides comprehensive cleanup and isolation for Playwright E2E tests
 * to ensure each test runs in a clean environment, especially during parallel execution.
 */

import { Page, BrowserContext } from '@playwright/test';
import { setupGeminiMock } from './mock-ai-gateway';

/**
 * Complete state reset for a page/context
 * Should be called in afterEach hooks to ensure clean state
 */
export async function resetPageState(page: Page): Promise<void> {
  try {
    // Clear all network interceptors
    await page.unroute('**/*');

    // Clear localStorage
    await page.evaluate(() => {
      localStorage.clear();
    });

    // Clear sessionStorage
    await page.evaluate(() => {
      sessionStorage.clear();
    });

    // Clear any IndexedDB data
    await page.evaluate(async () => {
      const databases = await indexedDB.databases?.();
      if (databases) {
        for (const dbInfo of databases) {
          if (dbInfo.name) {
            await new Promise<void>((resolve, reject) => {
              const deleteReq = indexedDB.deleteDatabase(dbInfo.name!);
              deleteReq.onsuccess = () => resolve();
              deleteReq.onerror = () => reject(deleteReq.error);
            });
          }
        }
      }
    });

    // Clear cookies
    await page.context().clearCookies();

    // Reset viewport to default
    await page.setViewportSize({ width: 1280, height: 720 });

    // Navigate to about:blank to clear DOM state
    await page.goto('about:blank', { waitUntil: 'domcontentloaded' });

    console.log('✅ Page state reset complete');
  } catch (error) {
    console.error('❌ Error during page state reset:', error);
  }
}

/**
 * Reset browser context state for complete isolation
 */
export async function resetContextState(context: BrowserContext): Promise<void> {
  try {
    // Clear all cookies for the context
    await context.clearCookies();

    // Close all pages except the current one (if any)
    const pages = context.pages();
    if (pages.length > 0) {
      // Keep the first page open, close others
      if (pages) {
        for (let i = 1; i < pages.length; i++) {
          const page = pages[i];
          if (page) {
            await page.close();
          }
        }
      }
    }

    console.log('✅ Context state reset complete');
  } catch (error) {
    console.error('❌ Error during context state reset:', error);
  }
}

/**
 * Standard test setup with proper mocking and state isolation
 * Call this in beforeEach hooks
 */
export async function setupTestEnvironment(page: Page, url: string = '/'): Promise<void> {
  try {
    // Ensure clean state before setup
    await resetPageState(page);

    // Setup AI mocks
    await setupGeminiMock(page);

    // Navigate to test URL
    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Wait for app to be ready
    await page.waitForLoadState('domcontentloaded');

    // Set default viewport
    await page.setViewportSize({ width: 1280, height: 720 });

    console.log(`✅ Test environment setup complete for: ${url}`);
  } catch (error) {
    console.error('❌ Error during test environment setup:', error);
    throw error;
  }
}

/**
 * Standard test cleanup with comprehensive state reset
 * Call this in afterEach hooks
 */
export async function cleanupTestEnvironment(page: Page): Promise<void> {
  try {
    await resetPageState(page);

    // Take screenshot on failure (this should be called from test fixture)
    console.log('🧹 Test environment cleanup complete');
  } catch (error) {
    console.error('❌ Error during test environment cleanup:', error);
  }
}

/**
 * Wait for app to be fully loaded and ready for testing
 */
export async function waitForAppReady(page: Page): Promise<void> {
  // Wait for network to be idle
  await page.waitForLoadState('networkidle');

  // Wait for key app elements to be present
  await page.waitForSelector('[data-testid], nav, main', {
    timeout: 10000,
  });

  // Small delay to ensure any async operations complete
  await page.waitForTimeout(500);
}

/**
 * Clean navigation to home page
 */
export async function navigateToHome(page: Page): Promise<void> {
  await page.goto('/', {
    waitUntil: 'networkidle',
    timeout: 30000,
  });
  await waitForAppReady(page);
}

/**
 * Safe navigation between pages with proper state management
 */
export async function safeNavigate(
  page: Page,
  url: string,
  options?: { waitForSelector?: string; timeout?: number },
): Promise<void> {
  const { waitForSelector, timeout = 10000 } = options || {};

  await page.goto(url, {
    waitUntil: 'networkidle',
    timeout: 30000,
  });

  if (waitForSelector) {
    await page.waitForSelector(waitForSelector, { timeout });
  }

  await waitForAppReady(page);
}

/**
 * Get unique test identifier for logging
 */
export function getTestId(testInfo: { title: string; file: string; line: number }): string {
  return `${testInfo.file}:${testInfo.line} - ${testInfo.title}`;
}

/**
 * Wait for specific elements to be ready
 */
export async function waitForElements(
  page: Page,
  selectors: string[],
  timeout: number = 5000,
): Promise<void> {
  for (const selector of selectors) {
    await page.waitForSelector(selector, { timeout });
  }
}

/**
 * Clear all browser data (cookies, localStorage, etc.)
 */
export async function clearAllBrowserData(page: Page): Promise<void> {
  // Clear cookies
  await page.context().clearCookies();

  // Clear storage
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
    // Clear service workers
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => registration.unregister());
      });
    }
  });

  // Clear network state
  await page.unroute('**/*');
}

/**
 * Reset application state by reloading
 */
export async function hardReset(page: Page, url: string = '/'): Promise<void> {
  await clearAllBrowserData(page);
  await navigateToHome(page);

  if (url !== '/') {
    await page.goto(url, { waitUntil: 'networkidle' });
  }

  await waitForAppReady(page);
}
