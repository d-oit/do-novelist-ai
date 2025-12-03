// CRITICAL: Import AI SDK logger patch FIRST
import '../../src/lib/ai-sdk-logger-patch';

import { Page } from '@playwright/test';

/**
 * Ensures AI SDK logger is properly initialized
 * This must be called before any AI SDK operations
 */
function ensureLoggerInitialized(): void {
  const globalAny = globalThis as any;

  if (typeof globalAny.m === 'undefined' || typeof globalAny.m?.log !== 'function') {
    console.warn('[mock-ai-sdk] AI SDK logger not initialized, setting up mock');

    globalAny.m = {
      log: (...args: unknown[]): void => {
        // Silent no-op in tests unless DEBUG is set
        if (process.env.DEBUG === 'ai-sdk') {
          console.log('[AI SDK Logger]', ...args);
        }
      },
    };
  }
}

/**
 * Mock setup for AI SDK
 * This is a placeholder mock for Playwright E2E tests
 */
export const setupAISDKMock = async (_page: Page): Promise<void> => {
  // Ensure logger is initialized FIRST
  ensureLoggerInitialized();

  // Stub for AI SDK mock - to be implemented as needed
  // This allows tests to run without actual AI API calls
  console.log('AI SDK mock setup (placeholder)');
};
