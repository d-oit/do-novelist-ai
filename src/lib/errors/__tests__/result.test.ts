import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  ok,
  err,
  isOk,
  isErr,
  unwrap,
  unwrapOr,
  unwrapErr,
  map,
  mapErr,
  andThen,
  andThenAsync,
  mapAsync,
  tryCatch,
  tryCatchAsync,
  fromPromise,
  toPromise,
  collect,
  collectAll,
  retry,
  withTimeout,
  safeAsync,
  safeSync,
  withContext,
  match,
  tap,
  tapErr,
  combine,
  combineResults,
  type Result,
} from '@/lib/errors/result';

describe('Result Type', () => {
  describe('constructor helpers', () => {
    it('should create success result with ok()', () => {
      const result = ok(42);

      expect(result.success).toBe(true);
      expect(result.data).toBe(42);
      expect(result.error).toBeUndefined();
    });

    it('should create error result with err()', () => {
      const error = new Error('Test error');
      const result = err(error);

      expect(result.success).toBe(false);
      expect(result.error).toBe(error);
      expect(result.data).toBeUndefined();
    });
  });

  describe('type guards', () => {
    it('should identify success with isOk()', () => {
      const result = ok(42);

      expect(isOk(result)).toBe(true);
      expect(isErr(result)).toBe(false);
    });

    it('should identify error with isErr()', () => {
      const result = err(new Error('Test error'));

      expect(isErr(result)).toBe(true);
      expect(isOk(result)).toBe(false);
    });

    it('should narrow types with isOk', () => {
      const result: Result<number> = ok(42);

      if (isOk(result)) {
        expect(result.data).toBe(42);
      }
    });

    it('should narrow types with isErr', () => {
      const error = {
        name: 'SystemError' as const,
        message: 'Test',
        code: 'SYSTEM_ERROR' as const,
        severity: 'critical' as const,
        timestamp: Date.now(),
        subsystem: 'test',
        operation: 'test',
        retryable: false,
      };
      const result: Result<number> = err(error);

      if (isErr(result)) {
        expect(result.error).toEqual(error);
      }
    });
  });

  describe('unwrap functions', () => {
    it('should unwrap success value', () => {
      const result = ok(42);

      expect(unwrap(result)).toBe(42);
    });

    it('should throw when unwrapping error', () => {
      const result = err(new Error('Test error'));

      expect(() => unwrap(result)).toThrow('Test error');
    });

    it('should add context when unwrapping error', () => {
      const result = err(new Error('Test error'));

      expect(() => unwrap(result, 'Operation failed')).toThrow('Operation failed: Test error');
    });

    it('should unwrapOr with default value on error', () => {
      const result = err(new Error('Test error'));

      expect(unwrapOr(result, 99)).toBe(99);
    });

    it('should return success value with unwrapOr', () => {
      const result = ok(42);

      expect(unwrapOr(result, 99)).toBe(42);
    });

    it('should unwrapErr on error result', () => {
      const error = new Error('Test error');
      const result = err(error);

      expect(unwrapErr(result)).toBe(error);
    });

    it('should throw when unwrapErr on success', () => {
      const result = ok(42);

      expect(() => unwrapErr(result)).toThrow('Called unwrapErr on an ok result');
    });
  });

  describe('map functions', () => {
    it('should map success value', () => {
      const result = ok(42);
      const mapped = map(result, x => x * 2);

      expect(isOk(mapped)).toBe(true);
      expect(unwrap(mapped)).toBe(84);
    });

    it('should not map error result', () => {
      const error = {
        name: 'SystemError' as const,
        message: 'Test error',
        code: 'SYSTEM_ERROR' as const,
        severity: 'critical' as const,
        timestamp: Date.now(),
        subsystem: 'test',
        operation: 'test',
        retryable: false,
      };
      const result: Result<number> = err(error);
      const mapped = map(result, x => x * 2);

      expect(isErr(mapped)).toBe(true);
      expect(unwrapErr(mapped)).toEqual(error);
    });

    it('should mapErr on error result', () => {
      const error = {
        name: 'SystemError' as const,
        message: 'Test error',
        code: 'SYSTEM_ERROR' as const,
        severity: 'critical' as const,
        timestamp: Date.now(),
        subsystem: 'test',
        operation: 'test',
        retryable: false,
      };
      const result = err(error);
      const mapped = mapErr(result, e => ({
        ...e,
        message: `Mapped: ${e.message}`,
      }));

      expect(isErr(mapped)).toBe(true);
      expect(unwrapErr(mapped).message).toBe('Mapped: Test error');
    });

    it('should not mapErr on success result', () => {
      const result: Result<number> = ok(42);
      const mapped = mapErr(result, e => ({
        ...e,
        message: `Mapped: ${e.message}`,
      }));

      expect(isOk(mapped)).toBe(true);
      expect(unwrap(mapped)).toBe(42);
    });
  });

  describe('andThen (flatMap)', () => {
    it('should chain successful operations', () => {
      const result = ok(21);
      const chained = andThen(result, x => ok(x * 2));

      expect(isOk(chained)).toBe(true);
      expect(unwrap(chained)).toBe(42);
    });

    it('should short-circuit on first error', () => {
      const error = {
        name: 'SystemError' as const,
        message: 'First error',
        code: 'SYSTEM_ERROR' as const,
        severity: 'critical' as const,
        timestamp: Date.now(),
        subsystem: 'test',
        operation: 'test',
        retryable: false,
      };
      const result: Result<number> = err(error);
      const chained = andThen(result, x => ok(x * 2));

      expect(isErr(chained)).toBe(true);
      expect(unwrapErr(chained)).toEqual(error);
    });

    it('should propagate second error', () => {
      const result = ok(42);
      const secondError = {
        name: 'SystemError' as const,
        message: 'Second error',
        code: 'SYSTEM_ERROR' as const,
        severity: 'critical' as const,
        timestamp: Date.now(),
        subsystem: 'test',
        operation: 'test',
        retryable: false,
      };
      const chained = andThen(result, () => err(secondError));

      expect(isErr(chained)).toBe(true);
      expect(unwrapErr(chained)).toEqual(secondError);
    });
  });

  describe('async operations', () => {
    it('should andThenAsync on success', async () => {
      const result = ok(21);
      const chained = await andThenAsync(result, async x => ok(x * 2));

      expect(isOk(chained)).toBe(true);
      expect(unwrap(chained)).toBe(42);
    });

    it('should short-circuit andThenAsync on error', async () => {
      const error = {
        name: 'SystemError' as const,
        message: 'Test error',
        code: 'SYSTEM_ERROR' as const,
        severity: 'critical' as const,
        timestamp: Date.now(),
        subsystem: 'test',
        operation: 'test',
        retryable: false,
      };
      const result: Result<number> = err(error);
      const chained = await andThenAsync(result, async x => ok(x * 2));

      expect(isErr(chained)).toBe(true);
      expect(unwrapErr(chained)).toEqual(error);
    });

    it('should mapAsync on success', async () => {
      const result = ok(21);
      const mapped = await mapAsync(result, async x => x * 2);

      expect(isOk(mapped)).toBe(true);
      expect(unwrap(mapped)).toBe(42);
    });

    it('should not mapAsync on error', async () => {
      const error = {
        name: 'SystemError' as const,
        message: 'Test error',
        code: 'SYSTEM_ERROR' as const,
        severity: 'critical' as const,
        timestamp: Date.now(),
        subsystem: 'test',
        operation: 'test',
        retryable: false,
      };
      const result: Result<number> = err(error);
      const mapped = await mapAsync(result, async x => x * 2);

      expect(isErr(mapped)).toBe(true);
      expect(unwrapErr(mapped)).toEqual(error);
    });
  });

  describe('tryCatch', () => {
    it('should catch synchronous errors', () => {
      const result = tryCatch(() => {
        throw new Error('Test error');
      });

      expect(isErr(result)).toBe(true);
      expect(unwrapErr(result).message).toContain('Test error');
    });

    it('should return success on no error', () => {
      const result = tryCatch(() => 42);

      expect(isOk(result)).toBe(true);
      expect(unwrap(result)).toBe(42);
    });

    it('should use custom error handler', () => {
      const result = tryCatch(
        () => {
          throw new Error('Test error');
        },
        () => ({
          name: 'SystemError' as const,
          message: 'Custom error',
          code: 'SYSTEM_ERROR' as const,
          severity: 'critical' as const,
          timestamp: Date.now(),
          subsystem: 'test',
          operation: 'test',
          retryable: false,
        }),
      );

      expect(isErr(result)).toBe(true);
      expect(unwrapErr(result).message).toBe('Custom error');
    });
  });

  describe('tryCatchAsync', () => {
    it('should catch async errors', async () => {
      const result = await tryCatchAsync(async () => {
        throw new Error('Async error');
      });

      expect(isErr(result)).toBe(true);
      expect(unwrapErr(result).message).toContain('Async error');
    });

    it('should return success on no error', async () => {
      const result = await tryCatchAsync(async () => 42);

      expect(isOk(result)).toBe(true);
      expect(unwrap(result)).toBe(42);
    });

    it('should use custom error handler', async () => {
      const result = await tryCatchAsync(
        async () => {
          throw new Error('Async error');
        },
        () => ({
          name: 'NetworkError' as const,
          message: 'Custom async error',
          code: 'NETWORK_ERROR' as const,
          severity: 'high' as const,
          timestamp: Date.now(),
          endpoint: '/test',
          method: 'GET',
          retryable: true,
        }),
      );

      expect(isErr(result)).toBe(true);
      expect(unwrapErr(result).message).toBe('Custom async error');
    });
  });

  describe('fromPromise and toPromise', () => {
    it('should convert successful promise to Result', async () => {
      const promise = Promise.resolve(42);
      const result = await fromPromise(promise);

      expect(isOk(result)).toBe(true);
      expect(unwrap(result)).toBe(42);
    });

    it('should convert rejected promise to Error Result', async () => {
      const promise = Promise.reject(new Error('Promise error'));
      const result = await fromPromise(promise);

      expect(isErr(result)).toBe(true);
      expect(unwrapErr(result).message).toContain('Promise error');
    });

    it('should convert Result to Promise', async () => {
      const result = ok(42);
      const value = await toPromise(result);

      expect(value).toBe(42);
    });

    it('should convert Error Result to rejected Promise', async () => {
      const result = err(new Error('Test error'));

      await expect(toPromise(result)).rejects.toThrow('Test error');
    });
  });

  describe('collect', () => {
    it('should collect all success results', () => {
      const results = [ok(1), ok(2), ok(3)];
      const collected = collect(results);

      expect(isOk(collected)).toBe(true);
      expect(unwrap(collected)).toEqual([1, 2, 3]);
    });

    it('should return first error', () => {
      const error1 = {
        name: 'SystemError' as const,
        message: 'Error 1',
        code: 'SYSTEM_ERROR' as const,
        severity: 'critical' as const,
        timestamp: Date.now(),
        subsystem: 'test',
        operation: 'test',
        retryable: false,
      };
      const error2 = {
        name: 'SystemError' as const,
        message: 'Error 2',
        code: 'SYSTEM_ERROR' as const,
        severity: 'critical' as const,
        timestamp: Date.now(),
        subsystem: 'test',
        operation: 'test',
        retryable: false,
      };
      const results: Array<Result<number>> = [ok(1), err(error1), err(error2)];
      const collected = collect(results);

      expect(isErr(collected)).toBe(true);
      expect(unwrapErr(collected)).toEqual(error1);
    });

    it('should handle empty array', () => {
      const results: Array<Result<number>> = [];
      const collected = collect(results);

      expect(isOk(collected)).toBe(true);
      expect(unwrap(collected)).toEqual([]);
    });
  });

  describe('collectAll', () => {
    it('should collect all results including errors', () => {
      const error = {
        name: 'SystemError' as const,
        message: 'Error',
        code: 'SYSTEM_ERROR' as const,
        severity: 'critical' as const,
        timestamp: Date.now(),
        subsystem: 'test',
        operation: 'test',
        retryable: false,
      };
      const results: Array<Result<number>> = [ok(1), err(error), ok(3)];
      const collected = collectAll(results);

      expect(collected).toHaveLength(3);
      expect(collected[0]).toEqual({ success: true, data: 1, error: undefined });
      expect(collected[1]).toEqual({ success: false, data: undefined, error });
      expect(collected[2]).toEqual({ success: true, data: 3, error: undefined });
    });
  });

  describe('retry', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('should retry on retryable error', async () => {
      let attempt = 0;
      const fn = vi.fn(async () => {
        attempt++;
        if (attempt < 3) {
          return err({
            name: 'NetworkError' as const,
            message: 'Retryable error',
            code: 'NETWORK_ERROR' as const,
            severity: 'high' as const,
            timestamp: Date.now(),
            endpoint: '/test',
            method: 'GET',
            retryable: true,
          });
        }
        return ok(42);
      });

      const promise = retry(fn, 3, 100);
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(isOk(result)).toBe(true);
      expect(unwrap(result)).toBe(42);
      expect(fn).toHaveBeenCalledTimes(3);

      vi.useRealTimers();
    });

    it('should not retry non-retryable error', async () => {
      const fn = vi.fn(async () =>
        err({
          name: 'ValidationError' as const,
          message: 'Non-retryable error',
          code: 'VALIDATION_ERROR' as const,
          severity: 'medium' as const,
          timestamp: Date.now(),
          retryable: false,
        }),
      );

      const promise = retry(fn, 3, 0);
      const result = await promise;

      expect(isErr(result)).toBe(true);
      expect(fn).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });

    it('should return error after max attempts', async () => {
      const fn = vi.fn(async () =>
        err({
          name: 'NetworkError' as const,
          message: 'Persistent error',
          code: 'NETWORK_ERROR' as const,
          severity: 'high' as const,
          timestamp: Date.now(),
          endpoint: '/test',
          method: 'GET',
          retryable: true,
        }),
      );

      const promise = retry(fn, 3, 0);
      const result = await promise;

      expect(isErr(result)).toBe(true);
      expect(unwrapErr(result).message).toBe('Persistent error');
      expect(fn).toHaveBeenCalledTimes(3);

      vi.useRealTimers();
    });
  });

  describe('withTimeout', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('should resolve before timeout', async () => {
      const promise = Promise.resolve(ok(42));
      const resultPromise = withTimeout(promise, 1000);

      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(isOk(result)).toBe(true);
      expect(unwrap(result)).toBe(42);

      vi.useRealTimers();
    });

    it('should timeout slow operation', async () => {
      const promise = new Promise<Result<number>>(() => {
        // Never resolves
      });

      const resultPromise = withTimeout(promise, 1000);
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(isErr(result)).toBe(true);
      expect(unwrapErr(result).message).toContain('timed out');

      vi.useRealTimers();
    });
  });

  describe('safe wrappers', () => {
    it('should wrap async operation safely', async () => {
      const result = await safeAsync(async () => 42);

      expect(isOk(result)).toBe(true);
      expect(unwrap(result)).toBe(42);
    });

    it('should catch async errors safely', async () => {
      const result = await safeAsync(async () => {
        throw new Error('Async error');
      }, 'test context');

      expect(isErr(result)).toBe(true);
      expect(unwrapErr(result).message).toContain('Async error');
    });

    it('should wrap sync operation safely', () => {
      const result = safeSync(() => 42);

      expect(isOk(result)).toBe(true);
      expect(unwrap(result)).toBe(42);
    });

    it('should catch sync errors safely', () => {
      const result = safeSync(() => {
        throw new Error('Sync error');
      }, 'test context');

      expect(isErr(result)).toBe(true);
      expect(unwrapErr(result).message).toContain('Sync error');
    });
  });

  describe('withContext', () => {
    it('should return result with context', () => {
      const result = ok(42);
      const contextResult = withContext(result, { userId: '123' });

      expect(contextResult).toBe(result);
    });
  });

  describe('match', () => {
    it('should match on success', () => {
      const result: Result<number> = ok(42);
      const value = match(result, {
        ok: x => `Success: ${x}`,
        err: e => `Error: ${e.message}`,
      });

      expect(value).toBe('Success: 42');
    });

    it('should match on error', () => {
      const error = {
        name: 'SystemError' as const,
        message: 'Test error',
        code: 'SYSTEM_ERROR' as const,
        severity: 'critical' as const,
        timestamp: Date.now(),
        subsystem: 'test',
        operation: 'test',
        retryable: false,
      };
      const result: Result<number> = err(error);
      const value = match(result, {
        ok: (x: number) => `Success: ${x}`,
        err: e => `Error: ${e.message}`,
      });

      expect(value).toBe('Error: Test error');
    });
  });

  describe('tap functions', () => {
    it('should tap on success', () => {
      const fn = vi.fn();
      const result = ok(42);
      const tapped = tap(result, fn);

      expect(fn).toHaveBeenCalledWith(42);
      expect(tapped).toBe(result);
    });

    it('should not tap on error', () => {
      const fn = vi.fn();
      const error = {
        name: 'SystemError' as const,
        message: 'Test error',
        code: 'SYSTEM_ERROR' as const,
        severity: 'critical' as const,
        timestamp: Date.now(),
        subsystem: 'test',
        operation: 'test',
        retryable: false,
      };
      const result: Result<number> = err(error);
      const tapped = tap(result, fn);

      expect(fn).not.toHaveBeenCalled();
      expect(tapped).toBe(result);
    });

    it('should tapErr on error', () => {
      const fn = vi.fn();
      const error = {
        name: 'SystemError' as const,
        message: 'Test error',
        code: 'SYSTEM_ERROR' as const,
        severity: 'critical' as const,
        timestamp: Date.now(),
        subsystem: 'test',
        operation: 'test',
        retryable: false,
      };
      const result = err(error);
      const tapped = tapErr(result, fn);

      expect(fn).toHaveBeenCalledWith(error);
      expect(tapped).toBe(result);
    });

    it('should not tapErr on success', () => {
      const fn = vi.fn();
      const result: Result<number> = ok(42);
      const tapped = tapErr(result, fn);

      expect(fn).not.toHaveBeenCalled();
      expect(tapped).toBe(result);
    });
  });

  describe('combine', () => {
    it('should combine multiple promises', async () => {
      const promises = [Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)];
      const results = await combine(promises);

      expect(results).toEqual([1, 2, 3]);
    });
  });

  describe('combineResults', () => {
    it('should combine all successful results', async () => {
      const promises = [Promise.resolve(ok(1)), Promise.resolve(ok(2)), Promise.resolve(ok(3))];
      const result = await combineResults(promises);

      expect(isOk(result)).toBe(true);
      expect(unwrap(result)).toEqual([1, 2, 3]);
    });

    it('should return first error', async () => {
      const error = {
        name: 'SystemError' as const,
        message: 'Error',
        code: 'SYSTEM_ERROR' as const,
        severity: 'critical' as const,
        timestamp: Date.now(),
        subsystem: 'test',
        operation: 'test',
        retryable: false,
      };
      const promises = [Promise.resolve(ok(1)), Promise.resolve(err(error)), Promise.resolve(ok(3))];
      const result = await combineResults(promises);

      expect(isErr(result)).toBe(true);
      expect(unwrapErr(result)).toEqual(error);
    });
  });
});
