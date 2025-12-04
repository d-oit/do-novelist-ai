# GOAP Plan: Codebase Improvements Implementation

**Created:** 2025-12-01 **Branch:** feature/codebase-improvements-implementation
**Goal:** Implement missing high and medium priority improvements from codebase
analysis plans

---

## Executive Summary

This GOAP plan orchestrates the implementation of 10 critical codebase
improvements identified across multiple analysis documents. Tasks are decomposed
into atomic, verifiable steps with clear dependencies, agent assignments, and
quality gates. The plan prioritizes high-impact changes while enabling parallel
execution where possible.

### Success Criteria

- All tests pass (462+ tests)
- 0 lint errors
- Build successful
- Coverage reporting functional
- AISettingsPanel integrated and functional
- Accessibility violations reduced to 0
- Performance optimizations verified

### Strategy Overview

- **Parallel Execution:** Independent tasks run concurrently
- **Sequential Dependencies:** Tasks requiring prior completion are chained
- **Quality Gates:** Each task verified before proceeding
- **Agent Assignment:** Specialized agents for optimal execution
- **Progress Tracking:** Updates to this plan file only upon verification

---

## Prerequisites

> [!IMPORTANT] **E2E Test Fixes Required First:** Before executing this
> implementation plan, the E2E test failures in GitHub Actions must be resolved.
> See **[E2E-FIX-GOAP-ORCHESTRATOR.md](E2E-FIX-GOAP-ORCHESTRATOR.md)** for the
> orchestrator plan to fix 5 failing E2E tests. This ensures a stable CI/CD
> pipeline for validating all changes in this plan.

---

## Task Decomposition & Execution Plan

### Phase 1: High Priority Critical Fixes (Parallel Execution)

#### Task 1.1: Fix React Test Warnings (Framer Motion Mocks)

**Agent:** react-typescript-code-fixer  
**Priority:** HIGH  
**Estimated Effort:** 2-3 hours  
**Dependencies:** None  
**Success Criteria:** 0 React test warnings, all tests pass

**Atomic Steps:**

1. Analyze current test warnings in `src/test/setup.ts`
2. Mock Framer Motion components to suppress DOM warnings
3. Update `src/features/analytics/components/AnalyticsDashboard.test.tsx` for
   act() warnings
4. Run tests to verify warnings eliminated
5. Commit verified changes

**Quality Gate:** Tests pass with 0 warnings

#### Task 1.2: Consolidate Duplicate Error Boundary Files

**Agent:** feature-implementer  
**Priority:** HIGH  
**Estimated Effort:** 1-2 hours  
**Dependencies:** None  
**Success Criteria:** Single error boundary file, all imports updated

**Atomic Steps:**

1. Audit `src/components/error-boundary.tsx` vs
   `src/components/ErrorBoundary.tsx`
2. Merge implementations into canonical version
3. Update all import statements across codebase
4. Delete duplicate file
5. Verify build and tests pass
6. Commit verified changes

**Quality Gate:** Build successful, no broken imports

#### Task 1.3: Add Test Coverage Reporting

**Agent:** debugger  
**Priority:** HIGH  
**Estimated Effort:** 1 hour  
**Dependencies:** None  
**Success Criteria:** Coverage reports generated, vitest.config.ts updated

**Atomic Steps:**

1. Add coverage configuration to `vitest.config.ts`
2. Configure HTML and LCOV reporters
3. Set coverage thresholds (lines: 80, branches: 75)
4. Run coverage command to verify functionality
5. Add coverage script to package.json
6. Commit verified changes

**Quality Gate:** Coverage report generates successfully

#### Task 1.4: Add Development Scripts

**Agent:** github-action-editor  
**Priority:** HIGH  
**Estimated Effort:** 2-3 hours  
**Dependencies:** Task 1.3 (coverage reporting)  
**Success Criteria:** All scripts functional, documented in README

**Atomic Steps:**

1. Add `analyze` script for bundle analysis (rollup-plugin-visualizer)
2. Add `coverage` script for test coverage
3. Add `typecheck` script for standalone TypeScript checking
4. Add `clean` script for cache clearing
5. Update package.json scripts section
6. Test all scripts functionality
7. Document scripts in README.md
8. Commit verified changes

**Quality Gate:** All scripts execute successfully

### Phase 2: AI Settings Integration (Sequential Dependencies)

#### Task 2.1: Add User Context Provider

**Agent:** feature-implementer  
**Priority:** HIGH  
**Estimated Effort:** 30 minutes  
**Dependencies:** None  
**Success Criteria:** UserContext available throughout app

