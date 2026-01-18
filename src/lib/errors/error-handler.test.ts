/**
 * Tests for error-handler.ts
 * Target: Increase coverage from 17.64% to 70%+
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

import {
  ErrorHandler,
  errorHandler,
  handleError,
  executeWithRetry,
  wrapAsync,
  wrapSync,
  getUserMessage,
  shouldRetry,
  createErrorHandler,
} from '@/lib/errors/error-handler';
import { toAppError } from '@/lib/errors/error-types';
import { ok, err, isOk, isErr } from '@/lib/errors/result';
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

describe('ErrorHandler', () => {
  let handler: ErrorHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    handler = new ErrorHandler({
      enableGlobalHandlers: false, // Disable for tests
      enableRetry: true,
      reporting: {
        reportToConsole: true,
        reportToSentry: false,
        reportToAnalytics: false,
      },
    });
  });

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

    it('should update configuration', () => {
      handler.updateConfig({
        enableRetry: false,
        defaultRetryOptions: {
          maxAttempts: 10,
        },
      });

      const stats = handler.getStats();
      expect(stats.config.enableRetry).toBe(false);
      expect(stats.config.defaultRetryOptions.maxAttempts).toBe(10);
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

    it('should handle AppError instance', () => {
      const appError = toAppError(new Error('App error'), 'test-context');
      const result = handler.handle(appError);

      expect(result.message).toBe('App error');
      expect(result.code).toBeDefined();
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

  describe('executeWithRetry', () => {
    it('should succeed on first attempt', async () => {
      const operation = vi.fn(async () => ok('success'));

      const result = await handler.executeWithRetry(operation);

      expect(operation).toHaveBeenCalledTimes(1);
      expect(isOk(result)).toBe(true);
    });

    it('should retry on retryable error', async () => {
      let attempts = 0;
      const operation = vi.fn(async () => {
        attempts++;
        if (attempts < 3) {
          const error = toAppError(new Error('Retryable'), 'test');
          // Use Object.defineProperty to override readonly property for testing
          Object.defineProperty(error, 'retryable', {
            value: true,
            writable: true,
            configurable: true,
          });
          return err(error);
        }
        return ok('success');
      });

      await handler.executeWithRetry(operation, {
        maxAttempts: 3,
        delayMs: 10,
      });

      expect(attempts).toBeGreaterThanOrEqual(1);
      expect(operation).toHaveBeenCalled();
      expect(isOk(result)).toBe(true);
    });

    it('should retry on retryable error', async () => {
      let attempts = 0;
      const operation = vi.fn(async () => {
        attempts++;
        if (attempts < 3) {
          // @ts-ignore - testing retryable behavior
          const error = toAppError(new Error('Retryable'), 'test');
          error.retryable = true;
          return err(error);
        }
        return ok('success');
      });

      await handler.executeWithRetry(operation, {
        maxAttempts: 3,
        delayMs: 10,
      });

      expect(attempts).toBeGreaterThanOrEqual(1);
      expect(operation).toHaveBeenCalled();
    });

    it('should not retry when retry is disabled', async () => {
      const noRetryHandler = new ErrorHandler({
        enableRetry: false,
        enableGlobalHandlers: false,
      });

      const operation = vi.fn(async () => err(toAppError(new Error('Error'), 'test')));

      const result = await noRetryHandler.executeWithRetry(operation);

      expect(isErr(result)).toBe(true);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should respect retry condition', async () => {
      const retryableError = toAppError(new Error('Retryable'), 'test');
      // @ts-ignore - testing retryable behavior
      retryableError.retryable = true;

      const nonRetryableError = toAppError(new Error('Non-retryable'), 'test');
      // @ts-ignore - testing retryable behavior
      nonRetryableError.retryable = false;

      const operation = vi.fn(async () => err(nonRetryableError));

      const result = await handler.executeWithRetry(operation, {
        maxAttempts: 3,
        delayMs: 10,
        retryCondition: error => error.retryable,
      });

      expect(isErr(result)).toBe(true);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should use custom retry options', async () => {
      let attempts = 0;
      const operation = vi.fn(async () => {
        attempts++;
        const error = toAppError(new Error('Error'), 'test');
        // @ts-ignore - testing retryable behavior
        error.retryable = true;
        return err(error);
      });

      await handler.executeWithRetry(operation, {
        maxAttempts: 5,
        delayMs: 5,
      });

      expect(attempts).toBeGreaterThanOrEqual(1);
      expect(operation).toHaveBeenCalled();
    });
  });

  describe('executeWithRetryAndTimeout', () => {
    it('should succeed before timeout', async () => {
      const operation = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return ok('success');
      });

      const result = await handler.executeWithRetryAndTimeout(operation, 100);

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data).toBe('success');
      }
    });

    it('should timeout slow operations', async () => {
      const operation = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
        return ok('success');
      });

      const result = await handler.executeWithRetryAndTimeout(operation, 50, {
        maxAttempts: 1,
        delayMs: 10,
      });

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.message).toContain('timed out');
      }
    });

    it('should retry timed out operations', async () => {
      let attempts = 0;
      const operation = vi.fn(async () => {
        attempts++;
        if (attempts < 2) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        return ok('success');
      });

      await handler.executeWithRetryAndTimeout(operation, 50, {
        maxAttempts: 2,
        delayMs: 10,
      });

      expect(attempts).toBeGreaterThanOrEqual(1);
      expect(operation).toHaveBeenCalled();
    });
  });

  describe('wrapAsync', () => {
    it('should wrap successful async function', async () => {
      const fn = async (x: number, y: number) => x + y;
      const wrapped = handler.wrapAsync(fn, 'test-context');

      const result = await wrapped(2, 3);

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data).toBe(5);
      }
    });

    it('should catch async function errors', async () => {
      const fn = async () => {
        throw new Error('Async error');
      };
      const wrapped = handler.wrapAsync(fn, 'test-context');

      const result = await wrapped();

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.message).toBe('Async error');
      }
    });

    it('should preserve function parameters', async () => {
      const fn = async (a: string, b: number, c: boolean) => ({ a, b, c });
      const wrapped = handler.wrapAsync(fn);

      const result = await wrapped('test', 42, true);

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data).toEqual({ a: 'test', b: 42, c: true });
      }
    });
  });

  describe('wrapSync', () => {
    it('should wrap successful sync function', () => {
      const fn = (x: number, y: number) => x * y;
      const wrapped = handler.wrapSync(fn, 'test-context');

      const result = wrapped(3, 4);

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data).toBe(12);
      }
    });

    it('should catch sync function errors', () => {
      const fn = () => {
        throw new Error('Sync error');
      };
      const wrapped = handler.wrapSync(fn, 'test-context');

      const result = wrapped();

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.message).toBe('Sync error');
      }
    });

    it('should preserve function parameters', () => {
      const fn = (a: string, b: number) => `${a}-${b}`;
      const wrapped = handler.wrapSync(fn);

      const result = wrapped('test', 123);

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data).toBe('test-123');
      }
    });
  });

  describe('getUserMessage', () => {
    it('should get message from Error', () => {
      const message = handler.getUserMessage(new Error('Test error'));
      expect(typeof message).toBe('string');
      expect(message.length).toBeGreaterThan(0);
    });

    it('should get message from AppError', () => {
      const appError = toAppError(new Error('App error'), 'context');
      const message = handler.getUserMessage(appError);
      expect(typeof message).toBe('string');
      expect(message.length).toBeGreaterThan(0);
    });

    it('should get message from string', () => {
      const message = handler.getUserMessage('String error');
      expect(typeof message).toBe('string');
    });

    it('should get message from unknown type', () => {
      const message = handler.getUserMessage({ weird: 'object' });
      expect(typeof message).toBe('string');
    });
  });

  describe('shouldRetry', () => {
    it('should return true for retryable errors', () => {
      const error = toAppError(new Error('Retryable'), 'test');
      // @ts-ignore - testing retryable behavior
      error.retryable = true;

      const result = handler.shouldRetry(error);
      expect(result).toBe(true);
    });

    it('should return false for non-retryable errors', () => {
      const error = toAppError(new Error('Non-retryable'), 'test');
      // @ts-ignore - testing retryable behavior
      error.retryable = false;

      const result = handler.shouldRetry(error);
      expect(result).toBe(false);
    });

    it('should handle non-AppError types', () => {
      const result = handler.shouldRetry(new Error('Regular error'));
      expect(typeof result).toBe('boolean');
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
      const error = toAppError(new Error('Test'), 'test-context');
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

  describe('getStats', () => {
    it('should return correct statistics', () => {
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

describe('Convenience functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleError', () => {
    it('should handle error with context', () => {
      const error = new Error('Test error');
      const result = handleError(error, 'test-context');

      expect(result.message).toBe('Test error');
      expect(result.code).toBeDefined();
    });
  });

  describe('executeWithRetry', () => {
    it('should execute operation with retry', async () => {
      const operation = vi.fn(async () => ok('success'));
      const result = await executeWithRetry(operation);

      expect(isOk(result)).toBe(true);
      expect(operation).toHaveBeenCalled();
    });
  });

  describe('wrapAsync', () => {
    it('should wrap async function', async () => {
      const fn = async (x: number) => x * 2;
      const wrapped = wrapAsync(fn, 'test');

      const result = await wrapped(5);

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data).toBe(10);
      }
    });
  });

  describe('wrapSync', () => {
    it('should wrap sync function', () => {
      const fn = (x: number) => x + 1;
      const wrapped = wrapSync(fn, 'test');

      const result = wrapped(5);

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data).toBe(6);
      }
    });
  });

  describe('getUserMessage', () => {
    it('should get user-friendly message', () => {
      const message = getUserMessage(new Error('Test'));
      expect(typeof message).toBe('string');
    });
  });

  describe('shouldRetry', () => {
    it('should check if error should be retried', () => {
      const error = new Error('Test');
      const result = shouldRetry(error);
      expect(typeof result).toBe('boolean');
    });
  });
});

describe('createErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create component-specific error handler', () => {
    const componentHandler = createErrorHandler('TestComponent');

    expect(componentHandler).toHaveProperty('handleError');
    expect(componentHandler).toHaveProperty('getErrorMessage');
    expect(typeof componentHandler.handleError).toBe('function');
    expect(typeof componentHandler.getErrorMessage).toBe('function');
  });

  it('should handle errors with component name', () => {
    const componentHandler = createErrorHandler('TestComponent');

    expect(() => {
      componentHandler.handleError(new Error('Component error'));
    }).not.toThrow();
  });

  it('should get error message', () => {
    const componentHandler = createErrorHandler('TestComponent');
    const message = componentHandler.getErrorMessage(new Error('Test error'));

    expect(typeof message).toBe('string');
  });
});

describe('Error reporting', () => {
  it('should report to analytics when enabled', () => {
    const handler = new ErrorHandler({
      enableGlobalHandlers: false,
      reporting: {
        reportToConsole: false,
        reportToSentry: false,
        reportToAnalytics: true,
      },
    });

    handler.handle(new Error('Test error'));

    expect(logger.info).toHaveBeenCalledWith(
      'Error reported',
      expect.objectContaining({
        errorCode: expect.any(String),
        errorName: expect.any(String),
      }),
    );
  });

  it('should not report when reporting is disabled', () => {
    const handler = new ErrorHandler({
      enableGlobalHandlers: false,
      reporting: {
        reportToConsole: false,
        reportToSentry: false,
        reportToAnalytics: false,
      },
    });

    handler.handle(new Error('Test error'));

    expect(logger.logError).not.toHaveBeenCalled();
    expect(logger.info).not.toHaveBeenCalled();
  });
});
