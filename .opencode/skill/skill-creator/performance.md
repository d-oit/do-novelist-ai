# Performance Optimization

Token usage, caching, and parallel processing for skill performance.

## Token Optimization

### Input Optimization

**Principles**:

- Concise but complete descriptions
- Every word adds value
- Remove filler phrases
- Hierarchical structure (critical first)

**Examples**:

```yaml
# ✗ Bad - Verbose
description: This skill provides comprehensive guidance and best practices for creating new skills in the Claude Code environment, including detailed instructions on file structure, naming conventions, documentation standards, templates for different types of skills, and examples of how to use them effectively in various scenarios.

# ✅ Good - Concise
description: Create new Claude Code skills with proper structure, modular organization, and performance optimization. Use when building new skills, refactoring existing skills, or improving skill maintainability.
```

**Input Compression**:

- Use compact JSON for structured data
- Remove whitespace in production
- Use abbreviations where meaning clear
- Reference shared context vs repetition

### Output Optimization

**Use structured data**:

```json
// ✅ Good - Structured output
{
  "status": "success",
  "issues": [
    { "code": 1, "message": "..." },
    { "code": 2, "message": "..." }
  ]
}

// ✗ Bad - Verbose prose
The operation completed successfully. We found the following issues: first issue is about configuration, second issue is about dependencies...
```

**Numeric codes**:

- Instead of "very urgent", use urgency: 4
- Provide legend once: urgency: 1=critical, 2=high, 3=medium, 4=low
- Reduces token usage for repeated categories

## Caching Strategies

### Result Caching

**Cache key generation**:

```typescript
function generateCacheKey(parameters: object): string {
  const sorted = Object.keys(parameters).sort();
  const stringified = JSON.stringify(parameters);
  return crypto.createHash('sha256').update(stringified).digest('hex');
}

// Usage
const cacheKey = generateCacheKey({ input, config, version });
if (cache.has(cacheKey)) {
  return cache.get(cacheKey);
}
const result = await process(parameters);
cache.set(cacheKey, result, { ttl: 5 * 60 * 1000 }); // 5 minutes
```

**TTL guidelines**:

- Static reference data: 1 hour
- User preferences: 10 minutes
- Real-time analysis: 30 seconds
- Computation-heavy: 5 minutes
- Simple operations: 1 minute

### Partial Result Caching

**Cache intermediate results**:

```typescript
// Document analysis pipeline
async function analyzeDocument(doc: Document): Promise<Analysis> {
  // Cache OCR output separately
  const ocrKey = `ocr:${doc.id}`;
  let ocrText = cache.get(ocrKey);
  if (!ocrText) {
    ocrText = await runOCR(doc);
    cache.set(ocrKey, ocrText, { ttl: 60 * 60 * 1000 });
  }

  // Cache normalized text
  const normKey = `norm:${doc.id}`;
  let normalized = cache.get(normKey);
  if (!normalized) {
    normalized = normalizeText(ocrText);
    cache.set(normKey, normalized, { ttl: 5 * 60 * 1000 });
  }

  // Extract (can reuse cached OCR and normalization)
  const extracted = await extractData(normalized);

  return { ocrText, normalized, extracted };
}
```

**Layer caching by volatility**:

```
Stable layer (cache longest):
  - Static data structures
  - Reference tables
  - Configuration validation

Medium layer (cache medium):
  - Text normalization
  - Common computations
  - Pattern matching

Volatile layer (cache shortest):
  - Real-time analysis
  - Trend calculations
  - User session data
```

## Parallel Processing

### Batch Operations

**Identify independent operations**:

```typescript
// ✗ Bad - Sequential
const results = [];
for (const item of items) {
  results.push(await process(item)); // 2s each × 100 = 200s
}

// ✅ Good - Parallel batch
const results = await Promise.all(items.map(item => process(item))); // 2s total
```

**Concurrency limits**:

```typescript
import pLimit from 'p-limit';

const limit = pLimit(5); // 5 concurrent operations

async function processBatch(items: Item[]): Promise<Result[]> {
  return Promise.all(items.map(item => limit(() => processItem(item))));
}
```

### Resource Pooling

**Connection pools**:

```typescript
class ResourcePool<T> {
  private pool: T[] = [];
  private max: number;

  constructor(factory: () => T, max: number) {
    this.max = max;
    for (let i = 0; i < max; i++) {
      this.pool.push(factory());
    }
  }

  acquire(): Promise<T> {
    const resource = this.pool.pop();
    if (resource) return Promise.resolve(resource);

    // Pool exhausted, create new
    return Promise.resolve(factory());
  }

  release(resource: T): void {
    if (this.pool.length < this.max) {
      this.pool.push(resource);
    }
  }
}

// Usage
const dbPool = new ResourcePool(() => createDBConnection(), 5);

const connection = await dbPool.acquire();
try {
  await operation(connection);
} finally {
  dbPool.release(connection);
}
```

## Error Handling and Caching

**Circuit breaker pattern**:

```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF-OPEN' = 'CLOSED';
  private threshold = 5;
  private timeout = 30 * 1000; // 30 seconds

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF-OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.reset();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }

  private reset(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }
}
```

## Performance Monitoring

**Structured logging**:

```typescript
class PerformanceMonitor {
  logExecution<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();

    try {
      const result = await fn();

      const duration = performance.now() - start;
      logger.info('operation_complete', {
        operation,
        duration: `${duration.toFixed(2)}ms`,
        status: 'success',
      });

      if (duration > 1000) {
        logger.warn('slow_operation', { operation, duration });
      }

      return result;
    } catch (error) {
      const duration = performance.now() - start;
      logger.error('operation_failed', {
        operation,
        duration: `${duration.toFixed(2)}ms`,
        error: error.message,
      });
      throw error;
    }
  }
}
```

**Metrics tracking**:

```typescript
const metrics = {
  // Token usage
  inputTokens: { total: 0, min: Infinity, max: 0 },
  outputTokens: { total: 0, min: Infinity, max: 0 },

  // Performance
  responseTime: { total: 0, count: 0, p50: 0, p95: 0, p99: 0 },

  // Reliability
  successRate: { total: 0, successful: 0 },
  cacheHitRate: { hits: 0, misses: 0 },

  update(metric: string, value: number) {
    // Update metrics
  },

  getPercentile(metric: string, p: number): number {
    // Calculate p50, p95, p99
  },
};
```

## Performance Best Practices

### DO:

✓ Optimize token usage with concise descriptions ✓ Cache results with
appropriate TTL ✓ Use parallel processing for independent operations ✓ Pool
expensive resources ✓ Monitor performance continuously ✓ Use circuit breakers
for failing dependencies ✓ Structure output as JSON when appropriate ✓ Profile
before optimizing ✓ Optimize incrementally

### DON'T:

✓ Be verbose in skill descriptions ✓ Cache everything indiscriminately ✓ Use
unlimited concurrency ✓ Ignore performance metrics ✓ Skip error handling ✓
Prematurely optimize ✓ Create resource leaks ✓ Ignore cache invalidation ✓
Over-optimize rarely used paths

---

Optimize skills systematically, measure results, iterate continuously.
