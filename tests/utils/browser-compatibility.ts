/**
 * Browser Compatibility Utilities for Cross-Browser E2E Testing
 *
 * Provides consistent testing patterns across Chromium, Firefox, and WebKit
 * with optimized waiting strategies and browser-specific optimizations.
 */

import { expect, type Page } from '@playwright/test';

/**
 * Browser detection and compatibility helpers
 */
export class BrowserCompatibility {
  private browserName: string;
  private browserVersion: string;

  constructor(page: Page) {
    this.browserName = page.context().browser()?.browserType().name() || 'unknown';
    this.browserVersion = page.context().browser()?.version() || 'unknown';
  }

  /**
   * Get browser-specific timeout adjustments
   */
  getTimeoutMultiplier(): number {
    switch (this.browserName.toLowerCase()) {
      case 'firefox':
        return 1.5; // Firefox typically needs more time
      case 'webkit':
        return 1.3; // WebKit needs moderate additional time
      case 'chromium':
      default:
        return 1.0; // Chromium is baseline
    }
  }

  /**
   * Get browser-specific retry strategies
   */
  getRetryConfig() {
    switch (this.browserName.toLowerCase()) {
      case 'firefox':
        return { retries: 2, timeout: 15000 };
      case 'webkit':
        return { retries: 2, timeout: 12000 };
      case 'chromium':
      default:
        return { retries: 1, timeout: 10000 };
    }
  }

  /**
   * Browser-specific waiting strategies
   */
  async enhancedWaitForElement(
    page: Page,
    selector: string,
    options?: { timeout?: number; state?: 'visible' | 'attached' | 'detached' | 'hidden' },
  ): Promise<void> {
    const baseTimeout = options?.timeout || 10000;
    const adjustedTimeout = Math.floor(baseTimeout * this.getTimeoutMultiplier());
    const state = options?.state || 'visible';

    try {
      await page.waitForSelector(selector, { timeout: adjustedTimeout, state });
    } catch (error) {
      // For Firefox and WebKit, try alternative waiting strategies
      if (this.browserName.toLowerCase() !== 'chromium') {
        await page.waitForLoadState('domcontentloaded');
        await page.waitForSelector(selector, { timeout: Math.floor(adjustedTimeout / 2), state });
      } else {
        throw error;
      }
    }
  }

  /**
   * Cross-browser compatible click with multiple strategies
   */
  async safeClick(
    page: Page,
    selector: string,
    options?: { timeout?: number; force?: boolean },
  ): Promise<void> {
    const timeout = options?.timeout || 10000;
    const adjustedTimeout = Math.floor(timeout * this.getTimeoutMultiplier());

    try {
      // Standard click
      await page.click(selector, { timeout: adjustedTimeout, force: options?.force });
    } catch {
      // Fallback strategies for different browsers
      const element = page.locator(selector);

      try {
        // Wait for element to be stable
        await element.waitFor({ state: 'visible', timeout: adjustedTimeout });
        await element.scrollIntoViewIfNeeded();
        await element.click({ timeout: adjustedTimeout / 2 });
      } catch {
        // Last resort: force click
        await element.click({ force: true, timeout: adjustedTimeout / 4 });
      }
    }
  }

  /**
   * Browser-specific form interaction helpers
   */
  async fillFormField(
    page: Page,
    selector: string,
    value: string,
    options?: { timeout?: number },
  ): Promise<void> {
    const timeout = options?.timeout || 10000;
    Math.floor(timeout * this.getTimeoutMultiplier()); // Used for timeout calculation

    const field = page.locator(selector);

    // Clear field first (browser-specific)
    if (this.browserName.toLowerCase() === 'firefox') {
      await field.click();
      await page.keyboard.press('Control+a');
      await field.fill(value);
    } else {
      await field.fill(value);
    }
  }

