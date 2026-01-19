# Smart Waits

Implement proper waiting strategies for reliable, fast, and maintainable E2E
tests.

## Overview

"Smart waits" means waiting for specific conditions (state) rather than
arbitrary time delays. This is the foundation of reliable E2E testing.

## Philosophy: Wait for What, Not When

### Anti-pattern: Fixed Time

```typescript
// ❌ BAD - Waits 2 seconds regardless
await page.waitForTimeout(2000);
```

**Problems**:

- Wastes time if ready sooner
- Fails if takes longer
- Magic numbers throughout code
- No semantic meaning

### Solution: State-Based Waiting

```typescript
// ✅ GOOD - Waits until visible
await expect(page.getByTestId('element')).toBeVisible();
```

**Benefits**:

- Passes as soon as ready
- Never fails prematurely
- Self-documenting
- Configurable timeout

## Playwright Waiting Strategies

### 1. expect() Auto-Waiting

Playwright's `expect()` has built-in waiting - use it first!

```typescript
// Element appears
await expect(page.getByTestId('modal')).toBeVisible();

// Element disappears
await expect(page.getByTestId('loading')).toBeHidden();

// Text content appears
await expect(page.getByText('Success')).toBeVisible();

// Element is attached to DOM
await expect(page.getByTestId('button')).toBeAttached();
```

**Default timeout**: 5 seconds (configurable per assertion)

### 2. waitForLoadState()

Wait for browser/different load states:

```typescript
// Page fully loaded
await page.waitForLoadState('load');

// No active network requests (AJAX complete)
await page.waitForLoadState('networkidle');

// DOM fully parsed (but might still be loading)
await page.waitForLoadState('domcontentloaded');
```

**When to use**:

- `load` - Navigation to new page
- `networkidle` - After form submission, button click
- `domcontentloaded` - Quick checks, no external resources

### 3. waitFor() with Custom Conditions

Wait for specific conditions:

```typescript
// Wait for element with specific text
await page.getByTestId('list').waitFor({
  state: 'attached',
  timeout: 5000,
});

// Wait for multiple elements
await Promise.all([
  page.getByTestId('title').waitFor(),
  page.getByTestId('content').waitFor(),
]);
```

### 4. waitForFunction() for Complex Conditions

Wait for dynamic conditions:

```typescript
// Wait for specific count
await page.waitForFunction(() => page.locator('.item').count() >= 3, {
  timeout: 5000,
});

// Wait for custom state
await page.waitForFunction(() => page.evaluate(() => window.appReady), {
  timeout: 10000,
});
```

## Waiting Scenarios

### Scenario 1: Modal Appearance

```typescript
test('opens settings modal', async ({ page }) => {
  await page.goto('/dashboard');

  // Click settings button
  await page.getByRole('button', { name: 'Settings' }).click();

  // Smart wait: Modal is visible
  await expect(page.getByTestId('settings-modal')).toBeVisible();

  // Wait for animation to complete
  await page.waitForLoadState('domcontentloaded');
});
```

### Scenario 2: Form Submission

```typescript
test('submits contact form', async ({ page }) => {
  await page.goto('/contact');

  // Fill form
  await page.getByTestId('name-input').fill('John Doe');
  await page.getByTestId('email-input').fill('john@example.com');
  await page.getByTestId('message-input').fill('Hello');

  // Submit form
  await page.getByRole('button', { name: 'Send' }).click();

  // Smart wait: Network idle (AJAX complete)
  await page.waitForLoadState('networkidle');

  // Verify success message
  await expect(page.getByTestId('success-message')).toBeVisible();
});
```

### Scenario 3: Lazy Loading

```typescript
test('loads lazy content', async ({ page }) => {
  await page.goto('/feed');

  // Scroll to trigger lazy load
  await page.mouse.wheel(0, 500);

  // Smart wait: Wait for element to appear
  await expect(page.getByTestId('lazy-item-10')).toBeVisible();
});
```

### Scenario 4: API Response

```typescript
test('displays data from API', async ({ page }) => {
  await page.goto('/dashboard');

  // Trigger API call
  await page.getByRole('button', { name: 'Refresh' }).click();

  // Smart wait: Wait for API response (network idle)
  await page.waitForLoadState('networkidle');

  // Verify data displayed
  await expect(page.getByTestId('data-grid')).toBeVisible();
  await expect(page.getByTestId('loading-spinner')).toBeHidden();
});
```

### Scenario 5: Multiple Concurrent Waits

```typescript
test('waits for multiple elements', async ({ page }) => {
  await page.goto('/dashboard');

  // Wait for all sections to load concurrently
  await Promise.all([
    expect(page.getByTestId('header')).toBeVisible(),
    expect(page.getByTestId('sidebar')).toBeVisible(),
    expect(page.getByTestId('content')).toBeVisible(),
  ]);
});
```

### Scenario 6: Skeleton Loading

```typescript
test('waits for content to load', async ({ page }) => {
  await page.goto('/page-with-skeleton');

  // First, wait for skeleton to appear
  await expect(page.getByTestId('skeleton-loader')).toBeVisible();

  // Then wait for skeleton to disappear
  await expect(page.getByTestId('skeleton-loader')).toBeHidden();

  // Finally, wait for actual content
  await expect(page.getByTestId('content')).toBeVisible();
});
```

## Advanced Waiting Patterns

### Chaining Waits

```typescript
// Wait for sequence of events
await page.getByRole('button', { name: 'Next' }).click();
await expect(page.getByText('Step 2')).toBeVisible();
await page.getByRole('button', { name: 'Submit' }).click();
await expect(page.getByText('Complete')).toBeVisible();
```

### Conditional Waits

