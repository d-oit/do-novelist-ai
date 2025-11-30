/**
 * Result Type - Functional error handling pattern
 * Based on 2024-2025 TypeScript best practices
 */

import type { AppError } from './error-types';
import { toAppError } from './error-types';

/**
 * Result type - represents either a success or failure
 */
export type Result<T, E = AppError> =
  | { success: true; data: T; error?: undefined }
  | { success: false; data?: undefined; error: E };

/**
 * Success helper
 */
export const ok = <T>(data: T): Result<T, never> => ({
  success: true,
  data,
});

/**
 * Failure helper
 */
export const err = <E>(error: E): Result<never, E> => ({
  success: false,
  error,
});

/**
 * Type guard for success
 */
export const isOk = <T, E>(result: Result<T, E>): result is { success: true; data: T } =>
  result.success === true;

/**
 * Type guard for error
 */
export const isErr = <T, E>(result: Result<T, E>): result is { success: false; error: E } =>
  result.success === false;

/**
 * Unwrap success value or throw
 */
export const unwrap = <T, E>(result: Result<T, E>, context?: string): T => {
  if (isOk(result)) {
    return result.data;
  }
  const error = result.error;
  const errorMessage = error instanceof Error ? error.message : String(error);
  throw context ? `${context}: ${errorMessage}` : errorMessage;
};

/**
 * Unwrap with default value
 */
export const unwrapOr = <T, E>(result: Result<T, E>, defaultValue: T): T => {
  return isOk(result) ? result.data : defaultValue;
};

/**
 * Unwrap error or throw
 */
export const unwrapErr = <T, E>(result: Result<T, E>): E => {
  if (isErr(result)) {
    return result.error;
  }
  throw new Error('Called unwrapErr on an ok result');
};

/**
 * Map success value
 */
export const map = <T, E, U>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> => {
  return isOk(result) ? ok(fn(result.data)) : result;
};

/**
 * Map error value
 */
export const mapErr = <T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> => {
  return isErr(result) ? err(fn(result.error)) : result;
};

/**
 * Chain operations that can fail
 */
export const andThen = <T, E, U>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> => {
  return isOk(result) ? fn(result.data) : result;
};

/**
 * Chain operations that can fail (async)
 */
export const andThenAsync = <T, E, U>(
  result: Result<T, E>,
  fn: (value: T) => Promise<Result<U, E>>
): Promise<Result<U, E>> => {
  return isOk(result) ? fn(result.data) : Promise.resolve(result);
};

/**
 * Map success value (async)
 */
export const mapAsync = <T, E, U>(
  result: Result<T, E>,
  fn: (value: T) => Promise<U>
): Promise<Result<U, E>> => {
  return isOk(result) ? fn(result.data).then(ok) : Promise.resolve(result);
};

/**
 * Execute function and convert to Result
 */
export const tryCatch = <T>(
  fn: () => T,
  errorHandler?: (error: unknown) => AppError
): Result<T, AppError> => {
  try {
    return ok(fn());
  } catch (error) {
    const appError = errorHandler ? errorHandler(error) : toAppError(error);
    return err(appError);
  }
};

/**
 * Execute async function and convert to Result
 */
export const tryCatchAsync = <T>(
  fn: () => Promise<T>,
  errorHandler?: (error: unknown) => AppError
): Promise<Result<T, AppError>> => {
  return fn()
    .then(value => ok(value))
    .catch(error => {
      const _appError = errorHandler ? errorHandler(error) : toAppError(error);
      return err(_appError);
    });
};

/**
 * Convert Promise to Result
 */
export const fromPromise = <T>(
  promise: Promise<T>,
  errorHandler?: (error: unknown) => AppError
): Promise<Result<T, AppError>> => {
  return promise
    .then(value => ok(value))
    .catch(error => {
      const appError = errorHandler ? errorHandler(error) : toAppError(error);
      return err(appError);
    });
};

/**
 * Convert Result to Promise
 */
export const toPromise = <T, E>(result: Result<T, E>): Promise<T> => {
  return isOk(result) ? Promise.resolve(result.data) : Promise.reject(result.error);
};

/**
 * Collect multiple results - returns first error or all success values
 */
