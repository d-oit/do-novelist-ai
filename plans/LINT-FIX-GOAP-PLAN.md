# GOAP Plan: Fix All Lint Issues

## Phase 1: Analysis

### Primary Goal
Fix all 788 lint errors across the codebase without modifying the lint configuration.

### Constraints
- Do NOT change eslint.config.js or any other lint configuration
- Fix only actual lint violations
- Maintain code functionality
- Use TypeScript best practices

### Error Categories Identified
1. **Promise Issues** (~200 errors)
   - `no-floating-promises`: Promises not awaited or handled
   - `no-misused-promises`: Promise-returning functions in void contexts
   - `require-await`: Async functions without await
   - `prefer-promise-reject-errors`: Should reject with Error objects

2. **Type Safety Issues** (~250 errors)
   - `no-unsafe-assignment`: Unsafe any assignments
   - `no-unsafe-member-access`: Unsafe member access on any
   - `no-unsafe-argument`: Unsafe arguments
   - `no-unsafe-return`: Unsafe returns
   - `no-explicit-any`: Avoid using 'any' type

3. **Strict Boolean Expressions** (~100 errors)
   - `strict-boolean-expressions`: Handle nullish cases explicitly

4. **Missing Return Types** (~150 errors)
   - `explicit-function-return-type`: Functions need explicit return types

5. **Missing Accessibility Modifiers** (~50 errors)
   - `explicit-member-accessibility`: Class methods/properties need public/private

6. **Nullish Coalescing** (~20 errors)
   - `prefer-nullish-coalescing`: Use ?? instead of || for safety

7. **Other** (~18 errors)
   - Enum comparisons, non-null assertions, unused vars, etc.

### Complexity Level
**Very Complex** - Multiple phases, many dependencies, requires specialized expertise

## Phase 2: Task Decomposition

### Main Goal
Fix all 788 lint errors systematically

### Sub-Goals (by file category)

1. **Editor Features** - Priority: P0
   - Success Criteria: All editor-related files pass linting
   - Files: BookViewer.tsx, CoverGenerator.tsx, PublishPanel.tsx, useGoapEngine.ts, editorService.ts
   - Issues: ~100 errors (promises, type safety, nullish)

2. **Project Management** - Priority: P0
   - Success Criteria: All project-related files pass linting
   - Files: ProjectWizard.tsx, ProjectsView.tsx, useProjects.ts, db.ts, projectService.ts
   - Issues: ~180 errors (type safety, promises, return types)

3. **Analytics & Publishing** - Priority: P0
   - Success Criteria: All analytics/publishing files pass linting
   - Files: analyticsStore.ts, publishingStore.ts, analyticsService.ts, publishingAnalyticsService.ts
   - Issues: ~200 errors (return types, promises)

4. **Error Handling** - Priority: P0
   - Success Criteria: All error handling files pass linting
   - Files: error-handler.ts, result.ts
   - Issues: ~80 errors (type safety, error objects)

5. **Characters & Validation** - Priority: P1
   - Success Criteria: All character/validation files pass linting
   - Files: character-guards.ts, schemas.ts, validation.ts
   - Issues: ~40 errors (strict booleans)

6. **Utilities & Helpers** - Priority: P1
   - Success Criteria: All util files pass linting
   - Files: utils.ts, useScrollLock.ts
   - Issues: ~10 errors (return types, strict booleans)

7. **AI & Services** - Priority: P1
   - Success Criteria: All AI/service files pass linting
   - Files: ai-config.ts, ai-config-service.ts, ai-health-service.ts, writingAssistant*.ts
   - Issues: ~30 errors (various)

8. **Components** - Priority: P1
   - Success Criteria: All component files pass linting
   - Files: Various component files
   - Issues: ~80 errors (promises, return types, accessibility)

9. **Shared & Types** - Priority: P1
   - Success Criteria: All shared/type files pass linting
   - Files: shared components, type guards, etc.
   - Issues: ~30 errors (various)

10. **Final Validation** - Priority: P0
    - Success Criteria: `npm run lint` passes completely
    - Validation: Run full lint check
    - Fixes: Address any remaining issues

### Atomic Tasks

**Phase A: Quick Wins (Can run in parallel)**
- Task A1: Fix missing return types (150+ issues) - Agent: refactorer
- Task A2: Fix missing accessibility modifiers (50+ issues) - Agent: refactorer
- Task A3: Fix unused variables (few issues) - Agent: refactorer

**Phase B: Promise Issues (Sequential - need to understand context)**
- Task B1: Fix promise issues in Editor features - Agent: refactorer
- Task B2: Fix promise issues in Project features - Agent: refactorer
- Task B3: Fix promise issues in Analytics/Publishing - Agent: refactorer
- Task B4: Fix promise issues in Components - Agent: refactorer

