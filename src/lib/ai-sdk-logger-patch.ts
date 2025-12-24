/**
 * AI SDK Logger Patch
 * Fixes "m.log is not a function" errors when using AI SDK
 * This is a minimal patch to satisfy the AI SDK's logger expectations
 */

import { logger as structuredLogger } from '@/lib/logging/logger';

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
      structuredLogger.debug('AI SDK log', { args });
    }
  },
};

// Make logger available globally (works in both Node.js and browser)
// Use try-catch to handle cases where properties are read-only (e.g., browser extensions)
if (typeof globalThis !== 'undefined') {
  try {
    const globalRecord = globalThis as unknown as Record<string, unknown>;
    globalRecord['m'] = logger;
  } catch {
    // Property is read-only, skip assignment
  }
}

// Also set on window for browser environments
if (typeof window !== 'undefined') {
  try {
    const windowRecord = window as unknown as Record<string, unknown>;
    windowRecord['m'] = logger;
  } catch {
    // Property is read-only (e.g., React DevTools), skip assignment
  }
}

// Export for module usage
export default logger;
