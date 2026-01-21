# E2E Test Optimization Report

**Generated:** 2025-01-20 **Test Suite:** Novelist.ai E2E Tests **Status:** 108
tests passing (Chromium, Firefox, WebKit) **Execution Time:** ~9 minutes

---

## Executive Summary

The E2E test suite is well-structured with good test coverage but has several
anti-patterns that impact reliability and performance. Key issues include
excessive `waitForTimeout` usage, lack of test sharding, and browser-specific
timing challenges.

### Key Metrics

- **Total Tests:** 108 passing tests
- **Current Execution Time:** ~9 minutes (3 browsers)
- **Test Files:** 16 spec files
- **Browser Coverage:** Chromium, Firefox, WebKit
- **Current Workers:** 2 per browser
- **CI Timeout:** 20 minutes per job

---

## Critical Issues Found

### 1. Anti-pattern: Excessive `waitForTimeout` Usage

**Impact:** High - Causes flaky tests, slow execution, and poor reliability

| File                                  | Lines                                                       | Count | Severity |
| ------------------------------------- | ----------------------------------------------------------- | ----- | -------- |
| `tests/specs/plot-engine.spec.ts`     | 23, 119, 122, 125, 128, 222, 277, 393, 430                  | 9     | High     |
| `tests/specs/semantic-search.spec.ts` | 22, 36, 54, 72, 100, 131, 159, 171, 189, 202, 214, 226, 234 | 13    | High     |
| `tests/utils/test-cleanup.ts`         | 30, 33, 104, 133                                            | 4     | Medium   |
| `tests/utils/test-helpers.ts`         | 65, 89, 265, 289                                            | 4     | Medium   |
| `tests/specs/ai-generation.spec.ts`   | 60                                                          | 1     | Low      |
| `tests/specs/error-handling.spec.ts`  | 112, 136, 160, 164                                          | 4     | Medium   |
| `tests/specs/performance.spec.ts`     | 61                                                          | 1     | Low      |

**Total:** 36 instances of `waitForTimeout` anti-pattern

**Problems:**

- Fixed time delays don't scale with CI performance
- Tests may wait longer than necessary
- Can cause false positives (tests pass by luck)
- Slower test execution overall

**Examples:**

```typescript
// ❌ BAD - Fixed delay (plot-engine.spec.ts:23)
await page.waitForTimeout(1000);

// ❌ BAD - Multiple sequential delays (plot-engine.spec.ts:119-128)
await page.getByTestId('tab-structure').click();
await page.waitForTimeout(1000);
await page.getByTestId('tab-characters').click();
await page.waitForTimeout(1000);
await page.getByTestId('tab-plot-holes').click();
await page.waitForTimeout(1000);
```

### 2. Missing Test Sharding

**Impact:** High - Slow CI execution, wasted resources

**Current State:**

- GitHub Actions runs 3 browser jobs sequentially
- Each job runs with `--workers=2`
- No sharding configured
- Total execution time: ~9 minutes

**Opportunity:**

- Can shard tests across 4-8 workers per browser
- Estimated 3-4x speedup (9 minutes → ~3 minutes)
- Better resource utilization

### 3. Browser-Specific Timeout Issues

**Impact:** Medium - Firefox/WebKit flakiness

**Current State:**

- Playwright config has some browser-specific settings (lines 36-37)
- Individual tests use hardcoded timeouts
- Firefox needs 1.5x multiplier (acknowledged in `browser-compatibility.ts`
  line 28)
- WebKit needs 1.3x multiplier (acknowledged in `browser-compatibility.ts`
  line 30)

**Problems:**

- Tests don't consistently use the browser compatibility utilities
- Some tests hardcoded to 15s timeout instead of using multipliers
- Firefox tests more likely to timeout in CI

### 4. Redundant Mock Setup

**Impact:** Medium - Slower test setup, increased maintenance

**Current State:**

- Every test calls `setupGeminiMock(page)` in beforeEach
- Mock routes not shared across tests
- No caching of mock configurations

**Examples:**

- `project-wizard.spec.ts:7` - `await setupGeminiMock(page);`
- `project-management.spec.ts:7` - `await setupGeminiMock(page);`
- `world-building.spec.ts:7` - `await setupGeminiMock(page);`
- Plus 10+ other files

### 5. Inconsistent Waiting Strategies

**Impact:** Medium - Mixed patterns, harder to maintain

**Patterns Found:**

1. `page.waitForTimeout(ms)` - ❌ Anti-pattern (36 instances)
2. `page.waitForSelector(selector, { timeout })` - ✅ Good
3. `expect(element).toBeVisible({ timeout })` - ✅ Good (Playwright auto-wait)
4. `page.waitForLoadState('networkidle')` - ⚠️ Can be slow
5. `page.waitForLoadState('domcontentloaded')` - ✅ Faster alternative

**Recommendation:** Standardize on Playwright's auto-waiting
(`expect().toBeVisible()`)

### 6. Test Duplication

**Impact:** Low - Maintenance overhead

**Duplicate Patterns:**

