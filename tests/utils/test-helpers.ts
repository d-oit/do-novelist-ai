import { expect, Page } from '@playwright/test';

/**
 * Wait for the application to be fully loaded and ready for interaction.
 * Uses proper Playwright wait strategies instead of arbitrary timeouts.
 */
export async function waitForAppReady(page: Page): Promise<void> {
  // Wait for network to settle
  await page.waitForLoadState('networkidle');

  // Wait for the main navigation to be visible and interactive
  await expect(page.getByTestId('nav-dashboard')).toBeVisible();
}

/**
 * Navigate to settings and wait for it to be fully loaded.
 */
export async function navigateToSettings(page: Page): Promise<void> {
  await page.getByTestId('nav-settings').click();
  await expect(page.getByTestId('settings-view')).toBeVisible();
}

/**
 * Navigate to dashboard and wait for it to be ready.
 */
export async function navigateToDashboard(page: Page): Promise<void> {
  await page.getByTestId('nav-dashboard').click();
  await expect(page.getByTestId('nav-dashboard')).toBeVisible();
}

/**
 * Wait for an element to be visible with auto-waiting (Playwright's default behavior).
 * This is a convenience wrapper that makes intent clear.
 */
export async function waitForElement(page: Page, testId: string): Promise<boolean> {
  try {
    await expect(page.getByTestId(testId)).toBeVisible();
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if an element exists and is visible without throwing.
 * Uses Playwright's built-in polling instead of explicit timeouts.
 */
export async function isElementVisible(page: Page, selector: string): Promise<boolean> {
  const element = page.locator(selector);
  try {
    await expect(element.first()).toBeVisible({ timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Wait for navigation to complete after clicking a link or button.
 */
export async function waitForNavigation(page: Page): Promise<void> {
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Wait for dynamic content to appear using role-based selectors.
 */
export async function waitForRole(
  page: Page,
  role: 'button' | 'dialog' | 'heading' | 'link' | 'menu' | 'textbox',
  name?: string,
): Promise<boolean> {
  try {
    const locator = name ? page.getByRole(role, { name }) : page.getByRole(role).first();
    await expect(locator).toBeVisible();
    return true;
  } catch {
    return false;
  }
}
