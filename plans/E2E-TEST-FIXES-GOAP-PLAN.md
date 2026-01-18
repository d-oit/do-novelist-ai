# GOAP Action Plan: Phase C - Fix E2E Test Failures

## Current State Analysis

### Test Run Summary

- Total tests: 321 tests (running across chromium, firefox, webkit)
- Passing: 283 tests
- Failing: 38 tests
- Primary failure pattern: Tests timing out at ~16-17 seconds without executing
  assertions

### Root Cause Categories

#### 1. Missing Data-Testid Elements (Primary Issue - ~70% of failures)

Tests are waiting for elements with `data-testid` attributes that don't exist in
the application:

**Missing Testids:**

- `[data-testid="app-ready"]` - Used by navigation.spec.ts, performance.spec.ts
- `[data-testid="settings-view"]` - Used by ai-generation.spec.ts
- `[data-testid="action-card-*"]` - Used by ai-generation.spec.ts
- Various plot-engine specific testids

**Impact:** Tests timeout waiting for these elements to appear (17.4s timeout)

#### 2. Network Idle Timeout Issues (Secondary Issue - ~20% of failures)

Multiple tests use `page.waitForLoadState('networkidle')` which may never
complete:

- Background API polling
- Analytics tracking requests
- Websocket connections
- React DevTools (in development mode)

**Impact:** Tests hang indefinitely or hit 60s timeout

#### 3. Incorrect Element Selectors (Minor Issue - ~10% of failures)

Some tests use `page.getByRole()` with parameters that don't match actual DOM:

- Missing aria-labels or incorrect role assignments
- Elements exist but with different accessibility attributes

**Impact:** Tests can't locate elements to interact with

### Failing Tests by Category

#### AI Generation Tests (6 failures)

- `should access dashboard via navigation`
- `should have AI-related console or output area`
- `should display action cards when project is loaded`
- `should handle navigation between dashboard and settings`

#### Navigation Tests (2 failures)

- `should navigate between main views`

#### Performance Tests (3 failures)

- `should have acceptable Time to Interactive (TTI)`
- `should handle rapid navigation without memory leaks`

#### Plot Engine Tests (15 failures)

- All plot-engine.spec.ts tests failing
- Missing plot-engine related testids

#### Additional Tests (12 failures)

- Various other spec files with similar issues

## Goal State

- All 321 E2E tests passing (100% pass rate)
- Test execution time < 5 minutes total
- No flaky tests
- Proper test isolation and cleanup

---

## GOAP Action Plan

### CRITICAL FINDING (Updated)

**Root Cause:** Modal overlays and dialogs not being closed between tests,
blocking subsequent test interactions.

**Evidence from Test Logs:**

```
- <div aria-hidden="true" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"></div> intercepts pointer events
```

Tests failing because:

1. Modals/dialogs left open from previous tests
2. Overlays block click events on navigation elements
3. `waitForLoadState('networkidle')` hangs on background polling
4. No proper cleanup of open UI elements between tests

---

### Action 1: Add App-Ready Testid (COMPLETED)

**Status:** ✅ Done **Actions:**

1. ✅ Added `data-testid="app-ready"` to App.tsx main element

---

### Action 2: Settings View Testid (EXISTS)

**Status:** ✅ Already exists **Note:** No action needed

---

### Action 3: Action Card Testids (EXISTS)

**Status:** ✅ Already exists **Note:** No action needed

---

### Action 4: Add Comprehensive Test Cleanup (NEW - CRITICAL)

**Preconditions:**

- All test specs accessible
- Tests lack proper cleanup hooks

**Effects:**

- Closes all modals/overlays between tests
- Clears browser state properly
- Prevents overlay blocking issues

**Actions:**

1. Create shared cleanup utility function
2. Add `test.afterEach()` hook in all test files
3. Close all open modals/dialogs
4. Remove all overlays
5. Force clear of any blocking elements

