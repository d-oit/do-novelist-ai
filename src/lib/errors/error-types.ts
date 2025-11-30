/**
 * Error Types - Comprehensive error classification system
 * Based on 2024-2025 TypeScript best practices
 */

/**
 * Base error interface with common properties
 */
export interface BaseError extends Error {
  readonly name: string;
  readonly code: string;
  readonly severity: 'critical' | 'high' | 'medium' | 'low';
  readonly timestamp: number;
  readonly context?: Record<string, unknown>;
  readonly cause?: Error;
  readonly retryable: boolean;
}

/**
 * Network Error - API failures, timeouts, connection issues
 */
export interface NetworkError extends BaseError {
  readonly name: 'NetworkError';
  readonly code: 'NETWORK_ERROR';
  readonly severity: 'high';
  readonly statusCode?: number;
  readonly endpoint: string;
  readonly method: string;
  readonly body?: unknown;
  readonly response?: unknown;
}

/**
 * Validation Error - Invalid input, type mismatches
 */
export interface ValidationError extends BaseError {
  readonly name: 'ValidationError';
  readonly code: 'VALIDATION_ERROR';
  readonly severity: 'medium';
  readonly field?: string;
  readonly received?: unknown;
  readonly expected?: unknown;
}

/**
 * Business Logic Error - App-specific business rule violations
 */
export interface BusinessLogicError extends BaseError {
  readonly name: 'BusinessLogicError';
  readonly code: 'BUSINESS_LOGIC_ERROR';
  readonly severity: 'high';
  readonly businessRule: string;
  readonly violation: string;
}

/**
 * System Error - Unexpected system failures, storage issues
 */
export interface SystemError extends BaseError {
  readonly name: 'SystemError';
  readonly code: 'SYSTEM_ERROR';
  readonly severity: 'critical';
  readonly subsystem: string;
  readonly operation: string;
}

/**
 * AI Error - AI service failures
 */
export interface AIError extends BaseError {
  readonly name: 'AIError';
  readonly code: 'AI_ERROR';
  readonly severity: 'high';
  readonly provider: string;
  readonly model?: string;
  readonly operation: string;
  readonly requestId?: string;
}

/**
 * Storage Error - IndexedDB, localStorage, etc.
 */
export interface StorageError extends BaseError {
  readonly name: 'StorageError';
  readonly code: 'STORAGE_ERROR';
  readonly severity: 'high';
  readonly store: string;
  readonly operation: 'read' | 'write' | 'delete' | 'clear';
  readonly key?: string;
}

/**
 * Configuration Error - Missing or invalid configuration
 */
export interface ConfigurationError extends BaseError {
  readonly name: 'ConfigurationError';
  readonly code: 'CONFIGURATION_ERROR';
  readonly severity: 'critical';
  readonly configKey: string;
  readonly configValue?: unknown;
}

/**
 * Union type of all errors
 */
export type AppError =
  | NetworkError
  | ValidationError
  | BusinessLogicError
  | SystemError
  | AIError
  | StorageError
  | ConfigurationError;

/**
 * Type guards for runtime type checking
 */
export const isNetworkError = (error: unknown): error is NetworkError =>
  error instanceof Error &&
  error.name === 'NetworkError' &&
  'statusCode' in error &&
  'endpoint' in error;

export const isValidationError = (error: unknown): error is ValidationError =>
  error instanceof Error && error.name === 'ValidationError' && 'field' in error;

export const isBusinessLogicError = (error: unknown): error is BusinessLogicError =>
  error instanceof Error && error.name === 'BusinessLogicError' && 'businessRule' in error;

export const isSystemError = (error: unknown): error is SystemError =>
  error instanceof Error && error.name === 'SystemError' && 'subsystem' in error;

export const isAIError = (error: unknown): error is AIError =>
  error instanceof Error && error.name === 'AIError' && 'provider' in error;

export const isStorageError = (error: unknown): error is StorageError =>
  error instanceof Error && error.name === 'StorageError' && 'store' in error;

export const isConfigurationError = (error: unknown): error is ConfigurationError =>
  error instanceof Error && error.name === 'ConfigurationError' && 'configKey' in error;

/**
 * Error factory functions
 */
export const createNetworkError = (
  message: string,
  options: {
    statusCode?: number;
    endpoint: string;
    method: string;
    body?: unknown;
    response?: unknown;
    cause?: Error;
    context?: Record<string, unknown>;
  }
): NetworkError => {
  return {
    name: 'NetworkError',
    code: 'NETWORK_ERROR',
    message,
    severity: 'high',
    retryable: options.statusCode ? options.statusCode >= 500 || options.statusCode === 429 : true,
    timestamp: Date.now(),
    statusCode: options.statusCode,
    endpoint: options.endpoint,
    method: options.method,
    body: options.body,
    response: options.response,
    cause: options.cause,
    context: options.context,
  };
};

export const createValidationError = (
  message: string,
  options: {
    field?: string;
    received?: unknown;
    expected?: unknown;
    context?: Record<string, unknown>;
  }
): ValidationError => {
  return {
    name: 'ValidationError',
    code: 'VALIDATION_ERROR',
    message,
    severity: 'medium',
    retryable: false,
    timestamp: Date.now(),
    field: options.field,
    received: options.received,
    expected: options.expected,
    context: options.context,
  };
};

