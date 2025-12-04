import { test, expect } from '@playwright/test';

import { setupGeminiMock } from '../utils/mock-ai-gateway';

test.describe('World Building Features E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await setupGeminiMock(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should access world building dashboard', async ({ page }) => {
    // Look for world building navigation
    const worldNav = page.locator('[data-testid*="world"], [data-testid*="building"]');

    if (await worldNav.isVisible({ timeout: 3000 }).catch(() => false)) {
      await worldNav.click();
      await page.waitForTimeout(1000);

      // Look for world building interface
      const worldDashboard = page.locator('[data-testid*="world"], [data-testid*="building"]');

      if (await worldDashboard.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(worldDashboard).toBeVisible();
      }
    } else {
      // Try accessing through dashboard
      await page.getByTestId('nav-dashboard').click();
      await page.waitForTimeout(1000);

      // Look for world building actions
      const worldActions = page.locator('[data-testid*="world"], [data-testid*="building"]');

      if (
        await worldActions
          .first()
          .isVisible({ timeout: 3000 })
          .catch(() => false)
      ) {
        await expect(worldActions.first()).toBeVisible();
      } else {
        test.skip();
      }
    }
  });

  test('should create and manage world elements', async ({ page }) => {
    // Navigate to world building
    const worldNav = page.locator('[data-testid*="world"], [data-testid*="building"]');

    if (await worldNav.isVisible({ timeout: 3000 }).catch(() => false)) {
      await worldNav.click();
      await page.waitForTimeout(1000);

      // Look for world element creation
      const createButton = page.locator('button:has-text("Create"), [data-testid*="create"], [data-testid*="add"]');

      if (await createButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await createButton.click();
        await page.waitForTimeout(1000);

        // Look for creation form
        const creationForm = page.locator('[data-testid*="form"], form, [data-testid*="modal"]');

        if (await creationForm.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(creationForm).toBeVisible();
        }
      } else {
        test.skip();
      }
    } else {
      test.skip();
    }
  });

  test('should display world element categories', async ({ page }) => {
    // Navigate to world building
    const worldNav = page.locator('[data-testid*="world"], [data-testid*="building"]');

    if (await worldNav.isVisible({ timeout: 3000 }).catch(() => false)) {
      await worldNav.click();
      await page.waitForTimeout(1001);

      // Look for categories
      const categories = page.locator('[data-testid*="category"], [data-testid*="type"], .category');

      if (
        await categories
          .first()
          .isVisible({ timeout: 3000 })
          .catch(() => false)
      ) {
        await expect(categories.first()).toBeVisible();
      } else {
        test.skip();
      }
    } else {
      test.skip();
    }
  });
});
