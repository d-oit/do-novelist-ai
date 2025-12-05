# GOAP Plan: Fix CI E2E Test Timeout

## Phase 1: Task Analysis

### Primary Goal

Fix GitHub Actions CI timeout (60 minutes exceeded) for E2E test suite while
maintaining test coverage and reliability.

### Constraints

- Time: **Urgent** - CI is blocking deployments
- Resources: 7 specialized agents, playwright-skill available
- Dependencies: Existing 55 E2E tests (1817 LOC), must maintain coverage
- Standards: AGENTS.md compliance, UI/UX best practices from codebase analysis

### Complexity Level

**Complex** - Requires 4+ agents with hybrid execution (parallel investigation +
sequential validation)

### Quality Requirements

- Testing: All 55 E2E tests must pass
- Performance: Complete within 30 minutes (50% margin for CI variability)
- Standards: AGENTS.md compliance, accessibility, error handling patterns
- Monitoring: Test execution metrics and bottleneck identification

### Root Cause Analysis (Completed)

- **Issue**: E2E test suite exceeds 60-minute GitHub Actions timeout
- **Impact**: CI fails, blocks merges and deployments
- **Tests**: 55 test cases across 8 spec files (1817 LOC)
- **Current config**: 60s per test timeout, 60min global timeout, 2 workers in
  CI

## Phase 2: Task Decomposition

### Main Goal

Optimize E2E test execution to complete within 30 minutes while maintaining 100%
test coverage.

### Sub-Goals

#### 1. Identify Performance Bottlenecks (Priority: P0)

- Success Criteria: Bottlenecks identified with execution time data
- Dependencies: None
- Complexity: Medium

#### 2. Optimize Test Execution Strategy (Priority: P0)

- Success Criteria: Tests complete within 30 minutes
- Dependencies: Sub-goal 1
- Complexity: High

#### 3. Implement Test Sharding/Parallelization (Priority: P1)

- Success Criteria: CI workflow splits tests efficiently
- Dependencies: Sub-goal 2
- Complexity: High

#### 4. Optimize Individual Test Performance (Priority: P1)

- Success Criteria: Slow tests refactored to use best practices
- Dependencies: Sub-goal 1, 2
- Complexity: Medium

#### 5. Validate Full Test Suite (Priority: P0)

- Success Criteria: All 55 tests pass locally and in CI
- Dependencies: Sub-goals 2, 3, 4
- Complexity: Medium

#### 6. Add Performance Monitoring (Priority: P2)

- Success Criteria: Test execution metrics tracked
- Dependencies: Sub-goal 5
- Complexity: Low

### Atomic Tasks

**Component 1: Performance Analysis**

- Task 1.1: Run full E2E suite locally with timing metrics (Agent:
  playwright-skill, Deps: none)
- Task 1.2: Analyze test execution patterns for bottlenecks (Agent:
  performance-engineer, Deps: 1.1)
- Task 1.3: Profile slow tests and identify optimization opportunities (Agent:
  codebase-analyzer, Deps: 1.2)

**Component 2: Optimization Strategy**

- Task 2.1: Design test sharding strategy for CI (Agent: Plan, Deps: 1.2, 1.3)
- Task 2.2: Optimize Playwright config for CI performance (Agent: refactorer,
  Deps: 2.1)
- Task 2.3: Update GitHub Actions workflow with sharding (Agent: refactorer,
  Deps: 2.1, 2.2)

**Component 3: Test Optimization**

- Task 3.1: Refactor slow tests using UI/UX best practices (Agent: refactorer,
  Deps: 1.3)
- Task 3.2: Optimize mock setup and teardown (Agent: refactorer, Deps: 1.3)
- Task 3.3: Remove redundant waits and improve selectors (Agent: refactorer,
  Deps: 3.1)

**Component 4: Validation**

- Task 4.1: Run full test suite locally (Agent: playwright-skill, Deps: 2.2,
  2.3, 3.1, 3.2, 3.3)
- Task 4.2: Validate CI workflow with test run (Agent: test-runner, Deps: 4.1)
- Task 4.3: Verify test execution time meets target (Agent:
  performance-engineer, Deps: 4.2)

**Component 5: Monitoring & Documentation**

- Task 5.1: Add test execution time reporting (Agent: feature-implementer, Deps:
  4.3)
