import { test, expect } from '@playwright/test';

import { setupGeminiMock } from '../utils/mock-ai-gateway';

test.describe('Mock Infrastructure Validation', () => {
  test.beforeEach(async ({ page }) => {
    await setupGeminiMock(page);
  });

  test('AI SDK Logger should be initialized without errors', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Check that no "m.log is not a function" errors occurred
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Wait for app to load
    await page.waitForLoadState('networkidle');

    // Verify logger is available in browser context
    const loggerCheck = await page.evaluate(() => {
      const globalAny = globalThis as any;
      return {
        hasGlobalM: typeof globalAny.m !== 'undefined',
        hasLogFunction: typeof globalAny.m?.log === 'function',
      };
    });

    expect(loggerCheck.hasGlobalM).toBe(true);
    expect(loggerCheck.hasLogFunction).toBe(true);

    // Verify no logger-related errors
    const loggerErrors = consoleErrors.filter(err => err.includes('m.log') || err.includes('logger'));
    expect(loggerErrors).toHaveLength(0);
  });

  test('AI API mocks should respond quickly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Measure response time for a mock API call
    const startTime = Date.now();

    // Make a mock API request
    const response = await page.evaluate(async () => {
      const res = await fetch('http://localhost:4173/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'test outline' }],
        }),
      });
      return res.json();
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Verify response is fast (<100ms target)
    expect(duration).toBeLessThan(1000); // Allow 1s for test environment overhead
    expect(response).toHaveProperty('choices');
    expect(response.choices[0].message.content).toBeTruthy();
  });

  test('Mock setup completes successfully', async ({ page }) => {
    // This test validates that mock setup completes without throwing errors
    // The actual console logs happen in the Playwright test context, not the browser

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify the page loaded successfully
    const pageTitle = await page.title();
    expect(pageTitle).toBeTruthy();

    // Verify no critical errors in console
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.waitForTimeout(500);

    // Should not have mock-related errors
    const mockErrors = consoleErrors.filter(
      err => err.includes('mock') || err.includes('setupAISDKMock') || err.includes('setupGeminiMock'),
    );
    expect(mockErrors).toHaveLength(0);
  });
});
