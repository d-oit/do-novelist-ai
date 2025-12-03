import { setupWorker } from 'msw/browser';
import { handlers } from './msw-handlers';

/**
 * MSW Browser Setup for Playwright E2E Tests
 *
 * This worker intercepts network requests in the BROWSER context
 * during Playwright tests and returns mocked responses for AI API calls.
 *
 * IMPORTANT: This must be called in the browser context (test.beforeEach)
 */

export const mswWorker = setupWorker(...handlers);

/**
 * Start MSW in the browser
 * Call this in test.beforeEach to ensure MSW is active
 */
export async function startMockingInBrowser(page: import('@playwright/test').Page): Promise<void> {
  // Register the service worker in the browser
  await page.addInitScript(async () => {
    // Import MSW worker in the browser context
    if (typeof window !== 'undefined') {
      const { mswWorker } = await import('./tests/utils/msw-browser');
      await mswWorker.start({
        serviceWorker: {
          url: '/mockServiceWorker.js',
        },
        onUnhandledRequest: 'bypass', // Don't warn about unhandled requests
      });
      console.log('🎭 MSW browser worker started');
    }
  });
}

/**
 * Alternative approach: Start MSW directly in the page
 * This registers the worker and sets up request interception
 */
export async function startMSW(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('about:blank');
  await page.addInitScript(async () => {
    // @ts-expect-error - MSW types aren't available in this context
    if (typeof window !== 'undefined' && !window.msw) {
      try {
        // Register service worker
        const registration = await navigator.serviceWorker.register('/mockServiceWorker.js', {
          scope: '/',
        });

        console.log('✅ Service Worker registered:', registration.scope);

        // Wait for the worker to be ready
        await navigator.serviceWorker.ready;

        // Send message to activate MSW
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({ type: 'MOCK_ACTIVATE' });
        }

        console.log('✅ MSW browser mock ready');
      } catch (error) {
        console.error('❌ Failed to register MSW service worker:', error);
      }
    }
  });
}