export const createBusinessLogicError = (
  message: string,
  options: {
    businessRule: string;
    violation: string;
    context?: Record<string, unknown>;
  }
): BusinessLogicError => {
  return {
    name: 'BusinessLogicError',
    code: 'BUSINESS_LOGIC_ERROR',
    message,
    severity: 'high',
    retryable: false,
    timestamp: Date.now(),
    businessRule: options.businessRule,
    violation: options.violation,
    context: options.context,
  };
};

export const createSystemError = (
  message: string,
  options: {
    subsystem: string;
    operation: string;
    cause?: Error;
    context?: Record<string, unknown>;
  }
): SystemError => {
  return {
    name: 'SystemError',
    code: 'SYSTEM_ERROR',
    message,
    severity: 'critical',
    retryable: false,
    timestamp: Date.now(),
    subsystem: options.subsystem,
    operation: options.operation,
    cause: options.cause,
    context: options.context,
  };
};

export const createAIError = (
  message: string,
  options: {
    provider: string;
    model?: string;
    operation: string;
    requestId?: string;
    cause?: Error;
    context?: Record<string, unknown>;
  }
): AIError => {
  return {
    name: 'AIError',
    code: 'AI_ERROR',
    message,
    severity: 'high',
    retryable: options.provider !== 'openai' || !message.includes('quota'),
    timestamp: Date.now(),
    provider: options.provider,
    model: options.model,
    operation: options.operation,
    requestId: options.requestId,
    cause: options.cause,
    context: options.context,
  };
};

export const createStorageError = (
  message: string,
  options: {
    store: string;
    operation: 'read' | 'write' | 'delete' | 'clear';
    key?: string;
    cause?: Error;
    context?: Record<string, unknown>;
  }
): StorageError => {
  return {
    name: 'StorageError',
    code: 'STORAGE_ERROR',
    message,
    severity: 'high',
    retryable: false,
    timestamp: Date.now(),
    store: options.store,
    operation: options.operation,
    key: options.key,
    cause: options.cause,
    context: options.context,
  };
};

export const createConfigurationError = (
  message: string,
  options: {
    configKey: string;
    configValue?: unknown;
    context?: Record<string, unknown>;
  }
): ConfigurationError => {
  return {
    name: 'ConfigurationError',
    code: 'CONFIGURATION_ERROR',
    message,
    severity: 'critical',
    retryable: false,
    timestamp: Date.now(),
    configKey: options.configKey,
    configValue: options.configValue,
    context: options.context,
  };
};

/**
 * Convert unknown error to AppError
 */
export const toAppError = (error: unknown, context?: string): AppError => {
  // Already an AppError
  if (error && typeof error === 'object' && 'code' in error && 'name' in error) {
    return error as AppError;
  }

  // Standard Error
  if (error instanceof Error) {
    // Network-related
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return createNetworkError(error.message, {
        endpoint: context || 'unknown',
        method: 'unknown',
        cause: error,
      });
    }

    // AI-related
    if (error.message.includes('AI') || error.message.includes('provider')) {
      return createAIError(error.message, {
        provider: 'unknown',
        operation: context || 'unknown',
        cause: error,
      });
    }

    // Storage-related
    if (error.message.includes('IndexedDB') || error.message.includes('storage')) {
      return createStorageError(error.message, {
        store: 'unknown',
        operation: 'read',
        cause: error,
      });
    }

    // Default to system error
    return createSystemError(error.message, {
      subsystem: 'application',
      operation: context || 'unknown',
      cause: error,
    });
  }

  // Non-error value
  const message = typeof error === 'string' ? error : 'Unknown error occurred';
  return createSystemError(message, {
    subsystem: 'application',
    operation: context || 'unknown',
  });
};

/**
 * Get user-friendly error message
 */
export const getErrorMessage = (error: unknown): string => {
  const appError = toAppError(error);

  switch (appError.name) {
    case 'NetworkError':
      if (appError.statusCode === 401) return 'Authentication required. Please check your API key.';
      if (appError.statusCode === 403) return 'Access denied. Check your permissions.';
      if (appError.statusCode === 404) return 'The requested resource was not found.';
      if (appError.statusCode === 429) return 'Too many requests. Please try again later.';
      if (appError.statusCode && appError.statusCode >= 500)
        return 'Server error. Please try again.';
      return 'Network error. Please check your connection and try again.';

    case 'ValidationError':
      return appError.field
        ? `Invalid ${appError.field}. ${appError.message}`
        : `Validation failed. ${appError.message}`;

    case 'BusinessLogicError':
      return appError.message || 'This operation violates business rules.';

    case 'SystemError':
      return 'A system error occurred. Please try again.';

    case 'AIError':
      return `AI service error: ${appError.message}`;

    case 'StorageError':
      return 'Failed to save data. Please check your browser storage.';

    case 'ConfigurationError':
      return `Configuration error: ${appError.message}`;

    default:
      return 'An unexpected error occurred.';
  }
};
