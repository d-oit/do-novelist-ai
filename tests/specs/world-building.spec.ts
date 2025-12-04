import { expect, test } from '@playwright/test';

import { setupGeminiMock } from '../utils/mock-ai-gateway';

test.describe('World Building E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await setupGeminiMock(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('nav-dashboard')).toBeVisible({ timeout: 10000 });
  });

  test('should access dashboard', async ({ page }) => {
    await page.getByTestId('nav-dashboard').click();
    await expect(page.getByTestId('nav-dashboard')).toBeVisible();
  });

  test('should have functional navigation', async ({ page }) => {
    // Dashboard
    await page.getByTestId('nav-dashboard').click();
    await expect(page.getByTestId('nav-dashboard')).toBeVisible();

    // Settings
    await page.getByTestId('nav-settings').click();
    await expect(page.getByTestId('settings-view')).toBeVisible({ timeout: 10000 });
  });
});
