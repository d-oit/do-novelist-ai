# GOAP Plan: Fix E2E Test Failures

## Executive Summary

**Goal**: Fix all E2E test failures (120+ failures across 170 tests) and achieve
100% pass rate **Strategy**: Hybrid (Sequential infrastructure → Parallel fixes
→ Sequential validation) **Estimated Duration**: 15-25 minutes with 9 parallel
agents **Quality Gates**: 3 checkpoints

## Task Analysis

### Primary Goal

Fix all E2E test failures identified in test run:

- **Timeout issues (70%)**: Tests waiting 30-60s for elements that never appear
- **AI SDK mock issues (15%)**: Console output expectations not met
- **Version history tests (10%)**: Selector issues and timing problems
- **Navigation tests (3%)**: Sidebar visibility timing issues
- **Publishing tests (2%)**: Element visibility timeouts

**Current Status**: 12/170 tests passing (7% pass rate) → Target: 170/170 (100%
pass rate)

### Constraints

- Time: Urgent (blocking PR #29 merge)
- Resources: Multiple specialized agents available
- Dependencies: Must update existing PR #29
- Quality: All 33 E2E tests must pass, full CI pipeline success

### Complexity Assessment

- **Level**: Medium-High
- **Agents Required**: 3-4 specialized agents
- **Dependencies**: Sequential phases with parallel tasks
- **Risk**: Medium (AI SDK integration complexity)

## Task Decomposition

### Phase 1: Root Cause Analysis & Research (Sequential)

**Priority**: P0 **Agent**: codebase-analyzer

**Tasks**: 1.1. Analyze AI SDK logging configuration 1.2. Review MSW mock setup
for AI Gateway 1.3. Identify all test files affected 1.4. Review test
environment configuration

**Success Criteria**:

- Root cause documented
- All affected files identified
- Solution approach validated

**Quality Gate 1**: Root cause confirmed, fix strategy approved

---

### Phase 2: Implementation (Parallel)

**Priority**: P0 **Agents**: refactorer (x2)

#### Track A: AI SDK Logger Fixes

**Agent**: refactorer-1 **Tasks**: 2.1. Create comprehensive AI SDK logger mock
2.2. Update mock-ai-sdk.ts to properly disable logging 2.3. Add logger patch to
test setup files 2.4. Ensure logger is disabled before any AI SDK imports

**Dependencies**: Phase 1 complete **Success Criteria**:

- AI SDK logger properly mocked
- No `m.log is not a function` errors
- Mocks load before AI SDK initialization

#### Track B: Test Configuration & Timeout Fixes

**Agent**: refactorer-2 **Tasks**: 2.5. Review and increase test timeouts if
needed 2.6. Fix element visibility issues in test selectors 2.7. Update
playwright.config.ts environment variables 2.8. Ensure proper test teardown

**Dependencies**: Phase 1 complete **Success Criteria**:

- No test timeouts
- All elements properly visible
- Clean test environment

**Quality Gate 2**: All fixes implemented, code compiles

---

### Phase 3: Validation (Sequential)

**Priority**: P0 **Agent**: test-runner

**Tasks**: 3.1. Run E2E tests locally 3.2. Fix any remaining issues discovered
3.3. Run full lint and build 3.4. Commit changes to feature branch

**Dependencies**: Phase 2 complete **Success Criteria**:

- All 33 E2E tests pass locally
- Zero lint errors
- Build succeeds
- Code committed

**Quality Gate 3**: Local validation passed

---

### Phase 4: CI/CD Integration (Sequential)

**Priority**: P0 **Agent**: code-reviewer

**Tasks**: 4.1. Push changes to remote branch 4.2. Update PR #29 description
with changes 4.3. Monitor GitHub Actions (ALL checks must pass) 4.4. Wait for
complete CI success before marking done

**Dependencies**: Phase 3 complete **Success Criteria**:

- All GitHub Actions pass (Build, Test, E2E, Security)
- PR updated with comprehensive description
- No failing checks
- Ready for merge

**Quality Gate 4**: Full CI pipeline green

## Execution Strategy

### Why Hybrid Strategy?

- **Phase 1**: Sequential (need complete analysis first)
- **Phase 2**: Parallel (two independent fix tracks)
- **Phase 3-4**: Sequential (validation must be ordered)

### Dependency Graph

```
Phase 1 (Analysis)
    ↓
Phase 2A (AI SDK) ┐
                  ├→ Phase 3 (Local Tests) → Phase 4 (CI)
Phase 2B (Config) ┘
```

## Quality Gates Detail

### QG1: Analysis Complete

- [ ] Root cause: AI SDK logger not properly disabled
- [ ] Affected files: mock-ai-sdk.ts, global-setup.ts, test files
- [ ] Solution: Comprehensive logger mock + environment variables
- [ ] Risks identified and mitigated

### QG2: Implementation Complete

- [ ] AI SDK logger mock created and imported
- [ ] Test configuration updated
- [ ] No TypeScript errors
- [ ] Code follows AGENTS.md guidelines

### QG3: Local Validation

- [ ] All 33 E2E tests pass
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds
- [ ] Changes committed to branch

### QG4: CI Pipeline Complete

- [ ] ✅ Build & Test job passes
- [ ] ✅ E2E Tests job passes
- [ ] ✅ CodeQL Security Analysis passes
- [ ] ✅ Lint checks pass
- [ ] ✅ All other CI checks pass
- [ ] PR updated and ready for review

## Risk Mitigation

### Risk 1: AI SDK mock doesn't work

**Mitigation**: Multiple mock strategies (env vars + patch + MSW) **Fallback**:
Direct logger object replacement in tests

### Risk 2: Tests still timeout

**Mitigation**: Incremental timeout increases with monitoring **Fallback**:
Refactor test approach if architectural issue

### Risk 3: CI environment differs from local

**Mitigation**: Match CI env vars exactly in local config **Fallback**: Add
CI-specific configuration

## Success Metrics

### Primary

- ✅ All 33 E2E tests passing
- ✅ All GitHub Actions green
- ✅ PR #29 ready for merge

### Secondary

- Zero test flakiness
- Improved test execution time
- Better test environment isolation

## Contingency Plans

### If Phase 2 fails

- Investigate deeper AI SDK integration issues
- Consider alternative mocking libraries
- Escalate if blocking architectural issue

### If Phase 3 fails locally

- Debug individual failing tests
- Add more detailed logging
- Review test environment setup

### If Phase 4 fails in CI

- Compare CI vs local environment
- Add CI-specific workarounds
- Review GitHub Actions logs in detail

## Handoff Coordination Notes

Each phase will produce:

1. **Phase 1**: Analysis document with findings
2. **Phase 2**: Implemented fixes in code
3. **Phase 3**: Test results and commit
4. **Phase 4**: CI status and PR update

Agents will coordinate through:

- Shared context (this plan file)
- Quality gate checkpoints
- Clear success criteria
- Documented outputs

## Execution Timeline

1. **Phase 1**: 5-10 minutes (analysis)
2. **Phase 2**: 10-15 minutes (parallel fixes)
3. **Phase 3**: 5-10 minutes (local validation)
4. **Phase 4**: 10-15 minutes (CI monitoring)

**Total**: 30-50 minutes

## Post-Execution Review

After completion, document:

- What worked well
- What challenges arose
- How we solved them
- Lessons for future E2E test development
