# MASTER EXECUTION PLAN - MISSING TASKS COORDINATION

**Date**: 2026-01-23 **Status**: Active **Total Estimated Time**: 12-15 hours
**Strategy**: Hybrid execution with parallel and sequential tasks

---

## Executive Summary

This master plan coordinates the implementation of all pending tasks from the
plans/ folder. Based on current state analysis, priorities are:

### Current State

✅ **Completed**:

- Phase 1 & 2 E2E Test Optimization (anti-pattern removal + test sharding)
- Fast CI Pipeline now PASSING
- E2E Tests now PASSING
- Some file size violations already fixed

🔄 **Pending Critical Tasks**:

1. Security Scanning & Analysis - Currently failing (needs investigation)
2. Refactor 3 files exceeding 600 LOC
3. Phase 5: API Documentation (4-5 hours)
4. Phase 6: Architecture Diagrams completion
5. E2E Test Optimization Phase 3-5
6. P0/P1 UI/UX improvements

---

## Task Inventory & Dependencies

### Task 1: Investigate & Fix Security Scan Failure (CRITICAL - Blocker)

**Priority**: P0 **Estimated Time**: 1-2 hours **Current Status**: Security
Scanning workflow failing **Dependencies**: None

**Details**:

- Latest run ID: 21295534833
- Status: failure
- Need to analyze security scan output

---

### Task 2: Refactor 3 Files Exceeding 600 LOC (HIGH)

**Priority**: P1 (Blocks Fast CI file size check) **Estimated Time**: 3-4 hours
**Dependencies**: None

**Files to Refactor**:

| File                                                        | Current LOC | Target LOC | LOC Excess | Priority |
| ----------------------------------------------------------- | ----------- | ---------- | ---------- | -------- |
| `src/lib/validation.test.ts`                                | 1060        | <600       | +460       | High     |
| `src/lib/errors/error-handler.test.ts`                      | 766         | <600       | +166       | Medium   |
| `src/lib/repositories/implementations/ChapterRepository.ts` | 748         | <600       | +148       | Medium   |

**Total LOC Reduction**: 2752 → <1800 (950+ LOC to remove)

**Strategy**:

- Split test files by test categories (creation, retrieval, modification, etc.)
- Extract repository methods to separate utilities
- Use feature-based organization

---

### Task 3: Phase 5 - API Documentation (HIGH)

**Priority**: P1 **Estimated Time**: 4-5 hours **Dependencies**: None (can run
in parallel)

**Services to Document** (Top 5 by usage):

| Service               | File                                                           | Estimated Time | Priority |
| --------------------- | -------------------------------------------------------------- | -------------- | -------- |
| ProjectService        | src/features/projects/services/projectService.ts               | 1 hour         | P0       |
| CharacterService      | src/features/characters/services/characterService.ts           | 1 hour         | P0       |
| EditorService         | src/features/editor/services/editorService.ts                  | 1 hour         | P1       |
| SemanticSearchService | src/features/semantic-search/services/semanticSearchService.ts | 1 hour         | P1       |
| AIConfigService       | src/features/ai/services/aiConfigService.ts                    | 1 hour         | P2       |

**Documentation Requirements**:

- Class-level JSDoc with examples
- Public method documentation
- Parameter types and return types
- Usage examples for key operations

---

### Task 4: Phase 6 - Architecture Diagrams (HIGH)

**Priority**: P1 **Estimated Time**: 3-4 hours **Dependencies**: Can run in
parallel with Task 3

**Status**: Already started

- ✅ Data Flow Diagram exists: plans/ARCHITECTURE-DATA-FLOW-DIAGRAM.md
- ✅ System Architecture exists: plans/architecture/system-architecture.md
- ⏳ Need to validate and enhance

**Tasks**:

- Validate existing diagrams for completeness
- Add component hierarchy diagram if needed
- Ensure Mermaid syntax is correct
- Document all components and relationships

---

### Task 5: E2E Test Optimization Phase 3-5 (MEDIUM)

**Priority**: P2 **Estimated Time**: 6-8 hours total **Dependencies**: None (E2E
tests passing)

**Phase 3: Browser-Specific Optimizations (2-3 hours)**

- Enforce `BrowserCompatibility` class usage in all tests
- Apply timeout multipliers consistently
- Add Firefox-specific localStorage workarounds where needed
- Optimize WebKit timeouts

**Phase 4: Mock Optimization (2-3 hours)**

- Move mock setup to global fixtures
- Use `beforeAll` for one-time mock initialization
- Cache mock configurations between tests
- Only reset routes when needed

**Phase 5: Test Consolidation (2 hours)**

