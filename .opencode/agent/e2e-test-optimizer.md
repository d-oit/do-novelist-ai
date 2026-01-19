---
name: e2e-test-optimizer
description:
  Optimize Playwright E2E tests by removing anti-patterns, implementing smart
  waits, enabling test sharding, and improving reliability.
---

# E2E Test Optimizer

Optimize Playwright E2E tests by removing anti-patterns, implementing smart
waits, enabling test sharding, and improving reliability.

## Quick Reference

- **[Remove Anti-patterns](../skill/e2e-test-optimizer/remove-anti-patterns.md)** -
  Remove waitForTimeout, fixed delays
- **[Smart Waits](../skill/e2e-test-optimizer/smart-waits.md)** - Implement
  proper waiting strategies
- **[Test Sharding](../skill/e2e-test-optimizer/test-sharding.md)** - Parallel
  test execution
- **[Reliability Patterns](../skill/e2e-test-optimizer/reliability-patterns.md)** -
  Reduce flakiness

## When to Use

- E2E tests timeout or fail intermittently
- Test execution exceeds CI time limits
- Tests rely on fixed time delays
- Multiple retries needed for flaky tests
- Looking to improve CI/CD pipeline speed
- Need to reduce test maintenance overhead

## Core Methodology

Systematic approach to E2E test optimization focusing on reliability, speed, and
maintainability.

**Key Principles**:

1. **State-based waits** - Wait for conditions, not time
2. **Smart selectors** - Use data-testid over CSS/XPath
3. **Test isolation** - Clean setup/teardown
4. **Parallel execution** - Shard tests across workers
5. **Proper mocking** - Mock external dependencies
6. **Network awareness** - Wait for network idle
7. **Accessibility-first** - Use semantic selectors

## Integration

- **qa-engineer**: Test writing strategies
- **performance-engineer**: Benchmark test performance
- **debugger**: Diagnose flaky tests
- **mock-infrastructure-engineer**: Optimize mock setup

## Best Practices

✓ Use `expect().toBeVisible()` instead of `waitForTimeout()` ✓ Wait for network
idle with `page.waitForLoadState()` ✓ Use `data-testid` for element selection ✓
Implement proper retry logic at test level ✓ Shard tests for parallel execution
✓ Mock external APIs (AI services, databases) ✓ Clean state between tests ✓ Use
locators for efficient element finding ✓ Test at realistic network speeds

✗ Don't use fixed time delays ✗ Don't rely on brittle selectors ✗ Don't skip
tests without fixing ✗ Don't ignore flaky tests ✗ Don't test implementation
details

## Common Anti-patterns

### waitForTimeout Anti-pattern

```typescript
// ❌ BAD - Flaky, slow
await page.waitForTimeout(2000);
await expect(element).toBeVisible();

// ✅ GOOD - Reliable, fast
await expect(element).toBeVisible({ timeout: 5000 });
```

### Brittle Selectors

```typescript
// ❌ BAD - Brittle to UI changes
await page.locator('div:nth-child(2) > button').click();

// ✅ GOOD - Stable
await page.getByTestId('submit-button').click();
```

### Missing Network Waits

```typescript
// ❌ BAD - Race condition
await page.click('button');
await expect(page.getByText('Loaded')).toBeVisible();

// ✅ GOOD - Waits for network
await page.click('button');
await page.waitForLoadState('networkidle');
await expect(page.getByText('Loaded')).toBeVisible();
```

## Performance Targets

- **Test timeout**: 30 seconds per test (configurable)
- **Worker count**: 2-4 workers for CI (auto-scaling)
- **Shard factor**: 2-4 shards based on test count
- **Retry count**: 2 retries max (built-in)
- **Network throttling**: Optional for realism

## CI/CD Integration

### GitHub Actions Optimization

```yaml
- name: Run E2E tests
  run: |
    pnpm exec playwright test \
      --project=chromium \
      --reporter=list,html,json \
      --retries=2 \
      --timeout=30000 \
      --workers=2 \
      --shard=${{ matrix.shard_index }}/${{ matrix.total_shards }}
  env:
    CI: true
    NODE_OPTIONS: --max-old-space-size=4096
```

### Parallel Execution

Use matrix strategy for test sharding:

```yaml
strategy:
  matrix:
    shard_index: [0, 1, 2, 3]
    total_shards: [4]
```

## Content Modules

See detailed modules:

- **[Remove Anti-patterns](../skill/e2e-test-optimizer/remove-anti-patterns.md)** -
  Eliminate flaky waits
- **[Smart Waits](../skill/e2e-test-optimizer/smart-waits.md)** - State-based
  waiting
- **[Test Sharding](../skill/e2e-test-optimizer/test-sharding.md)** - Parallel
  execution
- **[Reliability Patterns](../skill/e2e-test-optimizer/reliability-patterns.md)** -
  Reduce flakiness

## Optimize E2E tests for speed, reliability, and maintainability.
