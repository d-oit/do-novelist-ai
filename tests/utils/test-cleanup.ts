/**
 * Test Cleanup Utilities
 *
 * Shared utilities for cleaning up test state between tests
 * to prevent overlay blocking and test interference
 */

import type { Page } from '@playwright/test';

/**
 * Dismiss the onboarding modal if present
 * This prevents onboarding from blocking test interactions
 */
export async function dismissOnboardingModal(page: Page): Promise<void> {
  // Set localStorage to skip onboarding
  await page.evaluate(() => {
    try {
      localStorage.setItem('novelist-onboarding-completed', 'true');
      localStorage.removeItem('novelist-onboarding-step');
    } catch {
      // Ignore errors
    }
  });

  // Also try to click the skip button if it's visible
  try {
    const skipButton = page.getByText(/skip onboarding|skip/i).first();
    if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipButton.click();
      await page.waitForTimeout(300);
    }
  } catch {
    // Button might not be visible or already dismissed
  }

  // Wait for modal to close
  try {
    await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 3000 }).catch(() => {
      // Dialog might not have been present
    });
  } catch {
    // Ignore timeout
  }
}

/**
 * Comprehensive test cleanup
 * Removes overlays, closes modals, and resets browser state
 */
export async function cleanupTestEnvironment(page: Page): Promise<void> {
  // Close any open dialogs first
  await page.evaluate(() => {
    document.querySelectorAll('[role="dialog"]').forEach(dialog => {
      if (dialog instanceof HTMLDialogElement) {
        dialog.close();
      }
    });
  });

  // Remove only backdrop overlays (not navigation or app shell)
  await page.evaluate(() => {
    // Remove aria-hidden overlays (modals, backdrops, etc.)
    document.querySelectorAll('[aria-hidden="true"]').forEach(el => {
      if (el instanceof HTMLElement) {
        // Check if it's a backdrop/overlay (not navigation or app shell)
        const classes = el.className || '';
        const isBackdrop =
          classes.includes('backdrop-blur') ||
          classes.includes('bg-black/60') ||
          classes.includes('bg-gray-900') ||
          classes.includes('bg-slate-900') ||
          classes.includes('bg-opacity');

        // Only remove if it looks like an overlay (not app shell)
        if (isBackdrop && !classes.includes('sticky')) {
          el.remove();
        }
      }
    });
  });

  // Clear storage to prevent state leakage
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch {
    // Storage clear might fail in iframes or sandboxed contexts
    // This is acceptable
  }
}

/**
 * Wait for element to be stable and ready for interaction
 * Helps reduce "element not stable" errors
 */
export async function waitForElementStability(
  page: Page,
  selector: string,
  timeout: number = 5000,
): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { state: 'visible', timeout });
    // Additional wait for animations to complete
    await page.waitForTimeout(200);
    return true;
  } catch {
    return false;
  }
}

/**
 * Click an element with stability checks
 * Ensures the element is visible and stable before clicking
 * Automatically converts testid names to data-testid selectors
 */
export async function clickWithStability(
  page: Page,
  selector: string,
  options: { timeout?: number; force?: boolean } = {},
): Promise<void> {
  const { timeout = 15000, force = false } = options;

  // Convert testid to data-testid selector if needed
  const dataTestIdSelector =
    selector.startsWith('[') || selector.startsWith('.') || selector.startsWith('#')
      ? selector
      : `[data-testid="${selector}"]`;

  // Wait for element to be visible
  await page.waitForSelector(dataTestIdSelector, { state: 'visible', timeout });

  // Small delay for animations
  await page.waitForTimeout(100);

  // Click with stability check
  await page.locator(dataTestIdSelector).click({ timeout, force });
}
