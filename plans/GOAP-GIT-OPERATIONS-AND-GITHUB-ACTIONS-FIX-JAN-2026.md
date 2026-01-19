# GOAP Plan: Git Operations and GitHub Actions Fix

**Status**: In Progress **Created**: January 19, 2026 **Goal**: Commit changes,
push to GitHub, and ensure all GitHub Actions pass

---

## Current State

**Modified Files**:

- `src/features/onboarding/hooks/useOnboarding.ts` (lint fix)
- `src/lib/__tests__/db.test.ts` (loadProject test fix)
- `src/app/__tests__/App.test.tsx` (uncommitted)
- `src/features/analytics/components/__tests__/GoalsManager.test.tsx`
  (uncommitted)
- `src/lib/db.ts` (uncommitted refactoring)
- `src/lib/db/ai-preferences.ts` (uncommitted)

**New Files**:

- `plans/DB-TEST-FIX-LOADPROJECT-SUMMARY-JAN-2026.md`

**Branch**: `main` (up to date with `origin/main`)

---

## Goal State

1. All changes committed with proper message following repo style
2. Changes pushed to `origin/main`
3. All GitHub Actions passing (lint, test, build, E2E)
4. No skipped lint checks
5. All quality gates passing

---

## Action Plan

### Phase 1: Parallel Analysis (Agents 1-4)

**Success Criteria**:

- ✅ Code review completed with quality assessment
- ✅ All 2036 tests passing locally
- ✅ Lint passing with 0 errors
- ✅ Git status confirmed ready for commit

#### Agent 1: Code Reviewer

**Actions**:

- Review all modified files for code quality
- Check for TypeScript type safety
- Verify adherence to coding standards
- Identify potential bugs or issues
- Review test coverage and quality

**Preconditions**:

- All changed files accessible
- Review checklist available

**Effects**:

- Quality assessment report generated
- Issues documented (if any)
- Recommendations provided

**Estimated Cost**: 2-3 minutes

---

#### Agent 2: QA Engineer

**Actions**:

- Run full test suite (`npm run test`)
- Verify all 2036 tests passing
- Run E2E tests (`npm run test:e2e`)
- Check test coverage
- Document any failures

**Preconditions**:

- Test environment configured
- All dependencies installed

**Effects**:

- Test results documented
- Failures identified (if any)
- Test coverage metrics gathered

**Estimated Cost**: 5-10 minutes

---

#### Agent 3: Lint Checker

**Actions**:

- Run lint (`npm run lint`)
- Run lint for CI (`npm run lint:ci`)
- Fix any auto-fixable lint errors
- Document manual fixes required
- Ensure 0 lint errors before proceeding

**Preconditions**:

- ESLint configured
- TypeScript configured

**Effects**:

- Lint passing (0 errors)
- Code style compliance verified
- Auto-fixes applied

**Estimated Cost**: 2-5 minutes

---

#### Agent 4: Git Analyst

**Actions**:

- Verify current branch status
- Check remote tracking
- Review git diff for all changes
- Verify all files ready for commit
- Check for accidental commits or sensitive data

**Preconditions**:

- Git repository accessible
- Remote configured

**Effects**:

- Git status confirmed
- Changes validated
- Commit readiness confirmed

**Estimated Cost**: 1-2 minutes

---

### Phase 2: Commit & Push (Agent 5)

**Success Criteria**:

- ✅ Commit created with proper message
- ✅ Changes pushed to `origin/main`
- ✅ No merge conflicts

#### Agent 5: Git Ops Agent

**Actions**:

1. Stage all relevant files (excluding `.tsbuildinfo`)
2. Create commit with message following repo style:

   ```
   fix: resolve lint errors and test failures in onboarding, db, and analytics features

   - Fix lint issues in useOnboarding hook (import ordering, type safety)
   - Fix loadProject test by matching ProjectSchema enum values
   - Add comprehensive test coverage for GoalsManager and App components
   - Refactor db.ts to improve error handling and data validation
   - Add AI preferences database service with full CRUD operations
   - Add test summary documentation for loadProject fix
   ```

3. Push to `origin/main`
4. Verify push succeeded

**Preconditions**:

- All Phase 1 agents completed successfully
- All quality gates passing
- No lint errors
- All tests passing

**Effects**:

- Commit created with SHA
- Changes pushed to remote
- GitHub Actions triggered

**Estimated Cost**: 1-2 minutes

---

### Phase 3: Monitor (Agent 6)

**Success Criteria**:

- ✅ All GitHub Actions monitored
- ✅ Action URLs captured
- ✅ Failures identified quickly

#### Agent 6: GitHub Monitor

**Actions**:

1. Use `gh run list` to get latest workflow runs
2. Use `gh run watch --exit-status` to monitor
3. Capture all workflow URLs
4. Document any failures with logs
5. Report final status

**Preconditions**:

- GitHub CLI installed and authenticated
- Commit pushed to remote