export const collect = <T, E>(results: Array<Result<T, E>>): Result<T[], E> => {
  const values: T[] = [];
  for (const result of results) {
    if (isErr(result)) {
      return result;
    }
    values.push(result.data);
  }
  return ok(values);
};

/**
 * Collect array of results with potential errors
 */
export const collectAll = <T, E>(
  results: Array<Result<T, E>>
): Array<{ success: boolean; data?: T; error?: E }> => {
  return results.map(result => ({
    success: isOk(result),
    data: isOk(result) ? result.data : undefined,
    error: isErr(result) ? result.error : undefined,
  }));
};

/**
 * Retry operation N times
 */
export const retry = async <T>(
  fn: () => Promise<Result<T, AppError>>,
  maxAttempts: number,
  delayMs: number = 0
): Promise<Result<T, AppError>> => {
  let lastError: AppError | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const result = await fn();
    if (isOk(result)) {
      return result;
    }
    lastError = result.error;

    if (attempt < maxAttempts && result.error.retryable) {
      if (delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    } else {
      break;
    }
  }

  return err(lastError!);
};

/**
 * Execute operation with timeout
 */
export const withTimeout = <T>(
  promise: Promise<Result<T, AppError>>,
  timeoutMs: number
): Promise<Result<T, AppError>> => {
  return new Promise(resolve => {
    const timeout = setTimeout(() => {
      resolve(err(toAppError(new Error('Operation timed out'), 'withTimeout') as AppError));
    }, timeoutMs);

    promise
      .then(result => {
        clearTimeout(timeout);
        resolve(result);
      })
      .catch(error => {
        clearTimeout(timeout);
        resolve(err(toAppError(error, 'withTimeout')));
      });
  });
};

/**
 * Safe async operation wrapper
 */
export const safeAsync = async <T>(
  operation: () => Promise<T>,
  context?: string
): Promise<Result<T, AppError>> => {
  return tryCatchAsync(
    async () => {
      const result = await operation();
      return result;
    },
    error => toAppError(error, context)
  );
};

/**
 * Safe synchronous operation wrapper
 */
export const safeSync = <T>(operation: () => T, context?: string): Result<T, AppError> => {
  return tryCatch(
    () => operation(),
    error => toAppError(error, context)
  );
};

/**
 * Perform operation with result context
 */
export const withContext = <T, E extends AppError>(
  result: Result<T, E>,
  _context: Record<string, unknown>
): Result<T, E> => {
  // Context is read-only in BaseError, so we just return the result
  // In practice, errors should be created with context initially
  return result;
};

/**
 * Match - pattern matching for Result
 */
export const match = <T, E, U>(
  result: Result<T, E>,
  handlers: {
    ok: (value: T) => U;
    err: (error: E) => U;
  }
): U => {
  return isOk(result) ? handlers.ok(result.data) : handlers.err(result.error);
};

/**
 * Execute side-effect if success
 */
export const tap = <T, E>(result: Result<T, E>, fn: (value: T) => void): Result<T, E> => {
  if (isOk(result)) {
    fn(result.data);
  }
  return result;
};

/**
 * Execute side-effect if error
 */
export const tapErr = <T, E>(result: Result<T, E>, fn: (error: E) => void): Result<T, E> => {
  if (isErr(result)) {
    fn(result.error);
  }
  return result;
};

/**
 * Combine multiple async operations - fail fast
 */
export const combine = async <T extends Array<Promise<any>>>(
  promises: T
): Promise<{ [K in keyof T]: Awaited<T[K]> extends Promise<infer R> ? R : T[K] }> => {
  const results = await Promise.all(promises);
  return results as any;
};

/**
 * Combine results with aggregation - fail fast
 */
export const combineResults = async <T extends Array<Promise<Result<any, AppError>>>>(
  promises: T
): Promise<
  Result<
    {
      [K in keyof T]: Awaited<T[K]> extends Promise<infer R>
        ? R extends { success: true; data: infer D }
          ? D
          : never
        : never;
    },
    AppError
  >
> => {
  const results = await Promise.all(promises);
  const firstError = results.find(isErr);
  if (firstError) {
    return firstError as any;
  }
  return ok(results.map(r => (r as any).data)) as any;
};
