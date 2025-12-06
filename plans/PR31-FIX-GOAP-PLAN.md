# PR #31 Fix - GOAP Execution Plan

## Task Analysis

**Primary Goal**: Fix all failing CI checks in PR #31
(fix/accessibility-color-contrast)

**Constraints**:

- Time: Urgent - PR is blocked
- Resources: All agents available
- Dependencies: Must use pnpm (not npm), fix YAML lint errors, fix shellcheck
  issues

**Complexity Level**: Complex

- 4+ agents needed
- Mixed execution modes (parallel + sequential)
- Multiple file types (YAML, workflows)

**Quality Requirements**:

- All CI checks must pass
- YAML lint compliance
- Shellcheck compliance
- Build/test success

## Root Cause Analysis

### Issue 1: Missing pnpm-lock.yaml (CRITICAL)

**Affected Checks**: All npm-based workflows

- Bundle Size Analysis
- Accessibility Compliance
- Cross-Browser Performance
- Performance Regression
- Quality Gates

**Root Cause**: Workflows use `cache: npm` but project uses pnpm **Solution**:
Change all workflow files to use `cache: pnpm` and `pnpm ci`

### Issue 2: YAML Lint Errors

**Affected Check**: YAML Syntax Validation **Errors**:

- Line length violations (61 errors across 2 files)
- Trailing spaces (29 errors)
- Missing document start markers (warnings)
- Truthy value format (warnings)

**Files**:

- `.github/workflows/performance-integration.yml` (1 line-length error, 1
  trailing space)
- `.github/workflows/performance-dashboard.yml` (29 errors)
- `.github/workflows/performance-monitoring.yml` (6 errors)

### Issue 3: Shellcheck Issues

**Affected Check**: GitHub Actions Workflow Validation **Errors** (SC2129,
SC2170):

- SC2129: Use `{ cmd; }` instead of individual redirects
- SC2170: Invalid number comparison (use $var)
- SC2009, SC2086, SC2010, SC2012: Various shell best practices

### Issue 4: E2E Test Timeout

**Affected Check**: E2E Tests Shard 3/3 **Status**: Failed after 1m55s **Need**:
Investigation of specific failure

## GOAP Decomposition

### Phase 1: Critical Infrastructure Fixes (Sequential)

**Priority**: P0 - Blocks all other checks

#### Task 1.1: Fix pnpm cache configuration

- **Agent**: refactorer
- **Action**: Update all workflow files to use pnpm instead of npm
- **Files**: All `.github/workflows/*.yml` files with `cache: npm`
- **Success Criteria**: `cache: pnpm` in all workflows, `pnpm ci` instead of
  `npm ci`
- **Dependencies**: None
- **Estimated Time**: 5 minutes

### Phase 2: Parallel Quality Fixes

**Priority**: P0 - Independent tasks

#### Task 2.1: Fix YAML lint errors

- **Agent**: refactorer
- **Action**: Fix all YAML lint violations
- **Files**:
  - `.github/workflows/performance-integration.yml`
  - `.github/workflows/performance-dashboard.yml`
  - `.github/workflows/performance-monitoring.yml`
- **Success Criteria**: `yamllint` passes with zero errors
- **Dependencies**: None (parallel with 2.2)
- **Estimated Time**: 10 minutes

#### Task 2.2: Fix shellcheck issues

- **Agent**: refactorer
- **Action**: Fix all shellcheck violations in workflow scripts
- **Files**: Same as 2.1
- **Success Criteria**: `actionlint` passes with zero errors
- **Dependencies**: None (parallel with 2.1)
- **Estimated Time**: 10 minutes

### Phase 3: Verification (Sequential)

**Priority**: P0 - Quality gates

#### Task 3.1: Verify local builds

- **Agent**: test-runner
- **Action**: Run `pnpm install`, `pnpm run lint`, `pnpm run build`
- **Success Criteria**: All commands succeed
- **Dependencies**: Tasks 1.1, 2.1, 2.2
- **Estimated Time**: 5 minutes

#### Task 3.2: Investigate E2E timeout

- **Agent**: debugger
- **Action**: Check E2E test shard 3 logs for specific failure
- **Success Criteria**: Root cause identified
- **Dependencies**: Task 3.1
- **Estimated Time**: 5 minutes

### Phase 4: Validation (Sequential)