  /**
   * Cross-browser navigation with enhanced reliability
   */
  async safeNavigate(
    page: Page,
    url: string,
    options?: { timeout?: number; waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' },
  ): Promise<void> {
    const timeout = options?.timeout || 30000;
    const adjustedTimeout = Math.floor(timeout * this.getTimeoutMultiplier());
    const waitUntil = options?.waitUntil || 'networkidle';

    try {
      await page.goto(url, {
        timeout: adjustedTimeout,
        waitUntil,
      });
    } catch (error) {
      // Retry with domcontentloaded for problematic browsers
      if (this.browserName.toLowerCase() !== 'chromium') {
        await page.goto(url, {
          timeout: Math.floor(adjustedTimeout * 0.8),
          waitUntil: 'domcontentloaded',
        });
      } else {
        throw error;
      }
    }

    // Wait for page stability
    await this.waitForPageStability(page);
  }

  /**
   * Wait for page to be stable across browsers
   */
  async waitForPageStability(page: Page): Promise<void> {
    // Basic DOM readiness
    await page.waitForLoadState('domcontentloaded');

    // Browser-specific stability checks
    switch (this.browserName.toLowerCase()) {
      case 'firefox':
        // Firefox needs additional time for CSS and JS
        await page.waitForTimeout(500);
        break;
      case 'webkit':
        // WebKit may need time for webkit-specific rendering
        await page.waitForTimeout(300);
        break;
      default:
        // Chromium is usually ready faster
        break;
    }

    // Wait for key app elements
    await Promise.race([
      page.waitForSelector('[data-testid], nav, main', { timeout: 5000 }),
      page.waitForTimeout(2000), // Fallback timeout
    ]);
  }

  /**
   * Get browser information for logging
   */
  getBrowserInfo(): { name: string; version: string; timeoutMultiplier: number } {
    return {
      name: this.browserName,
      version: this.browserVersion,
      timeoutMultiplier: this.getTimeoutMultiplier(),
    };
  }
}

/**
 * Cross-browser compatible test setup helper
 */
export async function setupCrossBrowserTest(page: Page): Promise<BrowserCompatibility> {
  const compatibility = new BrowserCompatibility(page);

  // Browser-specific setup
  switch (compatibility.getBrowserInfo().name.toLowerCase()) {
    case 'firefox':
      // Firefox-specific optimizations
      await page.context().addInitScript(() => {
        // Disable Firefox-specific features that might interfere
        (window as any).browserName = 'firefox';
      });
      break;
    case 'webkit':
      // WebKit-specific optimizations
      await page.context().addInitScript(() => {
        // WebKit-specific setup
        (window as any).browserName = 'webkit';
      });
      break;
    default:
      // Chromium setup
      await page.context().addInitScript(() => {
        (window as any).browserName = 'chromium';
      });
  }

  return compatibility;
}

/**
 * Cross-browser compatible navigation helpers
 */
export const CrossBrowserNavigation = {
  /**
   * Navigate with multiple fallback strategies
   */
  navigateWithFallback: async (
    page: Page,
    selectors: Array<() => any>,
    options?: { timeout?: number },
  ): Promise<boolean> => {
    const timeout = options?.timeout || 10000;

    for (const selector of selectors) {
      try {
        const element = selector();
        await (element as any).waitFor({ state: 'visible', timeout: timeout / selectors.length });
        await (element as any).click();
        return true;
      } catch {
        continue;
      }
    }
    return false;
  },

  /**
   * Enhanced navigation with browser compatibility
   */
  navigateSafely: async (
    page: Page,
    compatibility: BrowserCompatibility,
    url: string,
  ): Promise<void> => {
    await compatibility.safeNavigate(page, url);
  },
};

/**
 * Cross-browser compatible assertion helpers
 */
export const CrossBrowserAssertions = {
  /**
   * Wait for element with browser-specific timeouts
   */
  async waitForElementCompat(
    page: Page,
    compatibility: BrowserCompatibility,
    selector: string,
    options?: { timeout?: number; state?: 'visible' | 'attached' | 'detached' | 'hidden' },
  ): Promise<void> {
    await compatibility.enhancedWaitForElement(page, selector, options);
  },

  /**
   * Browser-aware expect with enhanced error messages
   */
  createCompatExpect(page: Page, compatibility: BrowserCompatibility) {
    // const browserInfo = compatibility.getBrowserInfo();

    return {
      element: (selector: string) => ({
        toBeVisible: async (options?: { timeout?: number }) => {
          const timeout = options?.timeout || 10000;
          await compatibility.enhancedWaitForElement(page, selector, {
            timeout,
            state: 'visible',
          });
        },

        toHaveText: async (text: string, options?: { timeout?: number }) => {
          const timeout = options?.timeout || 10000;
          const adjustedTimeout = Math.floor(timeout * compatibility.getTimeoutMultiplier());
          const element = page.locator(selector);
          await element.waitFor({ state: 'visible', timeout: adjustedTimeout });
          await expect(element).toHaveText(text);
        },
      }),
    };
  },
};

export default BrowserCompatibility;
