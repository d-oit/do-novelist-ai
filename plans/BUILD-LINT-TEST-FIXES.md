# Build, Lint, and Test Fixes - Coordination Plan

**Date**: January 19, 2026 **Status**: In Progress **Strategy**: Hybrid
Execution (Parallel → Sequential → Parallel → Iterative)

---

## Current State Analysis

### Local Test Results

- ✅ **Build**: Succeeded (with chunk size warning)
- ✅ **Lint**: Passed
- ✅ **Unit Tests**: 2036/2036 passed
- ❌ **E2E Tests**: 324/324 total, but with failures and timeouts

### E2E Test Failures

1. **Test**: "should handle navigation between dashboard and settings"
   - Location: `tests/specs/ai-generation.spec.ts:179`
   - Issue: Consistently failing on retry
   - Status: Needs investigation

2. **Test**: "AI mocks are configured"
   - Location: `tests/specs/mock-validation.spec.ts:27`
   - Issue: Mock routes not properly matching requests
   - Status: Needs investigation

3. **Timeout Issues**:
   - E2E tests timing out after 120s
   - Incomplete test runs
   - Performance optimization needed

### Accessibility Violations

1. **aria-required-parent** (Critical) - 6 nodes
   - Elements with ARIA roles not in proper parent hierarchy

2. **landmark-banner-is-top-level** (Moderate) - 1 node
   - Banner landmark contained in another landmark

3. **landmark-main-is-top-level** (Moderate) - 1 node
   - Main landmark not at top level

4. **landmark-no-duplicate-main** (Moderate) - 1 node
   - Multiple main landmarks present

5. **landmark-unique** (Moderate) - 1 node
   - Landmarks not unique (missing labels or titles)

### Build Warning

- **vendor-misc-exUg0-bV.js**: 566.28 kB (exceeds 500 kB limit)
- **Recommendation**: Implement code splitting with dynamic imports

### GitHub Actions Status

- ❌ **Fast CI Pipeline**: Failing
- ❌ **E2E Tests**: Failing
- ✅ **Security Scanning**: Success

---

## Goal State

All quality gates passing:

- [ ] Build: Success, no warnings
- [ ] Lint: Passed (ESLint + TypeScript)
- [ ] Unit Tests: 2036/2036 passed
- [ ] E2E Tests: 324/324 passed, no timeouts
- [ ] Accessibility: 0 violations (WCAG AA)
- [ ] GitHub Actions: All workflows green

---

## Action Plan

### Phase 1: Parallel Analysis (3 agents simultaneously)

**Execution Strategy**: Parallel **Estimated Duration**: 5-10 minutes

#### Action 1.1: Debugger Agent - Analyze E2E Test Failures

- **Agent**: debugger
- **Task**: Analyze root causes of failing E2E tests
- **Preconditions**: Build succeeds
- **Effects**:
  - Root cause analysis for navigation test failure
  - Root cause analysis for AI mock configuration test
  - Identification of timeout issues
- **Estimated Cost**: 3 minutes

**Input Files**:

- `tests/specs/ai-generation.spec.ts`
- `tests/specs/mock-validation.spec.ts`
- Test output and error logs

**Expected Output**:

```typescript
{
  navigationTestFailure: {
    file: 'tests/specs/ai-generation.spec.ts',
    line: 179,
    rootCause: string,
    fixRequired: string
  },
  mockValidationFailure: {
    file: 'tests/specs/mock-validation.spec.ts',
    line: 27,
    rootCause: string,
    fixRequired: string
  },
  timeoutIssues: {
    causes: string[],
    recommendations: string[]
  }
}
```

#### Action 1.2: E2E-Test-Optimizer Agent - Analyze Timeout Issues

- **Agent**: e2e-test-optimizer
- **Task**: Analyze E2E test timeout problems and optimization opportunities
- **Preconditions**: None
- **Effects**:
  - Identification of anti-patterns (waitForTimeout usage)
  - Analysis of slow tests
  - Recommendations for smart waits
  - Test sharding opportunities
- **Estimated Cost**: 2 minutes

**Expected Output**:

```typescript
{
  antiPatternsFound: string[],
  slowTests: Array<{ file: string; test: string; duration: number }>,
  recommendations: string[],
  shardingOpportunities: boolean
}
```

#### Action 1.3: UX Designer Agent - Analyze Accessibility Violations

- **Agent**: ux-designer
- **Task**: Fix all accessibility violations to WCAG AA compliance
- **Preconditions**: None
- **Effects**:
  - Fix aria-required-parent issues (6 nodes)
  - Fix landmark hierarchy issues
  - Ensure WCAG AA compliance
- **Estimated Cost**: 2 minutes

**Expected Output**:

```typescript
{
  fixesApplied: Array<{
    file: string;
    issue: string;
    fix: string;
  }>,
  violationsRemaining: number,
  wcagLevel: 'AA'
}
```

---

### Phase 2: Sequential Implementation (quality gates between steps)

**Execution Strategy**: Sequential with Quality Gates **Estimated Duration**:
15-25 minutes **Dependencies**: Phase 1 complete

#### Action 2.1: QA Engineer Agent - Implement E2E Test Fixes

- **Agent**: qa-engineer
- **Task**: Implement fixes for all E2E test failures
- **Preconditions**:
  - Debugger analysis complete
  - E2E-Test-Optimizer recommendations available
- **Effects**:
  - Navigation test fixed
  - AI mock configuration test fixed
  - Timeout issues resolved
- **Estimated Cost**: 10 minutes

**Quality Gates**:

1. ✅ Lint Gate: `npm run lint`
2. ✅ Type Check Gate: `tsc --noEmit`

**Input Context**:

```typescript
{
  debuggerAnalysis: Action 1.1 output,
  e2eRecommendations: Action 1.2 output
}
```

**Expected Output**:

```typescript
{
  filesModified: string[],
  changes: Array<{
    file: string;
    change: string;
    reason: string;
  }>,
  testsFixed: string[]
}
```

#### Action 2.2: QA Engineer Agent - Implement Accessibility Fixes

- **Agent**: qa-engineer (with UX Designer handoff)
- **Task**: Implement accessibility fixes from UX Designer analysis
- **Preconditions**: UX Designer analysis complete
- **Effects**:
  - All accessibility violations fixed
  - WCAG AA compliance achieved
- **Estimated Cost**: 8 minutes

**Quality Gates**:

1. ✅ Lint Gate: `npm run lint`

**Input Context**:

```typescript
{
  a11yAnalysis: Action 1.3 output
}
```

**Expected Output**:

```typescript
{
  a11yFixes: Array<{
    element: string;
    issue: string;
    fix: string;
  }>,
  violationsRemaining: 0
}
```

---

### Phase 3: Parallel Performance Optimization (independent of above)

**Execution Strategy**: Parallel **Estimated Duration**: 8-12 minutes
**Dependencies**: None (can run in parallel with Phase 2)

#### Action 3.1: Performance Engineer Agent - Optimize Chunk Sizes

- **Agent**: performance-engineer
- **Task**: Optimize bundle chunk sizes to eliminate build warning
- **Preconditions**: Build succeeds
- **Effects**:
  - All chunks under 500 kB
  - Build warnings eliminated
- **Estimated Cost**: 8 minutes

**Quality Gates**:

1. ✅ Lint Gate: `npm run lint`
2. ✅ Build Gate: `npm run build`

**Expected Output**:

```typescript
{
  optimizationApplied: string,
  chunksOptimized: string[],
  maxSize: number,
  warningsEliminated: boolean
}
```

---

### Phase 4: Parallel Verification (all agents together)

**Execution Strategy**: Parallel **Estimated Duration**: 2-5 minutes
**Dependencies**: Phases 1-3 complete

#### Action 4.1: Full Test Suite Execution

- **Agent**: coordinator (runs commands)
- **Task**: Run complete test suite with all quality gates
- **Preconditions**: All fixes implemented
- **Effects**:
  - All quality gates verified
  - Test results known
- **Estimated Cost**: 2 minutes

**Quality Gates** (Parallel execution):

1. ✅ Build: `npm run build`
2. ✅ Lint: `npm run lint`
3. ✅ Unit Tests: `npm run test`
4. ✅ E2E Tests: `npm run test:e2e`

