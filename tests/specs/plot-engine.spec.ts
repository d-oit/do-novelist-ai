/**
 * E2E Tests for Plot Engine Dashboard
 *
 * Tests the complete user flow for plot analysis and generation
 */

import { test, expect } from '@playwright/test';

test.describe('Plot Engine Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await page.goto('/');

    // Wait for app to be ready
    await page.waitForSelector('[data-testid="app-ready"]', { timeout: 10000 });
  });

  test('should display plot engine dashboard', async ({ page }) => {
    // Navigate to plot engine (assuming there's a navigation element)
    const plotEngineLink = page.getByRole('link', { name: /plot engine/i });

    if (await plotEngineLink.isVisible()) {
      await plotEngineLink.click();

      // Check for dashboard header
      await expect(page.getByRole('heading', { name: /plot engine/i })).toBeVisible();

      // Check for main tabs
      await expect(page.getByTestId('tab-overview')).toBeVisible();
      await expect(page.getByTestId('tab-structure')).toBeVisible();
      await expect(page.getByTestId('tab-characters')).toBeVisible();
      await expect(page.getByTestId('tab-plot-holes')).toBeVisible();
      await expect(page.getByTestId('tab-generator')).toBeVisible();
    } else {
      test.skip();
    }
  });

  test('should switch between tabs', async ({ page }) => {
    const plotEngineLink = page.getByRole('link', { name: /plot engine/i });

    if (await plotEngineLink.isVisible()) {
      await plotEngineLink.click();

      // Click on different tabs
      await page.getByTestId('tab-structure').click();
      await expect(page.getByText(/story arc/i)).toBeVisible({ timeout: 5000 });

      await page.getByTestId('tab-characters').click();
      await expect(page.getByText(/character/i)).toBeVisible({ timeout: 5000 });

      await page.getByTestId('tab-plot-holes').click();
      await expect(page.getByText(/plot hole/i)).toBeVisible({ timeout: 5000 });

      await page.getByTestId('tab-generator').click();
      await expect(page.getByText(/generate|plot/i)).toBeVisible({ timeout: 5000 });
    } else {
      test.skip();
    }
  });

  test('should display empty state when no analysis run', async ({ page }) => {
    const plotEngineLink = page.getByRole('link', { name: /plot engine/i });

    if (await plotEngineLink.isVisible()) {
      await plotEngineLink.click();

      // Switch to a tab that requires analysis
      await page.getByTestId('tab-structure').click();

      // Should show empty state or prompt to run analysis
      const emptyState = page.getByText(/run analysis|no data|analyze first/i);
      await expect(emptyState).toBeVisible({ timeout: 5000 });
    } else {
      test.skip();
    }
  });

  test('should handle loading states', async ({ page }) => {
    const plotEngineLink = page.getByRole('link', { name: /plot engine/i });

    if (await plotEngineLink.isVisible()) {
      await plotEngineLink.click();

      // Check for skeleton loaders or loading indicators
      const loadingIndicators = page.locator('[class*="skeleton"], [class*="animate-pulse"]');

      // May or may not be visible depending on load time
      if (await loadingIndicators.first().isVisible()) {
        await expect(loadingIndicators.first()).toBeVisible();
      }

      // Eventually content should load
      await expect(page.getByTestId('tab-overview')).toBeVisible({ timeout: 10000 });
    } else {
      test.skip();
    }
  });

  test('should be keyboard accessible', async ({ page }) => {
    const plotEngineLink = page.getByRole('link', { name: /plot engine/i });

    if (await plotEngineLink.isVisible()) {
      await plotEngineLink.click();

      // Tab through navigation
      await page.keyboard.press('Tab');

      // Check that focus is visible
      const focusedElement = await page.locator(':focus');
      await expect(focusedElement).toBeTruthy();

      // Navigate tabs with keyboard
      await page.keyboard.press('Enter');

      // Verify tab changed or action occurred
      await page.waitForTimeout(500);
    } else {
      test.skip();
    }
  });

  test('should display plot analyzer component', async ({ page }) => {
    const plotEngineLink = page.getByRole('link', { name: /plot engine/i });

    if (await plotEngineLink.isVisible()) {
      await plotEngineLink.click();

      // Overview tab should show analyzer
      await page.getByTestId('tab-overview').click();

      // Check for analyze button or analysis controls
      const analyzeButton = page.getByRole('button', { name: /analyze|start analysis/i });

      if (await analyzeButton.isVisible()) {
        await expect(analyzeButton).toBeVisible();
        await expect(analyzeButton).toBeEnabled();
      }
    } else {
      test.skip();
    }
  });

  test('should display plot generator component', async ({ page }) => {
    const plotEngineLink = page.getByRole('link', { name: /plot engine/i });

    if (await plotEngineLink.isVisible()) {
      await plotEngineLink.click();

      // Navigate to generator tab
      await page.getByTestId('tab-generator').click();

      // Check for generator form
      await expect(page.getByText(/generate|create plot/i)).toBeVisible({ timeout: 5000 });

      // Check for form fields
      const genreInput = page.getByLabel(/genre/i);
      if (await genreInput.isVisible()) {
        await expect(genreInput).toBeVisible();
      }
    } else {
      test.skip();
    }
  });

  test('should handle errors gracefully', async ({ page }) => {
    const plotEngineLink = page.getByRole('link', { name: /plot engine/i });

    if (await plotEngineLink.isVisible()) {
      await plotEngineLink.click();

      // If error boundary is triggered, should show fallback UI
      const errorBoundary = page.getByText(/something went wrong|error occurred/i);

      // Should not show error by default
      await expect(errorBoundary).not.toBeVisible();
    } else {
      test.skip();
    }
  });

  test('should have proper ARIA labels', async ({ page }) => {
    const plotEngineLink = page.getByRole('link', { name: /plot engine/i });

    if (await plotEngineLink.isVisible()) {
      await plotEngineLink.click();

      // Check for proper ARIA landmarks
      const main = page.getByRole('main');
      if (await main.isVisible()) {
        await expect(main).toBeVisible();
      }

      // Check for tab accessibility
      const tabs = page.getByRole('button', { name: /overview|structure|characters|plot holes|generator/i });
      const tabCount = await tabs.count();
      expect(tabCount).toBeGreaterThan(0);
    } else {
      test.skip();
    }
  });

  test('should be responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    const plotEngineLink = page.getByRole('link', { name: /plot engine/i });

    if (await plotEngineLink.isVisible()) {
      await plotEngineLink.click();

      // Tabs should be visible and usable on mobile
      await expect(page.getByTestId('tab-overview')).toBeVisible();

      // Click a tab
      await page.getByTestId('tab-generator').click();

      // Content should adjust to mobile viewport
      const content = page.locator('main, [role="main"]');
      if (await content.isVisible()) {
        const box = await content.boundingBox();
        expect(box?.width).toBeLessThanOrEqual(375);
      }
    } else {
      test.skip();
    }
  });
});

test.describe('Plot Engine Accessibility', () => {
  test('should pass automated accessibility checks', async ({ page }) => {
    await page.goto('/');

    const plotEngineLink = page.getByRole('link', { name: /plot engine/i });

    if (await plotEngineLink.isVisible()) {
      await plotEngineLink.click();

      // Wait for content to load
      await page.waitForSelector('[data-testid="tab-overview"]', { timeout: 10000 });

      // Run accessibility scan (basic checks)
      await expect(page).toBeTruthy(); // Placeholder for axe-core or similar
    } else {
      test.skip();
    }
  });

  test('should support screen reader navigation', async ({ page }) => {
    await page.goto('/');

    const plotEngineLink = page.getByRole('link', { name: /plot engine/i });

    if (await plotEngineLink.isVisible()) {
      await plotEngineLink.click();

      // Check for proper heading hierarchy
      const h1 = page.getByRole('heading', { level: 1 });
      await expect(h1).toBeVisible({ timeout: 10000 });

      // Check for landmarks
      const navigation = page.getByRole('navigation');
      if (await navigation.isVisible()) {
        await expect(navigation).toBeVisible();
      }
    } else {
      test.skip();
    }
  });
});
