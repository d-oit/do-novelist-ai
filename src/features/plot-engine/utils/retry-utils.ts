/**
 * Retry Utilities
 *
 * Generic retry logic with exponential backoff for handling transient failures
 */

import { logger } from '@/lib/logging/logger';

export const MAX_RETRIES = 3;
export const INITIAL_DELAY_MS = 100;
export const BACKOFF_MULTIPLIER = 2;

export interface RetryableError extends Error {
  retryable?: boolean;
}

export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const errorMsg = error.message.toLowerCase();
    if (
      errorMsg.includes('timeout') ||
      errorMsg.includes('network') ||
      errorMsg.includes('fetch')
    ) {
      return true;
    }
    if (
      errorMsg.includes('rate limit') ||
      errorMsg.includes('429') ||
      errorMsg.includes('too many')
    ) {
      return true;
    }
    if (errorMsg.includes('500') || errorMsg.includes('502') || errorMsg.includes('503')) {
      return true;
    }
  }
  const retryableError = error as RetryableError;
  return retryableError?.retryable === true;
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  context: string,
  maxRetries: number = MAX_RETRIES,
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries && isRetryableError(error)) {
        const delay = INITIAL_DELAY_MS * Math.pow(BACKOFF_MULTIPLIER, attempt - 1);
        logger.warn(`Retrying operation (attempt ${attempt}/${maxRetries})`, {
          context,
          delay,
          error: lastError.message,
        });
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        logger.error(`Operation failed after ${attempt} attempts`, {
          context,
          error: lastError,
          retryable: isRetryableError(error),
        });
        throw lastError;
      }
    }
  }

  throw lastError || new Error('Unknown error occurred');
}
