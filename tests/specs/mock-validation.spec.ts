import { expect, test } from '@playwright/test';

import { setupGeminiMock } from '../utils/mock-openrouter';

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

    // Verify navigation is available using top navigation (not bottom nav)
    await expect(page.getByRole('navigation').getByTestId('nav-settings')).toBeVisible({ timeout: 10000 });

    // Verify the unified mock manager has initialized by checking console
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(msg.text());
    });

    // Navigate to a view that would use AI mocks
    await page.getByRole('navigation').getByTestId('nav-dashboard').click({ timeout: 15000 });
    await expect(page.getByTestId('dashboard-view')).toBeVisible({ timeout: 10000 });

    // Verify mock manager was initialized by checking console logs
    const hasMockLogs = consoleLogs.some(
      log =>
        log.includes('Mock manager initialized') ||
        log.includes('[UnifiedMock]') ||
        log.includes('AI SDK mock initialized'),
    );

    expect(hasMockLogs).toBe(true);
  });
});
