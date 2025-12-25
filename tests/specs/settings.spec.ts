import { expect, test } from '@playwright/test';

import { setupGeminiMock } from '../utils/mock-openrouter';

test.describe('Settings Panel E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await setupGeminiMock(page);

    // Navigate and wait for app to be ready
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for navigation to be ready
    await expect(page.getByRole('navigation')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('nav-dashboard')).toBeVisible({ timeout: 10000 });
  });

  test('should access settings view', async ({ page }) => {
    // Direct navigation test with fallback strategies
    const strategies = [
      () => page.getByTestId('nav-settings'),
      () => page.getByRole('button', { name: /settings/i }),
      () => page.getByText('Settings'),
    ];

    let settingsButton = null;
    for (const strategy of strategies) {
      try {
        settingsButton = strategy();
        await settingsButton.click({ timeout: 3000 });
        break;
      } catch {
        continue;
      }
    }

    if (!settingsButton) {
      // Try alternative approach - look for Settings button in header
      const headerSettingsButton = page.locator('header').getByText('Settings');
      if (await headerSettingsButton.isVisible()) {
        await headerSettingsButton.click();
      } else {
        throw new Error('Settings navigation button not found');
      }
    }

    // Wait for navigation and settings view to appear
    await page.waitForTimeout(2000);
    await expect(page.getByTestId('settings-view')).toBeVisible({ timeout: 15000 });

    // Verify main heading is present
    await expect(page.getByRole('heading', { name: 'Settings', exact: true }).first()).toBeVisible();
  });

  test('should display database persistence section', async ({ page }) => {
    await page.getByTestId('nav-settings').click();
    await expect(page.getByTestId('settings-view')).toBeVisible({ timeout: 10000 });

    // Check for Database Persistence section
    await expect(page.getByText('Database Persistence')).toBeVisible();

    // Check for storage strategy options
    await expect(page.getByRole('button', { name: 'Local (Browser)' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Turso Cloud' })).toBeVisible();
  });

  test('should toggle between local and cloud storage', async ({ page }) => {
    await page.getByTestId('nav-settings').click();
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
    await page.getByTestId('nav-settings').click();
    await expect(page.getByTestId('settings-view')).toBeVisible({ timeout: 10000 });

    // Check for Appearance section
    await expect(page.getByText('Appearance')).toBeVisible();

    // Check for theme buttons
    await expect(page.getByRole('button', { name: 'Light' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Dark' })).toBeVisible();
  });

  test('should toggle between light and dark theme', async ({ page }) => {
    await page.getByTestId('nav-settings').click();
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
    await page.getByTestId('nav-settings').click();
    await expect(page.getByTestId('settings-view')).toBeVisible({ timeout: 10000 });

    // Check for AI Provider Settings section (use first() since there are two matching elements)
    await expect(page.getByText('AI Provider Settings').first()).toBeVisible();
  });

  test('should display Writing Gamification section', async ({ page }) => {
    await page.getByTestId('nav-settings').click();
    await expect(page.getByTestId('settings-view')).toBeVisible({ timeout: 10000 });

    // Check for Gamification section
    await expect(page.getByText('Writing Gamification')).toBeVisible();
  });

  test('should display Google GenAI Configuration section', async ({ page }) => {
    await page.getByTestId('nav-settings').click();
    await expect(page.getByTestId('settings-view')).toBeVisible({ timeout: 10000 });

    // Check for API configuration section
    await expect(page.getByText('Google GenAI Configuration')).toBeVisible();
    await expect(page.getByText('API Key Active')).toBeVisible();
  });

  test('should save database configuration', async ({ page }) => {
    await page.getByTestId('nav-settings').click();
    await expect(page.getByTestId('settings-view')).toBeVisible({ timeout: 10000 });

    // Click Save Configuration button (for local mode)
    const saveButton = page.getByRole('button', { name: /Save Configuration/i });
    await expect(saveButton).toBeVisible();
    await saveButton.click();

    // Should show "Saved!" confirmation
    await expect(page.getByRole('button', { name: /Saved!/i })).toBeVisible({ timeout: 5000 });
  });

  test('should navigate away and back to settings', async ({ page }) => {
    await page.getByTestId('nav-settings').click();
    await expect(page.getByTestId('settings-view')).toBeVisible({ timeout: 10000 });

    // Navigate to dashboard
    await page.getByTestId('nav-dashboard').click();

    // Wait for navigation (dashboard may show wizard or project list, not project-dashboard specifically)
    await expect(page.getByTestId('nav-dashboard')).toBeVisible({ timeout: 10000 });

    // Navigate back to settings
    await page.getByTestId('nav-settings').click();
    await expect(page.getByTestId('settings-view')).toBeVisible({ timeout: 10000 });

    // Settings should still show all sections
    await expect(page.getByText('Database Persistence')).toBeVisible();
    await expect(page.getByText('Appearance')).toBeVisible();
  });
});
