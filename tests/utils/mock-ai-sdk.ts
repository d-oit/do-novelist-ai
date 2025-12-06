// CRITICAL: Import AI SDK logger patch FIRST
import '../../src/lib/ai-sdk-logger-patch';

import type { Page } from '@playwright/test';

/**
 * Ensures AI SDK logger is properly initialized in the browser context
 * This must be called before any AI SDK operations
 */
async function ensureLoggerInitializedInBrowser(page: Page): Promise<void> {
  // Inject logger into the browser context directly
  await page.addInitScript(() => {
    // Create a minimal logger that satisfies AI SDK expectations
    const mockLogger = {
      log: (): void => {
        // Silent no-op in tests to avoid console pollution
        // Uncomment for debugging: console.log('[AI SDK]', ...args);
      },
    };

    // Set on both globalThis and window for maximum compatibility
    (globalThis as any).m = mockLogger;
    (window as any).m = mockLogger;
  });
}

/**
 * Mock setup for AI SDK
 * Ensures the logger is available in browser context before any AI SDK code runs
 */
export const setupAISDKMock = async (page: Page): Promise<void> => {
  // Ensure logger is initialized in the browser context FIRST
  await ensureLoggerInitializedInBrowser(page);

  console.log('[mock-ai-sdk] AI SDK logger initialized in browser context');
};
