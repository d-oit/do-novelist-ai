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
    // Only log in development, suppress in test/production
    const isDev =
      (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') ||
      (typeof import.meta !== 'undefined' && import.meta.env?.DEV === true);

    if (isDev) {
      console.log('[AI SDK]', ...args);
    }
  },
};

// Make logger available globally (works in both Node.js and browser)
if (typeof globalThis !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
  (globalThis as any).m = logger;
}

// Also set on window for browser environments
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
  (window as any).m = logger;
}

// Export for module usage
export default logger;
