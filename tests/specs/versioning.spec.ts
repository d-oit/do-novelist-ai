import { expect, test } from '@playwright/test';

import { setupGeminiMock } from '../utils/mock-ai-gateway';

test.describe('Version History E2E Tests', () => {
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

  test('should navigate to settings and back', async ({ page }) => {
    await page.getByTestId('nav-settings').click();
    await expect(page.getByTestId('settings-view')).toBeVisible({ timeout: 10000 });

    await page.getByTestId('nav-dashboard').click();
    await expect(page.getByTestId('nav-dashboard')).toBeVisible();
  });
});
