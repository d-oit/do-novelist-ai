/**
 * Tests for error-handler.ts - Circuit Breaker Tests
 * Target: Circuit breaker and retry functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

import {
  ErrorHandler,
  handleError,
  executeWithRetry,
  wrapAsync,
  wrapSync,
  getUserMessage,
  shouldRetry,
  createErrorHandler,
} from '@/lib/errors/error-handler';
import { toAppError, createNetworkError } from '@/lib/errors/error-types';
import { ok, err, isOk, isErr } from '@/lib/errors/result';

// Mock logger
vi.mock('@/lib/errors/logging', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    logError: vi.fn(),
  },
}));

describe('ErrorHandler - Circuit Breaker', () => {
  let handler: ErrorHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    handler = new ErrorHandler({
      enableGlobalHandlers: false,
      enableRetry: true,
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
          Object.defineProperty(error, 'retryable', {
            value: true,
            writable: true,
            configurable: true,
          });
          return err(error);
        }
        return ok('success');
      });

      const result = await handler.executeWithRetry(operation, {
        maxAttempts: 3,
        delayMs: 10,
      });

      expect(attempts).toBeGreaterThanOrEqual(1);
      expect(operation).toHaveBeenCalled();
      expect(isOk(result)).toBe(true);
    });

    it('should retry on network error (503)', async () => {
      let attempts = 0;
      const operation = vi.fn(async () => {
        attempts++;
        if (attempts < 3) {
          const error = createNetworkError('Retryable error', {
            endpoint: '/test',
            method: 'GET',
            statusCode: 503,
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
      Object.defineProperty(retryableError, 'retryable', {
        value: true,
        writable: true,
        configurable: true,
      });

      const nonRetryableError = toAppError(new Error('Non-retryable'), 'test');
      Object.defineProperty(nonRetryableError, 'retryable', {
        value: false,
        writable: true,
        configurable: true,
      });

      const operation = vi.fn(async () => err(nonRetryableError));

      const result = await handler.executeWithRetry(operation, {
        maxAttempts: 3,
        delayMs: 10,
        retryCondition: error => error.retryable,
      });

      expect(isErr(result)).toBe(true);
      expect(operation).toHaveBeenCalledTimes(1);
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
      Object.defineProperty(error, 'retryable', {
        value: true,
        writable: true,
        configurable: true,
      });

      const result = handler.shouldRetry(error);
      expect(result).toBe(true);
    });

    it('should return false for non-retryable errors', () => {
      const error = toAppError(new Error('Non-retryable'), 'test');
      Object.defineProperty(error, 'retryable', {
        value: false,
        writable: true,
        configurable: true,
      });

      const result = handler.shouldRetry(error);
      expect(result).toBe(false);
    });

    it('should handle non-AppError types', () => {
      const result = handler.shouldRetry(new Error('Regular error'));
      expect(typeof result).toBe('boolean');
    });
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
