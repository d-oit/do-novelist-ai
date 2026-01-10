# GOAP Execution Plan: Build-Lint-Test-Fix-PR

**Date**: 2026-01-10 **Strategy**: Hybrid (Parallel Discovery → Sequential
Analysis → Hybrid Fixing → Sequential Validation → PR)

## Task Analysis

**Primary Goal**: Build, lint, and test the project; fix all issues with proper
implementations; create PR

**Constraints**:

- Time: Normal priority
- Resources: 1-9 agents available
- Dependencies: Fixes may have dependencies on each other
- MUST implement functionality (never skip/remove lint rules)

**Complexity Level**: Complex (multiple agents, mixed execution modes, quality
gates)

**Quality Requirements**:

- Build: Must complete without errors
- Lint: All ESLint + TypeScript errors fixed with proper implementations
- Tests: All unit tests and E2E tests passing
- Standards: AGENTS.md compliance
- Documentation: Update if needed

## Task Decomposition

### Phase 1: Discovery (PARALLEL)

**Objective**: Identify all build, lint, and test issues

**Tasks**:

1. **Task 1.1**: Run build and capture errors
   - Agent: Bash specialist
   - Command: `npm run build`
   - Success: Build output captured
   - Dependencies: None

2. **Task 1.2**: Run lint and capture errors
   - Agent: Bash specialist
   - Command: `npm run lint`
   - Success: Lint output captured
   - Dependencies: None

3. **Task 1.3**: Run tests and capture failures
   - Agent: test-runner
   - Command: `npm run test`
   - Success: Test results captured
   - Dependencies: None

**Quality Gate**: All three tasks complete, issues identified and categorized

### Phase 2: Analysis (SEQUENTIAL)

**Objective**: Analyze and categorize all issues

**Tasks**:

1. **Task 2.1**: Analyze all errors/failures
   - Agent: Orchestrator (goap-agent)
   - Action: Review outputs from Phase 1
   - Success: Issues categorized by type and priority
   - Dependencies: Phase 1 complete

2. **Task 2.2**: Create fix strategy
   - Agent: Orchestrator
   - Action: Determine which fixes can be parallel vs sequential
   - Success: Fix plan with agent assignments
   - Dependencies: Task 2.1

**Quality Gate**: Fix strategy defined with clear agent assignments

### Phase 3: Fix Issues (HYBRID)

**Objective**: Fix all issues with proper implementations

**Execution Pattern**:

- Independent issues → Parallel
- Dependent issues → Sequential
- Similar issues → Swarm

**Agent Pool**:

- refactorer agents (for code quality issues)
- feature-implementer agents (for missing functionality)
- debugger agents (for runtime issues)
- code-reviewer (for validation)

**Quality Gate**: All fixes implemented, no placeholders or skips

### Phase 4: Validation (SEQUENTIAL + ITERATIVE)

**Objective**: Verify all issues resolved

**Tasks**:

1. **Task 4.1**: Re-run build
   - Agent: Bash
   - Command: `npm run build`
   - Success: Build completes without errors
   - If fail: Loop back to Phase 3

2. **Task 4.2**: Re-run lint
   - Agent: Bash
   - Command: `npm run lint`
   - Success: No lint errors
   - If fail: Loop back to Phase 3

3. **Task 4.3**: Re-run tests
   - Agent: test-runner
   - Command: `npm run test`
   - Success: All tests pass
   - If fail: Loop back to Phase 3

**Quality Gate**: All validation passes (build + lint + test)

### Phase 5: PR Creation (SEQUENTIAL)

**Objective**: Create PR with all fixes

**Tasks**:

1. **Task 5.1**: Review changes
   - Agent: code-reviewer
   - Action: Final review of all changes
   - Success: Changes approved

2. **Task 5.2**: Create commit
   - Agent: Orchestrator
   - Action: Git commit with descriptive message
   - Success: Commit created

3. **Task 5.3**: Create PR
   - Agent: Orchestrator
   - Action: Push and create PR using gh CLI
   - Success: PR created and URL returned

**Quality Gate**: PR created successfully

## Dependency Graph

```
Phase 1 (Parallel):
├─ Task 1.1 (Build) ─┐
├─ Task 1.2 (Lint) ──┼─→ Phase 2 (Analysis)
└─ Task 1.3 (Test) ─┘
                     ↓
              Task 2.1 (Analyze)
                     ↓
              Task 2.2 (Strategy)
                     ↓
Phase 3 (Hybrid):
├─ Fix Group A (Parallel) ─┐
├─ Fix Group B (Parallel) ─┼─→ Phase 4 (Validation)
└─ Fix Group C (Sequential)┘
                     ↓
              Task 4.1 (Build) ──→ Pass? ─┐
                     ↓                     │
              Task 4.2 (Lint) ───→ Pass? ─┤
                     ↓                     │ Fail? → Loop to Phase 3
              Task 4.3 (Test) ───→ Pass? ─┘
                     ↓ All Pass
              Phase 5 (PR)
```

## Agent Assignments

**Phase 1**: 3 agents (parallel)

- Agent A: Build runner
- Agent B: Lint runner
- Agent C: Test runner

**Phase 2**: 1 agent (orchestrator)

- Orchestrator: Analysis and strategy

**Phase 3**: 3-6 agents (hybrid based on issues found)

- Pool of refactorer, feature-implementer, debugger agents

**Phase 4**: 2 agents (sequential)