**Phase C: Type Safety Issues (Sequential - careful refactoring)**
- Task C1: Fix type safety in db.ts (most unsafe issues) - Agent: refactorer
- Task C2: Fix type safety in error-handler.ts - Agent: refactorer
- Task C3: Fix type safety in result.ts - Agent: refactorer
- Task C4: Fix remaining type safety issues - Agent: refactorer

**Phase D: Strict Booleans (Parallel)**
- Task D1: Fix strict booleans in validation files - Agent: refactorer
- Task D2: Fix strict booleans in character files - Agent: refactorer
- Task D3: Fix strict booleans in other files - Agent: refactorer

**Phase E: Final Validation**
- Task E1: Run npm run lint to verify - Agent: code-reviewer
- Task E2: Fix any remaining edge cases - Agent: refactorer

### Dependency Graph
```
Phase A (Parallel) → Phase B (Sequential by domain)
                      ↓
Phase C (Sequential) → Phase D (Parallel)
                      ↓
                 Phase E (Sequential)
```

## Phase 3: Strategy Selection

**Hybrid Strategy** with Sequential dependencies where needed:
- Phase A: Parallel (Quick wins, independent)
- Phase B: Sequential (Promise issues need domain context)
- Phase C: Sequential (Type safety interdependencies)
- Phase D: Parallel (Independent boolean fixes)
- Phase E: Sequential (Final validation)

Total Agents: 5-8 working in parallel/sequence

## Phase 4: Agent Assignment

### Agent Capabilities Matrix
- **refactorer**: Fix code quality, structure, type safety
- **code-reviewer**: Validate quality, compliance
- **test-runner**: Run lint checks (if needed for validation)

### Work Distribution
- Each agent handles 2-3 sub-goals
- Agents can work on different file categories in parallel
- Handoff pattern: completed agents help with remaining work

## Phase 5: Execution Plan

### Overview
- Strategy: Hybrid (Parallel + Sequential phases)
- Total Tasks: 5 phases, ~50 atomic fixes
- Estimated Duration: Multiple agent-hours
- Quality Gates: Lint passes after each phase

### Phase 1: Quick Wins (Parallel)
**Tasks**:
- Agent 1 → Fix missing return types across all files
- Agent 2 → Fix missing accessibility modifiers
- Agent 3 → Fix unused variables and simple issues

**Quality Gate**: Run `npm run lint` to see progress

### Phase 2: Promise Issues (Sequential by domain)
**Tasks**:
- Agent 1 → Editor features promise fixes
- Agent 2 → Project features promise fixes
- Agent 3 → Analytics/Publishing promise fixes
- Agent 4 → Components promise fixes

**Quality Gate**: Promise-related errors reduced significantly

### Phase 3: Type Safety (Sequential)
**Tasks**:
- Agent 1 → db.ts type safety (highest count)
- Agent 2 → error-handler.ts type safety
- Agent 3 → result.ts type safety
- Agent 4 → Remaining type safety issues

**Quality Gate**: Type safety errors reduced significantly

### Phase 4: Strict Booleans (Parallel)
**Tasks**:
- Agent 1 → Validation and character files
- Agent 2 → Other boolean expression files

**Quality Gate**: Boolean expression errors eliminated

### Phase 5: Final Validation
**Tasks**:
- Agent 1 → Run full lint check
- Agent 2 → Fix any remaining edge cases
- Agent 3 → Final verification

**Quality Gate**: `npm run lint` passes with 0 errors

## Phase 6: Coordinated Execution

### Parallel Execution Pattern
```
Phase A: Launch 3 agents simultaneously
         ↓ All complete
Phase B: Launch 4 agents sequentially (domain by domain)
         ↓ All complete
Phase C: Launch 4 agents sequentially (by complexity)
         ↓ All complete
Phase D: Launch 2 agents simultaneously
         ↓ All complete
Phase E: Launch 2 agents sequentially
         ↓ Complete
```

### Monitoring
- Track errors count after each phase
- Validate fixes don't break functionality
- Coordinate handoffs between phases

## Phase 7: Success Criteria

### Overall Success Criteria
- [ ] All 788 lint errors fixed
- [ ] `npm run lint` passes with 0 errors
- [ ] `npm run lint:ci` passes
- [ ] TypeScript compilation succeeds
- [ ] No changes to lint configuration

### Quality Gates
- Gate 1: Phase A reduces errors to <650
- Gate 2: Phase B reduces errors to <400
- Gate 3: Phase C reduces errors to <150
- Gate 4: Phase D reduces errors to <30
- Gate 5: Phase E reaches 0 errors

### Deliverables
- All lint errors fixed
- Code maintains functionality
- Improved type safety
- Better error handling patterns

## Execution Notes

1. **Use Task Tool**: Create detailed task lists for each agent
2. **Bash Tool**: Run `npm run lint` frequently to track progress
3. **Edit Tool**: Apply fixes systematically
4. **gemini-websearch**: Use if research needed for specific patterns

## Start Execution

Begin with Phase 1: Launch 3 agents for quick wins (return types, accessibility, simple fixes).
