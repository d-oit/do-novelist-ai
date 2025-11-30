/**
 * Errors Module - Central exports for error handling
 * Based on 2024-2025 TypeScript best practices
 */

// Error types
export type {
  AppError,
  BaseError,
  NetworkError,
  ValidationError,
  BusinessLogicError,
  SystemError,
  AIError,
  StorageError,
  ConfigurationError,
} from './error-types';

export {
  createNetworkError,
  createValidationError,
  createBusinessLogicError,
  createSystemError,
  createAIError,
  createStorageError,
  createConfigurationError,
  toAppError,
  getErrorMessage,
  isNetworkError,
  isValidationError,
  isBusinessLogicError,
  isSystemError,
  isAIError,
  isStorageError,
  isConfigurationError,
} from './error-types';

// Result pattern
export type { Result } from './result';

export {
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
} from './result';

// Logging
export type { LogLevel, LogEntry } from './logging';

export {
  Logger,
  ConsoleLogService,
  SentryLogService,
  getLogger,
  logger,
  performanceLogger,
  logEvent,
} from './logging';

// Error handler
export type { RetryOptions, ErrorReportingOptions, ErrorHandlerConfig } from './error-handler';

export {
  ErrorHandler,
  errorHandler,
  handleError,
  executeWithRetry,
  wrapAsync,
  wrapSync,
  getUserMessage,
  shouldRetry,
  createErrorHandler,
} from './error-handler';

// React components
export {
  ErrorBoundary,
  PageErrorBoundary,
  SectionErrorBoundary,
  ComponentErrorBoundary,
  EditorErrorBoundary,
  ProjectsErrorBoundary,
  AIServiceErrorBoundary,
  withErrorBoundary,
  useErrorHandler,
} from '../../components/error-boundary';
