---
name: implement-plans
description: Orchestrate implementation of tasks from @plans\ folder using goap-agent skill with multi-agent coordination
version: 1.0.0
---

## Overview

This command reads all markdown files in the @plans\ folder, identifies pending tasks, and uses the **goap-agent skill** to intelligently plan and execute them through coordinated multi-agent execution with quality gates and atomic git operations.

## Execution Flow

### Phase 1: Initialize Git Branch

Create new feature branch with atomic commit strategy:

```bash
git checkout -b feature/automated-implementation-$(date +%s)
git config --local commit.gpgsign false
```

**Quality Gate:** Clean working directory, branch created successfully

---

### Phase 2: Read and Parse Plan Files

Scan @plans\ folder and parse all markdown files:

**Task Status Markers:**
- `[ ]` = pending (to be implemented)
- `[~]` = in-progress (currently working)
- `[x]` = completed (done and verified)
- `[!]` = failed (needs attention)

**Extract from each plan file:**
- Task title and description
- Priority level (High/Medium/Low)
- Dependencies (what must complete first)
- Complexity estimate (1-10)

**Output:** Structured task list with dependency graph

**Quality Gate:** All plan files parsed, dependencies validated

---

### Phase 3: Invoke goap-agent Skill for Planning

**Invoke:** `goap-agent` skill with analysis request

```markdown
## Task Analysis for goap-agent

**Primary Goal**: Implement all pending tasks from @plans\ folder with zero warnings/errors

**Constraints**:
- Time: Normal (quality over speed)
- Resources: 1-8 specialized agents available
- Dependencies: Must respect task dependencies from plan files
- Git: Atomic commits only after verification

**Complexity Level**: [Determined by task count and dependencies]

**Quality Requirements**:
- Testing: All tests must pass
- Standards: Zero lint warnings, zero errors
- Build: Must complete successfully
- Documentation: Updated after analysis-swarm approval
- Verification: analysis-swarm agent must approve before .md updates


**Special Requirements**:
- Use gemini-websearch skill when latest best practices needed
- Only update .md files after analysis-swarm (code-reviewer) approval
- Each successful task gets atomic git commit
- Handoff protocol between agents must be followed
```

**goap-agent will decompose into:**
- Atomic tasks with clear success criteria
- Dependency mapping
- Agent assignments
- Execution strategy (parallel/sequential/swarm/hybrid/iterative)
- Quality gates between phases

**Quality Gate:** GOAP plan created, validated, and ready for execution

---

### Phase 4: Execute GOAP Plan with Agent Coordination

**goap-agent orchestrates execution following the GOAP Planning Cycle:**

```
1. ANALYZE → Goal understanding complete
2. DECOMPOSE → Tasks broken into atomic units
3. STRATEGIZE → Execution pattern selected
4. COORDINATE → Agents assigned to tasks
5. EXECUTE → Run with monitoring
6. SYNTHESIZE → Validate and aggregate
```

#### Execution Strategy Selection

goap-agent chooses optimal strategy:

| Strategy | When Used | Example |
|----------|-----------|---------|
| **Sequential** | Dependent tasks, order critical | Setup → Config → Implementation |
| **Parallel** | Independent tasks, time-critical | Multiple features simultaneously |
| **Swarm** | Many similar tasks | Fixing multiple similar issues |
| **Hybrid** | Mixed requirements | Parallel features + sequential integration |
| **Iterative** | Progressive refinement | Code quality improvements until threshold |

#### Agent Handoff Protocol

**Standard handoff sequence coordinated by goap-agent:**

```yaml
1. feature-implementer → Implements code
   ↓ Handoff: Modified files
   
2. refactorer → Runs lint checks
   ↓ Handoff: Lint-clean code
   IF LINT FAILS → debugger agent fixes → return to refactorer
   
3. test-runner → Runs test suite
   ↓ Handoff: Test results
   IF TESTS FAIL → debugger agent fixes → return to test-runner
   
4. Build verification → Ensure build succeeds
   IF BUILD FAILS → debugger agent fixes → return to feature-implementer
   
5. code-reviewer (analysis-swarm role) → Comprehensive analysis
   ↓ Handoff: Approval decision
   IF ISSUES FOUND → Return to appropriate agent for fixes
   
6. ONLY AFTER APPROVAL → Update .md file + atomic commit
```

