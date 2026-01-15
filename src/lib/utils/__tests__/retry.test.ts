import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { logger } from '@/lib/logging/logger';
import { withRetry } from '@/lib/utils/retry';

vi.mock('@/lib/logging/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('withRetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('successful operations', () => {
    it('should return result on first successful attempt', async () => {
      const mockFn = vi.fn().mockResolvedValue('success');

      const result = await withRetry(mockFn);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(logger.error).not.toHaveBeenCalled();
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('should work with different return types', async () => {
      const mockFn = vi.fn().mockResolvedValue({ data: 'test', count: 42 });

      const result = await withRetry(mockFn);

      expect(result).toEqual({ data: 'test', count: 42 });
    });
  });

  describe('retry logic', () => {
    it('should retry on retryable status codes (429)', async () => {
      const mockFn = vi
        .fn()
        .mockRejectedValueOnce({ response: { status: 429 } })
        .mockResolvedValue('success');

      const promise = withRetry(mockFn, { maxAttempts: 3 });

      // Fast-forward through the delay
      await vi.runAllTimersAsync();

      const result = await promise;

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(logger.warn).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable status codes (500, 502, 503, 504)', async () => {
      const statusCodes = [500, 502, 503, 504];

      for (const statusCode of statusCodes) {
        vi.clearAllMocks();
        const mockFn = vi
          .fn()
          .mockRejectedValueOnce({ response: { status: statusCode } })
          .mockResolvedValue('success');

        const promise = withRetry(mockFn, { maxAttempts: 2 });
        await vi.runAllTimersAsync();
        const result = await promise;

        expect(result).toBe('success');
        expect(mockFn).toHaveBeenCalledTimes(2);
      }
    });

    it('should retry on network errors', async () => {
      const mockFn = vi
        .fn()
        .mockRejectedValueOnce(new Error('NetworkError: Failed to connect'))
        .mockResolvedValue('success');

      const promise = withRetry(mockFn, { maxAttempts: 2 });
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should retry on "Failed to fetch" errors', async () => {
      const mockFn = vi.fn().mockRejectedValueOnce(new Error('Failed to fetch')).mockResolvedValue('success');

      const promise = withRetry(mockFn, { maxAttempts: 2 });
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should respect maxAttempts option', async () => {
      const mockFn = vi.fn().mockRejectedValue({ response: { status: 503 } });

      const promise = withRetry(mockFn, { maxAttempts: 2 }).catch(e => e);
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result).toEqual({ response: { status: 503 } });
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(logger.error).toHaveBeenCalledTimes(1);
    });
  });

  describe('non-retryable errors', () => {
    it('should not retry on non-retryable status codes (400)', async () => {
      const mockFn = vi.fn().mockRejectedValue({ response: { status: 400 } });

      await expect(withRetry(mockFn, { maxAttempts: 3 })).rejects.toEqual({
        response: { status: 400 },
      });

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('should not retry on 401 Unauthorized', async () => {
      const mockFn = vi.fn().mockRejectedValue({ response: { status: 401 } });

      await expect(withRetry(mockFn)).rejects.toEqual({ response: { status: 401 } });
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should not retry on 404 Not Found', async () => {
      const mockFn = vi.fn().mockRejectedValue({ response: { status: 404 } });

      await expect(withRetry(mockFn)).rejects.toEqual({ response: { status: 404 } });
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('backoff and jitter', () => {
    it('should apply exponential backoff', async () => {
      const mockFn = vi
        .fn()
        .mockRejectedValueOnce({ response: { status: 503 } })
        .mockRejectedValueOnce({ response: { status: 503 } })
        .mockResolvedValue('success');

      const promise = withRetry(mockFn, {
        maxAttempts: 3,
        initialDelayMs: 100,
        backoffFactor: 2,
        jitterFactor: 0,
      });

      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
      expect(logger.warn).toHaveBeenCalledTimes(2);
    });

    it('should apply custom initial delay', async () => {
      const mockFn = vi
        .fn()
        .mockRejectedValueOnce({ response: { status: 503 } })
        .mockResolvedValue('success');

      const promise = withRetry(mockFn, {
        initialDelayMs: 500,
        jitterFactor: 0,
      });

      await vi.runAllTimersAsync();
      await promise;

      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Retrying in 500'), expect.any(Object));
    });

    it('should apply jitter to delay', async () => {
      const mockFn = vi
        .fn()
        .mockRejectedValueOnce({ response: { status: 503 } })
        .mockResolvedValue('success');

      // With jitter, delay will vary but should be within reasonable range
      const promise = withRetry(mockFn, {
        initialDelayMs: 1000,
        jitterFactor: 0.5,
      });

      await vi.runAllTimersAsync();
      await promise;

      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Retrying in'), expect.any(Object));
    });
  });

  describe('custom options', () => {
    it('should use custom retryableStatusCodes', async () => {
      const mockFn = vi.fn().mockRejectedValue({ response: { status: 418 } });

      const promise = withRetry(mockFn, {
        maxAttempts: 2,
        retryableStatusCodes: [418],
      }).catch(e => e); // Catch to prevent unhandled rejection

      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result).toEqual({ response: { status: 418 } });
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should use custom logLabel', async () => {
      const mockFn = vi.fn().mockRejectedValue({ response: { status: 503 } });

      const promise = withRetry(mockFn, {
        maxAttempts: 1,
        logLabel: 'Custom Operation',
      }).catch(e => e); // Catch to prevent unhandled rejection

      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result).toEqual({ response: { status: 503 } });
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('[Custom Operation]'), expect.any(Object));
    });
  });

  describe('error handling with different error formats', () => {
    it('should handle errors with status property directly', async () => {
      const mockFn = vi.fn().mockRejectedValue({ status: 503 });

      const promise = withRetry(mockFn, { maxAttempts: 2 }).catch(e => e);
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result).toEqual({ status: 503 });
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(logger.warn).toHaveBeenCalledTimes(1);
    });

    it('should handle Error instances', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('Custom error'));

      const promise = withRetry(mockFn, { maxAttempts: 2 }).catch(e => e);
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result).toBeInstanceOf(Error);
      expect((result as Error).message).toBe('Custom error');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should handle non-Error objects', async () => {
      const mockFn = vi.fn().mockRejectedValue('string error');

      const promise = withRetry(mockFn, { maxAttempts: 2 }).catch(e => e);
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result).toBe('string error');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('logging', () => {
    it('should log warnings on retry attempts', async () => {
      const mockFn = vi
        .fn()
        .mockRejectedValueOnce({ response: { status: 503 } })
        .mockResolvedValue('success');

      const promise = withRetry(mockFn, { logLabel: 'Test Operation' });
      await vi.runAllTimersAsync();
      await promise;

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('[Test Operation] Attempt 1 failed'),
        expect.objectContaining({
          attempt: 1,
          statusCode: 503,
        }),
      );
    });

    it('should log error on final failure', async () => {
      const mockFn = vi.fn().mockRejectedValue({ response: { status: 503 } });

      const promise = withRetry(mockFn, { maxAttempts: 2, logLabel: 'Test Operation' }).catch(e => e);
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result).toEqual({ response: { status: 503 } });
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('[Test Operation] Failed after 2 attempts'),
        expect.objectContaining({
          attempt: 2,
          isRetryableError: true,
          statusCode: 503,
        }),
      );
    });
  });
});