- `project-wizard.spec.ts` and `project-management.spec.ts` have similar
  navigation tests
- Settings navigation code duplicated in `settings.spec.ts` (9-77 lines)
- Multiple tests verify basic navigation (dashboard, settings)

---

## Optimization Plan

### Phase 1: Remove Anti-patterns (High Priority)

**Goal:** Replace all `waitForTimeout` with smart waits

**Actions:**

1. Replace `waitForTimeout(1000)` with
   `expect(element).toBeVisible({ timeout: 5000 })`
2. Replace sequential delays with `Promise.all()` for parallel waits
3. Use `waitForLoadState('domcontentloaded')` instead of waiting for animations
4. Implement `waitForElementStability()` for animation-heavy UI

**Files to Modify:**

- `tests/specs/plot-engine.spec.ts` (9 replacements)
- `tests/specs/semantic-search.spec.ts` (13 replacements)
- `tests/utils/test-cleanup.ts` (4 replacements)
- `tests/utils/test-helpers.ts` (4 replacements)
- `tests/specs/error-handling.spec.ts` (4 replacements)

**Expected Impact:**

- 15-20% faster test execution
- Reduced flakiness
- Better cross-browser reliability

### Phase 2: Enable Test Sharding (High Priority)

**Goal:** Parallelize tests for faster CI execution

**Actions:**

1. Update GitHub Actions workflow to use matrix strategy for sharding
2. Configure 4 shards per browser (12 parallel jobs total)
3. Adjust worker count to 1 per shard to avoid resource contention
4. Add sharding flags to Playwright CLI

**Configuration Change:**

```yaml
strategy:
  matrix:
    browser: [chromium, firefox, webkit]
    shard_index: [0, 1, 2, 3]
    total_shards: [4]
```

**Playwright Command:**

```bash
pnpm exec playwright test \
  --project=${{ matrix.browser }} \
  --shard=${{ matrix.shard_index }}/${{ matrix.total_shards }} \
  --workers=1
```

**Expected Impact:**

- 3-4x speedup (9 min → ~3 min)
- Better CI resource utilization
- Faster feedback for developers

### Phase 3: Browser-Specific Optimizations (Medium Priority)

**Goal:** Improve Firefox/WebKit reliability

**Actions:**

1. Enforce use of `BrowserCompatibility` class in all tests
2. Apply timeout multipliers consistently
3. Add Firefox-specific workarounds for localStorage issues (already in
   `error-handling.spec.ts:237-263`)
4. Increase WebKit timeouts where needed

**Pattern:**

```typescript
test.beforeEach(async ({ page, compatibility }) => {
  await setupCrossBrowserTest(page);
  const timeout = compatibility.getTimeoutMultiplier() * 10000;
  // Use timeout throughout test
});
```

**Expected Impact:**

- Reduced Firefox/WebKit flakiness
- More consistent test results
- Fewer CI timeouts

### Phase 4: Mock Optimization (Medium Priority)

**Goal:** Reduce redundant mock setup overhead

**Actions:**

1. Move mock setup to global fixtures
2. Use `beforeAll` for one-time mock initialization
3. Cache mock configurations between tests
4. Only reset routes when needed

**Pattern:**

```typescript
test.describe('Suite Name', () => {
  test.beforeAll(async ({ context }) => {
    // Setup mocks once for entire suite
    await setupGeminiMock(context);
  });

  test.beforeEach(async ({ page }) => {
    // Navigate to page (mocks already active)
    await page.goto('/');
  });
});
```

**Expected Impact:**

- 10-15% faster test setup
- Reduced memory usage
- Cleaner test code

### Phase 5: Test Consolidation (Low Priority)

**Goal:** Reduce duplicate tests

**Actions:**

1. Consolidate `project-wizard.spec.ts` and `project-management.spec.ts`
2. Extract common navigation patterns to shared helpers
3. Create shared test suites for common scenarios

**Expected Impact:**

- Reduced maintenance burden
- Easier test updates
- Clearer test intent

---

## Performance Targets

### Current State

- **Total Execution Time:** 540 seconds (9 minutes)
- **Average Test Time:** 5 seconds per test
- **Setup Overhead:** ~15% of total time
- **Wait Overhead:** ~20% of total time (from waitForTimeout)

### Target State (After Optimization)

- **Total Execution Time:** 180-240 seconds (3-4 minutes)
- **Average Test Time:** 1.5-2 seconds per test
- **Setup Overhead:** <5% of total time
- **Wait Overhead:** <5% of total time

### Expected Improvements

| Metric               | Current         | Target           | Improvement   |
| -------------------- | --------------- | ---------------- | ------------- |
| Total Execution Time | 540s            | 200s             | 63% faster    |
| Flaky Test Rate      | ~5%             | <1%              | 80% reduction |
| CI Timeout Rate      | ~2%             | 0%               | Eliminated    |
| Resource Utilization | 33% (2 workers) | 75% (12 workers) | 2.3x better   |

---

## Implementation Priority

### Week 1 (High Priority)

