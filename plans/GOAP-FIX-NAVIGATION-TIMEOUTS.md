# GOAP Plan: Fix Navigation Timeout Anti-Patterns

## Phase 1: Task Analysis

### Primary Goal

Remove all 80 `waitForTimeout` calls from E2E test files and replace with smart
state-based waits to eliminate test flakiness and improve reliability.

### Constraints

- Time: **High Priority** - CI is currently failing due to these timeouts
- Resources: refactorer agents, grep/glob tools, test execution
- Dependencies: Tests must continue to pass after changes
- Standards: AGENTS.md compliance, Playwright best practices

### Complexity Level

**Medium** - 80 occurrences across 8 files, pattern-based refactoring

### Quality Requirements

- Testing: All 55 E2E tests must pass after changes
- Standards: Follow Playwright best practices (no arbitrary waits)
- Performance: Tests should be faster (no 1-2s waits)
- Reliability: No flaky tests due to race conditions

## Phase 2: Task Decomposition

### Main Goal

Replace all `waitForTimeout` calls with smart waits in priority order

### Sub-Goals

#### 1. Analyze Current State (Priority: P0)

- Success Criteria: All waitForTimeout locations identified with context
- Dependencies: None
- Complexity: Low

#### 2. Fix High-Priority Files (Priority: P0)

- Success Criteria: Top 3 files fixed and tests pass
- Dependencies: Sub-goal 1
- Complexity: Medium

#### 3. Fix Remaining Files (Priority: P1)

- Success Criteria: All 8 files fixed and tests pass
- Dependencies: Sub-goal 2
- Complexity: Medium

#### 4. Validate Full Test Suite (Priority: P0)

- Success Criteria: All 55 tests pass locally
- Dependencies: Sub-goals 2, 3
- Complexity: Low

### Atomic Tasks

**Component 1: Analysis**

- Task 1.1: Count waitForTimeout per file (Agent: grep, Deps: none)
- Task 1.2: Read context around each occurrence (Agent: read, Deps: 1.1)
- Task 1.3: Identify replacement pattern for each (Agent: analysis, Deps: 1.2)

**Component 2: Fix Priority Files (Parallel)**

- Task 2.1: Fix settings.spec.ts (22 calls) (Agent: refactorer, Deps: 1.3)
- Task 2.2: Fix ai-generation.spec.ts (19 calls) (Agent: refactorer, Deps: 1.3)
- Task 2.3: Fix publishing.spec.ts (18 calls) (Agent: refactorer, Deps: 1.3)

**Component 3: Fix Remaining Files (Parallel)**

- Task 3.1: Fix project-management.spec.ts (10 calls) (Agent: refactorer, Deps:
  2.\*)
- Task 3.2: Fix world-building.spec.ts (5 calls) (Agent: refactorer, Deps: 2.\*)
- Task 3.3: Fix versioning.spec.ts (3 calls) (Agent: refactorer, Deps: 2.\*)
- Task 3.4: Fix project-wizard.spec.ts (2 calls) (Agent: refactorer, Deps: 2.\*)
- Task 3.5: Fix mock-validation.spec.ts (1 call) (Agent: refactorer, Deps: 2.\*)

**Component 4: Validation**

- Task 4.1: Run full E2E test suite (Agent: playwright-skill, Deps: 2._, 3._)
- Task 4.2: Verify all tests pass (Agent: validation, Deps: 4.1)
- Task 4.3: Commit changes (Agent: git, Deps: 4.2)

### Dependency Graph

```
Task 1.1 → Task 1.2 → Task 1.3
              ↓
    ┌─────────┼─────────┐
    ↓         ↓         ↓
Task 2.1  Task 2.2  Task 2.3  (Parallel - Priority files)
    └─────────┼─────────┘
              ↓
    ┌─────────┼─────────┬─────────┬─────────┐
    ↓         ↓         ↓         ↓         ↓
Task 3.1  Task 3.2  Task 3.3  Task 3.4  Task 3.5  (Parallel - Remaining files)
    └─────────┼─────────┴─────────┴─────────┘
              ↓
           Task 4.1 → Task 4.2 → Task 4.3
```

## Phase 3: Strategy Selection

### Chosen Strategy: **Hybrid Execution**

**Rationale**:

- Phase 1 (Analysis): Sequential (need to understand patterns first)
- Phase 2 (Priority files): Parallel (3 independent files, time-critical)
- Phase 3 (Remaining files): Parallel (5 independent files)
- Phase 4 (Validation): Sequential (must validate all changes together)

