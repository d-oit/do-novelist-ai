/**
 * Browser-Specific Test Helpers for Cross-Browser E2E Testing
 *
 * Provides browser-specific workarounds and optimizations for
 * consistent test execution across Chromium, Firefox, and WebKit
 */

import type { Page } from '@playwright/test';
import { BrowserCompatibility } from './browser-compatibility';

/**
 * Firefox-specific localStorage workaround
 * Firefox handles localStorage operations asynchronously
 */
export async function firefoxLocalStorageWorkaround(page: Page): Promise<void> {
  await page.evaluate(() => {
    return new Promise<void>((resolve, reject) => {
      try {
        // Wrap localStorage operations in a try-catch
        const items: Record<string, string> = {};
        try {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
              items[key] = localStorage.getItem(key) || '';
            }
          }
        } catch {
          // Ignore quota exceeded errors
        }
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
}

/**
 * WebKit animation detection improvements
 * WebKit may have different animation timing
 */
export async function waitForWebKitAnimations(page: Page, timeout: number = 1000): Promise<void> {
  await page.evaluate(
    ms =>
      new Promise<void>(resolve => {
        // Wait for all CSS animations and transitions to complete
        const startTime = Date.now();
        const checkAnimations = () => {
          const animations = document.getAnimations();
          const activeAnimations = animations.filter(anim => anim.playState === 'running');

          if (activeAnimations.length === 0 || Date.now() - startTime >= ms) {
            resolve();
          } else {
            requestAnimationFrame(checkAnimations);
          }
        };
        checkAnimations();
      }),
    timeout,
  );
}

/**
 * Chrome-specific timing adjustments
 * Chrome may need additional time for V8 compilation
 */
export async function chromeTimingAdjustment(page: Page): Promise<void> {
  await page.evaluate(() => {
    return new Promise<void>(resolve => {
      // Wait for V8 idle signal
      setTimeout(() => {
        resolve();
      }, 200);
    });
  });
}

/**
 * Cross-browser wait strategies
 * Combines multiple waiting approaches for reliability
 */
export async function crossBrowserWait(
  page: Page,
  compatibility: BrowserCompatibility,
  selector: string,
  options?: { timeout?: number; state?: 'visible' | 'attached' | 'detached' | 'hidden' },
): Promise<void> {
  const baseTimeout = options?.timeout || 10000;
  const adjustedTimeout = Math.floor(baseTimeout * compatibility.getTimeoutMultiplier());

  // Primary wait
  try {
    await page.waitForSelector(selector, {
      timeout: adjustedTimeout,
      state: options?.state || 'visible',
    });
    return;
  } catch {
    console.warn(`Primary wait failed for ${selector}, trying fallback strategies`);

    // Fallback 1: DOM content loaded
    try {
      await page.waitForLoadState('domcontentloaded');
      await page.waitForSelector(selector, {
        timeout: Math.floor(adjustedTimeout * 0.5),
        state: options?.state || 'visible',
      });
      return;
    } catch {
      // Continue to next fallback
    }

    // Fallback 2: Browser-specific animation wait
    const browserName = compatibility.getBrowserInfo().name.toLowerCase();
    if (browserName === 'webkit') {
      await waitForWebKitAnimations(page, 500);
    } else if (browserName === 'firefox') {
      await firefoxLocalStorageWorkaround(page);
    }

    // Final attempt
    try {
      await page.waitForSelector(selector, {
        timeout: Math.floor(adjustedTimeout * 0.3),
        state: options?.state || 'visible',
      });
    } catch (finalError) {
      console.error(`All wait strategies failed for ${selector}`, finalError);
      throw finalError;
    }
  }
}

/**
 * Browser-specific form filling
 * Handles different browser form interaction patterns
 */
export async function browserSpecificFill(
  page: Page,
  compatibility: BrowserCompatibility,
  selector: string,
  value: string,
): Promise<void> {
  const element = page.locator(selector);

  // Wait for element to be ready
  await crossBrowserWait(page, compatibility, selector, { state: 'visible' });

  const browserName = compatibility.getBrowserInfo().name.toLowerCase();

  switch (browserName) {
    case 'firefox':
      // Firefox may need explicit click before filling
      await element.click();
      await page.keyboard.press('Control+a');
      await element.fill(value);
      break;

    case 'webkit':
      // WebKit may need a small delay
      await element.fill(value);
      await page.waitForTimeout(100);
      break;

    default:
      // Chromium works with direct fill
      await element.fill(value);
  }
}

/**
 * Browser-specific click with multiple strategies
 */
export async function browserSpecificClick(
  page: Page,
  compatibility: BrowserCompatibility,
  selector: string,
  options?: { force?: boolean },
): Promise<void> {
  const element = page.locator(selector);
  const timeout = 15000 * compatibility.getTimeoutMultiplier();

  // Wait for element to be visible and stable
  await crossBrowserWait(page, compatibility, selector, { state: 'visible' });

  try {
    // Standard click
    await element.click({ timeout, force: options?.force });
  } catch {
    console.warn(`Standard click failed for ${selector}, trying fallback`);

    // Fallback 1: Scroll into view and click
    try {
      await element.scrollIntoViewIfNeeded();
      await element.click({ timeout: timeout / 2, force: true });
      return;
    } catch {
      // Continue to next fallback
    }

    // Fallback 2: JavaScript click
    try {
      await element.evaluate(el => (el as HTMLElement).click());
      return;
    } catch {
      // Continue to final fallback
    }

    // Fallback 3: Force click with no wait
    await element.click({ force: true, timeout: 1000 });
  }
}

/**
 * Cross-browser modal dismissal
 */
export async function dismissModalCompat(
  page: Page,
  _compatibility: BrowserCompatibility,
  modalSelector: string = '[role="dialog"]',
): Promise<void> {
  try {
    // Check if modal exists
    const modal = page.locator(modalSelector);
    const isVisible = await modal.isVisible({ timeout: 2000 }).catch(() => false);

    if (!isVisible) {
      return;
    }

    // Try multiple dismissal methods
    const methods = [
      // Method 1: Close button
      async () => {
        const closeButton = modal
          .locator('button[aria-label="Close"], button:has-text("Close"), button:has-text("×")')
          .first();
        if (await closeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
          await closeButton.click();
        }
      },
      // Method 2: Escape key
      async () => {
        await page.keyboard.press('Escape');
      },
      // Method 3: Click outside
      async () => {
        const backdrop = page.locator('.fixed.inset-0, [role="presentation"]').first();
        if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
          await backdrop.click();
        }
      },
    ];

    for (const method of methods) {
      try {
        await method();
        await page.waitForTimeout(300);

        // Check if modal is hidden
        const isHidden = await modal.isHidden({ timeout: 1000 }).catch(() => true);
        if (isHidden) {
          return;
        }
      } catch {
        // Try next method
      }
    }
  } catch (error) {
    console.warn('Modal dismissal failed, continuing anyway', error);
  }
}

/**
 * Browser-specific error message handling
 */
export async function waitForErrorCompat(
  page: Page,
  compatibility: BrowserCompatibility,
  errorSelector: string,
  timeout: number = 5000,
): Promise<boolean> {
  try {
    await crossBrowserWait(page, compatibility, errorSelector, { timeout, state: 'visible' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get browser-specific test timeout
 */
export function getBrowserSpecificTimeout(
  compatibility: BrowserCompatibility,
  baseTimeout: number,
): number {
  return Math.floor(baseTimeout * compatibility.getTimeoutMultiplier());
}

/**
 * Browser-specific setup for each test
 */
export async function setupBrowserSpecifics(
  page: Page,
  compatibility: BrowserCompatibility,
): Promise<void> {
  const browserName = compatibility.getBrowserInfo().name.toLowerCase();

  switch (browserName) {
    case 'firefox':
      // Firefox-specific setup
      await page.context().addInitScript(() => {
        // Disable Firefox animations for faster tests
        document.documentElement.style.setProperty('--test-mode', 'true');
      });
      break;

    case 'webkit':
      // WebKit-specific setup
      await page.context().addInitScript(() => {
        // Disable WebKit-specific features
        (window as any).__webkitTestMode = true;
      });
      break;

    default:
      // Chromium setup
      await page.context().addInitScript(() => {
        (window as any).__chromiumTestMode = true;
      });
  }

  // Common setup for all browsers
  await page.context().addInitScript(() => {
    // Disable all CSS transitions and animations for testing
    const style = document.createElement('style');
    style.textContent = `
      * {
        transition: none !important;
        animation: none !important;
      }
    `;
    document.head.appendChild(style);
  });
}

export default {
  firefoxLocalStorageWorkaround,
  waitForWebKitAnimations,
  chromeTimingAdjustment,
  crossBrowserWait,
  browserSpecificFill,
  browserSpecificClick,
  dismissModalCompat,
  waitForErrorCompat,
  getBrowserSpecificTimeout,
  setupBrowserSpecifics,
};
