import { test, expect } from '@playwright/test';

// Optional smoke: only meaningful in local/dev where Vite serves source modules.
// Skip in CI where we serve built assets (module import paths differ).
const isCI = !!process.env.CI;

// Helper to install a window.Sentry mock that records calls
const initSentryMock = () => {
  return `
    (function(){
      window.__sentryCalls = { captureException: 0, addBreadcrumb: 0, args: [] };
      window.Sentry = {
        captureException: function(err, options){
          window.__sentryCalls.captureException++;
          window.__sentryCalls.args.push({ type: 'exception', err: err && err.message, options });
        },
        addBreadcrumb: function(crumb){
          window.__sentryCalls.addBreadcrumb++;
          window.__sentryCalls.args.push({ type: 'breadcrumb', crumb });
        }
      };
    })();
    `;
};

// This smoke test verifies that with window.Sentry present, our logging service
// will forward an error to captureException when invoked.
// We trigger logging by dynamically importing the app's logging module from Vite
// dev server and calling logger.error().
// Note: Skipped in CI where we run the built app without Vite module paths.

test.describe('Sentry logging smoke', () => {
  test.skip(isCI, 'Sentry smoke relies on dev server module paths and is skipped in CI');

  test('forwards error via Sentry when logger.error is called', async ({ page, baseURL }) => {
    await page.addInitScript({ content: initSentryMock() });

    await page.goto(baseURL || 'http://localhost:3000');

    // Dynamically import the logging module and emit an error log from within the page context
    await page.evaluate(async () => {
      // Import the module from Vite dev server path
      const mod = await import('/src/lib/errors/logging.ts');
      const { logger } = mod as unknown as {
        logger: { error: (msg: string | Error, ctx?: Record<string, unknown>) => void };
      };
      logger.error(new Error('E2E Sentry smoke'));
    });

    // Verify that our mock Sentry captured the exception
    const calls = await page.evaluate(() => (window as any).__sentryCalls);
    expect(calls).toBeDefined();
    expect(calls.captureException).toBeGreaterThan(0);
    expect(calls.addBreadcrumb).toBeGreaterThanOrEqual(0);
  });
});
