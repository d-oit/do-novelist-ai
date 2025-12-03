/**
 * AI SDK Logger Patch
 * Fixes "m.log is not a function" errors when using AI SDK
 * This is a minimal patch to satisfy the AI SDK's logger expectations
 */

// Prevent "m.log is not a function" errors
// This patch is imported by test files and the AI SDK to ensure logger compatibility

const logger = {
  log: (...args: unknown[]): void => {
    // Minimal implementation - just ensure the method exists
    if (process.env.NODE_ENV === 'development') {
      console.log('[AI SDK]', ...args);
    }
  },
};

// Make logger available globally
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
globalThis.m = logger;

// Export for module usage
export default logger;
