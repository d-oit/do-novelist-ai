# Error Handling Guide - Novelist.ai

**Comprehensive Guide to Error Handling and Logging System (2024-2025 Best
Practices)**

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Architecture](#architecture)
4. [Error Types](#error-types)
5. [Result Pattern](#result-pattern)
6. [Logging System](#logging-system)
7. [Error Handler](#error-handler)
8. [React Error Boundaries](#react-error-boundaries)
9. [Best Practices](#best-practices)
10. [API Reference](#api-reference)
11. [Troubleshooting](#troubleshooting)

---

## Overview

The Novelist.ai error handling system is based on modern TypeScript and React
best practices from 2024-2025. It provides:

- ✅ **Comprehensive Error Classification** - 7 distinct error types with proper
  context
- ✅ **Type-Safe Result Pattern** - Functional error handling without exceptions
- ✅ **Structured Logging** - Multiple log levels with JSON formatting
- ✅ **React Error Boundaries** - Component-level error isolation
- ✅ **Automatic Retry Logic** - Exponential backoff for transient failures
- ✅ **Production Ready** - Sentry integration and error tracking
- ✅ **Developer Friendly** - Clear error messages and debugging tools

---

## Quick Start

### Basic Error Handling

```typescript
import { handleError, logger } from '@/lib/errors';

// Handle an error
try {
  await someOperation();
} catch (error) {
  handleError(error, 'operationName');
  // Error is logged and reported automatically
}

// Log a message
logger.info('User action completed', { userId: '123', action: 'save' });
```

### Using Result Pattern

```typescript
import { tryCatch, ok, err } from '@/lib/errors';

// Sync operations
const result = tryCatch(() => {
  return JSON.parse(someString);
});

if (ok(result)) {
  console.log('Success:', result.data);
} else {
  console.error('Error:', result.error.message);
}

// Async operations
const asyncResult = await tryCatchAsync(async () => {
  const response = await fetch('/api/data');
  return response.json();
});
```

### Using Error Boundaries

```typescript
import { PageErrorBoundary } from '@/lib/errors';

function App() {
  return (
    <PageErrorBoundary componentName="MainApp">
      <YourComponent />
    </PageErrorBoundary>
  );
}
```

---

## Architecture

### System Components

```
┌─────────────────────────────────────┐
│         Error Handling System        │
├─────────────────────────────────────┤
│                                     │
│  ┌──────────────┐  ┌─────────────┐ │
│  │  Error Types │  │  Result<T,E>│ │
│  │              │  │             │ │
│  │ - Network    │  │ - ok()      │ │
│  │ - Validation │  │ - err()     │ │
│  │ - Business   │  │ - map()     │ │
│  │ - System     │  │ - chain()   │ │
│  │ - AI         │  │             │ │
│  │ - Storage    │  └─────────────┘ │
│  └──────────────┘                   │
│                                     │
│  ┌──────────────┐  ┌─────────────┐ │
│  │   Logging    │  │ Error Handler│ │
│  │              │  │             │ │
│  │ - Console    │  │ - Global    │ │
│  │ - Sentry     │  │ - Retry     │ │
│  │ - Analytics  │  │ - Context   │ │
│  └──────────────┘  └─────────────┘ │
│                                     │
│  ┌──────────────┐                   │
│  │Error Boundary│                   │
│  │              │                   │
│  │ - Page       │                   │
│  │ - Section    │                   │
│  │ - Component  │                   │
│  └──────────────┘                   │
│                                     │
└─────────────────────────────────────┘
```

### Error Flow

```
┌─────────────┐
│  Operation  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Try/Catch │
└──────┬──────┘
       │
       ▼
┌─────────────┐      ┌─────────────┐
│   Convert   │─────▶│   Classify   │
│ to AppError │      │   Error     │
└──────┬──────┘      └──────┬──────┘
       │                     │
       ▼                     ▼
┌─────────────┐      ┌─────────────┐
│    Log      │      │   Report    │
│   (Console) │      │  (Sentry)   │
└──────┬──────┘      └──────┬──────┘
       │                     │
       ▼                     ▼
┌─────────────┐      ┌─────────────┐
│   Notify    │      │  Analytics  │
│  Listeners  │      │   Events    │
└─────────────┘      └─────────────┘
```

---

## Error Types

### 1. NetworkError

For API failures, timeouts, and connection issues.

```typescript
import { createNetworkError } from '@/lib/errors';

const error = createNetworkError('Failed to fetch data', {
  statusCode: 500,
  endpoint: '/api/data',
  method: 'GET',
  response: await response.text(),
  cause: originalError,
});
```

**Properties:**

- `statusCode` - HTTP status code
- `endpoint` - API endpoint
- `method` - HTTP method
- `body` - Request body
- `response` - Response data
- `retryable` - True for 5xx errors

### 2. ValidationError

For invalid input and type mismatches.

```typescript
import { createValidationError } from '@/lib/errors';

const error = createValidationError('Invalid email format', {
  field: 'email',
  received: 'invalid-email',
  expected: 'user@example.com',
});
```

**Properties:**

- `field` - Field name
- `received` - Actual value
- `expected` - Expected format

### 3. BusinessLogicError

For business rule violations.

```typescript
import { createBusinessLogicError } from '@/lib/errors';

const error = createBusinessLogicError(
  'Cannot delete project with active drafts',
  {
    businessRule: 'project-deletion',
    violation: 'has-active-drafts',
  }
);
```

**Properties:**

- `businessRule` - Rule name
- `violation` - Specific violation

### 4. SystemError

For unexpected system failures.

```typescript
import { createSystemError } from '@/lib/errors';

const error = createSystemError('Unexpected database error', {
  subsystem: 'database',
  operation: 'query',
  cause: dbError,
});
```

**Properties:**

- `subsystem` - Affected subsystem
- `operation` - Operation being performed

### 5. AIError

For AI service failures.

```typescript
import { createAIError } from '@/lib/errors';

const error = createAIError('OpenAI API quota exceeded', {
  provider: 'openai',
  model: 'gpt-4',
  operation: 'generateText',
  requestId: 'req-123',
});
```

**Properties:**

- `provider` - AI provider name
- `model` - Model name
- `operation` - Operation type
- `requestId` - Request ID

### 6. StorageError

For IndexedDB and storage failures.

```typescript
import { createStorageError } from '@/lib/errors';

const error = createStorageError('Failed to save draft', {
  store: 'drafts',
  operation: 'write',
  key: 'chapter-123',
});
```

**Properties:**

- `store` - Store name
- `operation` - Type of operation
- `key` - Key being accessed

### 7. ConfigurationError

For missing or invalid configuration.

```typescript
import { createConfigurationError } from '@/lib/errors';

const error = createConfigurationError('API key not configured', {
  configKey: 'VITE_AI_GATEWAY_API_KEY',
  configValue: undefined,
});
```

**Properties:**

- `configKey` - Configuration key
- `configValue` - Configuration value

---

## Result Pattern

The Result type represents either a success or failure, avoiding exceptions for
control flow.

### Basic Usage

```typescript
import { Result, ok, err } from '@/lib/errors';

// Success
const success: Result<number, string> = ok(42);

// Failure
const failure: Result<number, string> = err('Something went wrong');
```

### Chaining Operations

```typescript
import { map, andThen } from '@/lib/errors';

const result = await getUser(123);

// Map success value
const upperName = map(result, user => user.name.toUpperCase());

// Chain operations that can fail
const emailDomain = andThen(result, user =>
  user.email.includes('@') ? ok(user.email.split('@')[1]) : err('Invalid email')
);
```

### Error Handling

```typescript
import { isOk, isErr, unwrap, unwrapOr } from '@/lib/errors';

if (isOk(result)) {
  const data = result.data; // Type: T
} else {
  const error = result.error; // Type: E
}

// Unwrap with default
const value = unwrapOr(result, 'default');

// Unwrap or throw
const data = unwrap(result, 'Context for error');
```

### Async Operations

```typescript
import { tryCatchAsync, fromPromise } from '@/lib/errors';

// Wrap async function
const result = await tryCatchAsync(async () => {
  const data = await fetch('/api/data').then(r => r.json());
  return data;
});

// Convert Promise
const result = await fromPromise(fetch('/api/data').then(r => r.json()));
```

### Collecting Results

```typescript
import { collect } from '@/lib/errors';

const results = [ok(1), ok(2), err('error')];

const collected = collect(results); // Returns first error or all values
```

### Retry Logic

```typescript
import { retry } from '@/lib/errors';

const result = await retry(
  () => fetch('/api/data').then(r => r.json()),
  3, // max attempts
  500 // delay in ms
);
```

---

## Logging System

### Log Levels

```typescript
import { logger } from '@/lib/errors';

logger.debug('Debug information', { context: 'value' });
logger.info('Operation completed', { duration: 100 });
logger.warn('Something might be wrong', { userId: '123' });
logger.error('Operation failed', { error: e.message });
```

### Structured Logging

```typescript
logger.info('User login', {
  userId: '123',
  email: 'user@example.com',
  timestamp: Date.now(),
  ip: '192.168.1.1',
});

// Log error with full context
logger.logError(error, {
  operation: 'saveProject',
  projectId: '456',
  userId: '123',
});
```

### Child Loggers

```typescript
const editorLogger = logger.child({ component: 'Editor' });

editorLogger.info('Draft saved', { chapterId: '123' });
// Output: [timestamp] [INFO] [component=Editor] Draft saved {"chapterId":"123"}
```

### Performance Logging

```typescript
import { performanceLogger } from '@/lib/errors';

// Measure operation
const end = performanceLogger.start('saveDraft');

await saveDraft();

end(); // Logs duration automatically

// Or use the async helper
const result = await performanceLogger.measure('saveDraft', async () => {
  return await saveDraft();
});
```

### Event Logging

```typescript
import { logEvent } from '@/lib/errors';

logEvent('project_created', {
  projectId: '123',
  template: 'novel',
});
```

---

## Error Handler

### Global Error Handler

```typescript
import { errorHandler, handleError } from '@/lib/errors';

// Handle error with automatic logging and reporting
try {
  await operation();
} catch (error) {
  handleError(error, 'operationName');
}
```

### Execute with Retry

```typescript
import { executeWithRetry } from '@/lib/errors';

const result = await executeWithRetry(
  async () => {
    const response = await fetch('/api/data');
    if (!response.ok) throw new Error('API Error');
    return response.json();
  },
  {
    maxAttempts: 3,
    delayMs: 500,
    retryCondition: error => error.retryable,
  }
);
```

### Wrap Functions

```typescript
import { wrapAsync, wrapSync } from '@/lib/errors';

// Wrap async function
const safeOperation = wrapAsync(async (id: string) => {
  return await fetch(`/api/data/${id}`).then(r => r.json());
}, 'fetchData');

// Use it
const result = await safeOperation('123');
```

### Add Error Listeners

```typescript
import { errorHandler } from '@/lib/errors';

// Listen for all errors
const unsubscribe = errorHandler.addErrorListener(error => {
  console.log('Error occurred:', error.code);
  // Send to analytics, show notification, etc.
});

// Remove listener
unsubscribe();
```

### Get Error Statistics

```typescript
const stats = errorHandler.getStats();
console.log(stats);
// {
//   handledErrorsCount: 42,
//   listenersCount: 2,
//   config: { ... }
// }
```

---

## React Error Boundaries

### Page-Level Error Boundary

```typescript
import { PageErrorBoundary } from '@/lib/errors';

function App() {
  return (
    <PageErrorBoundary componentName="App">
      <Routes />
    </PageErrorBoundary>
  );
}
```

### Section-Level Error Boundary

```typescript
import { SectionErrorBoundary } from '@/lib/errors';

function ProjectsPage() {
  return (
    <div>
      <h1>Projects</h1>
      <SectionErrorBoundary componentName="ProjectsList">
        <ProjectsList />
      </SectionErrorBoundary>
    </div>
  );
}
```

### Custom Fallback

```typescript
import { ErrorBoundary } from '@/lib/errors';

function CustomFallback({ error, retry }) {
  return (
    <div className="error-container">
      <h2>Oops! Something went wrong</h2>
      <p>{error.message}</p>
      <button onClick={retry}>Try Again</button>
    </div>
  );
}

function Component() {
  return (
    <ErrorBoundary fallback={CustomFallback}>
      <YourComponent />
    </ErrorBoundary>
  );
}
```

### Higher-Order Component

```typescript
import { withErrorBoundary } from '@/lib/errors';

function MyComponent() {
  return <div>Content</div>;
}

// Wrap with error boundary
const SafeComponent = withErrorBoundary(MyComponent, {
  componentName: 'MyComponent',
});

// Use it
<SafeComponent />;
```

### Hook for Error Handling

```typescript
import { useErrorHandler } from '@/lib/errors';

function MyComponent() {
  const { handleError, getErrorMessage } = useErrorHandler('MyComponent');

  const handleSave = async () => {
    try {
      await saveData();
    } catch (error) {
      handleError(error, 'saveData');
      const message = getErrorMessage(error);
      setError(message);
    }
  };

  return <button onClick={handleSave}>Save</button>;
}
```

### Feature-Specific Boundaries

```typescript
import { EditorErrorBoundary } from '@/lib/errors';

function EditorPage() {
  return (
    <EditorErrorBoundary>
      <Editor />
    </EditorErrorBoundary>
  );
}
```

---

## Best Practices

### 1. Always Provide Context

```typescript
// ❌ Bad
throw new Error('Failed');

// ✅ Good
throw createSystemError('Failed to save draft to IndexedDB', {
  subsystem: 'storage',
  operation: 'save',
  key: 'chapter-123',
  cause: originalError,
});
```

### 2. Use Result Pattern for Operations That Can Fail

```typescript
// ❌ Bad - Using exceptions for control flow
function parseUser(json: string): User {
  try {
    const obj = JSON.parse(json);
    return obj as User;
  } catch {
    throw new Error('Invalid JSON');
  }
}

// ✅ Good - Using Result
function parseUser(json: string): Result<User, AppError> {
  try {
    const obj = JSON.parse(json);
    return ok(obj as User);
  } catch (error) {
    return err(
      createValidationError('Invalid JSON format', {
        received: json.substring(0, 100),
        context: { operation: 'parseUser' },
      })
    );
  }
}
```

### 3. Log Important Operations

```typescript
// ❌ Bad
await saveProject(project);

// ✅ Good
logger.info('Saving project', { projectId: project.id });
const end = performanceLogger.start('saveProject');
await saveProject(project);
end();
```

### 4. Classify Errors Properly

```typescript
// ❌ Bad - All errors are generic
catch (error) {
  logger.error('Error:', error);
  throw error;
}

// ✅ Good - Proper error classification
catch (error) {
  if (error.message.includes('fetch')) {
    throw createNetworkError('Failed to fetch data', {
      endpoint: '/api/projects',
      method: 'GET',
      cause: error,
    });
  }
  if (error.message.includes('validation')) {
    throw createValidationError('Invalid project data', {
      field: 'name',
      received: error.value,
      cause: error,
    });
  }
  throw createSystemError('Unexpected error', {
    subsystem: 'project-service',
    operation: 'save',
    cause: error,
  });
}
```

### 5. Use Error Boundaries Strategically

```typescript
// ❌ Bad - Wrapping everything
function App() {
  return (
    <ErrorBoundary>
      <div>
        <Header />
        <ErrorBoundary>
          <Main />
        </ErrorBoundary>
        <ErrorBoundary>
          <Footer />
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
}

// ✅ Good - Strategic placement
function App() {
  return (
    <PageErrorBoundary componentName="App">
      <div>
        <Header /> {/* Low risk, no boundary */}
        <SectionErrorBoundary componentName="Main">
          <Main /> {/* High risk, isolated */}
        </SectionErrorBoundary>
        <Footer /> {/* Low risk, no boundary */}
      </div>
    </PageErrorBoundary>
  );
}
```

### 6. Provide User-Friendly Error Messages

```typescript
// ❌ Bad
return 'Error: NETWORK_ERROR_500';

// ✅ Good
return 'Unable to save your work. Please check your internet connection and try again.';
```

### 7. Include Error Context

```typescript
// ❌ Bad
logger.error('Operation failed');

// ✅ Good
logger.error('Operation failed', {
  operation: 'saveDraft',
  chapterId: '123',
  userId: '456',
  attemptNumber: 2,
});
```

### 8. Use Retry for Transient Failures

```typescript
// ❌ Bad
try {
  return await apiCall();
} catch (error) {
  throw error;
}

// ✅ Good
return executeWithRetry(
  async () => {
    return await apiCall();
  },
  {
    maxAttempts: 3,
    delayMs: 500,
    retryCondition: error => error.retryable,
  }
);
```

### 9. Clean Up Resources in Error Handlers

```typescript
async function processData() {
  const resource = await acquireResource();
  try {
    return await process(resource);
  } catch (error) {
    // Ensure cleanup happens even on error
    await releaseResource(resource);
    throw error;
  } finally {
    await cleanup();
  }
}
```

### 10. Test Error Paths

```typescript
describe('saveDraft', () => {
  it('should handle storage errors', async () => {
    // Mock IndexedDB to throw
    jest.spyOn(indexedDB, 'open').mockImplementationOnce(() => {
      throw new Error('Storage quota exceeded');
    });

    await expect(saveDraft('123', '456', 'content', 'summary')).rejects.toThrow(
      'Storage quota exceeded'
    );
  });
});
```

---

## API Reference

### Error Types

#### `createNetworkError(message, options)`

Creates a NetworkError instance.

**Parameters:**

- `message` - Error message
- `options` - Error options object
  - `statusCode` - HTTP status code
  - `endpoint` - API endpoint
  - `method` - HTTP method
  - `body` - Request body
  - `response` - Response data
  - `cause` - Original error
  - `context` - Additional context

#### `createValidationError(message, options)`

Creates a ValidationError instance.

#### `createBusinessLogicError(message, options)`

Creates a BusinessLogicError instance.

#### `createSystemError(message, options)`

Creates a SystemError instance.

#### `createAIError(message, options)`

Creates an AIError instance.

#### `createStorageError(message, options)`

Creates a StorageError instance.

#### `createConfigurationError(message, options)`

Creates a ConfigurationError instance.

#### `toAppError(error, context?)`

Converts any error to AppError.

#### `getErrorMessage(error)`

Gets user-friendly error message.

### Result Pattern

#### `ok<T>(data)` / `err<E>(error)`

Create success or failure Result.

#### `isOk<T, E>(result)`, `isErr<T, E>(result)`

Type guards for Result.

#### `unwrap<T, E>(result, context?)`

Unwrap success value or throw.

#### `unwrapOr<T, E>(result, defaultValue)`

Unwrap with default value.

#### `map<T, E, U>(result, fn)`

Map success value.

#### `andThen<T, E, U>(result, fn)`

Chain operations.

#### `tryCatch<T>(fn, errorHandler?)`

Wrap sync function.

#### `tryCatchAsync<T>(fn, errorHandler?)`

Wrap async function.

#### `fromPromise<T>(promise, errorHandler?)`

Convert Promise to Result.

#### `retry<T>(fn, maxAttempts, delayMs)`

Retry operation.

### Logging

#### `logger.debug(message, context?)`

Log debug message.

#### `logger.info(message, context?)`

Log info message.

#### `logger.warn(message, context?)`

Log warning message.

#### `logger.error(message, context?)`

Log error message.

#### `logger.logError(error, context?)`

Log error with full context.

#### `logger.child(context)`

Create child logger.

#### `performanceLogger.start(operation)`

Start performance measurement.

#### `performanceLogger.measure(operation, fn)`

Measure async operation.

#### `logEvent(eventName, properties?)`

Log structured event.

### Error Handler

#### `handleError(error, context?)`

Handle error with logging and reporting.

#### `executeWithRetry(operation, options?)`

Execute with retry logic.

#### `wrapAsync(fn, context?)`

Wrap async function.

#### `wrapSync(fn, context?)`

Wrap sync function.

#### `addErrorListener(listener)`

Add error listener.

#### `getUserMessage(error)`

Get user-friendly message.

#### `shouldRetry(error)`

Check if error is retryable.

### React Error Boundaries

#### `<ErrorBoundary>`

Generic error boundary.

#### `<PageErrorBoundary>`

Page-level boundary.

#### `<SectionErrorBoundary>`

Section-level boundary.

#### `<ComponentErrorBoundary>`

Component-level boundary.

#### `<EditorErrorBoundary>`

Editor-specific boundary.

#### `<ProjectsErrorBoundary>`

Projects-specific boundary.

#### `<AIServiceErrorBoundary>`

AI service boundary.

#### `withErrorBoundary(Component, props)`

HOC wrapper.

#### `useErrorHandler(componentName?)`

Hook for error handling.

---

## Troubleshooting

### Common Issues

#### 1. "Cannot read properties of undefined"

**Problem:** Trying to access properties of a Result without checking.

```typescript
// ❌ Bad
const result = tryCatch(() => JSON.parse('invalid'));
return result.data; // TypeError if error

// ✅ Good
const result = tryCatch(() => JSON.parse('invalid'));
if (isOk(result)) {
  return result.data;
}
return null;
```

#### 2. "Error boundary not catching errors"

**Problem:** Error thrown in async operation.

```typescript
// ❌ Bad - Async error not caught
function Component() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/data').then(() => {
      throw new Error('Async error'); // Not caught
    });
  }, []);

  return <div>{data}</div>;
}

// ✅ Good - Use try/catch in async function
function Component() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        await fetch('/api/data');
        // Will be caught by error boundary
      } catch (error) {
        throw error;
      }
    };
    load();
  }, []);

  return <div>{data}</div>;
}
```

#### 3. "Looping error handling"

**Problem:** Error handler throwing new errors.

```typescript
// ❌ Bad
try {
  operation();
} catch (error) {
  handleError(error);
  throw new Error('Failed'); // Creates new error
}

// ✅ Good
try {
  operation();
} catch (error) {
  handleError(error);
  throw error; // Re-throw original
}
```

#### 4. Missing error context

**Problem:** Hard to debug without context.

```typescript
// ❌ Bad
catch (error) {
  throw createSystemError('Error', { subsystem: 'app' });
}

// ✅ Good
catch (error) {
  throw createSystemError('Failed to save draft', {
    subsystem: 'storage',
    operation: 'saveDraft',
    chapterId: '123',
    userId: '456',
    cause: error,
  });
}
```

#### 5. Performance issues with logging

**Problem:** Expensive logging in production.

```typescript
// ❌ Bad
logger.info('Debug info', expensiveOperation()); // Always executed

// ✅ Good
logger.info('Debug info', {
  data: expensiveOperation(), // Only executed if level allows
});
```

---

## Migration Guide

### From console.error to Structured Logging

**Before:**

```typescript
console.error('Failed to save:', error);
```

**After:**

```typescript
logger.error('Failed to save draft', {
  error: error.message,
  chapterId: '123',
});
```

### From throwing exceptions to Result

**Before:**

```typescript
function parse(data: string): User {
  try {
    return JSON.parse(data);
  } catch {
    throw new Error('Invalid JSON');
  }
}
```

**After:**

```typescript
function parse(data: string): Result<User, AppError> {
  try {
    return ok(JSON.parse(data));
  } catch (error) {
    return err(
      createValidationError('Invalid JSON', {
        received: data.substring(0, 100),
        cause: error,
      })
    );
  }
}
```

### From basic error boundaries to feature-specific

**Before:**

```typescript
class ErrorBoundary extends React.Component {
  // Basic implementation
}
```

**After:**

```typescript
import { EditorErrorBoundary } from '@/lib/errors';

// Use specific boundary for each feature
<EditorErrorBoundary componentName="Editor">
  <Editor />
</EditorErrorBoundary>
```

---

## Summary

The error handling system provides:

1. **Type Safety** - Full TypeScript coverage with discriminated unions
2. **Structured Errors** - 7 distinct error types with proper context
3. **Functional Pattern** - Result<T, E> for type-safe error handling
4. **Smart Logging** - Multi-level logging with structured output
5. **React Integration** - Error boundaries for component isolation
6. **Production Ready** - Sentry integration and error tracking
7. **Developer Experience** - Clear messages and debugging tools

Use this guide to implement robust error handling throughout the Novelist.ai
application.