**Expected Performance**:

- Sequential analysis: ~5 minutes
- Parallel fixes (Phase 2): ~10 minutes (vs 30 minutes sequential)
- Parallel fixes (Phase 3): ~10 minutes (vs 50 minutes sequential)
- Validation: ~7 minutes (test suite run)
- **Total**: ~32 minutes (vs ~92 minutes sequential)
- **Speedup**: ~3x faster

## Phase 4: Agent Assignment

### Agent Capability Matrix

| Agent            | Role                           | Tasks |
| ---------------- | ------------------------------ | ----- |
| grep             | Pattern search                 | 1.1   |
| read             | Context analysis               | 1.2   |
| analysis         | Pattern identification         | 1.3   |
| refactorer (A)   | Fix settings.spec.ts           | 2.1   |
| refactorer (B)   | Fix ai-generation.spec.ts      | 2.2   |
| refactorer (C)   | Fix publishing.spec.ts         | 2.3   |
| refactorer (D)   | Fix project-management.spec.ts | 3.1   |
| refactorer (E)   | Fix world-building.spec.ts     | 3.2   |
| refactorer (F)   | Fix versioning.spec.ts         | 3.3   |
| refactorer (G)   | Fix project-wizard.spec.ts     | 3.4   |
| refactorer (H)   | Fix mock-validation.spec.ts    | 3.5   |
| playwright-skill | Test execution                 | 4.1   |
| validation       | Result verification            | 4.2   |

### Workload Balance

- Analysis: Light load (3 quick tasks)
- Priority fixes: Heavy load (59 calls across 3 files)
- Remaining fixes: Medium load (21 calls across 5 files)
- Validation: Medium load (test execution)

## Phase 5: Execution Plan

### Overview

- Strategy: Hybrid (Sequential analysis → Parallel fixes → Sequential
  validation)
- Total Tasks: 13 atomic tasks
- Estimated Duration: ~32 minutes
- Quality Gates: 3 checkpoints

---

### Phase 1: Analysis (Sequential)

**Duration**: ~5 minutes

**Tasks**:

1. Task 1.1: Count waitForTimeout per file
   - Command: `grep -c "waitForTimeout" tests/specs/*.spec.ts`
   - Output: File counts

2. Task 1.2: Extract context around each occurrence
   - Read each file to understand navigation patterns
   - Identify what element each wait is waiting for

3. Task 1.3: Identify replacement patterns
   - Map each waitForTimeout to appropriate smart wait
   - Document pattern (navigation wait, state wait, network wait)

**Quality Gate 1**: ✅ All 80 occurrences cataloged with replacement patterns

---

### Phase 2: Fix Priority Files (Parallel)

**Duration**: ~10 minutes (3 agents working simultaneously)

**Tasks (Parallel)**:

1. Task 2.1: Fix settings.spec.ts (22 calls)
   - Agent: refactorer (haiku for speed)
   - Pattern: Replace navigation waits with `expect().toBeVisible()`
   - Validate: Run `playwright test settings.spec.ts` after

2. Task 2.2: Fix ai-generation.spec.ts (19 calls)
   - Agent: refactorer (haiku for speed)
   - Pattern: Replace state transition waits with loading spinner checks
   - Validate: Run `playwright test ai-generation.spec.ts` after

3. Task 2.3: Fix publishing.spec.ts (18 calls)
   - Agent: refactorer (haiku for speed)
   - Pattern: Replace form submission waits with success message checks
   - Validate: Run `playwright test publishing.spec.ts` after

**Quality Gate 2**: ✅ Top 3 files fixed, 59 waitForTimeout removed, tests pass

---

### Phase 3: Fix Remaining Files (Parallel)

**Duration**: ~10 minutes (5 agents working simultaneously)

**Tasks (Parallel)**:

1. Task 3.1: Fix project-management.spec.ts (10 calls)
   - Agent: refactorer (haiku)
   - Validate: Tests pass

2. Task 3.2: Fix world-building.spec.ts (5 calls)
   - Agent: refactorer (haiku)
   - Validate: Tests pass

3. Task 3.3: Fix versioning.spec.ts (3 calls)
   - Agent: refactorer (haiku)
   - Validate: Tests pass

4. Task 3.4: Fix project-wizard.spec.ts (2 calls)
   - Agent: refactorer (haiku)
   - Validate: Tests pass

