# GOAP Execution Plan: Fix Vitest RPC Worker Error

## Task Analysis

**Primary Goal**: Fix Vitest RPC worker error caused by pending analytics fetch
during test cleanup

**Error Details**:

- Error: `[vitest-worker]: Closing rpc while "fetch" was pending`
- Location: `src/lib/analytics/analytics.ts`
- Affected Test: `writingAssistantService.test.ts`
- Root Cause: Fire-and-forget lazy imports of analytics module trigger PostHog
  network requests that aren't awaited

**Constraints**:

- Time: Normal priority
- Must run full build, lint, test cycle
- Never skip lint
- All 1,415 tests must pass

**Complexity Level**: Medium

- Need to mock analytics module properly
- Need to ensure no side effects on other tests
- Need full validation cycle

**Quality Requirements**:

- Testing: All 1,415 tests passing
- Standards: AGENTS.md compliance, ESLint zero warnings
- Build: TypeScript compilation successful
- Documentation: Clear commit message

## Task Decomposition

### Main Goal

Eliminate pending fetch requests during test cleanup by mocking analytics module

### Sub-Goals

1. **Mock Analytics Module** (Priority: P0)
   - Success Criteria: Analytics module mocked in test setup
   - Dependencies: None
   - Complexity: Low

2. **Validate Fix** (Priority: P1, Deps: Mock Analytics Module)
   - Success Criteria: All tests pass, no RPC errors
   - Dependencies: Mock Analytics Module
   - Complexity: Medium

3. **Full Quality Check** (Priority: P1, Deps: Validate Fix)
   - Success Criteria: Build, lint, test all pass
   - Dependencies: Validate Fix
   - Complexity: Low

4. **Commit Changes** (Priority: P1, Deps: Full Quality Check)
   - Success Criteria: Changes committed and pushed
   - Dependencies: Full Quality Check
   - Complexity: Low

### Atomic Tasks

**Task 1.1**: Add analytics mock to test setup (Agent: debugger, Deps: none)
**Task 1.2**: Verify writingAssistantService.test.ts passes (Agent: debugger,
Deps: 1.1) **Task 2.1**: Run full test suite (Agent: test validation, Deps: 1.2)
**Task 3.1**: Run lint (Agent: quality check, Deps: 2.1) **Task 3.2**: Run build
(Agent: quality check, Deps: 2.1) **Task 4.1**: Commit and push (Agent: myself,
Deps: 3.1, 3.2)

### Dependency Graph

```
Task 1.1 (Mock analytics) → Task 1.2 (Verify test) → Task 2.1 (Full test suite)
                                                     ↓
Task 4.1 (Commit) ← Task 3.1 (Lint) + Task 3.2 (Build)
```

## Execution Strategy

**Strategy**: Sequential (dependencies require ordered execution)

## Execution Plan

### Phase 1: Implementation

**Agent**: debugger **Tasks**:

- Add proper analytics module mock to `src/test/setup.ts`
- Mock should prevent any network requests
- Mock should provide no-op implementations of analytics methods

**Quality Gate**: writingAssistantService.test.ts passes without RPC errors

### Phase 2: Validation

**Agent**: test-runner / myself **Tasks**:

- Run full test suite (npm run test)
- Run lint checks (npm run lint)
- Run build (npm run build)

**Quality Gate**: All quality checks pass

### Phase 3: Commit

**Agent**: myself **Tasks**:

- Create commit with descriptive message
- Push to GitHub

**Quality Gate**: Successfully pushed

## Success Criteria

- [x] Analytics module properly mocked
- [x] No RPC worker errors
- [x] All 1,415 tests passing
- [x] Lint passes with zero warnings
- [x] Build completes successfully
- [x] Changes committed and pushed

## Implementation Details

### Solution Approach

Add analytics mock to `src/test/setup.ts`:

```typescript
// Mock analytics to prevent network requests during tests
vi.mock('@/lib/analytics', () => ({
  analytics: {
    init: vi.fn(),
    identify: vi.fn(),
    capture: vi.fn(),
    reset: vi.fn(),
    trackPageView: vi.fn(),
    setTrackingEnabled: vi.fn(),
  },
  featureTracking: {
    trackFeatureUsage: vi.fn(),
    trackFeatureError: vi.fn(),
    trackFeaturePerformance: vi.fn(),
  },
}));
```

This will:

1. Prevent lazy imports from triggering real PostHog requests
2. Provide no-op mock implementations
3. Apply to all tests globally
4. Prevent RPC worker errors during cleanup

## Risk Assessment

- **Low Risk**: Mocking analytics is standard practice
- **No Breaking Changes**: Only affects test environment
- **High Confidence**: Direct solution to identified root cause

## Execution Summary

### Final Solution (Commit: 0f70277)

Added vi.mock() calls directly to writingAssistantService.test.ts:

- Mocked posthog-js SDK (lines 13-32)
- Mocked @/lib/analytics module (lines 34-84)
- Placed mocks at module top-level for automatic hoisting by Vitest

### Why This Worked

Vitest automatically hoists vi.mock() calls in test files to the top of the
module, ensuring they execute before any imports. Setup.ts mocks were not
hoisting properly in CI sharding environment due to Vitest's module loading
order.

### CI Results

✅ Fast CI Pipeline - Run #21038733831 (commit 0f70277)

- ✓ All 3 test shards passing (Shard 1/3, 2/3, 3/3)
- ✓ No RPC worker errors
- ✓ All quality checks passed
- ✓ Duration: 3m 41s

### Previous Attempts

1. **Commit 96ec1b4**: Added @/lib/analytics mock to setup.ts - Failed in Shard
   2/3 with RPC errors
2. **Commit d53505e**: Added posthog-js mock to setup.ts - Fixed Shard 2/3 but
   failed in Shard 1/3
3. **Commit 0f70277**: Added mocks directly to test file - ✅ SUCCESS across all
   shards

### Key Learning

For tests with dynamic imports (`void import()`) that bypass global mocks, place
vi.mock() calls directly in the test file at module top-level rather than
relying on setup.ts. Vitest only hoists mocks from test files, not setup files.
