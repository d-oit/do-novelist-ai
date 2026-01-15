import { describe, it, expect } from 'vitest';

import {
  createNetworkError,
  createValidationError,
  createBusinessLogicError,
  createSystemError,
  createAIError,
  createStorageError,
  createConfigurationError,
  isNetworkError,
  toAppError,
  getErrorMessage,
  type AIError,
  type SystemError,
} from '@/lib/errors/error-types';

describe('Error Types', () => {
  describe('createNetworkError', () => {
    it('should create network error with all properties', () => {
      const error = createNetworkError('Network failure', {
        statusCode: 500,
        endpoint: '/api/data',
        method: 'GET',
        body: { foo: 'bar' },
        response: { error: 'Internal Server Error' },
      });

      expect(error.name).toBe('NetworkError');
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.message).toBe('Network failure');
      expect(error.severity).toBe('high');
      expect(error.statusCode).toBe(500);
      expect(error.endpoint).toBe('/api/data');
      expect(error.method).toBe('GET');
      expect(error.body).toEqual({ foo: 'bar' });
      expect(error.response).toEqual({ error: 'Internal Server Error' });
      expect(error.timestamp).toBeGreaterThan(0);
    });

    it('should set retryable=true for 5xx errors', () => {
      const error = createNetworkError('Server error', {
        statusCode: 503,
        endpoint: '/api/data',
        method: 'GET',
      });

      expect(error.retryable).toBe(true);
    });

    it('should set retryable=true for 429 rate limit', () => {
      const error = createNetworkError('Rate limited', {
        statusCode: 429,
        endpoint: '/api/data',
        method: 'GET',
      });

      expect(error.retryable).toBe(true);
    });

    it('should set retryable=false for 4xx errors', () => {
      const error = createNetworkError('Bad request', {
        statusCode: 400,
        endpoint: '/api/data',
        method: 'POST',
      });

      expect(error.retryable).toBe(false);
    });

    it('should set retryable=true when no status code', () => {
      const error = createNetworkError('Network error', {
        endpoint: '/api/data',
        method: 'GET',
      });

      expect(error.retryable).toBe(true);
    });
  });

  describe('createValidationError', () => {
    it('should create validation error with field info', () => {
      const error = createValidationError('Invalid email', {
        field: 'email',
        received: 'notanemail',
        expected: 'string (email format)',
      });

      expect(error.name).toBe('ValidationError');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.message).toBe('Invalid email');
      expect(error.severity).toBe('medium');
      expect(error.retryable).toBe(false);
      expect(error.field).toBe('email');
      expect(error.received).toBe('notanemail');
      expect(error.expected).toBe('string (email format)');
    });

    it('should create validation error without field', () => {
      const error = createValidationError('General validation error', {});

      expect(error.field).toBeUndefined();
      expect(error.received).toBeUndefined();
      expect(error.expected).toBeUndefined();
    });
  });

  describe('createBusinessLogicError', () => {
    it('should create business logic error', () => {
      const error = createBusinessLogicError('Cannot delete active project', {
        businessRule: 'active-project-deletion',
        violation: 'Attempted to delete project with active users',
      });

      expect(error.name).toBe('BusinessLogicError');
      expect(error.code).toBe('BUSINESS_LOGIC_ERROR');
      expect(error.message).toBe('Cannot delete active project');
      expect(error.severity).toBe('high');
      expect(error.retryable).toBe(false);
      expect(error.businessRule).toBe('active-project-deletion');
      expect(error.violation).toBe('Attempted to delete project with active users');
    });
  });

  describe('createSystemError', () => {
    it('should create system error', () => {
      const cause = new Error('Underlying error');
      const error = createSystemError('Database connection failed', {
        subsystem: 'database',
        operation: 'connect',
        cause,
      });

      expect(error.name).toBe('SystemError');
      expect(error.code).toBe('SYSTEM_ERROR');
      expect(error.message).toBe('Database connection failed');
      expect(error.severity).toBe('critical');
      expect(error.retryable).toBe(false);
      expect(error.subsystem).toBe('database');
      expect(error.operation).toBe('connect');
      expect(error.cause).toBe(cause);
    });
  });

  describe('createAIError', () => {
    it('should create AI error with full info', () => {
      const error = createAIError('Token limit exceeded', {
        provider: 'openai',
        model: 'gpt-4',
        operation: 'generate',
        requestId: 'req-123',
      });

      expect(error.name).toBe('AIError');
      expect(error.code).toBe('AI_ERROR');
      expect(error.message).toBe('Token limit exceeded');
      expect(error.severity).toBe('high');
      expect(error.provider).toBe('openai');
      expect(error.model).toBe('gpt-4');
      expect(error.operation).toBe('generate');
      expect(error.requestId).toBe('req-123');
    });

    it('should set retryable=false for OpenAI quota errors', () => {
      const error = createAIError('quota exceeded', {
        provider: 'openai',
        operation: 'generate',
      });

      expect(error.retryable).toBe(false);
    });

    it('should set retryable=true for non-quota errors', () => {
      const error = createAIError('Service unavailable', {
        provider: 'anthropic',
        operation: 'generate',
      });

      expect(error.retryable).toBe(true);
    });
  });

  describe('createStorageError', () => {
    it('should create storage error for write operation', () => {
      const error = createStorageError('Failed to write data', {
        store: 'projects',
        operation: 'write',
        key: 'project-123',
      });

      expect(error.name).toBe('StorageError');
      expect(error.code).toBe('STORAGE_ERROR');
      expect(error.message).toBe('Failed to write data');
      expect(error.severity).toBe('high');
      expect(error.retryable).toBe(false);
      expect(error.store).toBe('projects');
      expect(error.operation).toBe('write');
      expect(error.key).toBe('project-123');
    });

    it('should handle all operation types', () => {
      const operations: Array<'read' | 'write' | 'delete' | 'clear'> = ['read', 'write', 'delete', 'clear'];

      operations.forEach(operation => {
        const error = createStorageError('Operation failed', {
          store: 'test',
          operation,
        });

        expect(error.operation).toBe(operation);
      });
    });
  });

  describe('createConfigurationError', () => {
    it('should create configuration error', () => {
      const error = createConfigurationError('Missing API key', {
        configKey: 'OPENAI_API_KEY',
        configValue: undefined,
      });

      expect(error.name).toBe('ConfigurationError');
      expect(error.code).toBe('CONFIGURATION_ERROR');
      expect(error.message).toBe('Missing API key');
      expect(error.severity).toBe('critical');
      expect(error.retryable).toBe(false);
      expect(error.configKey).toBe('OPENAI_API_KEY');
      expect(error.configValue).toBeUndefined();
    });
  });

  describe('type guards', () => {
    // Note: Type guards require Error instances, but factory functions create plain objects.
    // Type guards are intended for errors from external sources, not factory-created errors.

    it('should return false for factory-created objects', () => {
      const networkError = createNetworkError('Network error', {
        endpoint: '/api/test',
        method: 'GET',
      });

      // Factory-created errors are plain objects, not Error instances
      expect(isNetworkError(networkError)).toBe(false);
    });

    it('should return false for non-error values', () => {
      expect(isNetworkError(null)).toBe(false);
      expect(isNetworkError(undefined)).toBe(false);
      expect(isNetworkError('not an error')).toBe(false);
      expect(isNetworkError({})).toBe(false);
    });
  });

  describe('toAppError', () => {
    it('should pass through existing AppError', () => {
      const error = createNetworkError('Test', {
        endpoint: '/api/test',
        method: 'GET',
      });

      const appError = toAppError(error);

      expect(appError).toBe(error);
    });

    it('should convert fetch Error to NetworkError', () => {
      const error = new Error('fetch failed');
      const appError = toAppError(error);

      expect(appError.name).toBe('NetworkError');
      expect(appError.code).toBe('NETWORK_ERROR');
      expect(appError.message).toContain('fetch failed');
    });

    it('should convert network Error to NetworkError', () => {
      const error = new Error('network timeout');
      const appError = toAppError(error);

      expect(appError.name).toBe('NetworkError');
      expect(appError.code).toBe('NETWORK_ERROR');
      expect(appError.message).toContain('network timeout');
    });

    it('should convert AI Error to AIError', () => {
      const error = new Error('AI provider error');
      const appError = toAppError(error, 'test-operation') as AIError;

      expect(appError.name).toBe('AIError');
      expect(appError.code).toBe('AI_ERROR');
      expect(appError.operation).toBe('test-operation');
    });

    it('should convert storage Error to StorageError', () => {
      const error = new Error('IndexedDB error');
      const appError = toAppError(error);

      expect(appError.name).toBe('StorageError');
      expect(appError.code).toBe('STORAGE_ERROR');
    });

    it('should convert generic Error to SystemError', () => {
      const error = new Error('Something went wrong');
      const appError = toAppError(error);

      expect(appError.name).toBe('SystemError');
      expect(appError.code).toBe('SYSTEM_ERROR');
      expect(appError.message).toBe('Something went wrong');
    });

    it('should convert string to SystemError', () => {
      const appError = toAppError('String error');

      expect(appError.name).toBe('SystemError');
      expect(appError.code).toBe('SYSTEM_ERROR');
      expect(appError.message).toBe('String error');
    });

    it('should handle non-error values', () => {
      const appError = toAppError(null);

      expect(appError.name).toBe('SystemError');
      expect(appError.code).toBe('SYSTEM_ERROR');
      expect(appError.message).toBe('Unknown error occurred');
    });

    it('should include context in SystemError', () => {
      const error = new Error('Test error');
      const appError = toAppError(error, 'my-context') as SystemError;

      expect(appError.operation).toBe('my-context');
    });
  });

  describe('getErrorMessage', () => {
    it('should return user-friendly message for 401 NetworkError', () => {
      const error = createNetworkError('Unauthorized', {
        statusCode: 401,
        endpoint: '/api/test',
        method: 'GET',
      });

      expect(getErrorMessage(error)).toBe('Authentication required. Please check your API key.');
    });

    it('should return user-friendly message for 403 NetworkError', () => {
      const error = createNetworkError('Forbidden', {
        statusCode: 403,
        endpoint: '/api/test',
        method: 'GET',
      });

      expect(getErrorMessage(error)).toBe('Access denied. Check your permissions.');
    });

    it('should return user-friendly message for 404 NetworkError', () => {
      const error = createNetworkError('Not Found', {
        statusCode: 404,
        endpoint: '/api/test',
        method: 'GET',
      });

      expect(getErrorMessage(error)).toBe('The requested resource was not found.');
    });

    it('should return user-friendly message for 429 NetworkError', () => {
      const error = createNetworkError('Rate Limited', {
        statusCode: 429,
        endpoint: '/api/test',
        method: 'GET',
      });

      expect(getErrorMessage(error)).toBe('Too many requests. Please try again later.');
    });

    it('should return user-friendly message for 5xx NetworkError', () => {
      const error = createNetworkError('Server Error', {
        statusCode: 500,
        endpoint: '/api/test',
        method: 'GET',
      });

      expect(getErrorMessage(error)).toBe('Server error. Please try again.');
    });

    it('should return user-friendly message for generic NetworkError', () => {
      const error = createNetworkError('Connection failed', {
        endpoint: '/api/test',
        method: 'GET',
      });

      expect(getErrorMessage(error)).toBe('Network error. Please check your connection and try again.');
    });

    it('should return user-friendly message for ValidationError with field', () => {
      const error = createValidationError('Email is required', {
        field: 'email',
      });

      expect(getErrorMessage(error)).toBe('Invalid email. Email is required');
    });

    it('should return user-friendly message for ValidationError without field', () => {
      const error = createValidationError('Invalid input', {});

      expect(getErrorMessage(error)).toBe('Validation failed. Invalid input');
    });

    it('should return message for BusinessLogicError', () => {
      const error = createBusinessLogicError('Cannot perform action', {
        businessRule: 'test',
        violation: 'test',
      });

      expect(getErrorMessage(error)).toBe('Cannot perform action');
    });

    it('should return generic message for SystemError', () => {
      const error = createSystemError('Critical failure', {
        subsystem: 'test',
        operation: 'test',
      });

      expect(getErrorMessage(error)).toBe('A system error occurred. Please try again.');
    });

    it('should return message for AIError', () => {
      const error = createAIError('Token limit exceeded', {
        provider: 'openai',
        operation: 'generate',
      });

      expect(getErrorMessage(error)).toBe('AI service error: Token limit exceeded');
    });

    it('should handle unknown error types', () => {
      const message = getErrorMessage(new Error('Generic error'));

      expect(message).toContain('system error');
    });
  });

  describe('error context', () => {
    it('should include context in errors', () => {
      const context = { userId: '123', operation: 'delete' };
      const error = createSystemError('Operation failed', {
        subsystem: 'test',
        operation: 'test',
        context,
      });

      expect(error.context).toEqual(context);
    });

    it('should include cause in errors', () => {
      const cause = new Error('Root cause');
      const error = createSystemError('Wrapped error', {
        subsystem: 'test',
        operation: 'test',
        cause,
      });

      expect(error.cause).toBe(cause);
    });
  });

  describe('timestamp', () => {
    it('should have timestamp in all errors', () => {
      const before = Date.now();
      const error = createNetworkError('Test', {
        endpoint: '/test',
        method: 'GET',
      });
      const after = Date.now();

      expect(error.timestamp).toBeGreaterThanOrEqual(before);
      expect(error.timestamp).toBeLessThanOrEqual(after);
    });
  });
});