**Implementation Details:**

```typescript
// Shared cleanup utility
export async function cleanupTestEnvironment(page: Page): Promise<void> {
  // Close all open dialogs/modals
  await page.evaluate(() => {
    // Remove all overlays
    document
      .querySelectorAll('[aria-hidden="true"]')
      .forEach(el => el.remove());
    // Close any open dialogs
    document.querySelectorAll('[role="dialog"]').forEach(dialog => {
      dialog.dispatchEvent(new Event('close'));
    });
    // Clear any backdrop overlays
    document.querySelectorAll('.fixed.inset-0').forEach(el => el.remove());
  });

  // Force page reload to clean state
  await page.goto('/blank.html', { waitUntil: 'domcontentloaded' });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
}
```

**Files to Modify:**

1. All test specs in tests/specs/
2. Add shared cleanup utility to tests/utils/

**Cost:** 20 minutes

**Agent:** Test Cleanup Implementation Agent

---

### Action 5: Replace Network Idle Waits (CRITICAL)

**Preconditions:**

- All test specs accessible
- Current tests use waitForLoadState('networkidle')

**Effects:**

- Tests don't hang on background network activity
- Faster, more reliable test execution

**Actions:**

1. Replace ALL `waitForLoadState('networkidle')` with
   `waitForLoadState('domcontentloaded')`
2. Add specific waits for critical elements instead
3. Use `waitForSelector()` with proper timeouts

**Search & Replace Pattern:**

```bash
# Replace in all test files
waitForLoadState('networkidle') → waitForLoadState('domcontentloaded')
```

**Files to Modify:**

- tests/specs/plot-engine.spec.ts (7 occurrences)
- tests/specs/ai-generation.spec.ts (multiple occurrences)
- tests/specs/navigation.spec.ts (1 occurrence)
- Any other spec files using networkidle

**Cost:** 15 minutes

**Agent:** Network Idle Replacement Agent

---

### Action 6: Add Stability Waits for Click Actions

**Preconditions:**

- Tests use click() without stability checks

**Effects:**

- Elements fully render before interaction
- Reduces "element not stable" errors
- More reliable test execution

**Actions:**

1. Add stability checks before critical clicks
2. Use `{ force: true }` only as fallback
3. Ensure animations complete before interaction

**Implementation Pattern:**

```typescript
// Before click
await page.waitForTimeout(200); // Wait for animations
await expect(element).toBeVisible(); // Verify visible

// Then click with stability
await element.click({ timeout: 15000 });
```

**Files to Modify:**

- All test specs with navigation clicks
- Focus on plot-engine.spec.ts, ai-generation.spec.ts, navigation.spec.ts

**Cost:** 10 minutes

**Agent:** Stability Waits Agent

---

### Action 2: Add Settings View Testid

**Preconditions:**

- SettingsView component accessible
- Tests exist requiring `[data-testid="settings-view"]`

**Effects:**

- Tests can verify settings navigation
- Reduces navigation test failures

**Actions:**

1. Add `data-testid="settings-view"` to SettingsView root
2. Verify element is visible when settings route loads

**Cost:** 5 minutes

**Agent:** Settings Test Fix Agent

---

### Action 3: Add Action Card Testids

**Preconditions:**

- ActionCard component accessible
- Tests exist requiring action card testids

**Effects:**

- Tests can verify AI action cards display
- Enables action card interaction tests

**Actions:**

1. Add `data-testid="action-card-{id}"` pattern to ActionCard components
2. Verify cards render with proper testids

**Cost:** 10 minutes

**Agent:** Generation Test Fix Agent

---

### Action 4: Replace Network Idle Waits

**Preconditions:**

- All test specs accessible
- Current tests use waitForLoadState('networkidle')

**Effects:**

- Tests don't hang on background network activity
- Faster, more reliable test execution

**Actions:**

