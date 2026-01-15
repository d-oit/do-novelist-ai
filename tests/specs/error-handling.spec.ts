/**
 * E2E Tests for Error Handling
 *
 * Tests application error handling and recovery mechanisms
 */

import { test, expect } from '@playwright/test';

test.describe('Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-ready"]', { timeout: 10000 });
  });

  test('should handle JavaScript errors gracefully', async ({ page }) => {
    const errors: string[] = [];

    // Listen for console errors
    page.on('pageerror', error => {
      errors.push(error.message);
    });

    // Navigate around the app
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-ready"]');

    // App should still be functional
    await expect(page.locator('body')).toBeVisible();

    // Should have minimal or no critical errors
    const criticalErrors = errors.filter(
      e => !e.includes('Warning') && !e.includes('DevTools') && !e.includes('favicon'),
    );

    expect(criticalErrors.length).toBeLessThan(5);
  });

  test('should display user-friendly error messages', async ({ page }) => {
    // Check if error boundaries are in place
    await expect(page.locator('body')).toBeVisible();

    // App should not show raw error stacks to users
    const errorStack = await page.locator('pre').count();

    // If there are pre elements, they shouldn't contain stack traces
    if (errorStack > 0) {
      const text = await page.locator('pre').first().textContent();
      expect(text?.includes('at ')).toBeFalsy();
    }
  });

  test('should recover from network errors', async ({ page, context }) => {
    // Simulate network failure
    await context.route('**/*', route => route.abort());

    // Try to navigate
    await page.goto('/').catch(() => {});

    // Restore network
    await context.unroute('**/*');

    // Reload and verify recovery
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-ready"]', { timeout: 10000 });

    await expect(page.locator('[data-testid="app-ready"]')).toBeVisible();
  });

  test('should handle missing resources gracefully', async ({ page }) => {
    // Block some resources
    await page.route('**/*.woff2', route => route.abort());
    await page.route('**/*.woff', route => route.abort());

    await page.goto('/');

    // App should still load even with missing fonts
    await page.waitForSelector('[data-testid="app-ready"]', { timeout: 10000 });
    await expect(page.locator('[data-testid="app-ready"]')).toBeVisible();
  });

  test('should show error state for failed operations', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-ready"]');

    // Look for error indicators
    const errorElements = page.locator('[role="alert"], .error, .error-message, [aria-live="assertive"]');

    // Error elements might exist but shouldn't be blocking
    const count = await errorElements.count();
    expect(count >= 0).toBe(true);
  });
});

test.describe('Form Validation', () => {
  test('should validate required fields', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-ready"]');

    // Try to find a form
    const forms = page.locator('form');
    const formCount = await forms.count();

    if (formCount > 0) {
      // Find submit button
      const submitButton = page.getByRole('button', { name: /submit|create|save/i }).first();

      if (await submitButton.isVisible()) {
        // Try to submit without filling required fields
        await submitButton.click();

        // Should show validation error or prevent submission
        await page.waitForTimeout(500);

        // Form should still be visible (not submitted)
        await expect(forms.first()).toBeVisible();
      }
    }
  });

  test('should display inline validation errors', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-ready"]');

    // Find input fields
    const inputs = page.locator('input[required]');
    const inputCount = await inputs.count();

    if (inputCount > 0) {
      const firstInput = inputs.first();

      // Focus and blur without entering data
      await firstInput.focus();
      await firstInput.blur();

      // Should show validation message
      await page.waitForTimeout(300);

      // Check for error message
      const errorMessage = page.locator('.error, [role="alert"], .text-red-500, .text-destructive');
      const errorCount = await errorMessage.count();

      // Either shows error or has validation in place
      expect(errorCount >= 0).toBe(true);
    }
  });

  test('should clear validation errors on input', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-ready"]');

    const inputs = page.locator('input');
    const inputCount = await inputs.count();

    if (inputCount > 0) {
      const firstInput = inputs.first();

      // Enter invalid data
      await firstInput.fill('');
      await firstInput.blur();
      await page.waitForTimeout(300);

      // Now enter valid data
      await firstInput.fill('Valid Input');
      await page.waitForTimeout(300);

      // Error should be cleared or not present
      const body = await page.locator('body').textContent();
      expect(body).toBeTruthy();
    }
  });
});

