/**
 * Error Handler - Centralized error handling service
 * Based on 2024-2025 best practices
 */

import { logger } from './logging';
import type { AppError } from './error-types';
import { toAppError, getErrorMessage } from './error-types';
import { type Result, retry as retryResult, tryCatch, tryCatchAsync, isErr, err } from './result';

export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  maxDelayMs?: number;
  retryCondition?: (error: AppError) => boolean;
}

export interface ErrorReportingOptions {
  reportToConsole?: boolean;
  reportToSentry?: boolean;
  reportToAnalytics?: boolean;
}

/**
 * Global error handler configuration
 */
export interface ErrorHandlerConfig {
  enableRetry: boolean;
  defaultRetryOptions: RetryOptions;
  enableGlobalHandlers: boolean;
  enableUnhandledRejectionHandler: boolean;
  reporting: ErrorReportingOptions;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: ErrorHandlerConfig = {
  enableRetry: true,
  defaultRetryOptions: {
    maxAttempts: 3,
    delayMs: 500,
    backoffMultiplier: 2,
    maxDelayMs: 5000,
    retryCondition: (error: AppError) => error.retryable,
  },
  enableGlobalHandlers: true,
  enableUnhandledRejectionHandler: true,
  reporting: {
    reportToConsole: true,
    reportToSentry: true,
    reportToAnalytics: true,
  },
};

/**
 * Centralized error handler service
 */
export class ErrorHandler {
  private config: ErrorHandlerConfig;
  private errorListeners: Set<(error: AppError) => void> = new Set();
  private handledErrorsCount = 0;

  public constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeGlobalHandlers();
  }

  /**
   * Initialize global error handlers
   */
  private initializeGlobalHandlers(): void {
    if (typeof window === 'undefined') return;

    // Uncaught exceptions
    if (this.config.enableGlobalHandlers) {
      window.addEventListener('error', event => {
        const error = toAppError(event.error ?? event.message, 'global-error');
        this.handle(error, { source: 'window.onerror', fatal: true });
      });

      // Unhandled promise rejections
      if (this.config.enableUnhandledRejectionHandler) {
        window.addEventListener('unhandledrejection', event => {
          const error = toAppError(event.reason, 'unhandledrejection');
          this.handle(error, { source: 'unhandledrejection', fatal: true });
        });
      }
    }
  }

  /**
   * Handle an error with logging and reporting
   */
  public handle(
    error: unknown,
    options: {
      context?: string;
      source?: string;
      fatal?: boolean;
      report?: boolean;
    } = {},
  ): AppError {
    const appError = toAppError(error, options.context);
    this.handledErrorsCount++;

    // Log error
    if (options.report !== false) {
      this.reportError(appError, options);
    }

    // Notify listeners
    this.errorListeners.forEach(listener => {
      try {
        listener(appError);
      } catch (listenerError) {
        console.error('Error in error listener:', listenerError);
      }
    });

    // Re-throw if fatal
    if (options.fatal === true) {
      throw appError;
    }

    return appError;
  }

  /**
   * Report error to configured services
   */
  private reportError(error: AppError, options: { source?: string; fatal?: boolean }): void {
    const context = {
      source: options.source ?? 'error-handler',
      fatal: options.fatal ?? false,
      count: this.handledErrorsCount,
    };

    // Console logging
    if (this.config.reporting.reportToConsole === true) {
      logger.logError(error, context);
    }

    // Sentry reporting
    if (this.config.reporting.reportToSentry === true && typeof window !== 'undefined') {
      const Sentry = (
        window as {
          Sentry?: { captureException: (error: Error, options: Record<string, unknown>) => void };
        }
      ).Sentry;
      if (Sentry) {
        Sentry.captureException(error, {
          level: this.mapSeverityToSentry(error.severity),
          extra: { ...error.context, ...context },
          tags: {
            errorCode: error.code,
            errorName: error.name,
          },
        });
      }
    }

    // Analytics
    if (this.config.reporting.reportToAnalytics === true) {
      logger.info('Error reported', {
        errorCode: error.code,
        errorName: error.name,
        severity: error.severity,
        source: options.source,
        fatal: options.fatal,
      });
    }
  }

  /**
   * Map error severity to Sentry level
   */
  private mapSeverityToSentry(severity: string): string {
    switch (severity) {
      case 'critical':
        return 'fatal';
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'error';
    }
  }

  /**
   * Execute operation with retry logic
   */
  public async executeWithRetry<T>(
    operation: () => Promise<Result<T, AppError>>,
    options: RetryOptions = {},
  ): Promise<Result<T, AppError>> {
    const retryOptions = { ...this.config.defaultRetryOptions, ...options };

    if (!this.config.enableRetry) {
      return operation();
    }

    return retryResult(
      async () => {
        const result = await operation();
        if (
          isErr(result) &&
          retryOptions.retryCondition &&
          !retryOptions.retryCondition(result.error)
        ) {
          return result;
        }
        return result;
      },
      retryOptions.maxAttempts ?? 3,
      retryOptions.delayMs ?? 500,
    );
  }

