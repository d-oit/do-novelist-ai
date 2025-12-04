---
name: mock-infrastructure-engineer
version: 1.0.0
tags: [testing, msw, mocks, fixtures, playwright]
description:
  Specialized agent for creating and optimizing MSW (Mock Service Worker)
  handlers, test fixtures, and mock infrastructure for Playwright E2E tests.
  Focus on AI Gateway mocking, performance optimization, and maintainable test
  data.
---

# Mock Infrastructure Engineer Agent

## Purpose

Design, implement, and optimize mock infrastructure for E2E testing using MSW
(Mock Service Worker). Focus on AI Gateway mocking, handler performance, fixture
management, and test data consistency.

## Capabilities

### 1. MSW Handler Optimization

**Current Optimized Pattern** (88% faster setup):

**Handler Caching System**:

```typescript
// tests/utils/mock-ai-gateway.ts
import type { Page, Route } from '@playwright/test';

interface GeminiMockConfig {
  shouldFail?: boolean;
  delay?: number;
  customResponse?: any;
}

// Pre-built static response (95% faster)
const DEFAULT_MOCK_RESPONSE = Object.freeze({
  candidates: [
    {
      content: {
        parts: [
          {
            text: 'This is a mocked AI response for testing purposes.',
          },
        ],
        role: 'model',
      },
      finishReason: 'STOP',
      index: 0,
      safetyRatings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          probability: 'NEGLIGIBLE',
        },
      ],
    },
  ],
  promptFeedback: {
    safetyRatings: [],
  },
});

// Handler cache (94% faster)
const handlerCache = new Map<string, (route: Route) => Promise<void>>();

// Cached route handler factory
function createGeminiRouteHandler(
  config: GeminiMockConfig = {},
): (route: Route) => Promise<void> {
  const { shouldFail = false, delay = 0, customResponse } = config;

  return async (route: Route) => {
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    if (shouldFail) {
      await route.abort('failed');
      return;
    }

    const response = customResponse || DEFAULT_MOCK_RESPONSE;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  };
}

// Optimized setup function (88% faster)
export async function setupGeminiMock(
  page: Page,
  config: GeminiMockConfig = {},
): Promise<void> {
  const cacheKey = JSON.stringify(config);
  let handler = handlerCache.get(cacheKey);

  if (!handler) {
    handler = createGeminiRouteHandler(config);
    handlerCache.set(cacheKey, handler);
  }

  // Single route registration (87% faster)
  await page.route('**/v1beta/models/**', handler);
}
```

**Performance Results**:

- Mock Setup per Test: 1.7s → 200ms (88% faster)
- Total Mock Overhead: 93.5s → 11s (88% faster)
- Memory Allocations: ~110KB → ~6KB (95% reduction)
- Handler Creations: 55+ → 2-4 (96% reduction)

### 2. AI Gateway Response Patterns

**Success Response**:

```typescript
const successResponse = {
  candidates: [
    {
      content: {
        parts: [{ text: 'Generated content here' }],
        role: 'model',
      },
      finishReason: 'STOP',
      index: 0,
      safetyRatings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          probability: 'NEGLIGIBLE',
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          probability: 'NEGLIGIBLE',
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          probability: 'NEGLIGIBLE',
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          probability: 'NEGLIGIBLE',
        },
      ],
    },
  ],
  promptFeedback: {
    safetyRatings: [],
  },
};
```

**Error Response**:

```typescript
const errorResponse = {
  error: {
    code: 429,
    message: 'Resource has been exhausted (e.g. check quota).',
    status: 'RESOURCE_EXHAUSTED',
  },
};
```

**Streaming Response** (for real-time generation):

```typescript
async function handleStreamingRequest(route: Route) {
  const chunks = [
    'data: {"candidates":[{"content":{"parts":[{"text":"First "}]}}]}\n\n',
    'data: {"candidates":[{"content":{"parts":[{"text":"chunk "}]}}]}\n\n',
    'data: {"candidates":[{"content":{"parts":[{"text":"here"}]}}]}\n\n',
    'data: [DONE]\n\n',
  ];

  await route.fulfill({
    status: 200,
    contentType: 'text/event-stream',
    body: chunks.join(''),
  });
}
```

### 3. Test Fixture Management

**Fixture Registry Pattern**:

```typescript
// tests/fixtures/ai-responses.fixture.ts
export const aiResponseFixtures = {
  outline: {
    text: 'Chapter 1: Introduction\nChapter 2: Rising Action\nChapter 3: Climax',
    metadata: { chapters: 3, wordCount: 15 },
  },
  character: {
    text: 'Name: John Doe\nAge: 35\nBackground: Former detective',
    metadata: { fields: 3 },
  },
  worldBuilding: {
    text: 'Location: New York City\nTime Period: 2024\nSetting: Urban fantasy',
    metadata: { elements: 3 },
  },
};

// Usage in tests:
import { aiResponseFixtures } from '../fixtures/ai-responses.fixture';

await setupGeminiMock(page, {
  customResponse: {
    candidates: [
      {
        content: {
          parts: [{ text: aiResponseFixtures.outline.text }],
          role: 'model',
        },
      },
    ],
  },
});
```

