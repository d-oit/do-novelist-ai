import { expect, test } from '@playwright/test';

import { setupGeminiMock } from '../utils/mock-openrouter';

/**
 * Helper function to find and click the settings button
 * Tries multiple strategies for maximum reliability
 */
async function navigateToSettings(page: import('@playwright/test').Page): Promise<void> {
  const errors: string[] = [];

  // Strategy 1: Dashboard settings icon (only visible when dashboard view is active)
  try {
    const settingsIcon = page.getByTestId('dashboard-settings-icon');
    await settingsIcon.waitFor({ state: 'visible', timeout: 5000 });
    await settingsIcon.click();
    return;
  } catch {
    errors.push('Dashboard settings icon not visible');
  }

  // Strategy 2: Try BottomNav settings button directly (mobile only, visible by default)
  try {
    const bottomNavSettings = page.locator('nav').getByTestId('nav-settings');
    await bottomNavSettings.waitFor({ state: 'visible', timeout: 2000 });
    await bottomNavSettings.click();
    return;
  } catch {
    errors.push('BottomNav settings button not visible');
  }

  // Strategy 3: Try opening mobile menu and clicking settings link
  try {
    const menuToggle = page.getByTestId('mobile-menu-toggle');
    if (await menuToggle.isVisible({ timeout: 2000 })) {
      await menuToggle.click();
      // Wait for menu to open using smart wait
      await expect(page.locator('div[role="menu"]')).toBeVisible({ timeout: 2000 });

      // Try to find and click settings in mobile menu
      const mobileMenuSettings = page.locator('div[role="menu"]').getByTestId('nav-settings');
      await mobileMenuSettings.waitFor({ state: 'visible', timeout: 2000 });
      await mobileMenuSettings.click();
      return;
    }
  } catch {
    errors.push('Mobile menu strategy failed');
  }

  // Strategy 4: Header settings link (desktop, visible by default)
  try {
    const headerSettings = page.getByTestId('nav-settings').first();
    await headerSettings.waitFor({ state: 'visible', timeout: 2000 });
    await headerSettings.click();
    return;
  } catch {
    errors.push('Header settings link not visible');
  }

  // Strategy 5: Any button with Settings text
  try {
    const settingsButton = page.getByRole('button', { name: /settings/i }).first();
    await settingsButton.waitFor({ state: 'visible', timeout: 2000 });
    await settingsButton.click();
    return;
  } catch {
    errors.push('Settings button by role not found');
  }

  // All strategies failed - provide diagnostic information
  throw new Error(
    `Settings navigation failed. Tried strategies: ${errors.join(', ')}\n` +
      `Viewport: ${page.viewportSize()?.width}x${page.viewportSize()?.height}\n` +
      `Page URL: ${page.url()}\n` +
      `Available nav-settings elements: ${await page.locator('[data-testid*="nav-settings"]').count()}`,
  );
}