**Expected Output**:

```typescript
{
  build: { passed: boolean; warnings: number; output: string },
  lint: { passed: boolean; errors: number; output: string },
  unitTests: { passed: number; total: number; output: string },
  e2eTests: { passed: number; total: number; output: string },
  allPassed: boolean
}
```

---

### Phase 5: GitHub Actions Verification Loop (Iterative)

**Execution Strategy**: Iterative (until success) **Estimated Duration**:
Variable (5-15 minutes per iteration) **Dependencies**: Phase 4 complete

#### Action 5.1: Commit and Push Changes

- **Agent**: coordinator (runs git commands)
- **Task**: Commit and push all fixes
- **Preconditions**: All quality gates passed locally
- **Effects**:
  - Changes committed
  - Changes pushed to remote
- **Estimated Cost**: 1 minute

**Commands**:

```bash
git add .
git commit -m "fix: resolve E2E test failures and accessibility issues"
git push
```

#### Action 5.2: Monitor GitHub Actions

- **Agent**: coordinator (runs gh commands)
- **Task**: Monitor GitHub Actions until all workflows succeed
- **Preconditions**: Changes pushed
- **Effects**:
  - All workflows green
  - CI/CD verified
- **Estimated Cost**: 5-15 minutes

**Commands**:

```bash
# Get latest run
RUN_ID=$(gh run list --limit 1 --json databaseId --jq '.[0].databaseId')

# Watch workflow
gh run watch $RUN_ID

# Check conclusion (loop)
while ! gh run view $RUN_ID --json conclusion --jq '.conclusion | test("success")'; do
  sleep 10
done
```

**Iterative Logic**:

```typescript
let allGreen = false;
let iterations = 0;
const maxIterations = 3;

while (!allGreen && iterations < maxIterations) {
  iterations++;
  console.log(
    `GitHub Actions verification iteration ${iterations}/${maxIterations}`,
  );

  // Push and monitor
  await commitAndPush();
  await waitForGitHubActions();

  // Check results
  const results = await getGitHubActionsResults();
  allGreen = results.every(r => r.conclusion === 'success');

  if (!allGreen) {
    console.log('Some workflows failed, analyzing...');
    await spawnAgent('debugger', { task: 'analyze-ci-failures' });
    await spawnAgent('qa-engineer', { task: 'fix-ci-issues' });
  }
}
```

---

## Handoff Documentation

### Handoff 1: Phase 1 to Phase 2

**From**: [Debugger, E2E-Test-Optimizer, UX Designer] **To**: [QA Engineer]

**Context**: Analysis phase complete, all issues identified with specific fixes
needed.

**Objective**: Implement all identified fixes with proper quality gates.

**Artifacts**:

- Debugger analysis: E2E test root causes
- E2E-Test-Optimizer analysis: Timeout optimization strategies
- UX Designer analysis: Accessibility fixes

**Constraints**:

- Must pass lint before proceeding to each step
- Maintain WCAG AA accessibility
- Don't break existing tests
- Use MSW patterns for mocks

**Success Criteria**:

- [ ] E2E navigation test passes
- [ ] AI mock validation test passes
- [ ] Timeout issues resolved
- [ ] All accessibility violations fixed
- [ ] No regressions in other tests

---

### Handoff 2: Phase 2/3 to Phase 4

**From**: [QA Engineer, Performance Engineer] **To**: [Coordinator]

**Context**: All fixes implemented, ready for verification.

**Objective**: Run complete test suite to verify all fixes work correctly.

**Artifacts**:

- E2E test fixes: Files modified, changes made
- Accessibility fixes: WCAG AA compliance achieved
- Performance optimization: Chunk sizes optimized

**Constraints**:

- Never skip lint
- Run all quality gates
- Report any failures immediately
- Document execution time

**Success Criteria**:

- [ ] All quality gates pass
- [ ] Build succeeds with no warnings
- [ ] All tests pass (unit + E2E)
- [ ] No accessibility violations

---

### Handoff 3: Phase 4 to Phase 5

**From**: [Coordinator] **To**: [GitHub Actions Monitor]

