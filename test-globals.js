 
/* global console, window, document, describe, it, expect, vi, test, __dirname, process */

// Test file to verify globals are working
// Browser globals
console.log(window.location.href);
console.log(document.title);

// Vitest globals (should be available in test files)
describe('Test globals', () => {
  it('should have vitest globals', () => {
    expect(true).toBe(true);
    vi.fn();
  });
});

// Playwright globals (should be available in E2E test files)
test('Playwright test', async ({ page }) => {
  await page.goto('/');
  expect(page).toBeDefined();
});

// Node.js globals (should be available in config files)
console.log(__dirname);
console.log(process.env.NODE_ENV);