test.describe('Settings Panel E2E Tests', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await setupGeminiMock(page);

    // Navigate and wait for app to be ready
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for app to be ready and navigation to be visible
    await expect(page.getByTestId('app-ready')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('nav-dashboard')).toBeVisible({ timeout: 10000 });
  });

  test('should access settings view on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });

    // Wait for viewport to apply using smart wait
    await page.waitForLoadState('domcontentloaded');

    // Navigate to settings
    await navigateToSettings(page);

    // Wait for navigation and settings view to appear
    await expect(page.getByTestId('settings-view')).toBeVisible({ timeout: 15000 });

    // Verify main heading is present
    await expect(page.getByRole('heading', { name: 'Settings', exact: true }).first()).toBeVisible();
  });

  test('should access settings view on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Wait for viewport to apply using smart wait
    await page.waitForLoadState('domcontentloaded');

    // Navigate to settings
    await navigateToSettings(page);

    // Wait for navigation and settings view to appear
    await expect(page.getByTestId('settings-view')).toBeVisible({ timeout: 15000 });

    // Verify main heading is present
    await expect(page.getByRole('heading', { name: 'Settings', exact: true }).first()).toBeVisible();
  });

  test('should display database persistence section', async ({ page }) => {
    await navigateToSettings(page);
    await expect(page.getByTestId('settings-view')).toBeVisible({ timeout: 10000 });

    // Check for Database Persistence section
    await expect(page.getByText('Database Persistence')).toBeVisible();

    // Check for storage strategy options
    await expect(page.getByRole('button', { name: 'Local (Browser)' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Turso Cloud' })).toBeVisible();
  });

  test('should toggle between local and cloud storage', async ({ page }) => {
    await navigateToSettings(page);
    await expect(page.getByTestId('settings-view')).toBeVisible({ timeout: 10000 });

    // Click on Turso Cloud to switch
    await page.getByRole('button', { name: 'Turso Cloud' }).click();

    // Should now show database URL and auth token inputs
    await expect(page.getByLabel(/Database URL/i)).toBeVisible();
    await expect(page.getByLabel(/Auth Token/i)).toBeVisible();

    // Switch back to local
    await page.getByRole('button', { name: 'Local (Browser)' }).click();

    // Cloud inputs should be hidden
    await expect(page.getByLabel(/Database URL/i)).not.toBeVisible();
  });

  test('should display appearance section with theme toggle', async ({ page }) => {
    await navigateToSettings(page);
    await expect(page.getByTestId('settings-view')).toBeVisible({ timeout: 10000 });

    // Check for Appearance section
    await expect(page.getByText('Appearance')).toBeVisible();

    // Check for theme buttons
    await expect(page.getByRole('button', { name: 'Light' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Dark' })).toBeVisible();
  });

  test('should toggle between light and dark theme', async ({ page }) => {
    await navigateToSettings(page);
    await expect(page.getByTestId('settings-view')).toBeVisible({ timeout: 10000 });

    // Click Light theme
    await page.getByRole('button', { name: 'Light' }).click();

    // HTML element should not have 'dark' class
    const htmlElement = page.locator('html');
    await expect(htmlElement).not.toHaveClass(/dark/);

    // Click Dark theme
    await page.getByRole('button', { name: 'Dark' }).click();

    // HTML element should have 'dark' class
    await expect(htmlElement).toHaveClass(/dark/);
  });

  test('should display AI Provider Settings section', async ({ page }) => {
    await navigateToSettings(page);
    await expect(page.getByTestId('settings-view')).toBeVisible({ timeout: 10000 });

    // Check for AI Provider Settings section (use first() since there are two matching elements)
    await expect(page.getByText('AI Provider Settings').first()).toBeVisible();
  });

  test('should display Writing Gamification section', async ({ page }) => {
    await navigateToSettings(page);
    await expect(page.getByTestId('settings-view')).toBeVisible({ timeout: 10000 });

    // Check for Gamification section
    await expect(page.getByText('Writing Gamification')).toBeVisible();
  });

  test('should display Google GenAI Configuration section', async ({ page }) => {
    await navigateToSettings(page);
    await expect(page.getByTestId('settings-view')).toBeVisible({ timeout: 10000 });

    // Check for API configuration section
    await expect(page.getByText('Google GenAI Configuration')).toBeVisible();
    await expect(page.getByText('API Key Active')).toBeVisible();
  });

  test('should save database configuration', async ({ page }) => {
    await navigateToSettings(page);
    await expect(page.getByTestId('settings-view')).toBeVisible({ timeout: 10000 });

    // Click Save Configuration button (for local mode)
    const saveButton = page.getByRole('button', { name: /Save Configuration/i });
    await expect(saveButton).toBeVisible();
    await saveButton.click();

    // Should show "Saved!" confirmation
    await expect(page.getByRole('button', { name: /Saved!/i })).toBeVisible({ timeout: 5000 });
  });

  test('should navigate away and back to settings', async ({ page }) => {
    await navigateToSettings(page);
    await expect(page.getByTestId('settings-view')).toBeVisible({ timeout: 10000 });

    // Navigate to dashboard
    await page.getByTestId('nav-dashboard').click();

    // Wait for navigation (dashboard may show wizard or project list, not project-dashboard specifically)
    await expect(page.getByTestId('nav-dashboard')).toBeVisible({ timeout: 10000 });

    // Navigate back to settings
    await navigateToSettings(page);
    await expect(page.getByTestId('settings-view')).toBeVisible({ timeout: 10000 });

    // Settings should still show all sections
    await expect(page.getByText('Database Persistence')).toBeVisible();
    await expect(page.getByText('Appearance')).toBeVisible();
  });
});