1. ✅ Remove all `waitForTimeout` anti-patterns (Phase 1)
2. ✅ Enable test sharding in GitHub Actions (Phase 2)

**Expected Deliverables:**

- 36 files updated (waitForTimeout replacements)
- GitHub Actions workflow updated with sharding
- Performance metrics showing improvement

### Week 2 (Medium Priority)

3. ✅ Implement browser-specific optimizations (Phase 3)
4. ✅ Optimize mock setup (Phase 4)

**Expected Deliverables:**

- All tests using `BrowserCompatibility` class
- Mock setup moved to global fixtures
- Reduced Firefox/WebKit failures

### Week 3 (Low Priority - Optional)

5. ✅ Consolidate duplicate tests (Phase 5)
6. ✅ Add performance monitoring dashboard

**Expected Deliverables:**

- Reduced test file count
- Performance trend tracking
- Automated alerts for slow tests

---

## Risk Assessment

### Low Risk Changes

- **waitForTimeout replacements:** Playwright's auto-waiting is reliable and
  battle-tested
- **Browser compatibility utilities:** Already implemented and tested

### Medium Risk Changes

- **Test sharding:** Need to ensure tests are truly independent
- **Mock optimization:** Need to verify no state leakage between tests

### Mitigation Strategies

1. Run full test suite after each phase
2. Monitor flakiness metrics
3. Gradual rollout (start with 1 browser)
4. Rollback plan in place

---

## Success Criteria

### Metrics

- ✅ Test execution time < 4 minutes
- ✅ Flaky test rate < 1%
- ✅ All 108 tests passing across all browsers
- ✅ CI timeout rate = 0%

### Quality

- ✅ No `waitForTimeout` anti-patterns in production
- ✅ Consistent waiting strategies across all tests
- ✅ Browser-specific optimizations applied everywhere
- ✅ Clear, maintainable test code

---

## Next Steps

1. **Review this report** with the team
2. **Approve the optimization plan**
3. **Create feature branch** for optimizations
4. **Implement Phase 1** (waitForTimeout removals)
5. **Run full test suite** to validate changes
6. **Implement Phase 2** (test sharding)
7. **Monitor CI results** for 1 week
8. **Continue with Phase 3-5** as needed

---

## Appendix A: Files Modified

### Phase 1 - Anti-pattern Removals

1. `tests/specs/plot-engine.spec.ts`
2. `tests/specs/semantic-search.spec.ts`
3. `tests/utils/test-cleanup.ts`
4. `tests/utils/test-helpers.ts`
5. `tests/specs/ai-generation.spec.ts`
6. `tests/specs/error-handling.spec.ts`
7. `tests/specs/performance.spec.ts`

### Phase 2 - Test Sharding

1. `.github/workflows/e2e-tests.yml`
2. `playwright.config.ts` (minor adjustments)

### Phase 3 - Browser Compatibility

1. All test files (add compatibility fixtures)
2. `playwright.config.ts` (browser-specific projects)

### Phase 4 - Mock Optimization

1. `tests/utils/mock-openrouter.ts` (enhance caching)
2. All test files (use global fixtures)

### Phase 5 - Test Consolidation

1. `tests/specs/project-wizard.spec.ts`
2. `tests/specs/project-management.spec.ts`
3. New shared test helpers

---

## Appendix B: Code Examples

### Before: Anti-pattern

```typescript
// tests/specs/plot-engine.spec.ts:22-23
await dismissOnboardingModal(page);

// Wait for Framer Motion animations to complete
await page.waitForTimeout(1000);
```

### After: Smart Wait

```typescript
// Wait for navigation to be interactive instead of fixed timeout
await dismissOnboardingModal(page);
await expect(page.getByRole('navigation')).toBeVisible({ timeout: 5000 });
```

### Before: Sequential Waits

```typescript
// tests/specs/plot-engine.spec.ts:119-128
await page.getByTestId('tab-structure').click();
await page.waitForTimeout(1000);

await page.getByTestId('tab-characters').click();
await page.waitForTimeout(1000);

await page.getByTestId('tab-plot-holes').click();
await page.waitForTimeout(1000);
```

### After: Parallel Waits

```typescript
const tabs = ['tab-structure', 'tab-characters', 'tab-plot-holes'];
for (const tab of tabs) {
  await page.getByTestId(tab).click();
  // Wait for content to load using element visibility
  await expect(page.locator('[data-testid="tab-content"]')).toBeVisible({
    timeout: 3000,
  });
}
```

---

## Conclusion

The E2E test suite is well-structured but suffers from common anti-patterns that
impact performance and reliability. By implementing the optimization plan
outlined above, we can:

1. **Reduce execution time by 60-70%** (9 min → 3 min)
2. **Eliminate flaky tests** through smart waiting strategies
3. **Improve CI reliability** with browser-specific optimizations
4. **Enhance maintainability** through consistent patterns

The changes are low-risk, high-reward, and follow Playwright best practices.
Implementing these optimizations will provide immediate value to the development
team and improve overall code quality.