- Task 5.2: Document optimization decisions (Agent: technical-writer, Deps: 4.3)
- Task 5.3: Create performance baseline for future monitoring (Agent:
  performance-engineer, Deps: 5.1)

### Dependency Graph

```
Task 1.1 → Task 1.2 → Task 1.3
              ↓          ↓
           Task 2.1 ─────┘
              ↓
    ┌─────────┼─────────┐
    ↓         ↓         ↓
Task 2.2  Task 2.3  Task 3.1 → Task 3.3
    ↓         ↓         ↓
    └─────────┼─────────┤
              ↓         ↓
           Task 3.2 ────┘
              ↓
           Task 4.1 → Task 4.2 → Task 4.3
                                    ↓
                      ┌─────────────┼─────────────┐
                      ↓             ↓             ↓
                  Task 5.1      Task 5.2      Task 5.3
```

## Phase 3: Strategy Selection

### Chosen Strategy: **Hybrid Execution**

**Rationale**:

- Phase 1 (Analysis): Sequential (1.1 → 1.2 → 1.3) - Data flows between tasks
- Phase 2 (Design): Sequential (depends on analysis results)
- Phase 3 (Implementation): Parallel (2.2, 2.3, 3.1 are independent)
- Phase 4 (Refinement): Sequential (3.2, 3.3 depend on 3.1 results)
- Phase 5 (Validation): Sequential (must validate in order)
- Phase 6 (Monitoring): Parallel (5.1, 5.2, 5.3 are independent)

**Expected Performance**:

- Sequential phases: 100% reliable, clear failure points
- Parallel phases: 3x speedup for implementation
- Overall: 2x faster than pure sequential

## Phase 4: Agent Assignment

### Agent Capability Matrix

| Agent                | Role                      | Tasks                   |
| -------------------- | ------------------------- | ----------------------- |
| playwright-skill     | Test execution expert     | 1.1, 4.1                |
| performance-engineer | Performance analysis      | 1.2, 1.3, 4.3, 5.3      |
| codebase-analyzer    | Pattern analysis          | 1.3 (support)           |
| Plan                 | Strategy design           | 2.1                     |
| refactorer           | Code optimization         | 2.2, 2.3, 3.1, 3.2, 3.3 |
| test-runner          | CI validation             | 4.2                     |
| feature-implementer  | Monitoring implementation | 5.1                     |
| technical-writer     | Documentation             | 5.2                     |

### Workload Balance

- Heavy load: refactorer (5 tasks) - spread across parallel phases
- Medium load: playwright-skill (2 tasks), performance-engineer (4 tasks)
- Light load: All others (1-2 tasks)

## Phase 5: Execution Plan

### Overview

- Strategy: Hybrid (Sequential + Parallel phases)
- Total Tasks: 15 atomic tasks
- Estimated Duration: 45-60 minutes (with parallel optimization)
- Quality Gates: 6 checkpoints

---

### Phase 1: Performance Analysis (Sequential)

**Duration**: ~15 minutes

**Tasks**:

1. Task 1.1: Run E2E suite with detailed timing (Agent: playwright-skill)
   - Execute: `npx playwright test --reporter=html,json`
   - Capture: Individual test times, bottlenecks, failures

2. Task 1.2: Analyze execution patterns (Agent: performance-engineer)
   - Identify: Slowest tests, wait patterns, setup/teardown overhead
   - Output: Performance analysis report

3. Task 1.3: Profile optimization opportunities (Agent: performance-engineer +
   codebase-analyzer)
   - Compare: Current patterns vs UI/UX best practices
   - Output: Prioritized optimization list

**Quality Gate 1**:

- ✅ Test execution metrics collected
- ✅ Bottlenecks identified (top 10 slow tests)
- ✅ Optimization opportunities prioritized

---

### Phase 2: Strategy Design (Sequential)

**Duration**: ~10 minutes

**Tasks**:

1. Task 2.1: Design test sharding strategy (Agent: Plan)
   - Input: Performance analysis from Phase 1
   - Design: Optimal sharding (by spec file, by test count, by execution time)
   - Output: Sharding plan with expected CI time

**Quality Gate 2**:

- ✅ Sharding strategy documented
- ✅ Expected CI time < 30 minutes
- ✅ No cross-shard dependencies

---

### Phase 3: Parallel Implementation

**Duration**: ~15 minutes (3 agents in parallel)

**Tasks** (Parallel):

