import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import type { LogEntry } from '@/lib/errors/logging';
import { SentryLogService } from '@/lib/errors/logging';

// Minimal LogEntry helper
const makeEntry = (overrides: Partial<LogEntry> = {}): LogEntry => ({
  timestamp: new Date().toISOString(),
  level: 'error',
  message: 'test',
  context: { feature: 'unit-test' },
  error: new Error('boom'),
  ...overrides,
});

declare global {
  interface Window {
    Sentry?: {
      captureException?: (error: Error, options?: Record<string, unknown>) => void;
      addBreadcrumb?: (crumb: Record<string, unknown>) => void;
      captureMessage?: (message: string, options?: Record<string, unknown>) => void;
    };
  }
}

describe('SentryLogService', () => {
  const originalSentry = global.window?.Sentry;

  beforeEach(() => {
    vi.resetModules();
    // Ensure a clean global between tests
    if (typeof window !== 'undefined') {
      delete (window as { Sentry?: unknown }).Sentry;
    }
  });

  afterEach(() => {
    // Restore original Sentry if present
    if (typeof window !== 'undefined') {
      if (originalSentry) {
        window.Sentry = originalSentry;
      } else {
        delete (window as { Sentry?: unknown }).Sentry;
      }
    }
  });

  it('does not throw when Sentry is not available', () => {
    const svc = new SentryLogService();
    const entry = makeEntry();

    expect(() => svc.log(entry)).not.toThrow();
    // Also ensure other methods no-op safely
    expect(() => svc.log({ ...entry, error: undefined })).not.toThrow();
  });

  it('forwards error logs to Sentry.captureException when available', () => {
    const captureException = vi.fn();
    const addBreadcrumb = vi.fn();

    if (typeof window !== 'undefined') {
      window.Sentry = { captureException, addBreadcrumb };
    }

    const svc = new SentryLogService();
    const entry = makeEntry();

    svc.log(entry);

    expect(captureException).toHaveBeenCalledTimes(1);
    expect(captureException).toHaveBeenCalledWith(entry.error, expect.any(Object));
    // addBreadcrumb is not called for error entries in current implementation
    expect(addBreadcrumb).not.toHaveBeenCalled();
  });

  it('adds breadcrumb via Sentry.addBreadcrumb for non-error entries', () => {
    const captureException = vi.fn();
    const addBreadcrumb = vi.fn();

    if (typeof window !== 'undefined') {
      window.Sentry = { captureException, addBreadcrumb };
    }

    const svc = new SentryLogService();
    const entry = makeEntry({ error: undefined, level: 'info' });

    svc.log(entry);

    expect(captureException).not.toHaveBeenCalled();
    expect(addBreadcrumb).toHaveBeenCalledTimes(1);
    expect(addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        message: entry.message,
        level: 'info',
      }),
    );
  });
});
