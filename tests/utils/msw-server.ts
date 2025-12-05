import { setupServer } from 'msw/node';
import { handlers } from './msw-handlers';

/**
 * MSW Server Setup for Node.js Environment (Playwright E2E Tests)
 *
 * This server intercepts network requests in the Node.js environment
 * and returns mocked responses for AI API calls during E2E testing.
 */

export const server = setupServer(...handlers);

/**
 * Start the MSW server
 */
export function startMockServer(): void {
  server.listen({
    onUnhandledRequest: 'warn', // Warn about unhandled requests but don't fail
  });
  console.log('🎭 MSW mock server started for E2E tests');
}

/**
 * Stop the MSW server
 */
export function stopMockServer(): void {
  server.close();
  console.log('🎭 MSW mock server stopped');
}

/**
 * Reset handlers between tests
 */
export function resetMockServer(): void {
  server.resetHandlers();
}
