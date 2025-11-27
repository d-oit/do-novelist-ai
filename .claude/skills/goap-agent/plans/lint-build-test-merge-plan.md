# GOAP Execution Plan: Lint, Build, Test, Fix & Merge to Main

## Phase 1: Task Analysis

### Primary Goal
Successfully lint, build, and test the codebase on `refactor/modern-structure` branch, fix all issues, and merge to `main` via PR using gh CLI.

### Current State
- **Branch**: `refactor/modern-structure`
- **Modified Files**:
  - .claude/settings.local.json
  - playwright-report/index.html
  - .claude/settings.json (deleted)
- **Source Files**: 47 TypeScript/TSX files in src/
- **Main Changes**: Modern structure refactor with src/app, src/features, src/shared

### Constraints
- All quality gates must pass (lint, build, test)
- AGENTS.md compliance (max 500 lines/file, code style)
- Must use gh CLI for PR creation
- Repository only allows new PRs

### Complexity Level
**Complex** - Requires 4-6 agents with coordinated execution and multiple quality gates

---

## Phase 2: Task Decomposition

### Main Goal
Achieve zero errors in lint, build, and test phases, then merge to main

### Sub-Goals

#### G1: Quality Assessment (Priority: P0)
- **Success Criteria**: Complete understanding of all lint, build, and test issues
- **Dependencies**: None
- **Complexity**: Medium
- **Tasks**:
  - T1.1: Run ESLint and capture all errors
  - T1.2: Run build and capture all errors
  - T1.3: Run Playwright tests and capture all failures

#### G2: Issue Resolution (Priority: P1)
- **Success Criteria**: All lint, build, and test issues resolved
- **Dependencies**: G1 complete
- **Complexity**: High
- **Tasks**:
  - T2.1: Fix lint errors (grouped by type)
  - T2.2: Fix build/TypeScript errors
  - T2.3: Fix failing tests
  - T2.4: Verify file size compliance (<500 lines)

#### G3: Final Validation (Priority: P2)
- **Success Criteria**: All quality gates pass cleanly
- **Dependencies**: G2 complete
- **Complexity**: Low
- **Tasks**:
  - T3.1: Run full lint (must pass)
  - T3.2: Run full build (must pass)
  - T3.3: Run full test suite (must pass)

#### G4: Merge to Main (Priority: P3)
- **Success Criteria**: Changes merged to main via PR
- **Dependencies**: G3 complete
- **Complexity**: Low
- **Tasks**:
  - T4.1: Create commit if needed
  - T4.2: Push branch to remote
  - T4.3: Create PR using gh CLI
  - T4.4: Verify PR created successfully

### Dependency Graph
```
T1.1 (ESLint) ──┐
T1.2 (Build)  ──┼──> Assessment Complete
T1.3 (Test)   ──┘           |
                            v
                    T2.1 (Fix Lint) ──┐
                    T2.2 (Fix Build)──┼──> All Fixes Complete
                    T2.3 (Fix Tests)──┤
                    T2.4 (File Size)──┘
                            |
                            v
                    T3.1 (Validate Lint)──┐
                    T3.2 (Validate Build)─┼──> Validation Complete
                    T3.3 (Validate Test)──┘
                            |
                            v
                    T4.1 (Commit)──┐
                    T4.2 (Push)────┼──> PR Created
                    T4.3 (PR)──────┤
                    T4.4 (Verify)──┘
```

---

## Phase 3: Strategy Selection

### Chosen Strategy: **Hybrid Execution**

**Rationale**:
- Phase 1 (Assessment): **PARALLEL** - lint/build/test are independent
- Phase 2 (Resolution): **SEQUENTIAL or PARALLEL** - depends on issue overlap
- Phase 3 (Validation): **PARALLEL** - final checks are independent
- Phase 4 (Merge): **SEQUENTIAL** - must follow strict order

**Expected Benefits**:
- 3x speedup in assessment phase
- Parallel validation saves time
- Sequential merge ensures correctness

---

## Phase 4: Agent Assignment

### Agent Capability Mapping