- Agent: Validation runner
- Agent: Results analyzer

**Phase 5**: 1 agent (sequential)

- Orchestrator: PR creation

**Total Agents**: 7-10 (peak concurrency: 6)

## Execution Strategy Rationale

1. **Phase 1 - Parallel**: Build, lint, test are independent operations
2. **Phase 2 - Sequential**: Need complete picture before planning fixes
3. **Phase 3 - Hybrid**: Some fixes independent (parallel), others dependent
   (sequential)
4. **Phase 4 - Sequential + Iterative**: Must validate in order, loop if
   failures
5. **Phase 5 - Sequential**: Final steps must be ordered

## Success Criteria

- [ ] Build completes without errors
- [ ] Lint passes with no errors
- [ ] All tests pass (unit + E2E)
- [ ] All fixes use proper implementations (no skips/removals)
- [ ] AGENTS.md compliance
- [ ] PR created with descriptive summary

## Contingency Plans

**If Phase 1 discovers too many issues**:

- Prioritize by severity (P0: blocks build, P1: blocks tests, P2: quality)
- Fix in priority order

**If Phase 3 fixes cause new issues**:

- Phase 4 will catch them
- Loop back to Phase 3 with new fix strategy

**If Phase 4 validation fails after multiple iterations**:

- Escalate specific failures
- Get user input on approach
- May need to break into smaller PRs

## Monitoring

- Track agent progress in real-time
- Log all errors/failures
- Measure iteration count in Phase 4
- Report final metrics (issues found, fixes applied, iterations needed)

---

## Execution Log

### Phase 1: Discovery - COMPLETED ✓

**Build Results**: ✗ FAILED (15 TypeScript errors) **Lint Results**: ✓ PASSED
(no issues) **Test Results**: ✗ FAILED (5 test failures)

#### Build Errors Identified (15 total)

**File: src/features/world-building/services/worldBuildingDb.ts** (7 errors)

- Missing method: `updateProject` on WorldBuildingService
- Missing method: `getLoreEntriesByProjectId` (should be `getLoreByProjectId`)
- Type mismatches and undefined handling
- Property `worldBuildingProjectId` doesn't exist (lines 69, 97)

**File: src/features/world-building/services/worldBuildingService.ts** (4
errors)

- Missing method: `getLocation` on WorldBuildingDatabase
- Missing method: `getCulture` on WorldBuildingDatabase

**File:
src/features/writing-assistant/components/WritingAnalyticsDashboard.tsx** (2
errors)

- Argument count mismatch (line 193)
- Promise type mismatch with SetStateAction (line 194)

**File: src/features/writing-assistant/hooks/useWritingAssistant.ts** (2 errors)

- **CRITICAL**: `await` used outside async function (line 140)
- Argument count mismatch (line 478)
- Type mismatch Promise vs non-Promise (line 554)

**File: src/lib/database/migration-utility.ts** (2 errors)

- Missing `name` and `description` properties (lines 99, 101)

#### Test Failures Identified (5 total)

**File: useWritingAssistant.test.ts** (1 failure)

- Transform error: `await` outside async function at line 140 (SAME AS BUILD
  ERROR)

**File: writingAssistantDb.test.ts** (4 failures)

- Device ID generation timeout (10000ms exceeded)
- Device ID generation returns null
- Analysis record ID logger mock not called
- Feedback ID logger mock not called
- ID uniqueness test - empty array instead of 3 IDs

### Phase 2: Analysis - COMPLETED ✓

#### Issue Categorization

**Priority P0 (Blocks Build + Tests):**

1. Fix async/await issue in useWritingAssistant.ts line 140

**Priority P1 (Blocks Build):** 2. Fix world-building API contract mismatches
(missing methods) 3. Fix WritingAnalyticsDashboard type issues 4. Fix
migration-utility missing properties

**Priority P2 (Blocks Tests):** 5. Fix writingAssistantDb test mock issues 6.
Fix ID generation returning null

#### Fix Strategy

**Group A (Sequential - MUST FIX FIRST):**

- Issue 1: async/await in useWritingAssistant.ts
- Agent: refactorer
- Reason: Blocks both build and tests

**Group B (Parallel - After Group A):**

- Issue 2: World-building service API contracts
  - Agent B1: feature-implementer (worldBuildingDb.ts)
  - Agent B2: feature-implementer (worldBuildingService.ts)
- Issue 3: WritingAnalyticsDashboard types
  - Agent B3: refactorer
- Issue 4: Migration utility properties
  - Agent B4: refactorer

**Group C (Sequential - After Group B):**

- Issue 5 & 6: Test mocks and ID generation
  - Agent: debugger
  - Reason: Need code fixes complete first to understand test issues

#### Agent Assignment Plan

**Phase 3.1 (Sequential):**

- Agent A: refactorer → Fix async/await issue (P0)

**Phase 3.2 (Parallel - 4 agents):**

- Agent B1: feature-implementer → World-building DB methods
- Agent B2: feature-implementer → World-building Service methods
- Agent B3: refactorer → WritingAnalyticsDashboard types
- Agent B4: refactorer → Migration utility properties

**Phase 3.3 (Sequential):**

- Agent C: debugger → Fix test mocks and ID generation

**Total Agents for Phase 3:** 6 agents (1 sequential, 4 parallel, 1 sequential)

---

### Phase 3: Fix Issues - STARTING...