5. Task 3.5: Fix mock-validation.spec.ts (1 call)
   - Agent: refactorer (haiku)
   - Validate: Tests pass

**Quality Gate 3**: ✅ All 8 files fixed, 80 waitForTimeout removed, all tests
pass

---

### Phase 4: Validation (Sequential)

**Duration**: ~7 minutes

**Tasks**:

1. Task 4.1: Run full E2E test suite
   - Command: `npm run test:e2e`
   - Expected: All 55 tests pass
   - Duration: ~6 minutes (with optimizations)

2. Task 4.2: Verify results
   - Check: 0 waitForTimeout remaining
   - Check: All tests pass
   - Check: No flaky tests

3. Task 4.3: Commit changes
   - Message: "fix(e2e): remove waitForTimeout anti-patterns, use smart waits"
   - Files: 8 test spec files modified

**Quality Gate 4**: ✅ Full test suite passes, ready for CI

---

## Overall Success Criteria

- [ ] All 80 waitForTimeout calls removed
- [ ] All 55 E2E tests pass locally
- [ ] No flaky tests (run twice to confirm)
- [ ] Average test execution time reduced
- [ ] Code follows Playwright best practices
- [ ] Changes committed with clear message

## Replacement Patterns Reference

### Pattern 1: Navigation Wait

```typescript
// ❌ BEFORE
await page.getByTestId('nav-dashboard').click();
await page.waitForTimeout(1000);

// ✅ AFTER
await page.getByTestId('nav-dashboard').click();
await expect(page.getByTestId('dashboard-content')).toBeVisible({
  timeout: 5000,
});
```

### Pattern 2: State Transition Wait

```typescript
// ❌ BEFORE
await page.getByRole('button', { name: 'Generate' }).click();
await page.waitForTimeout(2000);

// ✅ AFTER
await page.getByRole('button', { name: 'Generate' }).click();
await expect(page.getByTestId('loading-spinner')).not.toBeVisible({
  timeout: 10000,
});
await expect(page.getByTestId('generated-content')).toBeVisible();
```

### Pattern 3: Form Submission Wait

```typescript
// ❌ BEFORE
await page.getByRole('button', { name: 'Save' }).click();
await page.waitForTimeout(1500);

// ✅ AFTER
await page.getByRole('button', { name: 'Save' }).click();
await expect(page.getByText('Saved successfully')).toBeVisible({
  timeout: 5000,
});
```

## Contingency Plans

### If Phase 2 fails (priority files)

**Action**:

1. Review test failures
2. Adjust timeout values if needed (increase to 10000ms for slow operations)
3. Add intermediate waits if state transitions are complex
4. Re-run tests individually to isolate issues

### If Phase 3 fails (remaining files)

**Action**:

1. Continue with passing files
2. Debug failing files individually
3. May need to add loading state checks
4. Worst case: Revert specific file and investigate separately

### If Phase 4 fails (validation)

**Action**:

1. Identify which tests are failing
2. Review changes in those specific test files
3. Compare before/after wait patterns
4. May need to add back strategic waits (but with smart waits, not arbitrary)

## Monitoring & Progress Tracking

### Progress Indicators

- [ ] Phase 1 complete: Analysis done
- [ ] Phase 2 complete: 59/80 waits fixed (74%)
- [ ] Phase 3 complete: 80/80 waits fixed (100%)
- [ ] Phase 4 complete: All tests passing

### Quality Metrics

- **Wait Removals**: Target 80/80 (100%)
- **Test Pass Rate**: Target 55/55 (100%)
- **Execution Time**: Target <7 min (from ~11 min baseline)
- **Flakiness**: Target 0 flaky tests

## Expected Outcomes

### Performance Improvements

- **Test Execution Time**: ~7 min (from ~11 min with waits)
- **Time Saved Per Run**: ~4 min (36% faster)
- **CI Impact**: Combined with sharding, <10 min total CI time
- **Reliability**: Eliminate race conditions from arbitrary waits

### Code Quality Improvements

- **Best Practices**: 100% Playwright best practices compliance
- **Maintainability**: Clearer intent (what we're waiting for)
- **Debuggability**: Easier to identify failures (know what didn't appear)
- **Standards**: Full AGENTS.md compliance

---

## Execution Status

**Status**: Ready to execute **Next Action**: Begin Phase 1 (Analysis)
**Expected Completion**: ~32 minutes from start

🤖 Generated with GOAP methodology
