---
name: e2e-test-optimizer
description:
  Optimize Playwright E2E tests by removing anti-patterns, implementing smart
  waits, enabling test sharding, and improving reliability.
---

# E2E Test Optimizer

Specialized skill for optimizing Playwright E2E tests to eliminate flakiness,
improve speed, and ensure reliable CI/CD execution.

## Quick Reference

- **[Remove Anti-patterns](remove-anti-patterns.md)** - Eliminate waitForTimeout
  and fixed delays
- **[Smart Waits](smart-waits.md)** - Implement state-based waiting strategies
- **[Test Sharding](test-sharding.md)** - Configure parallel test execution
- **[Reliability Patterns](reliability-patterns.md)** - Reduce test flakiness

## When to Use

Use this skill when:

- E2E tests are timing out in CI
- Tests fail intermittently (flaky tests)
- Test execution time exceeds CI limits
- Multiple retries needed for tests to pass
- Tests rely on fixed time delays (anti-patterns)
- Looking to speed up CI/CD pipeline
- Need to improve test maintainability

## Core Methodology

Systematic E2E optimization focusing on three pillars: **Reliability**,
**Speed**, and **Maintainability**.

### Key Principles

1. **State-based waiting** - Wait for conditions, not arbitrary time
2. **Smart selectors** - Use stable, semantic element targeting
3. **Test isolation** - Clean setup/teardown to prevent interference
4. **Parallel execution** - Shard tests for faster CI runs
5. **Proper mocking** - Mock external dependencies for reliability
6. **Network awareness** - Wait for network completion
7. **Accessibility-first** - Use semantic selectors for stability

### Optimization Hierarchy

```
Priority 1: Remove anti-patterns (waitForTimeout)
  ↓
Priority 2: Implement smart waits (toBeVisible, toBeAttached)
  ↓
Priority 3: Optimize selectors (data-testid, locators)
  ↓
Priority 4: Enable test sharding (parallel execution)
  ↓
Priority 5: Add performance monitoring
```

## Integration Points

Works with these agents for comprehensive testing strategy:

- **qa-engineer**: Test writing strategies and conventions
- **performance-engineer**: Test performance benchmarking
- **debugger**: Diagnose and fix flaky tests
- **mock-infrastructure-engineer**: Optimize mock setup and caching

## Anti-patterns to Eliminate

### 1. waitForTimeout Anti-pattern

**Problem**: Fixed time delays are flaky and slow down tests

```typescript
// ❌ BAD - Flaky, slow
await page.waitForTimeout(2000);
await expect(element).toBeVisible();

// ✅ GOOD - Reliable, fast
await expect(element).toBeVisible({ timeout: 5000 });
```

### 2. Brittle Selectors Anti-pattern

**Problem**: CSS/XPath selectors break on UI changes

```typescript
// ❌ BAD - Brittle
await page.locator('div:nth-child(2) > button').click();
await page.locator('.btn.primary').click();

// ✅ GOOD - Stable
await page.getByTestId('submit-button').click();
await page.getByRole('button', { name: 'Submit' }).click();
```

### 3. Missing Network Waits Anti-pattern

**Problem**: Race conditions between user action and network requests

```typescript
// ❌ BAD - Race condition
await page.click('button');
await expect(page.getByText('Loaded')).toBeVisible();

// ✅ GOOD - Waits for network
await page.click('button');
await page.waitForLoadState('networkidle');
await expect(page.getByText('Loaded')).toBeVisible();
```

### 4. Hardcoded Timeout Anti-pattern

**Problem**: One-size-fits-all timeout doesn't work for all tests

```typescript
// ❌ BAD - Too short for slow tests, too long for fast
test.setTimeout(10000); // Global timeout

// ✅ GOOD - Per-test or per-assertion timeout
await expect(element).toBeVisible({ timeout: 5000 });
await expect(slowElement).toBeVisible({ timeout: 30000 });
```

## Best Practices

### ✅ Do

- Use `expect().toBeVisible()` for automatic waiting
- Use `data-testid` attributes for element selection
- Wait for network idle: `page.waitForLoadState('networkidle')`
- Use Playwright locators for efficient queries
- Clean state between tests
- Mock external dependencies (AI services, databases)
- Implement test-level retry logic
- Shard tests for parallel execution
- Test at realistic network speeds
- Use semantic selectors (roles, labels)

### ❌ Don't

- Use `waitForTimeout()` - always wait for state
- Rely on brittle selectors (CSS, XPath)
- Skip tests without fixing the root cause
- Ignore flaky tests - investigate and fix
- Test implementation details
- Use global timeouts - use per-assertion timeouts
- Assume immediate UI updates - wait for changes

## Performance Targets

### Speed Metrics

- **Test timeout**: 30 seconds per test (configurable)
- **Assertion timeout**: 5 seconds typical (adjust per test)
- **Worker count**: 2-4 workers for CI
- **Shard factor**: 2-4 shards based on test count
- **Target execution time**: < 2 minutes for smoke tests

### Optimization Goals