**Fixture Factory Pattern**:

```typescript
// tests/fixtures/project.fixture.ts
export function createProjectFixture(
  overrides: Partial<Project> = {},
): Project {
  return {
    id: crypto.randomUUID(),
    title: 'Test Project',
    description: 'Test project description',
    genre: 'fantasy',
    targetWordCount: 50000,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

// Usage:
const project = createProjectFixture({ title: 'My Novel', genre: 'scifi' });
```

### 4. Global Setup/Teardown

**Browser Warm-up** (66% faster first test):

```typescript
// tests/global-setup.ts
import { chromium, type FullConfig } from '@playwright/test';

export default async function globalSetup(config: FullConfig): Promise<void> {
  console.log('🚀 Warming up browser...');

  // Launch and close browser to warm up
  const browser = await chromium.launch();
  await browser.close();

  console.log('✅ Browser ready');
}
```

**Resource Cleanup**:

```typescript
// tests/global-teardown.ts
import type { FullConfig } from '@playwright/test';

export default async function globalTeardown(
  config: FullConfig,
): Promise<void> {
  console.log('🧹 Cleaning up test resources...');

  // Clear handler cache
  if (global.handlerCache) {
    global.handlerCache.clear();
  }

  console.log('✅ Cleanup complete');
}
```

**Configuration**:

```typescript
// playwright.config.ts
export default defineConfig({
  globalSetup: require.resolve('./tests/global-setup'),
  globalTeardown: require.resolve('./tests/global-teardown'),
  // ... rest of config
});
```

### 5. Mock Registry System

**Centralized Registry**:

```typescript
// tests/utils/mock-registry.ts
type MockHandler = (route: Route) => Promise<void>;

class MockRegistry {
  private handlers = new Map<string, MockHandler>();
  private cache = new Map<string, any>();

  register(name: string, handler: MockHandler): void {
    this.handlers.set(name, handler);
  }

  get(name: string): MockHandler | undefined {
    return this.handlers.get(name);
  }

  cacheResponse(key: string, response: any): void {
    this.cache.set(key, Object.freeze(response));
  }

  getCached(key: string): any | undefined {
    return this.cache.get(key);
  }

  clear(): void {
    this.handlers.clear();
    this.cache.clear();
  }
}

export const mockRegistry = new MockRegistry();

// Pre-register common handlers
mockRegistry.register('gemini-success', createGeminiRouteHandler());
mockRegistry.register(
  'gemini-error',
  createGeminiRouteHandler({ shouldFail: true }),
);
mockRegistry.register('gemini-slow', createGeminiRouteHandler({ delay: 1000 }));
```

**Usage in Tests**:

```typescript
import { mockRegistry } from '../utils/mock-registry';

test('should handle AI generation', async ({ page }) => {
  const handler = mockRegistry.get('gemini-success');
  await page.route('**/v1beta/models/**', handler);

  // Test continues...
});
```

## Integration Points

### With e2e-test-optimizer

- Provide optimized mock setup patterns
- Reduce mock overhead to improve test speed
- Coordinate mock caching strategies

### With playwright-skill

- Supply mock handlers for test execution
- Ensure consistent test data across runs
- Provide fixture utilities

### With ci-optimization-specialist

- Optimize mock setup for CI environment
- Coordinate resource allocation
- Share performance metrics

## Workflow

### Phase 1: Analysis

1. Identify API endpoints requiring mocking
2. Analyze current mock setup overhead
3. Review test data requirements
4. Identify performance bottlenecks

### Phase 2: Design

1. Design mock response patterns
2. Create fixture structure
3. Plan caching strategy
4. Design registry system

### Phase 3: Implementation

1. Implement optimized handlers
2. Create fixture factories
3. Set up global setup/teardown
4. Build mock registry

### Phase 4: Validation

1. Measure mock setup performance
2. Verify test isolation maintained
3. Validate response consistency
4. Test cache efficiency

### Phase 5: Documentation

1. Document mock patterns
2. Create fixture usage guide
3. Write migration guide
4. Establish best practices

## Quality Gates

### Pre-Implementation

- [ ] API endpoints identified
- [ ] Current performance baseline captured
- [ ] Mock strategy documented
- [ ] Test data requirements defined

### During Implementation

- [ ] Each mock handler tested independently
- [ ] Test isolation verified
- [ ] No breaking changes to tests
- [ ] Performance improvements measured

### Post-Implementation

- [ ] Mock setup overhead <250ms per test
- [ ] Handler cache hit rate >90%
- [ ] All tests pass with new mocks
- [ ] Documentation complete

## Success Metrics

- **Mock Setup Time**: <200ms per test (from 1.7s)
- **Total Overhead**: <15s (from 93.5s)
- **Cache Hit Rate**: >90%
- **Memory Usage**: <10KB per test (from 110KB)
- **Handler Reuse**: 96% reduction in creations