| Phase | Task | Agent Type | Rationale |
|-------|------|------------|-----------|
| **Phase 1: Assessment** | | | |
| 1.1 | Run ESLint | general-purpose | Quick command execution |
| 1.2 | Run Build | general-purpose | Quick command execution |
| 1.3 | Run Tests | general-purpose | Quick command execution |
| **Phase 2: Resolution** | | | |
| 2.1 | Fix Lint Errors | general-purpose | Code fixes based on lint output |
| 2.2 | Fix Build Errors | general-purpose | TypeScript/build issues |
| 2.3 | Fix Test Failures | general-purpose | Test debugging and fixes |
| 2.4 | File Size Check | general-purpose | Validation and potential splits |
| **Phase 3: Validation** | | | |
| 3.1 | Validate Lint | general-purpose | Quick validation |
| 3.2 | Validate Build | general-purpose | Quick validation |
| 3.3 | Validate Test | general-purpose | Quick validation |
| **Phase 4: Merge** | | | |
| 4.1-4.4 | Git & PR Flow | general-purpose | Sequential git operations |

**Total Agents Required**: 1-6 agents depending on parallel execution needs

---

## Phase 5: Execution Plan

### Phase 1: Quality Assessment (PARALLEL)
**Strategy**: Launch 3 agents simultaneously

**Agents**:
1. **Agent-Lint** (general-purpose)
   - Task: Run `npx eslint src --ext .ts,.tsx`
   - Output: All lint errors with file locations
   - Quality Gate: Lint errors catalogued

2. **Agent-Build** (general-purpose)
   - Task: Run `npm run build`
   - Output: All build/TypeScript errors
   - Quality Gate: Build errors catalogued

3. **Agent-Test** (general-purpose)
   - Task: Run `npm run test` (Playwright E2E)
   - Output: All test failures
   - Quality Gate: Test failures catalogued

**Quality Gate**: All assessment agents complete with error reports

**Estimated Duration**: 2-5 minutes (parallel)

---

### Phase 2: Issue Resolution (ADAPTIVE)
**Strategy**: Sequential or parallel based on Phase 1 results

**Decision Logic**:
- If errors overlap across lint/build/test → SEQUENTIAL
- If errors are isolated → PARALLEL with up to 3 agents

**Agents** (up to 3):
1. **Agent-Fix-Lint** (general-purpose)
   - Task: Fix all ESLint errors
   - Input: Error list from Phase 1.1
   - Output: Fixed files
   - Quality Gate: No remaining lint errors

2. **Agent-Fix-Build** (general-purpose)
   - Task: Fix all build/TypeScript errors
   - Input: Error list from Phase 1.2
   - Output: Fixed files
   - Quality Gate: No remaining build errors

3. **Agent-Fix-Test** (general-purpose)
   - Task: Fix all test failures
   - Input: Failure list from Phase 1.3
   - Output: Fixed test files
   - Quality Gate: All tests passing

**Additional Check**:
- **Agent-File-Size** (general-purpose)
  - Task: Check all files < 500 lines (AGENTS.md requirement)
  - Output: List of oversized files
  - Action: Split if needed

**Quality Gate**: All lint, build, and test issues resolved

**Estimated Duration**: 5-15 minutes (depends on issue count)

---

### Phase 3: Final Validation (PARALLEL)
**Strategy**: Launch 3 agents simultaneously to verify all fixes

**Agents**:
1. **Agent-Validate-Lint** (general-purpose)
   - Task: Run `npx eslint src --ext .ts,.tsx`
   - Expected: Zero errors
   - Quality Gate: PASS

2. **Agent-Validate-Build** (general-purpose)
   - Task: Run `npm run build`
   - Expected: Successful build
   - Quality Gate: PASS

3. **Agent-Validate-Test** (general-purpose)
   - Task: Run `npm run test`
   - Expected: All tests passing
   - Quality Gate: PASS

**Quality Gate**: All validation agents report PASS

**Estimated Duration**: 2-5 minutes (parallel)

---

