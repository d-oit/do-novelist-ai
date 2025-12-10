# GOAP Plan: Fix GitHub Actions Workflows

## Phase 1: Task Analysis

### Primary Goal

Fix all failing GitHub Actions workflows on the main branch and verify all
workflows pass successfully.

### Constraints

- **Atomic Commits**: Each fix must be a separate, meaningful commit
- **Verification Required**: Use gh CLI to verify workflow status after each fix
- **Iterative Approach**: Continue until all workflows pass
- **Quality Standards**: Must comply with AGENTS.md guidelines

### Complexity Level

**Medium to Complex** - Depends on the nature and number of failures

### Quality Requirements

- All GitHub Actions workflows must pass
- Atomic, well-documented git commits
- Code must pass linting and type checking
- Changes must not break existing functionality

## Phase 2: Task Decomposition

### Main Goal

Achieve 100% passing GitHub Actions workflows on main branch

### Sub-Goals

1. **Investigation** - Priority: P0
   - Success Criteria: Current workflow status documented
   - Dependencies: None
   - Complexity: Low

2. **Analysis** - Priority: P0
   - Success Criteria: Root causes of failures identified
   - Dependencies: Investigation complete
   - Complexity: Medium

3. **Resolution** - Priority: P0
   - Success Criteria: All issues fixed with atomic commits
   - Dependencies: Analysis complete
   - Complexity: Medium to High

4. **Verification** - Priority: P0
   - Success Criteria: All workflows passing via gh CLI
   - Dependencies: Resolution complete
   - Complexity: Low

### Atomic Tasks

**Component 1: Investigation**

- Task 1.1: Check current workflow runs status (Agent: general-purpose, Deps:
  none)
- Task 1.2: List all workflows and their status (Agent: general-purpose, Deps:
  1.1)
- Task 1.3: Document failing workflows (Agent: general-purpose, Deps: 1.2)

**Component 2: Analysis**

- Task 2.1: Retrieve logs for each failing workflow (Agent: debugger, Deps: 1.3)
- Task 2.2: Identify root cause for each failure (Agent: debugger, Deps: 2.1)
- Task 2.3: Prioritize fixes by dependency order (Agent: general-purpose, Deps:
  2.2)

**Component 3: Resolution (Iterative)**

- Task 3.1: Fix issue #1 (Agent: refactorer, Deps: 2.3)
- Task 3.2: Create atomic commit for fix #1 (Agent: general-purpose, Deps: 3.1)
- Task 3.3: Repeat for each issue (Agent: loop-agent, Deps: 3.2)

**Component 4: Verification**

- Task 4.1: Check workflow status after fixes (Agent: general-purpose, Deps:
  3.3)
- Task 4.2: If failures remain, return to analysis (Agent: loop-agent, Deps:
  4.1)
- Task 4.3: Confirm all workflows pass (Agent: general-purpose, Deps: 4.2)

### Dependency Graph

```
Task 1.1 (Check status) → Task 1.2 (List workflows) → Task 1.3 (Document failures)
                                                            ↓
Task 2.1 (Get logs) → Task 2.2 (Identify root cause) → Task 2.3 (Prioritize)
                                                            ↓
Task 3.1 (Fix) → Task 3.2 (Commit) ← ─ ─ ─ ─ ─ ─ ─ ┐
      ↓                                              │
Task 4.1 (Verify) → Task 4.2 (Check if done) ─ ─ ─ ┘ (loop if failures remain)
      ↓
Task 4.3 (Final confirmation)
```

## Phase 3: Strategy Selection

### Selected Strategy: **ITERATIVE with SEQUENTIAL execution**

**Rationale**:

- **Iterative**: Must continue fixing until all workflows pass (convergence
  criteria)
- **Sequential**: Dependencies between investigation → analysis → fix → verify
- **Not Parallel**: Each fix may affect subsequent workflow runs
- **Not Swarm**: Fixes may be diverse, not similar tasks

### Convergence Criteria

✓ All GitHub Actions workflows report "success" status via gh CLI ✓ No pending
or failing workflow runs

### Iteration Limit

Maximum 10 iterations (safety limit to prevent infinite loops)

## Phase 4: Agent Assignment

### Agent Capability Matching

| Task Component    | Agent Type      | Rationale                               |
| ----------------- | --------------- | --------------------------------------- |
| Investigation     | general-purpose | gh CLI commands, status checking        |
| Analysis          | debugger        | Log analysis, root cause identification |
| Resolution        | refactorer      | Code fixes, linting, type checking      |
| Iteration Control | loop-agent      | Manages iterative refinement cycle      |
| Verification      | general-purpose | gh CLI verification commands            |

### Primary Agent: loop-agent

The loop-agent will orchestrate the entire iterative workflow, spawning
specialized agents as needed.

## Phase 5: Execution Plan

### Overview

- **Strategy**: Iterative Sequential
- **Total Phases**: 4 (Investigation, Analysis, Resolution, Verification)
- **Estimated Iterations**: 1-5 (depends on number of failures)
- **Quality Gates**: 4 checkpoints