- **Reduce flaky tests**: < 1% failure rate
- **Improve execution speed**: 20-30% faster with sharding
- **Reduce CI time**: Minimize total pipeline duration
- **Maintain readability**: Keep tests easy to understand

## Smart Waiting Strategies

### waitForLoadState

Wait for different load states based on context:

```typescript
// For navigation
await page.waitForLoadState('load');

// For AJAX requests
await page.waitForLoadState('networkidle');

// For dynamic content
await page.waitForLoadState('domcontentloaded');
```

### expect() Built-in Waiting

Use Playwright's auto-waiting assertions:

```typescript
// Wait for element to appear
await expect(page.getByTestId('element')).toBeVisible();

// Wait for element to disappear
await expect(page.getByTestId('loading')).toBeHidden();

// Wait for text content
await expect(page.getByText('Success')).toBeVisible();

// Wait for element to be attached
await expect(page.getByTestId('element')).toBeAttached();
```

### Locators with Filters

Combine locators with smart filters:

```typescript
// Wait for specific element in list
await expect(
  page.getByTestId('item').filter({ hasText: 'Target' })
).toBeVisible();

// Wait for enabled button
await expect(
  page.getByRole('button', { name: 'Submit' })
    .and(page.getByRole('button', { disabled: false })
).toBeVisible();
```

## Test Sharding Strategy

### GitHub Actions Matrix

```yaml
strategy:
  matrix:
    shard_index: [0, 1, 2, 3]
    total_shards: [4]

steps:
  - name: Run E2E tests
    run: |
      pnpm exec playwright test \
        --project=chromium \
        --shard=${{ matrix.shard_index }}/${{ matrix.total_shards }} \
        --retries=2
```

### Dynamic Sharding

```bash
# Calculate shards based on test count
SHARD_COUNT=4
TEST_COUNT=$(pnpm exec playwright test --list 2>/dev/null | grep -c '›')
SHARD_SIZE=$((TEST_COUNT / SHARD_COUNT + 1))

for i in $(seq 0 $((SHARD_COUNT - 1))); do
  pnpm exec playwright test \
    --shard=$i/$SHARD_COUNT \
    --output=test-results/shard-$i
done
```

## CI/CD Integration

### Environment Variables

```bash
# Required for Playwright in CI
export CI=true
export PLAYWRIGHT_BROWSERS_PATH=~/.cache/ms-playwright
export NODE_ENV=test
export NODE_OPTIONS=--max-old-space-size=4096
```

### Optimized Test Command

```bash
pnpm exec playwright test \
  --project=chromium \
  --reporter=list,html,json \
  --retries=2 \
  --timeout=30000 \
  --workers=2 \
  --max-failures=5
```

### Caching Strategy

```yaml
- name: Cache Playwright browsers
  uses: actions/cache@v3
  with:
    path: ~/.cache/ms-playwright
    key: playwright-${{ runner.os }}-${{ hashFiles('**/pnpm-lock.yaml') }}
```

## Common Pitfalls

### Animation Delays

Animations can cause tests to be flaky:

```typescript
// ❌ DON'T - Wait arbitrary time
await page.waitForTimeout(500);

// ✅ DO - Wait for animation to complete
await page.waitForLoadState('domcontentloaded');
```

### Lazy Loading

Lazy-loaded components need special handling:

```typescript
// ❌ DON'T - Element might not exist yet
await expect(page.getByTestId('lazy-content')).toBeVisible();

// ✅ DO - Scroll into view first
await page.getByTestId('lazy-container').scrollIntoViewIfNeeded();
await expect(page.getByTestId('lazy-content')).toBeVisible();
```

### Multiple Loading States

Handle skeleton loaders gracefully:

```typescript
// Wait for loading state to complete
await expect(page.getByTestId('loading')).toBeVisible();
await expect(page.getByTestId('loading')).toBeHidden();
await expect(page.getByTestId('content')).toBeVisible();
```

## Monitoring and Metrics

### Test Execution Time

Track per-test execution to identify slow tests:

```typescript
test.describe('Feature', () => {
  test('slow test', async ({ page }) => {
    const startTime = Date.now();
    // ... test code ...
    const duration = Date.now() - startTime;
    if (duration > 5000) {
      console.warn(`Test took ${duration}ms - consider optimization`);
    }
  });
});
```

### Failure Analysis

Categorize failures for targeted fixes:

```typescript
test.afterEach(async () => {
  if (test.info().status !== 'passed') {
    // Take screenshot on failure
    await page.screenshot({
      path: `failures/${test.info().title}.png`,
      fullPage: true,
    });
  }
});
```

## Content Modules

- **[Remove Anti-patterns](remove-anti-patterns.md)** - Detailed anti-pattern
  removal guide
- **[Smart Waits](smart-waits.md)** - Comprehensive waiting strategies
- **[Test Sharding](test-sharding.md)** - Parallel execution setup
- **[Reliability Patterns](reliability-patterns.md)** - Reduce test flakiness

## Create fast, reliable, and maintainable E2E tests.
