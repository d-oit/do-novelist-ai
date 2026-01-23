/**
 * Tests for error-handler.ts - Recovery Tests
 * Target: Error recovery functionality
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

describe('ErrorHandler - Recovery', () => {
  let handler: ErrorHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    handler = new ErrorHandler({
      enableGlobalHandlers: false,
    });
  });

  describe('handle', () => {
    it('should handle Error instance', () => {
      const error = new Error('Test error');
      const result = handler.handle(error, { context: 'test' });

      expect(result.message).toBe('Test error');
      expect(result.code).toBeDefined();
      expect(result.severity).toBeDefined();
    });

    it('should handle string error', () => {
      const result = handler.handle('String error', { context: 'test' });

      expect(typeof result.message).toBe('string');
      expect(result.code).toBeDefined();
    });

    it('should handle unknown error type', () => {
      const result = handler.handle({ weird: 'object' }, { context: 'test' });

      expect(typeof result.message).toBe('string');
      expect(result.code).toBeDefined();
    });

    it('should increment error count', () => {
      handler.handle(new Error('Error 1'));
      handler.handle(new Error('Error 2'));
      handler.handle(new Error('Error 3'));

      const stats = handler.getStats();
      expect(stats.handledErrorsCount).toBe(3);
    });

    it('should log error when report is true', () => {
      handler.handle(new Error('Test error'), { report: true });

      expect(logger.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test error',
        }),
        expect.objectContaining({
          source: 'error-handler',
          fatal: false,
        }),
      );
    });

    it('should not log error when report is false', () => {
      handler.handle(new Error('Test error'), { report: false });

      expect(logger.logError).not.toHaveBeenCalled();
    });

    it('should throw error when fatal is true', () => {
      expect(() => {
        handler.handle(new Error('Fatal error'), { fatal: true });
      }).toThrow();
    });

    it('should not throw error when fatal is false', () => {
      expect(() => {
        handler.handle(new Error('Non-fatal error'), { fatal: false });
      }).not.toThrow();
    });

    it('should include source in context', () => {
      handler.handle(new Error('Test'), { source: 'custom-source' });

      expect(logger.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test',
        }),
        expect.objectContaining({
          source: 'custom-source',
        }),
      );
    });
  });

  describe('recoverFromError', () => {
    it('should recover successfully', async () => {
      const error = new Error('Original error');
      const recoveryFn = vi.fn(async () => 'recovered');

      const result = await handler.recoverFromError(error, recoveryFn);

      expect(result).toBe('recovered');
      expect(recoveryFn).toHaveBeenCalledTimes(1);
      expect(logger.warn).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('Successfully recovered from error');
    });

    it('should throw original error when recovery fails', async () => {
      const originalError = new Error('Original error');
      const recoveryFn = vi.fn(async () => {
        throw new Error('Recovery failed');
      });

      await expect(handler.recoverFromError(originalError, recoveryFn)).rejects.toThrow();
      expect(logger.error).toHaveBeenCalledWith('Recovery failed', expect.any(Object));
    });

    it('should log recovery attempt', async () => {
      const error = new Error('Test');
      const recoveryFn = async () => 'recovered';

      await handler.recoverFromError(error, recoveryFn);

      expect(logger.warn).toHaveBeenCalledWith(
        'Attempting to recover from error',
        expect.objectContaining({
          errorCode: expect.any(String),
          errorName: expect.any(String),
        }),
      );
    });
  });
});