### Iteration Loop Structure

```
ITERATION N:
  Phase 1: Investigation
    → Check workflow status
    → Quality Gate: Status retrieved successfully

  Phase 2: Analysis
    → Analyze failures (if any)
    → Quality Gate: Root causes identified OR no failures found

  Phase 3: Resolution
    → Fix each issue atomically
    → Quality Gate: All fixes committed

  Phase 4: Verification
    → Check workflow status again
    → Quality Gate: Workflows passing OR issues documented for next iteration

  CONVERGENCE CHECK:
    If all workflows pass → EXIT SUCCESS
    If failures remain → NEXT ITERATION
    If iteration limit reached → EXIT WITH REPORT
```

### Detailed Phase Breakdown

#### Phase 1: Investigation

**Tasks**:

- Task 1: Run `gh run list --branch main --limit 10` to see recent runs
- Task 2: Run `gh workflow list` to see all workflows
- Task 3: Identify any failing workflow runs

**Quality Gate**:

- [ ] Current workflow status documented
- [ ] Failing workflows identified (or confirmed none)

**Tools**: Bash (gh CLI)

#### Phase 2: Analysis

**Tasks**:

- Task 1: For each failing run, execute `gh run view <run-id>`
- Task 2: Analyze error logs to identify root causes
- Task 3: Categorize failures (build, test, lint, type errors, etc.)

**Quality Gate**:

- [ ] Root cause identified for each failure
- [ ] Fix strategy determined for each issue

**Tools**: Bash (gh CLI), Read (code inspection)

#### Phase 3: Resolution

**Tasks**:

- Task 1: Fix issue #1 (code changes)
- Task 2: Verify fix locally (lint, test, build)
- Task 3: Create atomic commit with descriptive message
- Task 4: Repeat for each issue

**Quality Gate**:

- [ ] All identified issues fixed
- [ ] Each fix has atomic commit
- [ ] Local verification passes

**Tools**: Read, Edit, Bash (npm run lint, npm run test, git)

#### Phase 4: Verification

**Tasks**:

- Task 1: Wait for workflow runs to complete (or trigger manually if needed)
- Task 2: Check status with `gh run list --branch main --limit 5`
- Task 3: Verify all workflows show "completed" with "success" status

**Quality Gate**:

- [ ] All workflows completed
- [ ] All workflows show success status
- [ ] OR new failures documented for next iteration

**Tools**: Bash (gh CLI)

### Overall Success Criteria

- [ ] All GitHub Actions workflows passing
- [ ] No failing or pending workflow runs
- [ ] All fixes committed atomically
- [ ] Final verification confirms success

### Contingency Plans

- **If workflow doesn't trigger automatically**: Manually trigger with
  `gh workflow run <workflow-name>`
- **If fix introduces new failures**: Revert commit, re-analyze, apply corrected
  fix
- **If iteration limit reached**: Document remaining issues and report to user
- **If workflow takes too long**: Continue with next fix, verify later

## Phase 6: Coordinated Execution

### Execution Command

Launch loop-agent with the following task:

```
Task: Fix all failing GitHub Actions workflows on main branch

Instructions:
1. Check current workflow status using gh CLI
2. If failures exist, analyze logs and identify root causes
3. Fix each issue with atomic commits
4. Verify workflows pass with gh CLI
5. Repeat until all workflows pass or max 10 iterations

Convergence: All workflows show "success" status
Max Iterations: 10
```

### Monitoring

- Track iteration count
- Log each fix and commit
- Monitor workflow status after each fix
- Report progress to user

## Phase 7: Expected Result Synthesis

### Success Output Format

```markdown
## GitHub Actions Fix Summary

### Initial Status

- Total Workflows: [N]
- Failing Workflows: [N]
- Issues Identified: [List]

### Fixes Applied

1. Fix #1: [Description]
   - Commit: [hash] - [message]
   - Files Changed: [list]

2. Fix #2: [Description]
   - Commit: [hash] - [message]
   - Files Changed: [list]

### Final Status

✅ All [N] workflows passing

- Total Iterations: [N]
- Total Commits: [N]
- Total Files Modified: [N]

### Verification
```

gh run list --branch main --limit 5 [Output showing all success]

```

### Quality Metrics
- ✅ Atomic commits: Yes
- ✅ Local tests passed: Yes
- ✅ Lint/type check: Passed
- ✅ All workflows passing: Yes
```

## Error Handling

### Common Failure Scenarios

1. **Workflow timeout**
   - Recovery: Wait and re-check, or proceed with other fixes

2. **Fix introduces new failure**
   - Recovery: Revert commit, re-analyze, apply corrected fix

3. **Dependency conflicts**
   - Recovery: Update dependencies, verify compatibility

4. **Test failures**
   - Recovery: Fix tests or fix code causing test failures

5. **Lint/type errors**
   - Recovery: Apply lint fixes, add type annotations

## Execution Start

Ready to execute this GOAP plan using loop-agent orchestration.

**Next Step**: Launch loop-agent with iterative refinement workflow