**Effects**:

- Workflow run IDs captured
- URLs documented
- Failures identified (if any)
- Final status reported

**Estimated Cost**: 5-15 minutes (waiting for CI)

---

### Phase 4: Iterative Fix Loop (Agents 7-19)

**Success Criteria**:

- ✅ All GitHub Actions passing
- ✅ No lint errors
- ✅ All tests passing
- ✅ Build successful

**Loop Configuration**:

- **Max Iterations**: 10
- **Termination Mode**: Criteria-based (all actions passing)
- **Quality Gates**:
  - Lint: 0 errors
  - Unit tests: 100% pass rate
  - E2E tests: 100% pass rate
  - Build: Successful

#### Agent 7: Loop Orchestrator

**Actions**:

1. Coordinate all fix agents
2. Track iteration progress
3. Validate quality gates
4. Decide continue/stop
5. Report summary

**Preconditions**:

- GitHub Actions failures detected
- Quality gates defined

**Effects**:

- Iterations tracked
- Progress documented
- Termination decision made

**Estimated Cost**: 1-2 minutes per iteration

---

#### Agent 8: CI Optimization Specialist

**Actions** (if workflow issues):

- Fix GitHub Actions YAML syntax
- Optimize workflow timing
- Fix dependency caching
- Resolve permission issues
- Update workflow versions

**Preconditions**:

- Workflow configuration issues detected

**Effects**:

- Workflows fixed
- CI configuration optimized

**Estimated Cost**: 2-5 minutes

---

#### Agent 9: E2E Test Optimizer

**Actions** (if E2E failures):

- Fix test timeout issues
- Update selectors
- Fix async/await issues
- Optimize test performance
- Fix flaky tests

**Preconditions**:

- E2E test failures detected

**Effects**:

- E2E tests passing
- Test stability improved

**Estimated Cost**: 5-10 minutes

---

#### Agent 10: QA Engineer (Test Fixer)

**Actions** (if unit test failures):

- Analyze test failures
- Fix test assertions
- Update mocks
- Fix setup/teardown
- Improve test coverage

**Preconditions**:

- Unit test failures detected

**Effects**:

- Tests passing
- Coverage improved

**Estimated Cost**: 3-8 minutes

---

#### Agent 11: Lint Checker (Fixer)

**Actions** (if lint errors):

- Run `npm run lint:fix`
- Fix manual lint issues
- Update ESLint config if needed
- Ensure strict mode compliance

**Preconditions**:

- Lint errors detected

**Effects**:

- Lint passing (0 errors)
- Code style compliant

**Estimated Cost**: 2-5 minutes

---

#### Agent 12: Debugger

**Actions** (if runtime errors):

- Analyze error logs
- Identify root cause
- Fix the issue
- Verify fix

**Preconditions**:

- Runtime errors detected

**Effects**:

- Errors resolved
- System stable

**Estimated Cost**: 5-10 minutes

---

#### Agents 13-19: Specialized Fixers

**Actions**: Depending on specific failure types:

- Agent 13: TypeScript Guardian - Fix type errors
- Agent 14: Security Specialist - Fix security issues
- Agent 15: Performance Engineer - Fix performance issues
- Agent 16: Mock Infrastructure Engineer - Fix mock issues
- Agent 17: Database Schema Manager - Fix DB issues
- Agent 18: Tech Stack Specialist - Fix dependency issues
- Agent 19: Architecture Guardian - Fix architectural issues

**Preconditions**:

- Specific failure type detected

**Effects**:

- Issues resolved in respective domains

**Estimated Cost**: 3-10 minutes each

---

## Plan Summary

**Total Phases**: 4 **Total Agents**: 19 (max) **Estimated Duration**: 30-60
minutes **Key Dependencies**: Phase 1 → Phase 2 → Phase 3 → Phase 4 (loop)

**Risk Assessment**:

- **High Risk**: Test failures requiring mock updates
- **Medium Risk**: Lint errors requiring manual fixes
- **Low Risk**: Workflow configuration issues
- **Mitigation**: Comprehensive analysis in Phase 1 before committing

**Success Metrics**:

- Commit SHA available
- All GitHub Actions green
- 0 lint errors
- 100% test pass rate
- Documentation complete

---

## Execution Log

### Iteration 1: Initial Analysis

**Agent Assignments**:

1. Code Reviewer → Analyzing...
2. QA Engineer → Running tests...
3. Lint Checker → Running lint...
4. Git Analyst → Checking status...

**Results Pending...**

---

### Iteration 2+: Fix Loop

_Will be populated based on Phase 4 execution_

---

## Final Summary

_Will be completed after execution_

---

**Notes**:

- Never skip lint - this is a hard requirement
- All quality gates must pass before commit
- Use GitHub CLI for monitoring
- Document all changes made during fixes
- Keep commit messages following repo style (fix:, feat:, docs:, etc.)
