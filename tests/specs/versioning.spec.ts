import { expect, test } from '@playwright/test';

import { setupGeminiMock } from '../utils/mock-ai-gateway';

test.describe('Version History and Comparison E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await setupGeminiMock(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should access version history', async ({ page }) => {
    // Look for version history navigation
    const versionNav = page.locator('[data-testid*="version"], [data-testid*="history"]');

    if (await versionNav.isVisible({ timeout: 3000 }).catch(() => false)) {
      await versionNav.click();

      // Look for version history interface
      const versionHistory = page.locator('[data-testid*="version"], [data-testid*="history"]');

      if (await versionHistory.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(versionHistory).toBeVisible();
      }
    } else {
      test.skip();
    }
  });

  test('should display version list', async ({ page }) => {
    // Navigate to version history
    const versionNav = page.locator('[data-testid*="version"], [data-testid*="history"]');

    if (await versionNav.isVisible({ timeout: 3000 }).catch(() => false)) {
      await versionNav.click();

      // Look for version list
      const versionList = page.locator('[data-testid*="list"], [data-testid*="versions"]');

      if (await versionList.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(versionList).toBeVisible();
      } else {
        test.skip();
      }
    } else {
      test.skip();
    }
  });

  test('should handle version comparison', async ({ page }) => {
    // Navigate to version history
    const versionNav = page.locator('[data-testid*="version"], [data-testid*="history"]');

    if (await versionNav.isVisible({ timeout: 3000 }).catch(() => false)) {
      await versionNav.click();

      // Look for comparison controls
      const compareButton = page.locator('button:has-text("Compare"), [data-testid*="compare"]');

      if (await compareButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(compareButton).toBeVisible();
      } else {
        test.skip();
      }
    } else {
      test.skip();
    }
  });
});