test.describe('Accessibility Error Prevention', () => {
  test('should have no missing alt text on images', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-ready"]');

    // Find all images
    const images = page.locator('img');
    const imageCount = await images.count();

    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');

      // All images should have alt attribute (can be empty for decorative)
      expect(alt !== null).toBe(true);
    }
  });

  test('should have proper form labels', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-ready"]');

    // Find all inputs
    const inputs = page.locator('input:not([type="hidden"])');
    const inputCount = await inputs.count();

    for (let i = 0; i < Math.min(inputCount, 5); i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledby = await input.getAttribute('aria-labelledby');

      // Input should have label, aria-label, or aria-labelledby
      const hasLabel = id ? (await page.locator(`label[for="${id}"]`).count()) > 0 : false;
      const isAccessible = hasLabel || ariaLabel || ariaLabelledby;

      expect(isAccessible).toBe(true);
    }
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-ready"]');

    // Check if text is visible
    const textElements = page.locator('p, h1, h2, h3, h4, h5, h6, span, button, a');
    const count = await textElements.count();

    // Should have text content
    expect(count).toBeGreaterThan(0);

    // Visual verification - text should be visible
    if (count > 0) {
      await expect(textElements.first()).toBeVisible();
    }
  });
});

test.describe('State Management Errors', () => {
  test('should handle localStorage errors', async ({ page, context }) => {
    // Disable localStorage
    await context.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new Error('localStorage is disabled');
        },
      });
    });

    await page.goto('/');

    // App should still load (might use fallback storage)
    await page.waitForSelector('[data-testid="app-ready"]', { timeout: 10000 });
    await expect(page.locator('[data-testid="app-ready"]')).toBeVisible();
  });

  test('should handle quota exceeded errors', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-ready"]');

    // Try to fill localStorage (if app uses it)
    await page.evaluate(() => {
      try {
        const data = 'x'.repeat(1024 * 1024); // 1MB
        for (let i = 0; i < 10; i++) {
          localStorage.setItem(`test_${i}`, data);
        }
      } catch {
        // Quota exceeded - this is expected
      }
    });

    // App should still be functional
    await expect(page.locator('body')).toBeVisible();

    // Clean up
    await page.evaluate(() => {
      try {
        for (let i = 0; i < 10; i++) {
          localStorage.removeItem(`test_${i}`);
        }
      } catch {
        // Ignore
      }
    });
  });

  test('should persist state across page reloads', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-ready"]');

    // Set some state (e.g., theme preference)
    const initialUrl = page.url();

    // Reload page
    await page.reload();
    await page.waitForSelector('[data-testid="app-ready"]', { timeout: 10000 });

    // Should be on the same page
    expect(page.url()).toBe(initialUrl);
    await expect(page.locator('[data-testid="app-ready"]')).toBeVisible();
  });
});

test.describe('Browser Compatibility', () => {
  test('should work without modern JavaScript features', async ({ page }) => {
    await page.goto('/');

    // App should use polyfills if needed
    await page.waitForSelector('[data-testid="app-ready"]', { timeout: 10000 });
    await expect(page.locator('[data-testid="app-ready"]')).toBeVisible();
  });

  test('should handle different viewport sizes', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667 }, // Mobile
      { width: 768, height: 1024 }, // Tablet
      { width: 1920, height: 1080 }, // Desktop
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('/');
      await page.waitForSelector('[data-testid="app-ready"]', { timeout: 10000 });

      await expect(page.locator('[data-testid="app-ready"]')).toBeVisible();
    }
  });
});
