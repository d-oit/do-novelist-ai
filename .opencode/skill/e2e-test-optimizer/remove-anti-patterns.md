# Remove Anti-patterns

Identify and eliminate common E2E test anti-patterns that cause flakiness, slow
execution, and maintenance issues.

## Overview

Anti-patterns are common practices that seem to solve problems but actually
create new ones. In E2E testing, anti-patterns lead to flaky tests, slow
execution, and brittle test suites.

## The Big Three Anti-patterns

### 1. waitForTimeout - The Timing Trap

**Problem**: Fixed time delays are the #1 cause of flaky tests.

```typescript
// ❌ ANTI-PATTERN
await page.waitForTimeout(2000);
await expect(element).toBeVisible();
```

**Why it's bad**:

- Arbitrary time (2 seconds) - what if test needs 1.9s or 2.1s?
- Flaky on slow CI machines
- Wastes time - always waits full 2 seconds even if ready in 100ms
- Doesn't assert what you're waiting for

**Solution**: Use state-based assertions

```typescript
// ✅ SOLUTION
await expect(element).toBeVisible({ timeout: 5000 });
```

**Benefits**:

- Polls continuously, not once
- Passes as soon as element is visible
- Configurable timeout per assertion
- Asserts the actual condition

**Before/After Example**:

```typescript
// ❌ BEFORE - 2 seconds always, flaky
test('loads settings', async ({ page }) => {
  await page.goto('/settings');
  await page.waitForTimeout(2000); // Anti-pattern!
  await expect(page.getByTestId('settings')).toBeVisible();
});

// ✅ AFTER - Fast, reliable
test('loads settings', async ({ page }) => {
  await page.goto('/settings');
  await expect(page.getByTestId('settings')).toBeVisible({ timeout: 5000 });
});
```

### 2. Brittle Selectors - The Change Trap

**Problem**: CSS/XPath selectors break when UI structure changes.

```typescript
// ❌ ANTI-PATTERN
await page.locator('div:nth-child(2) > button').click();
await page.locator('.btn.primary').click();
await page.locator('div.container > div.row > button').click();
```

**Why it's bad**:

- Breaks if nesting changes
- Breaks if classes are renamed
- No semantic meaning
- Hard to understand
- Multiple matches cause confusion

**Solution**: Use stable, semantic selectors

```typescript
// ✅ SOLUTION
await page.getByTestId('submit-button').click();
await page.getByRole('button', { name: 'Submit' }).click();
```

**Benefits**:

- Survives UI refactoring
- Self-documenting
- Accessibility-friendly
- Unique identification

**Selector Priority**:

1. **`getByTestId()`** - Most stable (requires test ID)
2. **`getByRole()` + `name`** - Semantic, accessible
3. **`getByLabel()`** - Form elements
4. **`getByText()`** - Content-based (use carefully)
5. **Locator filters** - For lists/groups
6. **CSS selectors** - Last resort

### 3. Missing Network Waits - The Race Trap

**Problem**: Tests execute before network requests complete.

```typescript
// ❌ ANTI-PATTERN
await page.click('submit-button');
await expect(page.getByText('Success')).toBeVisible();
```

**Why it's bad**:

- Race condition between click and AJAX
- Fails intermittently (classic flaky test)
- No guarantee data is loaded
- Hard to debug (passes sometimes)

**Solution**: Wait for network completion

```typescript
// ✅ SOLUTION
await page.click('submit-button');
await page.waitForLoadState('networkidle');
await expect(page.getByText('Success')).toBeVisible();
```

**Benefits**:

- Synchronized with network
- No race conditions
- Consistent behavior
- Detects hung requests

## Other Common Anti-patterns

### Hardcoded Timeouts

```typescript
// ❌ ANTI-PATTERN - One size doesn't fit all
test.setTimeout(10000);

// ✅ SOLUTION - Per-assertion timeout
await expect(fastElement).toBeVisible({ timeout: 5000 });
await expect(slowElement).toBeVisible({ timeout: 30000 });
```

### Multiple Sequential Timeouts

```typescript
// ❌ ANTI-PATTERN - Cumulative delay
await page.waitForTimeout(500); // Wait for animation
await page.waitForTimeout(500); // Wait for API
await page.waitForTimeout(500); // Wait for render
// Total: 1.5 seconds wasted

// ✅ SOLUTION - Wait for actual state
await page.waitForLoadState('networkidle');
await expect(element).toBeVisible();
```

