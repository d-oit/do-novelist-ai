import { expect, test } from '@playwright/test';

import { setupGeminiMock } from '../utils/mock-ai-gateway';

test.describe('World Building E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await setupGeminiMock(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Use role-based waiting instead of hardcoded timeout
    await expect(page.getByRole('navigation')).toBeVisible();
    await expect(page.getByTestId('nav-dashboard')).toBeVisible();
  });

  test('should access dashboard', async ({ page }) => {
    await page.getByTestId('nav-dashboard').click();
    await expect(page.getByTestId('nav-dashboard')).toBeVisible();
  });

  test('should have functional navigation', async ({ page }) => {
    // Dashboard
    await page.getByTestId('nav-dashboard').click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByTestId('nav-dashboard')).toBeVisible();

    // Settings using role-based selector
    await page.getByRole('button', { name: /settings/i }).click();
    await expect(page.getByTestId('settings-view')).toBeVisible();
  });
});
