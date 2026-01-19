# E2E Test & Accessibility Fixes - Execution Plan

**Date**: January 19, 2026 **Goal**: Fix all failing E2E tests, accessibility
violations, and build warnings

## Current State

### Failing E2E Tests

1. `should handle navigation between dashboard and settings` - failing on retry
2. `AI mocks are configured` - failing on retry
3. Tests timing out after 120s causing incomplete runs

### Accessibility Violations

- **Critical**: `aria-required-parent` - 6 nodes
- **Moderate**: `landmark-banner-is-top-level` - 1 node
- **Moderate**: `landmark-main-is-top-level` - 1 node
- **Moderate**: `landmark-no-duplicate-main` - 1 node
- **Moderate**: `landmark-unique` - 1 node

### Build Warning

- `vendor-misc-exUg0-bV.js` is 566.28 kB (exceeds 500kB limit)

## Goal State

✅ All E2E tests pass ✅ No accessibility violations ✅ Build succeeds without
warnings ✅ Full test suite completes successfully ✅ GitHub Actions all passing

## Action Plan

### Phase 1: Parallel Investigation & Fixes (Actions 1-3)

#### Action 1: Investigate Root Causes (Debugger Agent)

**Status**: ⏳ Pending **Preconditions**: Build succeeds, tests run **Actions**:

- Analyze E2E test failures in navigation.spec.ts and mock-validation.spec.ts
- Identify why `nav-settings` test fails on retry
- Identify why AI mocks are not configuring properly
- Determine timeout issue root cause (waitForTimeout anti-patterns) **Effects**:
  Analysis report with specific fixes needed **Output**:
  `plans/debug-analysis-report.md`

#### Action 2: Fix E2E Test Timeouts (E2E-Test-Optimizer Agent)

**Status**: ⏳ Pending **Preconditions**: Debugger analysis complete
**Actions**:

- Remove all `waitForTimeout` anti-patterns
- Implement smart waits (expect assertions)
- Enable test sharding for parallel execution
- Fix retry logic for navigation tests **Effects**: Optimized test
  infrastructure, no timeouts **Output**: `plans/e2e-optimization-report.md`

#### Action 3: Fix Accessibility Violations (UX Designer Agent)

**Status**: ⏳ Pending **Preconditions**: None (can run in parallel)
**Actions**:

- Fix `aria-required-parent` issues (critical priority) - 6 nodes
- Fix landmark hierarchy issues
  - Add proper `<header role="banner">` wrapper
  - Ensure `<main>` is top-level
  - Remove duplicate `<main>` landmarks
  - Ensure unique landmark labels
- Ensure WCAG 2.1 AA compliance **Effects**: Zero accessibility violations
  **Output**: `plans/accessibility-fixes-report.md`

### Phase 2: Sequential Implementation (Actions 4-6)

#### Action 4: Implement E2E Test Fixes (QA Engineer Agent)

**Status**: ⏳ Pending **Preconditions**: Debugger analysis complete, Action 2
done **Actions**:

- Implement fixes for navigation test (retry logic)
- Implement fixes for AI mock configuration
- Write proper mocks using MSW patterns
- Update test helpers for better reliability **Effects**: All E2E tests passing
  **Output**: `plans/e2e-fixes-report.md`

#### Action 5: Optimize Chunk Sizes (Performance Engineer Agent)

**Status**: ⏳ Pending **Preconditions**: Actions 1-4 complete **Actions**:

- Analyze vendor-misc chunk (566.28 kB → target <500kB)
- Implement code splitting with dynamic `import()`
- Update `vite.config.ts` manualChunks
- Test build with optimized chunks **Effects**: All chunks under 500kB limit
  **Output**: `plans/performance-optimization-report.md`

#### Action 6: Full Verification Cycle

**Status**: ⏳ Pending **Preconditions**: All fixes implemented **Actions**:

- Run `npm run build` (verify no warnings)
- Run `npm run lint` (never skip!)
- Run `npm run test` (unit tests)
- Run `npm run test:e2e` (all E2E tests) **Effects**: All checks pass
  **Output**: `plans/verification-report.md`

### Phase 3: GitHub Actions Verification (Action 7)

#### Action 7: GitHub Actions Verification

**Status**: ⏳ Pending **Preconditions**: All local checks pass **Actions**:

- Commit and push all changes
- Use `gh` CLI to monitor workflow runs
- Loop until all GitHub Actions show success
- Document any CI-specific issues **Effects**: GitHub Actions all passing
  **Output**: `plans/github-actions-report.md`

## Execution Strategy

- **Phase 1 (Actions 1-3)**: Execute in parallel (no dependencies)
- **Phase 2 (Actions 4-6)**: Run sequentially
- **Phase 3 (Action 7)**: Final verification
- **Quality Gates**:
  - Never skip `npm run lint` at any step
  - All accessibility fixes must pass Axe scan
  - All E2E tests must pass on first attempt (no retries needed)

## Key Dependencies

```
Action 1 (Debugger) ──┐
                      ├─── Action 4 (QA Engineer) ──┬─ Action 5 (Performance) ── Action 6 (Verification)
Action 2 (E2E-Opt) ───┘                             │
                                                   └─ Action 7 (GitHub Actions)
Action 3 (UX Designer) ────────────────────────────┘ (parallel)
```

## Expected Outcomes

### Test Improvements

- No `waitForTimeout` anti-patterns
- Smart waits using expect assertions
- Proper mock setup with MSW
- All tests pass on first attempt

### Accessibility Improvements

- Zero axe-core violations
- Proper landmark hierarchy
- ARIA attributes correctly nested
- WCAG 2.1 AA compliant

### Performance Improvements

- All chunks < 500kB
- Optimized code splitting
- Better caching strategy

### CI/CD Improvements

- GitHub Actions passing consistently
- No flaky tests
- Proper test sharding

## Risk Assessment

### High Risk

- **Navigation test flakiness**: Multiple retries indicate timing issues
  - **Mitigation**: Remove all `waitForTimeout`, use smart waits
- **Mock configuration**: AI mocks not setting up properly
  - **Mitigation**: Use UnifiedMockManager consistently

### Medium Risk

- **Accessibility fixes may require UI changes**: Landmark structure changes
  - **Mitigation**: Minimal changes, only add proper wrappers
- **Chunk optimization may break imports**: Code splitting edge cases
  - **Mitigation**: Test thoroughly after optimization

### Low Risk

- **GitHub Actions may timeout**: Parallel execution
  - **Mitigation**: Monitor logs, adjust timeouts if needed

## Handoff Summaries

### After Phase 1

- Root cause analysis complete
- Accessibility fixes implemented
- E2E infrastructure optimized

### After Phase 2

- All tests passing locally
- Performance optimized
- Ready for CI verification

### After Phase 3

- All GitHub Actions passing
- Documentation complete
- Ready for deployment

## Next Steps

1. **Start Phase 1**: Spawn Debugger, E2E-Test-Optimizer, and UX Designer agents
   in parallel
2. **Monitor Progress**: Check agent outputs and adjust as needed
3. **Complete Phase 2**: Sequential implementation of fixes
4. **Verify**: Full verification cycle
5. **Deploy**: Push to GitHub and monitor Actions

---

**Status**: 🔵 In Progress **Last Updated**: 2026-01-19 **Next Milestone**:
Complete Phase 1 (Actions 1-3)