### Assuming Immediate Updates

```typescript
// ❌ ANTI-PATTERN - React update cycle
await page.click('toggle');
expect(await page.isChecked('toggle')).toBe(true);

// ✅ SOLUTION - Wait for React to update
await page.click('toggle');
await expect(page.getByTestId('toggle')).toBeChecked();
```

## Refactoring Checklist

Use this checklist when reviewing tests for anti-patterns:

### waitForTimeout Checklist

- [ ] No `waitForTimeout()` calls
- [ ] All waits use `expect()` or `waitFor()`
- [ ] Timeouts are assertion-specific, not global
- [ ] No sequential delays (multiple `waitForTimeout`)

### Selector Checklist

- [ ] Primary selectors use `getByTestId()`
- [ ] Fallback uses `getByRole()` or `getByText()`
- [ ] No CSS selectors unless necessary
- [ ] No XPath selectors
- [ ] No nth-child() or index-based selection

### Network Checklist

- [ ] Actions followed by state assertion
- [ ] Navigation uses `waitForLoadState()`
- [ ] API calls allow network idle
- [ ] No assumptions about timing

## Real-World Example

### Before: Anti-pattern Filled Test

```typescript
test('creates new project', async ({ page }) => {
  await page.goto('/projects');
  await page.waitForTimeout(1000); // Anti-pattern 1

  await page.locator('div.container > button').click(); // Anti-pattern 2
  await page.waitForTimeout(500); // Anti-pattern 1

  await page.locator('input[name="name"]').fill('Test Project');
  await page.locator('div.form > button.submit').click(); // Anti-pattern 2
  await page.waitForTimeout(2000); // Anti-pattern 1

  await expect(page.locator('.toast.success')).toBeVisible(); // Anti-pattern 2
});
```

### After: Optimized Test

```typescript
test('creates new project', async ({ page }) => {
  await page.goto('/projects');

  // Wait for page load
  await expect(page.getByTestId('projects-list')).toBeVisible();

  // Click new project button
  await page.getByRole('button', { name: 'New Project' }).click();

  // Fill form
  await page.getByTestId('project-name-input').fill('Test Project');
  await page.getByRole('button', { name: 'Create' }).click();

  // Wait for success
  await page.waitForLoadState('networkidle');
  await expect(page.getByTestId('toast-success')).toBeVisible();
});
```

**Results**:

- **Flakiness**: 0% (was ~30%)
- **Execution time**: 3.5s (was 5.5s)
- **Maintainability**: Clear what each step does

## Anti-pattern Detection Script

Use this script to find anti-patterns in test files:

```bash
# Find waitForTimeout calls
grep -r "waitForTimeout" tests/specs/

# Find CSS selectors
grep -r "page.locator('\." tests/specs/

# Find nth-child selectors
grep -r "nth-child\|nth(" tests/specs/

# Find sequential timeouts
grep -A2 "waitForTimeout" tests/specs/ | grep "waitForTimeout"
```

## Anti-pattern Removal Strategy

### Phase 1: Audit

1. Run anti-pattern detection script
2. Catalog all findings
3. Prioritize by impact (most used = highest priority)

### Phase 2: Refactor

1. Fix high-impact anti-patterns first
2. Update one test file at a time
3. Verify tests still pass
4. Commit changes incrementally

### Phase 3: Validate

1. Run tests 10 times to check flakiness
2. Measure execution time improvement
3. Update documentation with lessons learned

### Phase 4: Prevent

1. Add ESLint rules to catch anti-patterns
2. Update team guidelines
3. Code review checklist for new tests

## Summary

Removing anti-patterns is the first and most impactful step in E2E optimization:

| Anti-pattern          | Impact                     | Fix Difficulty | Priority |
| --------------------- | -------------------------- | -------------- | -------- |
| waitForTimeout        | High (flakiness, speed)    | Low            | 1        |
| Brittle selectors     | Medium (breaks on changes) | Low            | 2        |
| Missing network waits | High (flakiness)           | Low            | 1        |
| Hardcoded timeouts    | Medium (slow/fast tests)   | Low            | 2        |
| Sequential delays     | High (wastes time)         | Low            | 1        |

**Start with waitForTimeout** - it's the biggest win for both speed and
reliability.