**Context**: Local verification complete, ready to deploy.

**Objective**: Commit, push, and verify all GitHub Actions pass.

**Artifacts**:

- Verification results: All quality gates passed
- Files changed: List of modified files
- Test results: Complete test suite output

**Constraints**:

- Never skip lint in commit
- Use conventional commit message
- Wait for all workflows to complete
- Loop until success (max 3 iterations)

**Success Criteria**:

- [ ] Changes committed and pushed
- [ ] All GitHub Actions workflows green
- [ ] No rollbacks needed

---

## Risk Assessment

### Risk 1: E2E Test Flakiness

**Likelihood**: Medium **Impact**: High **Mitigation**:

- Use e2e-test-optimizer agent recommendations
- Implement proper smart waits
- Remove all anti-patterns

### Risk 2: Accessibility Fixes Break Layout

**Likelihood**: Low **Impact**: Medium **Mitigation**:

- UX Designer agent specializes in WCAG AA
- Visual regression tests will catch layout breaks
- Can iterate if issues arise

### Risk 3: Performance Optimization Increases Complexity

**Likelihood**: Low **Impact**: Low **Mitigation**:

- Simple code splitting with dynamic imports
- Performance engineer agent specializes in this
- Build gate ensures no breakage

### Risk 4: GitHub Actions Timeouts

**Likelihood**: Medium **Impact**: Medium **Mitigation**:

- E2E timeout fixes apply to CI
- Optimized test execution time
- Can use longer timeouts in CI config

---

## Quality Gates

### Pre-Execution Gates

- [ ] Local build succeeds
- [ ] Local lint passes

### Phase Gates

1. **After Phase 1**: Analysis documents complete
2. **After Action 2.1**: Lint passed
3. **After Action 2.2**: Lint passed
4. **After Action 3.1**: Lint passed, Build passed
5. **After Phase 4**: All gates passed (Build, Lint, Unit, E2E)

### Post-Execution Gates

- [ ] Local verification complete
- [ ] GitHub Actions all green
- [ ] No remaining issues

---

## Progress Tracking

| Phase                              | Status     | Start Time | End Time | Duration |
| ---------------------------------- | ---------- | ---------- | -------- | -------- |
| Phase 1: Parallel Analysis         | ⏳ Pending | -          | -        | -        |
| Phase 2: Sequential Implementation | ⏳ Pending | -          | -        | -        |
| Phase 3: Parallel Performance      | ⏳ Pending | -          | -        | -        |
| Phase 4: Parallel Verification     | ⏳ Pending | -          | -        | -        |
| Phase 5: GitHub Actions Loop       | ⏳ Pending | -          | -        | -        |

**Overall Progress**: 0/5 phases (0%)

---

## Success Criteria

All of the following must be true:

- [ ] ✅ Build: Success, no warnings
- [ ] ✅ Lint: Passed (0 errors, 0 warnings)
- [ ] ✅ Unit Tests: 2036/2036 passed
- [ ] ✅ E2E Tests: 324/324 passed
  - [ ] Navigation test passes
  - [ ] AI mock validation test passes
  - [ ] No timeouts
- [ ] ✅ Accessibility: 0 violations
  - [ ] No aria-required-parent issues
  - [ ] Proper landmark hierarchy
  - [ ] WCAG AA compliant
- [ ] ✅ Performance: All chunks < 500 kB
- [ ] ✅ GitHub Actions: All workflows green
  - [ ] Fast CI Pipeline: success
  - [ ] Security Scanning: success
  - [ ] E2E Tests: success

---

## Notes

- Created new agent-coordination agent and skill for systematic workflow
- Using hybrid execution strategy for optimal efficiency and quality
- All handoffs documented with complete context
- Quality gates enforced at every step
- Never skip lint - explicitly enforced in workflow

---

**Next Actions**:

1. Start Phase 1: Spawn Debugger, E2E-Test-Optimizer, UX Designer agents in
   parallel
2. Handoff results to QA Engineer for implementation
3. Run Performance Engineer optimization in parallel
4. Execute full verification with all quality gates
5. Commit, push, and monitor GitHub Actions until all green
