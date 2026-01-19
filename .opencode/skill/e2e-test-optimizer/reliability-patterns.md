# Reliability Patterns

Implement robust E2E test patterns to reduce flakiness and ensure consistent
results.

## Overview

"Reliability patterns" are proven techniques that make E2E tests immune to
timing issues, race conditions, and environmental differences.

## The Four Pillars of Reliable E2E Tests

1. **Test Isolation** - Tests don't affect each other
2. **State Reset** - Clean slate for each test
3. **Deterministic Behavior** - Same inputs = same outputs
4. **Failure Diagnostics** - Understand why tests fail

## Pillar 1: Test Isolation

### Problem: Cross-Test Contamination

```typescript
// ❌ BAD - Tests share state
test.describe('User Session', () => {
  test('logs in', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('username').fill('user1');
    await page.getByTestId('password').fill('pass');
    await page.getByRole('button', { name: 'Login' }).click();
  });

  test('logs in as different user', async ({ page }) => {
    // ❌ Still logged in as user1!
    await page.goto('/dashboard');
    // Test contaminated by previous test
  });
});
```

### Solution: Complete Isolation

```typescript
// ✅ GOOD - Isolated test context
test.describe('User Session', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear all state before each test
    await context.clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('logs in as user1', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('username').fill('user1');
    await page.getByTestId('password').fill('pass');
    await page.getByRole('button', { name: 'Login' }).click();
  });

  test('logs in as user2', async ({ page }) => {
    // ✅ Clean state, no contamination
    await page.goto('/login');
    await page.getByTestId('username').fill('user2');
    await page.getByTestId('password').fill('pass');
    await page.getByRole('button', { name: 'Login' }).click();
  });
});
```

### Isolation Checklist

```typescript
test.beforeEach(async ({ page, context }) => {
  // Clear browser storage
  await context.clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
    // Clear IndexedDB
    const databases = indexedDB.databases;
    databases.forEach(db => indexedDB.deleteDatabase(db.name));
  });

  // Clear navigation state
  await page.goto('/'); // Reset to home
});
```

## Pillar 2: State Reset

### Problem: State Accumulation

```typescript
// ❌ BAD - State accumulates
test.describe('Cart', () => {
  test('adds item 1', async ({ page }) => {
    await page.goto('/cart');
    await page.getByTestId('add-item-1').click();
  });

  test('adds item 2', async ({ page }) => {
    // ❌ Cart already has item 1!
    await page.goto('/cart');
    await page.getByTestId('add-item-2').click();
  });
});
```

### Solution: Explicit State Management

```typescript
// ✅ GOOD - Explicit state reset
test.describe('Cart', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cart');
    // Clear cart explicitly
    await page.getByTestId('clear-cart').click();
    await page.waitForLoadState('networkidle');
  });

  test('adds item 1', async ({ page }) => {
    await page.getByTestId('add-item-1').click();
    await expect(page.getByTestId('item-1')).toBeVisible();
  });

  test('adds item 2', async ({ page }) => {
    // ✅ Cart is empty, clean state
    await page.getByTestId('add-item-2').click();
    await expect(page.getByTestId('item-2')).toBeVisible();
  });
});
```

### Database Reset Pattern

```typescript
test.beforeEach(async () => {
  // Reset in-memory database
  const db = getTestDatabase();
  db.reset();

  // Or for real database, use transactions
  await db.transaction(async trx => {
    await trx.rollback();
  });
});
```

### Mock Reset Pattern

```typescript
test.beforeEach(async () => {
  // Reset all mocks to default state
  vi.clearAllMocks();
  mockApiService.getUsers.mockResolvedValue(defaultUsers);
  mockApiService.getPosts.mockResolvedValue(defaultPosts);
});

test.afterEach(async () => {
  // Verify no unexpected mock calls
  expect(mockApiService.getUsers).toHaveBeenCalledTimes(1);
});
```

## Pillar 3: Deterministic Behavior

