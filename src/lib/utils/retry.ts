import { logger } from '@/lib/logging/logger';

interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  backoffFactor?: number;
  jitterFactor?: number;
  retryableStatusCodes?: number[];
  logLabel?: string;
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  backoffFactor: 2,
  jitterFactor: 0.5,
  retryableStatusCodes: [429, 500, 502, 503, 504],
  logLabel: 'Retryable Operation',
};

interface ErrorWithResponse {
  response?: { status?: number };
  status?: number;
}

export async function withRetry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  const {
    maxAttempts,
    initialDelayMs,
    backoffFactor,
    jitterFactor,
    retryableStatusCodes,
    logLabel,
  } = opts;

  let attempt = 0;
  while (attempt < maxAttempts) {
    try {
      return await fn();
    } catch (error: unknown) {
      attempt++;
      const isLastAttempt = attempt === maxAttempts;

      let statusCode: number | undefined;
      const errorObj = error as ErrorWithResponse;

      if (errorObj.response && typeof errorObj.response.status === 'number') {
        statusCode = errorObj.response.status;
      } else if (typeof errorObj.status === 'number') {
        statusCode = errorObj.status;
      }

      const errorMessage = error instanceof Error ? error.message : String(error);
      const isRetryableError =
        (statusCode && retryableStatusCodes.includes(statusCode)) ||
        !statusCode ||
        errorMessage.includes('NetworkError') ||
        errorMessage.includes('Failed to fetch');

      if (!isRetryableError || isLastAttempt) {
        logger.error(`[${logLabel}] Failed after ${attempt} attempts.`, {
          error,
          attempt,
          isRetryableError,
          statusCode,
        });
        throw error;
      }

      let delay = initialDelayMs * backoffFactor ** (attempt - 1);
      const jitter = delay * jitterFactor * (Math.random() - 0.5) * 2;
      delay = Math.max(0, delay + jitter);

      logger.warn(`[${logLabel}] Attempt ${attempt} failed. Retrying in ${delay.toFixed(2)}ms...`, {
        error,
        attempt,
        delay,
        statusCode,
      });

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error(
    `[${logLabel}] Unexpected error: Failed to complete after ${maxAttempts} attempts.`,
  );
}