**Atomic Steps:**

1. Create `src/contexts/UserContext.tsx` with userId state
2. Add UserContext provider to App.tsx root
3. Implement localStorage persistence for userId
4. Default to 'default-user' for single-user app
5. Export useUser hook for components
6. Verify context accessible in components
7. Commit verified changes

**Quality Gate:** UserContext provides userId correctly

#### Task 2.2: Integrate AISettingsPanel into SettingsView

**Agent:** feature-implementer  
**Priority:** HIGH  
**Estimated Effort:** 15 minutes  
**Dependencies:** Task 2.1 (User Context)  
**Success Criteria:** AISettingsPanel visible and functional in settings

**Atomic Steps:**

1. Import AISettingsPanel in `src/features/settings/components/SettingsView.tsx`
2. Add AISettingsPanel section after Appearance section
3. Pass userId from UserContext to AISettingsPanel
4. Verify AI provider selection UI accessible
5. Test cost dashboard and health monitoring visibility
6. Commit verified changes

**Quality Gate:** AISettingsPanel renders and functions correctly

### Phase 3: Medium Priority Improvements (Parallel Execution)

#### Task 3.1: Accessibility Audit and Fixes

**Agent:** react-typescript-code-fixer  
**Priority:** MEDIUM  
**Estimated Effort:** 2 hours  
**Dependencies:** None  
**Success Criteria:** WCAG 2.1 AA compliance, 0 accessibility violations

**Atomic Steps:**

1. Install `@axe-core/react` for dev auditing
2. Run automated accessibility scan on key components
3. Fix color contrast issues in dark mode
4. Add missing ARIA labels to interactive elements
5. Ensure keyboard navigation works for all controls
6. Add skip links for main content navigation
7. Verify focus states visible on all focusable elements
8. Run Lighthouse accessibility audit
9. Commit verified changes

**Quality Gate:** Lighthouse accessibility score ≥90

#### Task 3.2: Standardize Class Name Patterns (cn() Utility)

**Agent:** feature-implementer  
**Priority:** MEDIUM  
**Estimated Effort:** 2 hours  
**Dependencies:** None  
**Success Criteria:** All conditional classes use cn() utility

**Atomic Steps:**

1. Audit codebase for template literal class usage (48 occurrences found)
2. Refactor template literals to cn() utility calls
3. Create ESLint rule to enforce cn() usage
4. Update any remaining inconsistent patterns
5. Verify no template literals in className attributes
6. Run lint to confirm no violations
7. Commit verified changes

**Quality Gate:** 0 template literal className violations

#### Task 3.3: Performance Optimization (React.memo)

**Agent:** react-typescript-code-fixer  
**Priority:** MEDIUM  
**Estimated Effort:** 4-6 hours  
**Dependencies:** None  
**Success Criteria:** Unnecessary re-renders eliminated, performance improved

**Atomic Steps:**

1. Profile app with React DevTools to identify re-render issues
2. Add React.memo to heavy components:
   - ProjectDashboard
   - AnalyticsDashboard
   - CharacterCard
   - ChapterList
3. Implement custom comparison functions where needed
4. Use useMemo/useCallback for expensive computations
5. Optimize Zustand selectors with shallow equality
6. Verify performance improvements with profiling
7. Commit verified changes

**Quality Gate:** React DevTools shows reduced re-renders

#### Task 3.4: Create Shared Component Library

**Agent:** feature-implementer  
**Priority:** MEDIUM  
**Estimated Effort:** 6-8 hours  
**Dependencies:** Task 3.2 (Class standardization)  
**Success Criteria:** Shared components organized with barrel exports

**Atomic Steps:**

1. Audit all reusable components in `src/components/ui/`
2. Identify components to consolidate (Button, Card, Input, Modal, etc.)
3. Create `src/shared/components/` directory
4. Move shared components with proper TypeScript interfaces
5. Add barrel exports (index.ts) for clean imports
6. Document component APIs with JSDoc
7. Update all import statements to use shared library
8. Verify build and tests pass
9. Commit verified changes

**Quality Gate:** All components importable from shared library

---

## Dependencies Graph

```
Task 1.1 (Framer Motion) ──┐
Task 1.2 (Error Boundary) ─┼─ Phase 1 Complete
Task 1.3 (Coverage) ──────┘

Task 1.4 (Dev Scripts) ──── Depends on Task 1.3

Task 2.1 (User Context) ───┐
Task 2.2 (AI Settings) ──── Depends on Task 2.1

Task 3.1 (A11y Audit) ─────┐
Task 3.2 (Class Patterns) ─┼─ Phase 3 Complete
Task 3.3 (React.memo) ────┘
Task 3.4 (Shared Library) ─ Depends on Task 3.2
```