- Consolidate `project-wizard.spec.ts` and `project-management.spec.ts`
- Extract common navigation patterns to shared helpers
- Create shared test suites for common scenarios

---

### Task 6: P0/P1 UI/UX Improvements (MEDIUM)

**Priority**: P2 **Estimated Time**: 8-12 days total (subset for this session)

**P0 Critical Tasks**:

| Task                                | Estimated Time | Status  |
| ----------------------------------- | -------------- | ------- |
| P0-1: Onboarding Flow               | 2-3 days       | Pending |
| P0-2: Mobile Navigation (MoreSheet) | 1 day          | ✅ DONE |
| P0-3: Help/Documentation Section    | 3-4 days       | Pending |

**P1 High Priority Tasks**:

| Task                         | Estimated Time | Status  |
| ---------------------------- | -------------- | ------- |
| P1-1: Undo/Redo System       | 2 days         | Pending |
| P1-2: Inline Form Validation | 2-3 days       | Pending |
| P1-3: AI Generation Feedback | 2 days         | Pending |
| P1-4: aria-live Regions      | 1 day          | ✅ DONE |

---

## Execution Strategy

### Phase 1: Critical Path (Sequential, 1-2 hours)

```
Task 1: Security Scan Investigation (1-2 hours)
    ↓ (must complete first)
```

**Agent Assignment**:

- 1x Security Specialist / Debugger

---

### Phase 2: Parallel Independent Tasks (3-5 hours)

```
[Task 2: File Refactoring (3-4 hours)]
    ↓ (parallel with)
[Task 3: API Documentation (4-5 hours)]
    ↓ (parallel with)
[Task 4: Architecture Diagrams (3-4 hours)]
```

**Agent Assignment**:

- 3x QA Engineers / Code Quality Specialists (Task 2 - 3 files)
- 5x QA Engineers (Task 3 - 5 services, can be parallelized)
- 1x Architecture Guardian (Task 4 - diagram validation/enhancement)

---

### Phase 3: E2E Test Optimization (6-8 hours, parallel with Phase 2)

```
[Phase 3: Browser Optimizations (2-3 hours)]
[Phase 4: Mock Optimization (2-3 hours)]
[Phase 5: Test Consolidation (2 hours)]
```

**Agent Assignment**:

- 1x E2E Test Optimizer (Phase 3)
- 1x E2E Test Optimizer (Phase 4)
- 1x E2E Test Optimizer (Phase 5)

---

### Phase 4: UI/UX Improvements (8-12 days - scoped down for this session)

```
[P0-3: Help Center (3-4 days)]
[P1-2: Inline Validation (2-3 days)]
```

**Agent Assignment**:

- 1x UX Designer / Frontend Developer (Help Center)
- 1x UX Designer / Frontend Developer (Inline Validation)

---

## Quality Gates

### After Each Task Completion

1. **Lint Gate**: `npm run lint`
   - All ESLint rules pass
   - No TypeScript errors

2. **Type Check Gate**: `tsc --noEmit`
   - No TypeScript compilation errors

3. **Unit Test Gate**: `npm run test`
   - All unit tests passing
   - No test coverage regression

4. **Build Gate**: `npm run build`
   - Production build succeeds
   - No file size violations

5. **E2E Test Gate**: `npm run test:e2e`
   - All E2E tests passing (currently passing)

---

## Handoff Coordination

### Task 1 → Task 2, 3, 4

**Handoff from Security Investigation**:

- Security scan issues resolved
- Any security-related code fixes documented
- All quality gates passing

**To**:

- File Refactoring Team (Task 2)
- API Documentation Team (Task 3)
- Architecture Diagram Team (Task 4)

---

### Task 2, 3, 4 → E2E Optimization

**Handoff from Parallel Tasks**:

- File refactoring complete (3 files under 600 LOC)
- API documentation complete (5 services)
- Architecture diagrams validated
- All quality gates passing

**To**:

- E2E Test Optimization Team

---

### Task 2, 3, 4 → UI/UX Improvements

**Handoff** (can proceed in parallel if code quality gates pass):

- Core codebase improvements complete
- Ready for UI/UX layer changes

**To**:

- UI/UX Development Team

---

## Success Criteria

### Critical Success Criteria

- [ ] Security Scanning workflow passes
- [ ] All files under 600 LOC limit
- [ ] Fast CI pipeline passes (all gates)
- [ ] E2E tests continue to pass (all 324 tests)
- [ ] API documentation complete for 5 services
- [ ] Architecture diagrams validated and complete

### Important Success Criteria