### Problem: Non-Deterministic Elements

```typescript
// ❌ BAD - Random test data
test('displays greeting', async ({ page }) => {
  const randomId = Math.random();
  await page.goto(`/user/${randomId}`);
  // ❌ Fails sometimes if randomId doesn't exist
  await expect(page.getByText('Hello')).toBeVisible();
});
```

### Solution: Predictable Test Data

```typescript
// ✅ GOOD - Deterministic test data
const testUsers = [
  { id: 'user-001', name: 'Alice' },
  { id: 'user-002', name: 'Bob' },
  { id: 'user-003', name: 'Charlie' },
];

test('displays greeting', async ({ page }) => {
  await page.goto('/user/user-001');
  // ✅ Always works with predictable data
  await expect(page.getByText('Hello, Alice')).toBeVisible();
});
```

### Deterministic Test Order

```typescript
// ❌ BAD - Random execution order
test.describe('Feature', () => {
  // Tests run in random order
  test('test A', async () => {
    /* ... */
  });
  test('test B', async () => {
    /* ... */
  });
  test('test C', async () => {
    /* ... */
  });
});

// ✅ GOOD - Serial execution for dependent tests
test.describe.serial('Feature', () => {
  // Tests run in order
  test('test A', async () => {
    /* ... */
  });
  test('test B', async () => {
    /* ... */
  });
  test('test C', async () => {
    /* ... */
  });
});
```

### Deterministic Timeouts

```typescript
// ❌ BAD - Global timeout
test.setTimeout(10000); // May fail on slow CI

// ✅ GOOD - Per-assertion timeout
await expect(fastElement).toBeVisible({ timeout: 5000 });
await expect(slowElement).toBeVisible({ timeout: 15000 });
```

## Pillar 4: Failure Diagnostics

### Pattern 1: Automatic Screenshots

```typescript
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== 'passed') {
    // Screenshot on failure
    await page.screenshot({
      path: `test-results/${testInfo.title}-failure.png`,
      fullPage: true,
    });

    // Also capture console errors
    const errors = await page.evaluate(() => {
      return window.consoleErrors || [];
    });
    console.error('Console errors:', errors);
  }
});
```

### Pattern 2: Trace Files

```typescript
test.afterEach(async ({ browser }, testInfo) => {
  if (testInfo.status !== 'passed') {
    // Save full trace for debugging
    await context.tracing.stop({
      path: `test-results/${testInfo.title}-trace.zip`,
    });
  }
});
```

### Playwright Config for Tracing

```typescript
export default defineConfig({
  use: {
    trace: 'retain-on-failure', // Only save traces when tests fail
    screenshot: 'only-on-failure', // Screenshots only on failure
    video: 'retain-on-failure', // Videos only on failure
  },
});
```

### Pattern 3: Retry with Diagnostics

```typescript
test.describe('Flaky Feature', () => {
  // Only retry if really needed
  test.describe.configure({ retries: 2 });

  test('example', async ({ page }) => {
    await page.goto('/page');
    await expect(page.getByTestId('element')).toBeVisible();
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.retry) {
      console.warn(`Test retry #${testInfo.retry}: ${testInfo.title}`);
      // Additional diagnostics on retry
      await page.screenshot({
        path: `test-results/${testInfo.title}-retry-${testInfo.retry}.png`,
        fullPage: true,
      });
    }
  });
});
```

## Common Flaky Test Patterns

### Pattern 1: Animation Race

```typescript
// ❌ FLAKY - Animation timing
test('opens modal', async ({ page }) => {
  await page.getByTestId('open-modal').click();
  await expect(page.getByTestId('modal')).toBeVisible();
  // Fails if animation takes 501ms (test waits 500ms)
});