```typescript
// Wait for element only if it should appear
const shouldWaitForModal = someCondition;
if (shouldWaitForModal) {
  await expect(page.getByTestId('modal')).toBeVisible({ timeout: 10000 });
}
```

### Retry with Smart Waits

```typescript
// Wait with automatic retry (built into Playwright)
test.describe('feature', () => {
  test.beforeEach(async ({ page }) => {
    // Setup might need retries
    await page.goto('/setup');
  });

  test('main test', async ({ page }) => {
    // Smart wait handles slow setup
    await expect(page.getByTestId('ready')).toBeVisible();
  });
});
```

### Polling for Custom State

```typescript
// Wait for custom application state
await page.waitForFunction(
  () => {
    return page.evaluate(() => {
      return window.appState === 'ready';
    });
  },
  { timeout: 10000 },
);
```

## Timeout Configuration

### Per-Assertion Timeouts

```typescript
// Quick element appearance
await expect(page.getByTestId('quick-element')).toBeVisible({ timeout: 3000 });

// Slow API call
await expect(page.getByTestId('api-result')).toBeVisible({ timeout: 10000 });

// Very slow operation
await expect(page.getByTestId('slow-operation')).toBeVisible({
  timeout: 30000,
});
```

### Project-Level Configuration

```typescript
// playwright.config.ts
export default defineConfig({
  timeout: 10000, // Global default
  expect: {
    timeout: 5000, // Assertion default
  },
  use: {
    actionTimeout: 5000, // Click/fill timeout
  },
});
```

### Test-Specific Timeouts

```typescript
test.slow(() => {
  // Mark test as slow for longer timeout
  test.setTimeout(30000);
});

test('very slow operation', async ({ page }) => {
  test.setTimeout(30000); // Override for this test
  await expect(page.getByTestId('slow')).toBeVisible({ timeout: 30000 });
});
```

## Common Waiting Pitfalls

### Pitfall 1: Not Waiting for Animation

```typescript
// ❌ FAILS - Element animates into view
await page.click('button');
await expect(page.getByTestId('modal')).toBeVisible(); // Fails!

// ✅ CORRECT - Wait for animation
await page.click('button');
await page.waitForLoadState('domcontentloaded');
await expect(page.getByTestId('modal')).toBeVisible(); // Passes!
```

### Pitfall 2: Not Waiting for Network

```typescript
// ❌ FAILS - API call in progress
await page.click('submit');
await expect(page.getByText('Success')).toBeVisible(); // Fails!

// ✅ CORRECT - Wait for network
await page.click('submit');
await page.waitForLoadState('networkidle');
await expect(page.getByText('Success')).toBeVisible(); // Passes!
```

### Pitfall 3: Waiting Too Short

```typescript
// ❌ FAILS - Timeout too aggressive
await expect(page.getByTestId('slow-api')).toBeVisible({ timeout: 1000 });

// ✅ CORRECT - Appropriate timeout
await expect(page.getByTestId('slow-api')).toBeVisible({ timeout: 10000 });
```

### Pitfall 4: Sequential Instead of Parallel

```typescript
// ❌ SLOW - Waits sequentially
await expect(page.getByTestId('elem1')).toBeVisible();
await expect(page.getByTestId('elem2')).toBeVisible(); // Waits after 1
await expect(page.getByTestId('elem3')).toBeVisible(); // Waits after 2
await expect(page.getByTestId('elem4')).toBeVisible(); // Waits after 3

// ✅ FAST - Waits in parallel
await Promise.all([
  expect(page.getByTestId('elem1')).toBeVisible(),
  expect(page.getByTestId('elem2')).toBeVisible(),
  expect(page.getByTestId('elem3')).toBeVisible(),
  expect(page.getByTestId('elem4')).toBeVisible(),
]);
```

## Waiting Best Practices

### DO

- Use `expect().toBeVisible()` for most cases
- Use `waitForLoadState('networkidle')` after API calls
- Use `toBeHidden()` for disappearing elements
- Use `Promise.all()` for concurrent waits
- Configure appropriate timeouts per test
- Wait for animations to complete
- Document why specific waits are needed

### DON'T

- Use `waitForTimeout()` without justification
- Assume immediate updates
- Use global timeouts for everything
- Wait longer than necessary
- Skip waits hoping test passes

## Monitoring Wait Performance

### Track Slow Waits

```typescript
test.describe('Feature', () => {
  test('example', async ({ page }) => {
    const start = Date.now();
    await expect(page.getByTestId('element')).toBeVisible();
    const elapsed = Date.now() - start;

    if (elapsed > 5000) {
      console.warn(`Slow wait: ${elapsed}ms for 'element'`);
    }
  });
});
```

### Optimize Based on Metrics

```typescript
// After collecting metrics
const waitTimes = {
  element1: 1200, // Acceptable
  element2: 8500, // Too slow - investigate
  element3: 450, // Good
};

// Optimize the slow one
```

## Quick Reference

| Strategy                          | When to Use            | Syntax                                       |
| --------------------------------- | ---------------------- | -------------------------------------------- |
| `toBeVisible()`                   | Wait for element       | `expect(locator).toBeVisible()`              |
| `toBeHidden()`                    | Wait for disappearance | `expect(locator).toBeHidden()`               |
| `waitForLoadState('load')`        | Navigation             | `await page.waitForLoadState('load')`        |
| `waitForLoadState('networkidle')` | API/AJAX               | `await page.waitForLoadState('networkidle')` |
| `Promise.all()`                   | Concurrent waits       | `await Promise.all([expect1, expect2])`      |
| Custom timeout                    | Slow operations        | `.toBeVisible({ timeout: 10000 })`           |

Smart waits transform flaky tests into reliable, fast, and maintainable tests.
