/**
 * Tests for error-handler.ts - Log Cleanup Tests
 * Target: Error logging and cleanup functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { ErrorHandler } from '@/lib/errors/error-handler';
import { logger } from '@/lib/errors/logging';

// Mock logger
vi.mock('@/lib/errors/logging', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    logError: vi.fn(),
  },
}));

describe('ErrorHandler - Log Cleanup', () => {
  let handler: ErrorHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    handler = new ErrorHandler({
      enableGlobalHandlers: false,
    });
  });

  describe('error listeners', () => {
    it('should add error listener', () => {
      const listener = vi.fn();
      handler.addErrorListener(listener);

      handler.handle(new Error('Test error'));

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test error',
        }),
      );
    });

    it('should remove error listener with returned function', () => {
      const listener = vi.fn();
      const unsubscribe = handler.addErrorListener(listener);

      unsubscribe();
      handler.handle(new Error('Test error'));

      expect(listener).not.toHaveBeenCalled();
    });

    it('should remove error listener with removeErrorListener', () => {
      const listener = vi.fn();
      handler.addErrorListener(listener);
      handler.removeErrorListener(listener);

      handler.handle(new Error('Test error'));

      expect(listener).not.toHaveBeenCalled();
    });

    it('should notify multiple listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      const listener3 = vi.fn();

      handler.addErrorListener(listener1);
      handler.addErrorListener(listener2);
      handler.addErrorListener(listener3);

      handler.handle(new Error('Test error'));

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
      expect(listener3).toHaveBeenCalledTimes(1);
    });

    it('should handle listener errors gracefully', () => {
      const faultyListener = vi.fn(() => {
        throw new Error('Listener error');
      });
      const goodListener = vi.fn();

      handler.addErrorListener(faultyListener);
      handler.addErrorListener(goodListener);

      expect(() => {
        handler.handle(new Error('Test error'));
      }).not.toThrow();

      expect(faultyListener).toHaveBeenCalled();
      expect(goodListener).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith('Error in error listener', expect.any(Object));
    });

    it('should track listener count in stats', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      handler.addErrorListener(listener1);
      handler.addErrorListener(listener2);

      const stats = handler.getStats();
      expect(stats.listenersCount).toBe(2);

      handler.removeErrorListener(listener1);
      const statsAfter = handler.getStats();
      expect(statsAfter.listenersCount).toBe(1);
    });
  });

  describe('Error reporting', () => {
    it('should report to analytics when enabled', () => {
      const reportingHandler = new ErrorHandler({
        enableGlobalHandlers: false,
        reporting: {
          reportToConsole: false,
          reportToSentry: false,
          reportToAnalytics: true,
        },
      });

      reportingHandler.handle(new Error('Test error'));

      expect(logger.info).toHaveBeenCalledWith(
        'Error reported',
        expect.objectContaining({
          errorCode: expect.any(String),
          errorName: expect.any(String),
        }),
      );
    });

    it('should not report when reporting is disabled', () => {
      const disabledReportingHandler = new ErrorHandler({
        enableGlobalHandlers: false,
        reporting: {
          reportToConsole: false,
          reportToSentry: false,
          reportToAnalytics: false,
        },
      });

      disabledReportingHandler.handle(new Error('Test error'));

      expect(logger.logError).not.toHaveBeenCalled();
      expect(logger.info).not.toHaveBeenCalled();
    });
  });
});
