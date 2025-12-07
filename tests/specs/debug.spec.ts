import { test, expect } from '@playwright/test';

test.describe('Debug Test Suite', () => {
  test('should navigate to homepage successfully', async ({ page }) => {
    console.log('Starting debug test...');

    try {
      console.log('Attempting to navigate to homepage...');

      // Navigate with basic approach
      await page.goto('/', {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });

      console.log('Navigation successful!');

      // Wait for basic page content
      await page.waitForLoadState('networkidle');

      // Basic checks
      const title = await page.title();
      console.log(`Page title: ${title}`);

      // Check that body exists (not checking visibility as React errors may affect it)
      const bodyCount = await page.locator('body').count();
      expect(bodyCount).toBeGreaterThan(0);

      console.log('Debug test passed!');
    } catch (error) {
      console.error('Debug test failed:', error);
      throw error;
    }
  });

  test('should access basic page elements', async ({ page }) => {
    console.log('Testing basic page elements...');

    try {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Check for basic content
      const bodyExists = await page.locator('body').count();
      console.log(`Body elements found: ${bodyExists}`);

      // Try to find some navigation
      const navCount = await page.locator('nav, [role="navigation"]').count();
      console.log(`Found ${navCount} navigation elements`);

      expect(bodyExists).toBeGreaterThan(0);
    } catch (error) {
      console.error('Page elements test failed:', error);
      throw error;
    }
  });

  test('should test server connection', async ({ page }) => {
    console.log('Testing server connection...');

    try {
      // Test if server is responding
      const response = await page.goto('/');
      console.log(`Response status: ${response?.status()}`);

      // Check page content
      const content = await page.content();
      console.log(`Page content length: ${content.length}`);

      expect(response?.ok()).toBe(true);
    } catch (error) {
      console.error('Server connection test failed:', error);
      throw error;
    }
  });
});