  /**
   * Execute operation with retry and timeout
   */
  public async executeWithRetryAndTimeout<T>(
    operation: () => Promise<Result<T, AppError>>,
    timeoutMs: number,
    options: RetryOptions = {},
  ): Promise<Result<T, AppError>> {
    const retryOptions = { ...this.config.defaultRetryOptions, ...options };

    return retryResult(
      async () => {
        const timeoutPromise = new Promise<Result<T, AppError>>(resolve => {
          setTimeout(() => {
            resolve(err(toAppError(new Error('Operation timed out'), 'timeout')));
          }, timeoutMs);
        });

        const result = await Promise.race([operation(), timeoutPromise]);
        if (
          isErr(result) &&
          retryOptions.retryCondition &&
          !retryOptions.retryCondition(result.error)
        ) {
          return result;
        }
        return result;
      },
      retryOptions.maxAttempts ?? 3,
      retryOptions.delayMs ?? 500,
    );
  }

  /**
   * Wrap async function with error handling
   */
  public wrapAsync<T extends unknown[], R>(
    fn: (...args: T) => Promise<R>,
    context?: string,
  ): (...args: T) => Promise<Result<R, AppError>> {
    return async (...args: T): Promise<Result<R, AppError>> => {
      return tryCatchAsync(
        async () => fn(...args),
        error => toAppError(error, context),
      );
    };
  }

  /**
   * Wrap sync function with error handling
   */
  public wrapSync<T extends unknown[], R>(
    fn: (...args: T) => R,
    context?: string,
  ): (...args: T) => Result<R, AppError> {
    return (...args: T): Result<R, AppError> => {
      return tryCatch(
        () => fn(...args),
        error => toAppError(error, context),
      );
    };
  }

  /**
   * Add error listener
   */
  public addErrorListener(listener: (error: AppError) => void): () => void {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  /**
   * Remove error listener
   */
  public removeErrorListener(listener: (error: AppError) => void): void {
    this.errorListeners.delete(listener);
  }

  /**
   * Get error statistics
   */
  public getStats(): {
    handledErrorsCount: number;
    listenersCount: number;
    config: ErrorHandlerConfig;
  } {
    return {
      handledErrorsCount: this.handledErrorsCount,
      listenersCount: this.errorListeners.size,
      config: this.config,
    };
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<ErrorHandlerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get user-friendly error message
   */
  public getUserMessage(error: unknown): string {
    return getErrorMessage(error);
  }

  /**
   * Check if error should be retried
   */
  public shouldRetry(error: unknown): boolean {
    const appError = toAppError(error);
    const defaultCondition = this.config.defaultRetryOptions.retryCondition;
    return defaultCondition ? defaultCondition(appError) : appError.retryable;
  }

  /**
   * Recover from error
   */
  public async recoverFromError<T>(error: unknown, recoveryFn: () => Promise<T>): Promise<T> {
    const appError = toAppError(error);
    logger.warn('Attempting to recover from error', {
      errorCode: appError.code,
      errorName: appError.name,
    });

    try {
      const result = await recoveryFn();
      logger.info('Successfully recovered from error');
      return result;
    } catch (recoveryError) {
      logger.error('Recovery failed', { recoveryError });
      throw appError;
    }
  }
}

/**
 * Global error handler instance
 */
export const errorHandler = new ErrorHandler();

/**
 * Convenience functions
 */
export const handleError = (error: unknown, context?: string): AppError => {
  return errorHandler.handle(error, { context, report: true });
};

export const executeWithRetry = <T>(
  operation: () => Promise<Result<T, AppError>>,
  options?: RetryOptions,
): Promise<Result<T, AppError>> => {
  return errorHandler.executeWithRetry(operation, options);
};

export const wrapAsync = <T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  context?: string,
): ((...args: T) => Promise<Result<R, AppError>>) => {
  return errorHandler.wrapAsync(fn, context);
};

export const wrapSync = <T extends unknown[], R>(
  fn: (...args: T) => R,
  context?: string,
): ((...args: T) => Result<R, AppError>) => {
  return errorHandler.wrapSync(fn, context);
};

export const getUserMessage = (error: unknown): string => {
  return errorHandler.getUserMessage(error);
};

export const shouldRetry = (error: unknown): boolean => {
  return errorHandler.shouldRetry(error);
};

/**
 * React error boundary helper
 */
export const createErrorHandler = (
  componentName: string,
): {
  handleError: (error: unknown) => void;
  getErrorMessage: (error: unknown) => string;
} => {
  return {
    handleError: (error: unknown): void => {
      errorHandler.handle(error, {
        context: componentName,
        source: 'react-component',
      });
    },
    getErrorMessage: (error: unknown): string => {
      return errorHandler.getUserMessage(error);
    },
  };
};