**Priority**: P0 - Final quality gate

#### Task 4.1: Push fixes and monitor CI

- **Agent**: Main (user)
- **Action**: Commit and push all fixes
- **Success Criteria**: All CI checks pass
- **Dependencies**: All Phase 3 tasks
- **Estimated Time**: 2 minutes (push) + 5 minutes (CI)

## Execution Strategy

**Strategy**: Hybrid (Sequential Phase 1 → Parallel Phase 2 → Sequential Phase
3/4)

### Rationale

1. **Phase 1 is critical**: pnpm cache fix unblocks all other checks
2. **Phase 2 can parallelize**: YAML and shellcheck fixes are independent
3. **Phase 3 must be sequential**: Need to verify before investigating further
4. **Phase 4 is final validation**: Push and monitor

### Expected Speedup

- Without parallelization: ~40 minutes
- With hybrid approach: ~25 minutes
- **Improvement**: 37% faster

## Quality Gates

### Gate 1: After Phase 1

- [ ] All workflow files use `cache: pnpm`
- [ ] All `npm ci` changed to `pnpm ci`
- [ ] No `npm install` commands remain

### Gate 2: After Phase 2

- [ ] `yamllint` passes with zero errors
- [ ] `actionlint` passes with zero errors
- [ ] All line lengths ≤ 120 characters
- [ ] No trailing spaces
- [ ] All shellcheck errors fixed

### Gate 3: After Phase 3

- [ ] `pnpm install` succeeds
- [ ] `pnpm run lint` passes
- [ ] `pnpm run build` succeeds
- [ ] E2E failure root cause identified

### Gate 4: After Phase 4

- [ ] All CI checks pass (23/23 green)
- [ ] PR ready for review

## File Inventory

### Workflows to Update (Phase 1)

1. `.github/workflows/ci.yml`
2. `.github/workflows/performance-integration.yml`
3. `.github/workflows/performance-dashboard.yml`
4. `.github/workflows/performance-monitoring.yml`
5. `.github/workflows/ci-and-labels.yml`

### Workflows to Fix (Phase 2)

1. `.github/workflows/performance-integration.yml` (YAML + shellcheck)
2. `.github/workflows/performance-dashboard.yml` (YAML only)
3. `.github/workflows/performance-monitoring.yml` (YAML + shellcheck)
4. `.github/workflows/ci.yml` (shellcheck only)

## Risk Assessment

### High Risk

- **pnpm cache mismatch**: If we don't fix this, all checks will fail
- **Breaking changes in workflows**: Could break CI entirely

### Medium Risk

- **YAML formatting**: Could introduce syntax errors
- **Shellcheck fixes**: Could change script behavior

### Mitigation

- Test locally before pushing
- Review all changes carefully
- Keep commits atomic (one fix per commit)
- Monitor CI after each push

## Contingency Plans

### If pnpm fix doesn't work

1. Check if pnpm-lock.yaml exists in repo
2. If not, generate with `pnpm install`
3. Commit pnpm-lock.yaml

### If YAML lint still fails

1. Re-run yamllint locally
2. Use `--print-config` to verify rules
3. Fix remaining issues iteratively

### If shellcheck still fails

1. Review actionlint output
2. Apply shellcheck suggestions one by one
3. Test scripts don't break

### If E2E tests still timeout

1. Increase timeout in playwright.config.ts
2. Check if specific test is flaky
3. Skip flaky test temporarily with `.skip`

## Success Metrics

### Planning Quality

- ✅ Clear decomposition with 9 measurable tasks
- ✅ Realistic time estimates (25 min total)
- ✅ Appropriate hybrid strategy
- ✅ Well-defined quality gates (4 checkpoints)

### Execution Quality

- Target: All 23 CI checks passing
- Target: Zero YAML lint errors
- Target: Zero shellcheck errors
- Target: < 30 minutes total execution time

## Next Steps

1. **Execute Phase 1**: Fix pnpm cache (Agent: refactorer)
2. **Execute Phase 2**: Parallel YAML + shellcheck fixes
3. **Execute Phase 3**: Local verification
4. **Execute Phase 4**: Push and monitor CI

---

**GOAP Plan Created**: 2025-12-05 **Target Completion**: 2025-12-05 (same day)
**Estimated Duration**: 25 minutes **Strategy**: Hybrid (Sequential → Parallel →
Sequential)