#### Quality Gates (Enforced by goap-agent)

**Quality Gate 1: Implementation Complete**
- ✓ Code written and files modified
- ✓ Changes align with task requirements
- Action: Proceed to linting

**Quality Gate 2: Lint Validation**
- ✓ Zero lint warnings
- ✓ Zero lint errors
- ✗ If fails: debugger agent fixes, retry
- Action: Proceed to testing

**Quality Gate 3: Test Validation**
- ✓ All tests pass
- ✓ No test failures or skips
- ✗ If fails: debugger agent diagnoses and fixes
- Action: Proceed to build

**Quality Gate 4: Build Verification**
- ✓ Build completes successfully
- ✓ No build errors
- ✗ If fails: debugger agent fixes, return to implementation
- Action: Proceed to analysis

**Quality Gate 5: Analysis-Swarm Approval (CRITICAL)**
- ✓ code-reviewer agent performs comprehensive analysis:
  - Code quality check
  - Integration verification
  - Side effects analysis
  - Documentation completeness
  - Test coverage validation
- ✗ If rejected: Specific agent fixes issues, re-validate
- **ONLY ON APPROVAL:** Proceed to git commit + .md update

**Quality Gate 6: Atomic Commit**
- ✓ Changes committed atomically
- ✓ Commit message follows convention
- Action: Update plan .md file

---

### Phase 5: Web Search Integration (When Needed)

**Trigger gemini-websearch skill when:**
- Task involves newer technologies (post-2024)
- Best practices may have evolved
- API documentation needed
- Framework/library updates relevant

**goap-agent determines when to invoke:**

```markdown
## Web Search Request

Query: "latest best practice {technology} {specific-task} 2025"

Examples:
- "latest best practice React hooks testing 2025"
- "latest best practice TypeScript error handling 2025"
- "latest best practice Node.js API security 2025"

Use results to inform implementation approach.
```

**Quality Gate:** Best practices gathered and validated before implementation

---

### Phase 6: Progress Update (Only After Full Verification)

**CRITICAL: Only update .md files after analysis-swarm approval**

Update sequence:
1. code-reviewer (analysis-swarm) approves changes
2. Atomic git commit executed
3. Update corresponding .md file in @plans\ folder
4. Change status marker from `[ ]` to `[x]`
5. Add completion timestamp and commit hash

**Example .md update:**

```markdown
### [x] Implement user authentication
**Priority:** High
**Status:** Completed
**Completed:** 2025-11-28 14:32 UTC
**Commit:** abc1234def
**Agent:** feature-implementer
**Verified by:** analysis-swarm

Description: Add JWT-based authentication system
```

**Quality Gate:** .md file updated, reflects accurate completion status

---

### Phase 7: Atomic Git Operations

**Commit Strategy (Managed by goap-agent):**

```bash
# After each task passes all quality gates:
git add {modified-files}
git commit -m "feat: {task-title} [agent:{primary-agent}]

Implemented by: {primary-agent}
Verified by: analysis-swarm
- Lint: ✓ passed (0 warnings, 0 errors)
- Tests: ✓ passed (all tests)
- Build: ✓ passed
- Analysis: ✓ approved

Task from: @plans\{filename}.md
Co-authored-by: goap-orchestrator"
```

**Atomic commit principles:**
- One commit per completed task
- Only after all quality gates pass
- Includes verification details
- References source plan file

**Quality Gate:** Commit successful, branch history clean

---

## Success Criteria (Zero-Tolerance)

**Overall success requires ALL of:**

✓ **Zero lint warnings**
✓ **Zero lint errors**
✓ **All tests passing**
✓ **Build successful**
✓ **analysis-swarm approval**
✓ **.md files updated only after verification**
✓ **Atomic commits for each task**
✓ **All dependencies respected**

**If ANY criterion fails:** 
- Task is NOT marked complete
- .md file is NOT updated
- debugger agent investigates and fixes
- Re-run verification from failed gate

---

## Command Usage

### Basic Usage
```bash
/implement-plans
```