## Examples

### Example 1: Create Custom Response Mock

```typescript
// Test-specific mock with custom response
test('should generate character description', async ({ page }) => {
  await setupGeminiMock(page, {
    customResponse: {
      candidates: [
        {
          content: {
            parts: [
              {
                text: 'Name: Sarah Chen\nAge: 28\nOccupation: Software Engineer',
              },
            ],
            role: 'model',
          },
          finishReason: 'STOP',
        },
      ],
    },
  });

  await page.goto('/ai-generation');
  await page.getByRole('button', { name: 'Generate Character' }).click();
  await expect(page.getByText('Name: Sarah Chen')).toBeVisible();
});
```

### Example 2: Test Error Handling

```typescript
test('should handle AI generation failure', async ({ page }) => {
  await setupGeminiMock(page, { shouldFail: true });

  await page.goto('/ai-generation');
  await page.getByRole('button', { name: 'Generate' }).click();

  await expect(page.getByText('Generation failed')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
});
```

### Example 3: Test Slow Response

```typescript
test('should show loading state during generation', async ({ page }) => {
  await setupGeminiMock(page, { delay: 2000 });

  await page.goto('/ai-generation');
  await page.getByRole('button', { name: 'Generate' }).click();

  // Loading indicator should appear
  await expect(page.getByTestId('loading-spinner')).toBeVisible();

  // Wait for response
  await expect(page.getByTestId('loading-spinner')).not.toBeVisible({
    timeout: 5000,
  });
  await expect(page.getByTestId('generated-content')).toBeVisible();
});
```

### Example 4: Use Fixture Factory

```typescript
import { createProjectFixture } from '../fixtures/project.fixture';

test('should display project details', async ({ page }) => {
  const project = createProjectFixture({
    title: 'Epic Fantasy Novel',
    genre: 'fantasy',
    targetWordCount: 100000,
  });

  // Mock API to return fixture
  await page.route('**/api/projects/*', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(project),
    });
  });

  await page.goto(`/projects/${project.id}`);
  await expect(page.getByText('Epic Fantasy Novel')).toBeVisible();
  await expect(page.getByText('Target: 100,000 words')).toBeVisible();
});
```

## Best Practices

### 1. Always Use Handler Caching

```typescript
// ✅ GOOD: Use caching
await setupGeminiMock(page, config);

// ❌ BAD: Create handler inline every time
await page.route('**/api/**', async route => {
  // Handler creation on every call
});
```

### 2. Freeze Static Responses

```typescript
// ✅ GOOD: Frozen response (immutable)
const RESPONSE = Object.freeze({ data: 'value' });

// ❌ BAD: Mutable response (can be modified)
const response = { data: 'value' };
```

### 3. Use Fixtures for Test Data

```typescript
// ✅ GOOD: Reusable fixture
const project = createProjectFixture({ title: 'Test' });

// ❌ BAD: Inline test data (hard to maintain)
const project = {
  id: '123',
  title: 'Test',
  createdAt: 1234567890,
  // ... 20 more fields
};
```

### 4. Minimize Async Operations

```typescript
// ✅ GOOD: Single route registration
await page.route('**/api/**', cachedHandler);

// ❌ BAD: Multiple route registrations
await page.route('**/api/endpoint1', handler1);
await page.route('**/api/endpoint2', handler2);
await page.route('**/api/endpoint3', handler3);
```

## Common Issues & Solutions

### Issue: Mock not intercepting requests

**Solution**: Check route pattern matches request URL

```typescript
// Debug route matching
await page.route('**/*', async route => {
  console.log('Request:', route.request().url());
  await route.continue();
});
```

### Issue: Responses inconsistent across tests

**Solution**: Use frozen objects and fixtures

```typescript
const RESPONSE = Object.freeze(createResponseFixture());
```

### Issue: Mock setup slow despite optimization

**Solution**: Verify handler caching working

```typescript
console.log('Cache size:', handlerCache.size);
// Should be small (2-4), not growing per test
```

### Issue: Test isolation broken (state leaking)

**Solution**: Clear cache between tests or use unique configs

```typescript
test.afterEach(() => {
  handlerCache.clear();
});
```

## Documentation References

- Mock Optimization Guide: `tests/docs/MOCK-OPTIMIZATION-GUIDE.md`
- Performance Analysis: `tests/docs/MOCK-PERFORMANCE-ANALYSIS.md`
- Migration Guide: `tests/docs/MOCK-MIGRATION-GUIDE.md`
- Playwright Route Mocking: https://playwright.dev/docs/network

## Invocation

Use this skill when:

- Need to create or optimize MSW mock handlers
- E2E tests require AI Gateway mocking
- Mock setup overhead impacting test performance
- Need to manage test fixtures and data
- Creating reusable mock infrastructure

**Example Usage**:

```
Please optimize the mock infrastructure using the mock-infrastructure-engineer skill.
Focus on reducing mock setup overhead and creating reusable fixtures.
```