// ✅ RELIABLE - Wait for animation
test('opens modal', async ({ page }) => {
  await page.getByTestId('open-modal').click();
  await page.waitForLoadState('domcontentloaded'); // Wait for animation
  await expect(page.getByTestId('modal')).toBeVisible();
});
```

### Pattern 2: Network Race

```typescript
// ❌ FLAKY - Network timing
test('loads data', async ({ page }) => {
  await page.goto('/data-page');
  await expect(page.getByTestId('data')).toBeVisible();
  // Fails if API takes 501ms
});

// ✅ RELIABLE - Wait for network
test('loads data', async ({ page }) => {
  await page.goto('/data-page');
  await page.waitForLoadState('networkidle'); // Wait for API
  await expect(page.getByTestId('data')).toBeVisible();
});
```

### Pattern 3: Selector Ambiguity

```typescript
// ❌ FLAKY - Multiple matches
test('clicks button', async ({ page }) => {
  // 3 buttons with "Submit" text exist
  await page.getByRole('button', { name: 'Submit' }).click();
  // Clicks wrong button sometimes
});

// ✅ RELIABLE - Unique selector
test('clicks button', async ({ page }) => {
  await page.getByTestId('form-submit-button').click();
  // Always clicks correct button
});
```

## Anti-Flakiness Checklist

Before marking test as reliable:

- [ ] Test runs successfully 10+ times in a row
- [ ] Test passes on different browsers (chromium, firefox, webkit)
- [ ] Test passes on different OS (Linux, macOS, Windows)
- [ ] Test passes with different network speeds
- [ ] Test has proper beforeEach/afterEach isolation
- [ ] Test uses state-based waits (no waitForTimeout)
- [ ] Test has unique selectors (data-testid)
- [ ] Test has failure diagnostics (screenshots, traces)
- [ ] Test is deterministic (no random data)

## Reliability Testing Strategy

### Phase 1: Stress Test

```bash
# Run test 50 times to check for flakiness
for i in {1..50}; do
  echo "Run $i"
  pnpm exec playwright test tests/specs/example.spec.ts
done

# Count failures
if [ $? -ne 0 ]; then
  echo "Test is flaky!"
fi
```

### Phase 2: Parallel Test

```bash
# Run same test in parallel to check isolation
pnpm exec playwright test \
  tests/specs/example.spec.ts \
  --workers=4 \
  --repeat-each=3
```

### Phase 3: Cross-Platform Test

```yaml
strategy:
  matrix:
    os: [ubuntu-latest, macos-latest, windows-latest]
    browser: [chromium, firefox, webkit]
```

## Reliability Metrics

### Track Flakiness Rate

```typescript
const results = {
  passed: 47,
  failed: 2,
  flaky: 1, // Test passed on retry
};

const flakinessRate = (results.flaky / results.passed) * 100;
// Target: < 1% flakiness rate
```

### Measure Reliability Improvement

```typescript
// Before optimization: 15% flakiness rate
const before = { total: 100, failed: 15 };

// After optimization: 1% flakiness rate
const after = { total: 100, failed: 1 };

const improvement = ((before.failed - after.failed) / before.failed) * 100;
// Result: 93.3% improvement
```

## Quick Reference

| Pattern                  | Use Case          | Example                          |
| ------------------------ | ----------------- | -------------------------------- |
| `beforeEach` isolation   | State reset       | Clear cookies, localStorage      |
| `afterEach` diagnostics  | Failure debugging | Screenshots, traces              |
| `test.describe.serial`   | Ordered tests     | Dependent test sequences         |
| `expect().toBeVisible()` | Element waiting   | Auto-waiting assertions          |
| `waitForLoadState()`     | Network waiting   | AJAX, navigation completion      |
| `test.slow()`            | Long operations   | Extend timeout for specific test |
| `retry: 2`               | Known flaky tests | Retry up to 2 times              |

## Summary

Reliable E2E tests require:

1. **Complete isolation** - No cross-test contamination
2. **Explicit state reset** - Clean slate each test
3. **Deterministic behavior** - Predictable results
4. **Rich diagnostics** - Understand failures quickly

Implement these patterns to transform flaky tests into reliable tests.