This will:
1. Create new git branch
2. Read all .md files from @plans\
3. Invoke goap-agent for intelligent planning
4. Execute with coordinated multi-agent system
5. Enforce quality gates
6. Update .md files only after verification
7. Create atomic commits

### Advanced Usage

```bash
# Specify maximum agents
/implement-plans --max-agents 6

# Use custom branch name
/implement-plans --branch feature/my-implementation

# Specify plans folder
/implement-plans --plans-folder custom/plans

# Dry run (show plan without executing)
/implement-plans --dry-run

# Verbose output (show agent handoffs)
/implement-plans --verbose
```

---

## Example Plan File Format

The command expects markdown files in @plans\ with this structure:

```markdown
# Feature Implementation Plan

## Tasks

### [ ] Implement user authentication
**Priority:** High
**Dependencies:** None
**Complexity:** 8
**Estimated Time:** 3-4 hours

Description: Add JWT-based authentication system with refresh tokens.
Requires: bcrypt, jsonwebtoken packages

**Acceptance Criteria:**
- User can register with email/password
- User can login and receive JWT
- Protected routes verify token
- Refresh token mechanism works
- All tests pass

---

### [ ] Create API endpoints
**Priority:** Medium  
**Dependencies:** user-authentication
**Complexity:** 5
**Estimated Time:** 2 hours

Description: REST API endpoints for user CRUD operations

**Acceptance Criteria:**
- GET /api/users (admin only)
- GET /api/users/:id
- PUT /api/users/:id
- DELETE /api/users/:id (admin only)
- Proper error handling
- API documentation updated

---

### [x] Set up database
**Priority:** High
**Dependencies:** None
**Complexity:** 3
**Completed:** 2025-11-27 10:15 UTC
**Commit:** xyz9876abc

Description: PostgreSQL setup with migrations
```

---

## Error Handling & Recovery

**goap-agent handles errors through:**

### Lint Failures
```
Error: ESLint warnings detected
Action: 
  1. debugger agent analyzes lint output
  2. refactorer agent applies automatic fixes
  3. Re-run lint validation
  4. Retry up to 3 times
  5. If still failing: Report to user with details
```

### Test Failures
```
Error: 3 tests failing
Action:
  1. test-runner provides failure details
  2. debugger agent diagnoses root cause
  3. feature-implementer or refactorer fixes code
  4. Re-run test suite
  5. Retry up to 2 times
  6. If still failing: Detailed report to user
```

### Build Failures
```
Error: Build compilation failed
Action:
  1. debugger agent analyzes build output
  2. Identify breaking change or missing dependency
  3. feature-implementer fixes issue
  4. Retry build
  5. If persistent: Rollback and re-plan
```

### Dependency Blocks
```
Error: Task requires completion of dependent task
Action:
  1. goap-agent re-orders execution
  2. Prioritize blocking dependency
  3. Resume blocked task after dependency completes
```

### Analysis-Swarm Rejection
```
Error: code-reviewer rejects changes
Action:
  1. Review detailed rejection reasons
  2. Assign appropriate agent to fix issues
  3. Re-validate through quality gates
  4. Re-submit for analysis approval
  5. Only proceed after approval
```

---

## Output Example

