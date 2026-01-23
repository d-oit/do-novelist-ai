/**
 * Tests for error-handler.ts - Main Suite
 * Target: Increase coverage from 17.64% to 70%+
 */

import { describe, it, expect, vi } from 'vitest';

import { ErrorHandler, errorHandler } from '@/lib/errors/error-handler';

// Mock logger
vi.mock('@/lib/errors/logging', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    logError: vi.fn(),
  },
}));

describe('ErrorHandler', () => {
  describe('constructor and configuration', () => {
    it('should create handler with default config', () => {
      const defaultHandler = new ErrorHandler();
      const stats = defaultHandler.getStats();

      expect(stats.config.enableRetry).toBe(true);
      expect(stats.config.defaultRetryOptions.maxAttempts).toBe(3);
      expect(stats.handledErrorsCount).toBe(0);
      expect(stats.listenersCount).toBe(0);
    });

    it('should create handler with custom config', () => {
      const customHandler = new ErrorHandler({
        enableRetry: false,
        defaultRetryOptions: {
          maxAttempts: 5,
          delayMs: 1000,
        },
      });

      const stats = customHandler.getStats();
      expect(stats.config.enableRetry).toBe(false);
      expect(stats.config.defaultRetryOptions.maxAttempts).toBe(5);
      expect(stats.config.defaultRetryOptions.delayMs).toBe(1000);
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      const handler = new ErrorHandler({
        enableGlobalHandlers: false,
      });

      const listener1 = vi.fn();
      const listener2 = vi.fn();

      handler.addErrorListener(listener1);
      handler.addErrorListener(listener2);

      handler.handle(new Error('Error 1'));
      handler.handle(new Error('Error 2'));

      const stats = handler.getStats();

      expect(stats.handledErrorsCount).toBe(2);
      expect(stats.listenersCount).toBe(2);
      expect(stats.config).toBeDefined();
      expect(stats.config.enableRetry).toBe(true);
    });
  });
});

describe('Global error handler instance', () => {
  it('should export global instance', () => {
    expect(errorHandler).toBeInstanceOf(ErrorHandler);
  });

  it('should have default configuration', () => {
    const stats = errorHandler.getStats();
    expect(stats.config).toBeDefined();
  });
});
