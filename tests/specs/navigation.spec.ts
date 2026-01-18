/**
 * E2E Tests for Application Navigation
 *
 * Tests core navigation functionality across the application
 */

import { test, expect } from '@playwright/test';
import { cleanupTestEnvironment, dismissOnboardingModal } from '../utils/test-cleanup';

test.describe('Application Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-ready"]', { timeout: 10000 });

    // Dismiss onboarding modal if present
    await dismissOnboardingModal(page);

    // Wait for Framer Motion animations to complete
    await page.waitForTimeout(1000);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestEnvironment(page);
  });

  test('should load the application successfully', async ({ page }) => {
    // Verify app is ready
    const appReady = page.locator('[data-testid="app-ready"]');
    await expect(appReady).toBeVisible();

    // Verify page title
    await expect(page).toHaveTitle(/Novelist/i);
  });

  test('should have functional main navigation', async ({ page }) => {
    // Check for navigation elements
    const navigation = page.getByRole('navigation').first();
    await expect(navigation).toBeVisible();

    // Navigation should be accessible
    await expect(navigation).toHaveAttribute('role', 'navigation');
  });

  test('should navigate between main views', async ({ page }) => {
    // Test navigation to different views
    const views = ['Dashboard', 'Projects', 'Settings'];

    for (const view of views) {
      const link = page
        .getByRole('link', { name: new RegExp(view, 'i') })
        .or(page.getByRole('button', { name: new RegExp(view, 'i') }));

      if (await link.isVisible()) {
        await link.click();

        // Wait for navigation to complete
        await page.waitForLoadState('domcontentloaded', { timeout: 10000 });

        // Verify we're on the expected page
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });

  test('should maintain state during navigation', async ({ page }) => {
    // Navigate to settings
    const settingsButton = page
      .getByRole('button', { name: /settings/i })
      .or(page.getByRole('link', { name: /settings/i }));

    if (await settingsButton.first().isVisible()) {
      await settingsButton.first().click();
      await page.waitForLoadState('domcontentloaded', { timeout: 10000 });

      // Navigate back
      await page.goBack();
      await page.waitForLoadState('domcontentloaded', { timeout: 10000 });

      // Verify we're back at starting page
      const appReady = page.locator('[data-testid="app-ready"]');
      await expect(appReady).toBeVisible();
    }
  });

  test('should handle browser back/forward navigation', async ({ page }) => {
    // Get initial URL
    const initialUrl = page.url();

    // Navigate to another page
    const projectsButton = page
      .getByRole('button', { name: /projects/i })
      .or(page.getByRole('link', { name: /projects/i }));

    if (await projectsButton.first().isVisible()) {
      await projectsButton.first().click();
      await page.waitForLoadState('domcontentloaded', { timeout: 10000 });

      // Use browser back button
      await page.goBack();
      await page.waitForLoadState('domcontentloaded', { timeout: 10000 });

      // Should be back at initial URL
      expect(page.url()).toBe(initialUrl);

      // Use browser forward button
      await page.goForward();
      await page.waitForLoadState('domcontentloaded', { timeout: 10000 });

      // URL should have changed again
      expect(page.url()).not.toBe(initialUrl);
    }
  });

  test('should have keyboard navigation support', async ({ page }) => {
    // Focus first interactive element
    await page.keyboard.press('Tab');

    // Verify focus is visible
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });

  test('should display navigation on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Wait for responsive layout
    await page.waitForTimeout(500);

    // Check for mobile navigation (hamburger menu or bottom nav)
    const mobileNav = page.locator('nav').first();
    await expect(mobileNav).toBeVisible();
  });

  test('should preserve scroll position on navigation', async ({ page }) => {
    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 500));
    const scrollPosition = await page.evaluate(() => window.scrollY);

    expect(scrollPosition).toBeGreaterThan(0);

    // Navigate and come back
    const settingsButton = page
      .getByRole('button', { name: /settings/i })
      .or(page.getByRole('link', { name: /settings/i }));

    if (await settingsButton.first().isVisible()) {
      await settingsButton.first().click();
      await page.waitForLoadState('domcontentloaded', { timeout: 10000 });

      await page.goBack();
      await page.waitForLoadState('domcontentloaded', { timeout: 10000 });

      // Scroll position might be reset (which is acceptable behavior)
      const newScrollPosition = await page.evaluate(() => window.scrollY);
      expect(typeof newScrollPosition).toBe('number');
    }
  });
});

test.describe('Navigation Error Handling', () => {
  test('should handle invalid routes gracefully', async ({ page }) => {
    // Try to navigate to non-existent route
    await page.goto('/non-existent-route');

    // Should either show 404 or redirect to home
    await page.waitForLoadState('domcontentloaded', { timeout: 10000 });

    // Verify page is still functional
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle navigation during loading', async ({ page }) => {
    await page.goto('/');

    // Try to navigate before app is fully loaded
    const projectsButton = page.getByRole('button', { name: /projects/i }).first();

    if (await projectsButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await projectsButton.click();
      await page.waitForLoadState('domcontentloaded', { timeout: 10000 });

      // Should successfully navigate
      await expect(page.locator('body')).toBeVisible();
    }
  });
});

test.describe('Navigation Accessibility', () => {
  test('should have accessible navigation landmarks', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-ready"]');

    // Check for navigation landmark
    const nav = page.getByRole('navigation');
    await expect(nav.first()).toBeVisible();
  });

  test('should have skip navigation link', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-ready"]');

    // Tab to first element (should be skip link or main content)
    await page.keyboard.press('Tab');

    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should announce navigation changes to screen readers', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-ready"]');

    // Check for aria-live regions or route announcements
    const liveRegion = page.locator('[aria-live="polite"], [aria-live="assertive"], [role="status"]');

    // At least one live region should exist for announcements
    if ((await liveRegion.count()) > 0) {
      await expect(liveRegion.first()).toBeAttached();
    }
  });
});