```
🚀 Orchestrated Task Executor - Starting

✓ Git branch created: feature/automated-implementation-1732800000
✓ Found 3 plan files in @plans\:
  - auth.md (4 pending tasks)
  - api.md (5 pending tasks)
  - docs.md (3 pending tasks)

📋 Invoking goap-agent skill for planning...

✓ GOAP Analysis Complete:
  - Strategy: Hybrid (Sequential setup → Parallel features → Sequential integration)
  - Agents to spawn: 5
  - Estimated duration: 45-60 minutes
  - Quality gates: 6 per task

🤖 Spawning agents:
  ✓ feature-implementer-01 (ready)
  ✓ refactorer-01 (ready)
  ✓ test-runner-01 (ready)
  ✓ code-reviewer-01 [analysis-swarm] (ready)
  ✓ debugger-01 (standby)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 Task 1/12: Set up database schema
   Source: @plans\auth.md
   Strategy: Sequential
   Agent: feature-implementer-01
   
   [Step 1/6] Implementation... ✓ (2m 14s)
   [Step 2/6] Lint check... ✓ (0m 08s) - 0 warnings, 0 errors
   [Step 3/6] Test suite... ✓ (0m 45s) - 12/12 passed
   [Step 4/6] Build... ✓ (0m 32s)
   [Step 5/6] Analysis-swarm review... ✓ (0m 28s) - APPROVED
   [Step 6/6] Git commit... ✓ (0m 02s) - commit: a1b2c3d
   
   ✓ Updated: @plans\auth.md
   ✓ Status changed: [ ] → [x]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 Task 2/12: Implement user authentication
   Source: @plans\auth.md
   Strategy: Sequential (depends on Task 1)
   Agent: feature-implementer-01
   
   [Websearch] Querying: "latest JWT best practices Node.js 2025"
   ✓ Found 5 relevant sources
   
   [Step 1/6] Implementation... ✓ (3m 42s)
   [Step 2/6] Lint check... ✓ (0m 11s) - 0 warnings, 0 errors
   [Step 3/6] Test suite... ✓ (1m 03s) - 28/28 passed
   [Step 4/6] Build... ✓ (0m 38s)
   [Step 5/6] Analysis-swarm review... ✓ (0m 51s) - APPROVED
   [Step 6/6] Git commit... ✓ (0m 02s) - commit: d4e5f6g
   
   ✓ Updated: @plans\auth.md
   ✓ Status changed: [ ] → [x]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 Tasks 3-5: API endpoints (Parallel execution)
   Source: @plans\api.md
   Strategy: Parallel (independent tasks)
   Agents: feature-implementer-01, feature-implementer-02, feature-implementer-03
   
   ┌─ Task 3: GET endpoints... ✓ (2m 18s)
   ├─ Task 4: POST endpoints... ✓ (2m 31s)
   └─ Task 5: Error handling... ✓ (2m 05s)
   
   All tasks completed, running aggregated verification...
   [Lint check] ✓ 0 warnings, 0 errors
   [Test suite] ✓ 47/47 passed
   [Build] ✓ Success
   [Analysis-swarm] ✓ APPROVED - "Well structured API design"
   
   ✓ 3 atomic commits: e7f8g9h, h1i2j3k, k4l5m6n
   ✓ Updated: @plans\api.md (3 tasks)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

... [continues for all tasks] ...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ All Tasks Complete!

📊 Summary:
  - Total tasks: 12
  - Completed: 12
  - Failed: 0
  - Duration: 47m 23s
  - Commits: 12 atomic commits
  - Branch: feature/automated-implementation-1732800000

✓ Quality Metrics:
  - Lint warnings: 0
  - Lint errors: 0
  - Tests passing: 100% (127/127)
  - Build: Success
  - Analysis approvals: 12/12

📦 Deliverables:
  - Authentication system (JWT-based)
  - API endpoints (RESTful)
  - Documentation (updated)
  - Test coverage: 94%

📁 Updated Plan Files:
  - @plans\auth.md (4 tasks completed)
  - @plans\api.md (5 tasks completed)
  - @plans\docs.md (3 tasks completed)

🎯 Next Steps:
  - Review changes on branch: feature/automated-implementation-1732800000
  - Run final integration tests
  - Create pull request when ready
  - Merge to main after review

✨ Execution completed successfully!
```

---

## Integration with goap-agent Skill

This command fully leverages the **goap-agent skill** for:

1. **Task Analysis** - Understanding goals and constraints
2. **Decomposition** - Breaking complex tasks into atomic units
3. **Strategy Selection** - Choosing optimal execution pattern
4. **Agent Coordination** - Managing handoffs and dependencies
5. **Quality Gates** - Enforcing validation at each phase
6. **Result Synthesis** - Aggregating and validating outcomes

**goap-agent orchestrates the entire execution following GOAP methodology:**
- ANALYZE → DECOMPOSE → STRATEGIZE → COORDINATE → EXECUTE → SYNTHESIZE

All agent coordination, handoff protocols, and quality gates are managed by the goap-agent skill according to its documented patterns and best practices.