1. Task 2.2: Optimize Playwright config (Agent: refactorer)
   - Adjust: Workers, timeouts, retries for CI
   - Optimize: Web server startup, test isolation

2. Task 2.3: Update GitHub Actions workflow (Agent: refactorer)
   - Implement: Test sharding matrix
   - Configure: Parallel jobs, artifact aggregation

3. Task 3.1: Refactor slow tests (Agent: refactorer)
   - Apply: UI/UX best practices from analysis
   - Optimize: Selectors, waits, assertions

**Quality Gate 3**:

- ✅ Playwright config optimized for CI
- ✅ GitHub Actions workflow supports sharding
- ✅ Slow tests refactored with best practices

---

### Phase 4: Sequential Refinement

**Duration**: ~10 minutes

**Tasks**:

1. Task 3.2: Optimize mock setup (Agent: refactorer)
   - Streamline: Mock initialization in beforeEach
   - Remove: Redundant route handlers

2. Task 3.3: Improve selectors and waits (Agent: refactorer)
   - Replace: Arbitrary waits with smart expectations
   - Standardize: data-testid patterns

**Quality Gate 4**:

- ✅ Mock setup optimized
- ✅ No arbitrary `waitForTimeout` remaining
- ✅ All selectors follow best practices

---

### Phase 5: Validation (Sequential)

**Duration**: ~25 minutes

**Tasks**:

1. Task 4.1: Run full test suite locally (Agent: playwright-skill)
   - Execute: All 55 tests with optimizations
   - Verify: All pass, execution time < 30 minutes

2. Task 4.2: Validate CI workflow (Agent: test-runner)
   - Push: Changes to feature branch
   - Monitor: GitHub Actions execution
   - Verify: Sharding works, time < 30 minutes

3. Task 4.3: Performance verification (Agent: performance-engineer)
   - Compare: Before/after metrics
   - Validate: Target met (< 30 min), no test failures

**Quality Gate 5**:

- ✅ All 55 tests pass locally
- ✅ CI workflow completes within 30 minutes
- ✅ Performance improvement documented

---

### Phase 6: Monitoring & Documentation (Parallel)

**Duration**: ~10 minutes

**Tasks** (Parallel):

1. Task 5.1: Add execution time reporting (Agent: feature-implementer)
   - Implement: Test duration tracking in CI
   - Alert: If execution time exceeds threshold

2. Task 5.2: Document optimization decisions (Agent: technical-writer)
   - Document: Sharding strategy, config changes
   - Update: CI documentation, troubleshooting guide

3. Task 5.3: Create performance baseline (Agent: performance-engineer)
   - Establish: Target metrics for future monitoring
   - Configure: Alerts for regression

**Quality Gate 6**:

- ✅ Performance monitoring in place
- ✅ Documentation updated
- ✅ Baseline established for future runs

---

### Overall Success Criteria

- [ ] All 55 E2E tests pass
- [ ] CI execution time < 30 minutes (with 50% safety margin)
- [ ] GitHub Actions workflow uses test sharding
- [ ] Test code follows UI/UX best practices
- [ ] Performance monitoring active
- [ ] Documentation complete

### Contingency Plans

- **If Phase 1 fails** (tests don't run): Fix test infrastructure, re-run
  analysis
- **If Phase 3 parallel tasks conflict**: Sequential execution of conflicting
  tasks
- **If Phase 5 validation fails**: Return to Phase 3, apply additional
  optimizations
- **If CI still times out**: Implement more aggressive sharding (4-6 shards)

## Phase 6: Execution Monitoring

### Real-Time Tracking

- Monitor each agent's progress
- Validate quality gates before proceeding
- Adjust plan if blockers discovered

### Failure Handling

- Log all failures with context
- Retry transient failures once
- Escalate blocking issues immediately

## Phase 7: Result Synthesis

### Expected Deliverables

1. Optimized Playwright configuration
2. GitHub Actions workflow with test sharding
3. Refactored test files following best practices
4. Performance monitoring infrastructure
5. Documentation of changes and rationale
6. Performance baseline for future monitoring

### Success Metrics

- CI execution time: Target < 30 minutes (currently 60+ minutes)
- Test pass rate: 100% (55/55 tests)
- Parallel efficiency: 2-3x speedup from sharding
- Code quality: All AGENTS.md standards met

---

## Execution Status

**Status**: Ready to execute **Next Action**: Begin Phase 1 with
playwright-skill agent