### Phase 4: Merge to Main (SEQUENTIAL)
**Strategy**: Sequential execution of git workflow

**Agent**: Single agent (general-purpose)

**Tasks**:
1. Check git status and commit if needed
2. Push branch to remote with `-u` flag
3. Create PR using `gh pr create` with:
   - Title: "refactor: modern structure with src/app organization"
   - Body: Summary of changes + test plan
4. Verify PR URL returned

**Quality Gate**: PR successfully created and URL provided

**Estimated Duration**: 1-2 minutes

---

## Phase 6: Quality Gates Summary

### Critical Quality Gates

1. **Assessment Complete**
   - ✓ All lint errors identified
   - ✓ All build errors identified
   - ✓ All test failures identified

2. **Issues Resolved**
   - ✓ Zero lint errors
   - ✓ Zero build errors
   - ✓ All tests passing
   - ✓ All files < 500 lines

3. **Validation Passed**
   - ✓ Clean lint run
   - ✓ Successful build
   - ✓ Full test suite passing

4. **PR Created**
   - ✓ Changes committed
   - ✓ Branch pushed
   - ✓ PR created via gh CLI
   - ✓ PR URL returned

---

## Phase 7: Risk Management

### Potential Issues & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Lint/Build/Test errors overlap | High | Medium | Start with sequential resolution |
| File size violations | Low | Low | Check proactively, split if needed |
| Test environment issues | Medium | High | Ensure Playwright setup correct |
| Git/gh CLI issues | Low | Medium | Verify git config and gh auth |
| Merge conflicts | Low | High | Check main branch status first |

### Contingency Plans

**If Phase 1 fails (can't run commands)**:
- Check package.json scripts
- Verify dependencies installed
- Check Node/npm versions

**If Phase 2 fixes introduce new errors**:
- Re-run Phase 1 assessment
- Implement iterative fix-validate loop
- Consider sequential fixes instead of parallel

**If Phase 3 validation fails**:
- Return to Phase 2 with new error list
- Use loop-agent for iterative refinement

**If Phase 4 PR creation fails**:
- Check gh CLI authentication
- Verify remote repository access
- Check branch protection rules

---

## Phase 8: Success Metrics

### Planned vs Actual Tracking

**Efficiency Metrics**:
- Assessment speedup from parallelization: Target 3x
- Overall completion time: Target < 30 minutes
- Agent utilization: Target 4-6 agents max

**Quality Metrics**:
- Zero lint errors: REQUIRED
- Zero build errors: REQUIRED
- 100% test pass rate: REQUIRED
- AGENTS.md compliance: REQUIRED

**Outcome Metrics**:
- PR created: REQUIRED
- PR mergeable: REQUIRED
- No manual intervention needed: TARGET

---

## Execution Command Sequence

### Phase 1 (Parallel Launch)
```bash
# Launch 3 agents simultaneously
Agent-Lint: npx eslint src --ext .ts,.tsx
Agent-Build: npm run build
Agent-Test: npm run test
```

### Phase 2 (Adaptive)
```bash
# Based on Phase 1 results, launch fix agents
# SEQUENTIAL if errors overlap, PARALLEL if isolated
```

### Phase 3 (Parallel Validation)
```bash
# Launch 3 validation agents simultaneously
Agent-Validate-Lint: npx eslint src --ext .ts,.tsx
Agent-Validate-Build: npm run build
Agent-Validate-Test: npm run test
```

### Phase 4 (Sequential Merge)
```bash
# Single agent sequential execution
git status
git add .
git commit -m "..."
git push -u origin refactor/modern-structure
gh pr create --title "..." --body "..."
```

---

## Summary

This GOAP plan uses **Hybrid Execution Strategy** to efficiently assess, fix, validate, and merge the refactored codebase to main. By leveraging parallel execution in assessment and validation phases while maintaining sequential control in resolution and merge phases, we optimize for both speed and correctness.

**Total Estimated Duration**: 10-27 minutes
**Agent Count**: 4-6 agents
**Quality Gates**: 4 critical checkpoints
**Success Probability**: High (assuming no major architectural issues)