1. Replace `waitForLoadState('networkidle')` with
   `waitForLoadState('domcontentloaded')`
2. Add specific waits for critical elements instead
3. Use `waitForSelector()` with timeouts instead

**Cost:** 20 minutes

**Agent:** Test Refactoring Agent

---

### Action 5: Add Plot Engine Testids

**Preconditions:**

- Plot engine components accessible
- Tests exist for plot engine features

**Effects:**

- All plot-engine tests can locate elements
- Enables comprehensive plot engine testing

**Actions:**

1. Add testids to all plot engine components:
   - `data-testid="plot-engine-dashboard"`
   - `data-testid="plot-analyzer"`
   - `data-testid="plot-generator"`
   - `data-testid="plot-tab-{name}"`
   - `data-testid="plot-loading-state"`

**Cost:** 15 minutes

**Agent:** Plot Engine Test Fix Agent

---

### Action 6: Fix Performance Test TTI Logic

**Preconditions:**

- Performance test spec accessible
- App has interactive elements

**Effects:**

- TTI tests work reliably
- Performance metrics accurate

**Actions:**

1. Remove dependency on `[data-testid="app-ready"]`
2. Use alternative app readiness detection
3. Add fallback for when no buttons are immediately available
4. Adjust timeouts for CI environments

**Cost:** 10 minutes

**Agent:** Performance Test Fix Agent

---

### Action 7: Verify All Tests Pass

**Preconditions:**

- All above actions completed
- Test suite runnable

**Effects:**

- Confirms all 38 failures fixed
- Goal state achieved

**Actions:**

1. Run full E2E test suite
2. Verify 321/321 tests passing
3. Run multiple times to ensure no flaky tests
4. Document any remaining issues

**Cost:** 10 minutes

**Agent:** Verification Agent

---

## Execution Strategy

### Parallel Execution

**Phase 1: Component Testids (Agents 1-3, 5)**

- Can execute in parallel
- Each agent works on different component
- No dependencies between actions

**Phase 2: Test Refactoring (Agent 4)**

- Depends on testids being added
- Runs after Phase 1
- Single agent processes all test files

**Phase 3: Performance Fixes (Agent 6)**

- Can run in parallel with Phase 2
- Independent of other fixes

**Phase 4: Verification (Agent 7)**

- Depends on all previous actions
- Final verification phase
- Single agent

### Estimated Total Time

- Phase 1: 15-20 minutes (parallel execution)
- Phase 2-3: 20-30 minutes (parallel execution)
- Phase 4: 10 minutes
- **Total: 45-60 minutes**

### Risk Assessment

**Low Risk:**

- Adding testids (non-breaking)
- Replacing network idle waits (improves reliability)

**Medium Risk:**

- Modifying test assertion logic
- Changing app readiness detection

**Mitigation:**

- Run full test suite after each phase
- Use git to track changes
- Keep backward compatibility where possible

---

## Dependencies

### External Dependencies

- None (all fixes are internal to codebase)

### Internal Dependencies

1. Action 4 depends on Actions 1, 2, 3, 5 completing
2. Action 7 depends on all previous actions completing

### Resource Constraints

- Must maintain test isolation
- Cannot modify production API calls
- Must work across chromium, firefox, webkit

## Success Criteria

1. ✅ All 321 E2E tests passing
2. ✅ Test execution time < 5 minutes
3. ✅ No tests timeout prematurely
4. ✅ Test isolation maintained
5. ✅ Cross-browser compatibility verified

## Rollback Plan

If any action causes regressions:

1. Revert specific action using git
2. Analyze failure pattern
3. Adjust fix approach
4. Re-run affected tests

## Next Steps

1. Execute Actions 1, 2, 3, 5 in parallel (Component Testid Agents)
2. Execute Actions 4, 6 in parallel (Test Refactoring + Performance Fix Agents)
3. Execute Action 7 (Verification Agent)
4. Generate final Phase C Report
