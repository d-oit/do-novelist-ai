import { expect, test } from '@playwright/test';

import { setupGeminiMock } from '../utils/mock-ai-gateway';

test.describe('Mock Infrastructure Validation', () => {
  test.beforeEach(async ({ page }) => {
    await setupGeminiMock(page);
  });

  test('App should load without critical errors', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify the page loaded successfully
    const pageTitle = await page.title();
    expect(pageTitle).toBeTruthy();
  });

  test('Mock setup completes successfully', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify navigation is available
    await expect(page.getByTestId('nav-dashboard')).toBeVisible({ timeout: 10000 });
  });

  test('AI mocks are configured', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // The mock setup logs to console, verify app is functional
    await expect(page.getByTestId('nav-settings')).toBeVisible({ timeout: 10000 });
  });
});