---

## Agent Assignments & Capabilities

| Agent                           | Tasks                   | Strengths                                              |
| ------------------------------- | ----------------------- | ------------------------------------------------------ |
| **react-typescript-code-fixer** | 1.1, 3.1, 3.3           | ESLint/TypeScript fixes, React patterns, accessibility |
| **feature-implementer**         | 1.2, 2.1, 2.2, 3.2, 3.4 | Component creation, refactoring, integration           |
| **debugger**                    | 1.3                     | Testing configuration, coverage setup                  |
| **github-action-editor**        | 1.4                     | Script configuration, tooling setup                    |

---

## Quality Gates & Verification

### Pre-Implementation Gate

- [ ] Branch created: feature/codebase-improvements-implementation
- [ ] All tests passing (462+)
- [ ] 0 lint errors
- [ ] Build successful

### Post-Task Verification

Each task includes:

- **Functional Testing:** Feature works as expected
- **Build Verification:** No compilation errors
- **Lint Check:** No new violations
- **Test Suite:** All tests pass
- **Commit:** Changes committed with descriptive message

### Final Quality Gate

- [ ] All 10 tasks completed and verified
- [ ] Full test suite passes
- [ ] Lint clean
- [ ] Build successful
- [ ] Coverage reporting functional
- [ ] Accessibility audit passes
- [ ] Performance profiling shows improvements

---

## Execution Timeline

| Phase       | Tasks         | Duration    | Parallel/Sequential |
| ----------- | ------------- | ----------- | ------------------- |
| **Phase 1** | Tasks 1.1-1.4 | 6-8 hours   | Parallel            |
| **Phase 2** | Tasks 2.1-2.2 | 45 minutes  | Sequential          |
| **Phase 3** | Tasks 3.1-3.4 | 14-22 hours | Parallel            |
| **Total**   | All Tasks     | 20-31 hours | Mixed               |

---

## Risk Mitigation

### Technical Risks

- **Breaking Changes:** Incremental commits allow easy rollback
- **Import Conflicts:** Verify builds after each import update
- **Performance Regressions:** Profile before/after optimizations

### Coordination Risks

- **Agent Conflicts:** Clear task boundaries prevent overlap
- **Dependency Issues:** Sequential tasks prevent circular dependencies
- **Quality Gaps:** Mandatory verification gates catch issues early

---

## Progress Tracking

**Status:** Phase 1-2 Complete, Phase 3 In Progress  
**Started:** 2025-12-01  
**Last Updated:** 2025-12-04  
**Next Action:** Complete remaining Phase 3 tasks

### Completed Tasks

- [x] Plan creation and decomposition
- [x] Dependencies analysis
- [x] Agent assignments
- [x] Task 1.1: Fix React test warnings (Framer Motion mocks in place)
- [x] Task 1.2: Consolidate error boundaries (single error-boundary.tsx exists)
- [x] Task 1.3: Add coverage reporting (vitest.config.ts has coverage with
      thresholds)
- [x] Task 1.4: Add development scripts (analyze script functional, others in
      package.json)
- [x] Task 2.1: Add user context (UserContext.tsx exists)
- [x] Task 2.2: Integrate AISettingsPanel (already completed in settings)

### In Progress Tasks

- [ ] Task 3.1: Accessibility audit (needs @axe-core/react integration)
- [ ] Task 3.2: Standardize class patterns (cn() utility usage audit needed)
- [ ] Task 3.3: Performance optimization (React.memo implementation needed)
- [ ] Task 3.4: Shared component library (organization needed)

---

## Success Metrics

| Metric           | Baseline | Target | Verification      |
| ---------------- | -------- | ------ | ----------------- |
| Test Warnings    | ~10      | 0      | Test output       |
| Lint Errors      | 0        | 0      | npm run lint      |
| Test Coverage    | Unknown  | ≥80%   | Coverage report   |
| Bundle Size      | Unknown  | -15%   | Bundle analyzer   |
| Lighthouse A11y  | Unknown  | ≥90    | Lighthouse audit  |
| Build Time       | ~15s     | <10s   | Build output      |
| React Re-renders | Unknown  | -50%   | DevTools profiler |

---

**Execution Status:** Ready to begin Phase 1 implementation. All agents
assigned, dependencies mapped, quality gates defined.
