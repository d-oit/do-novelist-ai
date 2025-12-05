import { test, expect } from '@playwright/test';

test.describe('Infrastructure Validation', () => {
  test('should load page successfully', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await expect(page.locator('h1, title')).toBeVisible();
  });

  test('should have basic navigation', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await expect(page.locator('[data-testid="nav-projects"]')).toBeVisible();
  });
});