- [ ] E2E Test Optimization Phase 3-5 complete
- [ ] Help Center implemented (P0-3)
- [ ] Inline form validation implemented (P1-2)
- [ ] All quality gates passing after each phase

### Nice-to-Have Success Criteria

- [ ] Onboarding flow implemented (P0-1)
- [ ] Undo/Redo system implemented (P1-1)
- [ ] AI generation feedback improvements (P1-3)

---

## Risk Assessment

| Risk                                           | Likelihood | Impact | Mitigation                                   |
| ---------------------------------------------- | ---------- | ------ | -------------------------------------------- |
| Security scan reveals multiple vulnerabilities | Medium     | High   | Fix sequentially, document workarounds       |
| File refactoring breaks tests                  | Low        | High   | Comprehensive testing after each file        |
| API documentation takes longer than estimated  | Medium     | Low    | Focus on core methods only                   |
| E2E optimization introduces new failures       | Low        | High   | Run full E2E suite after each phase          |
| UI/UX work scope creep                         | High       | Medium | Strict timeboxing, prioritize critical tasks |

---

## Progress Tracking

### Phase 1: Security Investigation

- [ ] Analyze security scan failure
- [ ] Identify root cause
- [ ] Implement fixes
- [ ] Verify security scan passes

### Phase 2: Parallel Tasks

- [ ] Refactor validation.test.ts (<600 LOC)
- [ ] Refactor error-handler.test.ts (<600 LOC)
- [ ] Refactor ChapterRepository.ts (<600 LOC)
- [ ] Document ProjectService
- [ ] Document CharacterService
- [ ] Document EditorService
- [ ] Document SemanticSearchService
- [ ] Document AIConfigService
- [ ] Validate System Architecture diagram
- [ ] Validate Data Flow diagram

### Phase 3: E2E Optimization

- [ ] Implement browser-specific optimizations
- [ ] Implement mock optimization
- [ ] Consolidate duplicate tests

### Phase 4: UI/UX Improvements

- [ ] Implement Help Center
- [ ] Implement inline form validation

---

## Deliverables

### Code Changes

1. Security fixes for scan failures
2. Refactored files:
   - validation.test.ts (split into multiple files)
   - error-handler.test.ts (split by error types)
   - ChapterRepository.ts (extract utilities)
3. API documentation with JSDoc for 5 services
4. Enhanced/validated architecture diagrams

### Documentation

1. Security fix report (if vulnerabilities found)
2. File refactoring summary
3. API documentation completion report
4. Architecture diagram validation report
5. E2E optimization completion report

### Reports

All reports to be generated in `plans/` folder:

- `SECURITY-SCAN-FIX-REPORT-JAN-23-2026.md`
- `FILE-REFACTORING-COMPLETION-REPORT-JAN-23-2026.md`
- `API-DOCUMENTATION-COMPLETION-REPORT-JAN-23-2026.md`
- `ARCHITECTURE-DIAGRAMS-COMPLETION-REPORT-JAN-23-2026.md`
- `E2E-OPTIMIZATION-PHASE3-5-COMPLETION-REPORT-JAN-23-2026.md`
- `UI-UX-IMPROVEMENTS-COMPLETION-REPORT-JAN-23-2026.md`
- `MASTER-EXECUTION-COMPLETION-REPORT-JAN-23-2026.md`

---

## Timeline Summary

| Phase   | Tasks                                  | Estimated Time | Parallel? |
| ------- | -------------------------------------- | -------------- | --------- |
| Phase 1 | Security Investigation                 | 1-2 hours      | No        |
| Phase 2 | File Refactoring + API Docs + Diagrams | 5 hours (max)  | Yes       |
| Phase 3 | E2E Optimization Phase 3-5             | 6-8 hours      | Yes       |
| Phase 4 | UI/UX Improvements (scoped)            | 5-7 days       | Partial   |

**Total Estimated Time**: 12-15 hours (for Phases 1-3) + 5-7 days (Phase 4
UI/UX)

---

## Next Steps

1. **Immediately**: Begin Task 1 - Security Scan Investigation
2. **After Task 1**: Launch parallel Tasks 2, 3, 4
3. **During Tasks 2-4**: Launch E2E optimization Phases 3-5 in parallel
4. **After Tasks 2-4**: Begin scoped UI/UX improvements
5. **After all tasks**: Generate comprehensive completion report

---

**Plan Created**: 2026-01-23 **Plan Author**: Agent Coordinator (GOAP Agent)
**Status**: Ready for Execution **Total Estimated Time**: 12-15 hours (core
tasks) + 5-7 days (UI/UX) **Strategy**: Hybrid parallel/sequential with strict
quality gates
