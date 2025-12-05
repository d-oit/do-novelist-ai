# GOAP Plan: Codebase Improvement & Technical Debt

**Analysis Date:** 2025-12-01 **Last Updated:** 2025-12-04 **Current State:**
462 tests passing (100%), 0 lint errors, build successful, CI/CD optimized
**Goal:** Improve code quality, maintainability, and developer experience

---

## Executive Summary

After comprehensive codebase analysis, the project is in good health with all
quality gates passing. However, several improvement opportunities exist across
architecture, testing, performance, and developer experience.

### Current Strengths

- ✅ All 462 tests passing (100%)
- ✅ 0 lint errors, TypeScript strict mode
- ✅ Well-organized feature-based architecture
- ✅ Comprehensive error handling system
- ✅ AI Gateway integration complete
- ✅ Gamification system implemented

### Identified Improvement Areas

1. **Test Coverage Gaps** - Some features lack unit tests
2. **Code Duplication** - Repeated patterns across features
3. **Performance Optimization** - Bundle size and runtime improvements
4. **Documentation** - Missing JSDoc and API documentation
5. **Accessibility** - A11y audit needed
6. **Developer Experience** - Tooling and workflow improvements

---

## Prerequisites

> [!IMPORTANT] E2E tests and CI/CD pipeline have been optimized and are now
> stable. See
> **[plans/completed/GOAP-EXECUTION-SUMMARY.md](file:///d:/git/do-novelist-ai/plans/completed/GOAP-EXECUTION-SUMMARY.md)**
> for completed CI optimization work. The pipeline is ready for validating
> improvements.

---

## Priority 1: Critical Improvements (Week 1-2)

### Action 1.1: Add Missing Test Coverage

**Goal State:** `test_coverage >= 85%` **Current State:** Coverage reporting
configured with thresholds (lines: 80, branches: 75)

**Preconditions:**

- Test framework configured ✅
- Vitest installed ✅
- Coverage reporting configured ✅

**Steps:**

1. ✅ Add coverage reporting to vitest.config.ts (COMPLETED)
2. Identify untested files in:
   - `src/features/publishing/services/publishingAnalyticsService.ts`
   - `src/lib/character-validation.ts`
   - `src/lib/epub.ts`
3. Write unit tests for critical paths
4. Set coverage threshold in CI (already configured)

**Estimated Effort:** 6-10 hours (reduced from 8-12)

### Action 1.2: Fix React Testing Warnings

**Goal State:** `react_test_warnings = 0` **Current State:** Framer Motion mocks
implemented, warnings likely resolved

**Preconditions:**

- Tests passing ✅
- Framer Motion test files identified ✅

**Steps:**

1. ✅ Mock Framer Motion in test setup to suppress DOM warnings (PARTIALLY
   COMPLETE)
2. Update `src/test/setup.ts` with proper motion mocks
3. Fix `act()` warnings in async tests

**Files to Update:**

- `src/test/setup.ts`
- `src/features/analytics/components/AnalyticsDashboard.test.tsx`
- 5 other test files using Framer Motion

**Estimated Effort:** 1-2 hours (reduced from 2-3)

### Action 1.3: Consolidate Duplicate Error Boundary Components

**Goal State:** `error_boundary_files = 1` **Current State:** Single
error-boundary.tsx exists (consolidated)

**Preconditions:**

- ✅ Consolidation completed (only error-boundary.tsx exists)

**Steps:**

1. ✅ Audit `src/components/error-boundary.tsx` vs
   `src/components/ErrorBoundary.tsx` (COMPLETED)
2. ✅ Merge into single canonical implementation (COMPLETED)
3. ✅ Update all imports (COMPLETED)
4. ✅ Delete duplicate file (COMPLETED)

**Estimated Effort:** 0 hours (COMPLETED)

---

## Priority 2: Architecture Improvements (Week 2-3)

### Action 2.1: Create Shared Component Library

**Goal State:** `shared_components_organized = true` **Current State:** UI
components scattered across features

**Preconditions:**

- Component audit complete

**Steps:**

1. Audit all reusable components in `src/components/ui/`
2. Create barrel exports in `src/shared/components/`
3. Document component API with JSDoc
4. Add Storybook stories (optional)

**Components to Consolidate:**

- Button, Card, Input, Modal, Tooltip
- Loading states, Empty states
- Form components

**Estimated Effort:** 6-8 hours

### Action 2.2: Implement Service Layer Pattern

**Goal State:** `services_standardized = true` **Current State:** Inconsistent
service patterns across features

**Preconditions:**

- Feature services exist ✅

**Steps:**

1. Create base service interface in `src/shared/types/`
2. Standardize error handling in services
3. Add retry logic using existing `executeWithRetry`
4. Implement service factory pattern

**Files to Refactor:**

- `src/features/*/services/*.ts`
- `src/services/*.ts`

**Estimated Effort:** 8-10 hours

### Action 2.3: Optimize Zustand Store Structure

**Goal State:** `store_performance_optimized = true` **Current State:** Multiple
stores, potential re-render issues

**Preconditions:**

- Zustand stores exist ✅

**Steps:**

1. Audit store selectors for unnecessary re-renders
2. Implement shallow equality checks
3. Split large stores into slices
4. Add devtools integration for debugging

**Stores to Optimize:**

- `src/lib/stores/analyticsStore.ts`
- `src/lib/stores/publishingStore.ts`
- `src/features/projects/hooks/useProjects.ts`

**Estimated Effort:** 4-6 hours

---

## Priority 3: Performance Optimization (Week 3-4)

### Action 3.1: Bundle Size Analysis & Optimization

**Goal State:** `bundle_size_reduced >= 15%` **Current State:** Unknown bundle
composition

**Preconditions:**

- Vite build configured ✅

**Steps:**

1. Add `rollup-plugin-visualizer` to analyze bundle
2. Identify large dependencies
3. Implement code splitting for routes
4. Lazy load heavy components (Recharts, Editor)
5. Tree-shake unused exports

**Estimated Effort:** 4-6 hours

### Action 3.2: Implement React.memo for Heavy Components

**Goal State:** `unnecessary_rerenders = 0` **Current State:** Components may
re-render unnecessarily

**Preconditions:**

- React DevTools profiling

**Steps:**

1. Profile app with React DevTools
2. Identify components with frequent re-renders
3. Apply `React.memo` with custom comparison
4. Use `useMemo`/`useCallback` for expensive computations

**Target Components:**

- `ProjectDashboard` / `ProjectDashboardOptimized`
- `AnalyticsDashboard`
- `GoapVisualizer`
- `BookViewer`

**Estimated Effort:** 4-6 hours

### Action 3.3: Implement Virtual Scrolling

**Goal State:** `large_list_performance = optimized` **Current State:** Lists
render all items

**Preconditions:**

- Large lists identified

**Steps:**

1. Identify lists with >50 items potential
2. Implement `react-virtual` or similar
3. Apply to chapter lists, version history, analytics

**Estimated Effort:** 3-4 hours

---

## Priority 4: Developer Experience (Week 4-5)

### Action 4.1: Add JSDoc Documentation

**Goal State:** `public_api_documented = true` **Current State:** Limited inline
documentation

**Preconditions:**

- TypeScript types exist ✅

**Steps:**

1. Document all public functions in `src/lib/`
2. Document hook return types and parameters
3. Document service methods
4. Generate API docs with TypeDoc

**Priority Files:**

- `src/lib/errors/*.ts`
- `src/lib/validation.ts`
- `src/features/*/hooks/*.ts`

**Estimated Effort:** 6-8 hours

### Action 4.2: Create Development Scripts

**Goal State:** `dev_scripts_complete = true` **Current State:** Most scripts
implemented

**Preconditions:**

- Package.json exists ✅
- Analyze script functional ✅

**Steps:**

1. ✅ Add `npm run analyze` for bundle analysis (COMPLETED)
2. ✅ Add `npm run coverage` for test coverage (COMPLETED)
3. Add `npm run typecheck` for standalone type checking
4. Add `npm run clean` for cache clearing
5. Document scripts in README

**Estimated Effort:** 1 hour (reduced from 2-3)

### Action 4.3: Improve Git Hooks

**Goal State:** `pre_commit_comprehensive = true` **Current State:** Basic
lint-staged configured

**Preconditions:**

- Husky installed ✅

**Steps:**

1. Add commit message validation (conventional commits)
2. Add pre-push hook for tests
3. Add branch naming validation
4. Update `.husky/` configuration

**Estimated Effort:** 2-3 hours

---

## Priority 5: Accessibility Audit (Week 5-6)

### Action 5.1: WCAG 2.1 AA Compliance Audit

**Goal State:** `a11y_violations = 0` **Current State:** Basic aria attributes
present

**Preconditions:**

- Components use semantic HTML ✅

**Steps:**

1. Install `@axe-core/react` for dev auditing
2. Run automated accessibility scan
3. Fix color contrast issues
4. Add missing ARIA labels
5. Ensure keyboard navigation works
6. Add skip links for main content

**Focus Areas:**

- Form inputs and labels
- Modal focus trapping
- Color contrast in dark mode
- Screen reader announcements

**Estimated Effort:** 8-12 hours

### Action 5.2: Add E2E Accessibility Tests

**Goal State:** `a11y_tests_automated = true` **Current State:** No automated
a11y testing

**Preconditions:**

- Playwright configured ✅

**Steps:**

1. Add `@axe-core/playwright` to E2E tests
2. Create accessibility test suite
3. Add to CI pipeline
4. Set violation thresholds

**Estimated Effort:** 4-6 hours

---

## Implementation Roadmap

```
Week 1-2: Critical Improvements
├── Action 1.1: Test Coverage (8-12 hrs)
├── Action 1.2: React Test Warnings (2-3 hrs)
└── Action 1.3: Error Boundary Consolidation (1-2 hrs)

Week 2-3: Architecture Improvements
├── Action 2.1: Shared Component Library (6-8 hrs)
├── Action 2.2: Service Layer Pattern (8-10 hrs)
└── Action 2.3: Zustand Optimization (4-6 hrs)

Week 3-4: Performance Optimization
├── Action 3.1: Bundle Size (4-6 hrs)
├── Action 3.2: React.memo (4-6 hrs)
└── Action 3.3: Virtual Scrolling (3-4 hrs)

Week 4-5: Developer Experience
├── Action 4.1: JSDoc Documentation (6-8 hrs)
├── Action 4.2: Development Scripts (2-3 hrs)
└── Action 4.3: Git Hooks (2-3 hrs)

Week 5-6: Accessibility
├── Action 5.1: WCAG Audit (8-12 hrs)
└── Action 5.2: A11y E2E Tests (4-6 hrs)
```

**Total Estimated Effort:** 65-95 hours (~2-3 sprints)

---

## Success Metrics

| Metric                 | Current | Target | Priority |
| ---------------------- | ------- | ------ | -------- |
| Test Coverage          | Unknown | ≥85%   | P1       |
| Test Warnings          | ~10     | 0      | P1       |
| Bundle Size            | Unknown | -15%   | P3       |
| Lighthouse Performance | Unknown | ≥90    | P3       |
| A11y Violations        | Unknown | 0      | P5       |
| JSDoc Coverage         | ~10%    | ≥80%   | P4       |

---

## Dependencies & Risks

### Dependencies

- Coverage tooling requires vitest configuration update
- Bundle analysis requires new dev dependency
- A11y testing requires axe-core packages

### Risks

- Performance optimization may introduce regressions → Mitigate with
  comprehensive testing
- Refactoring services may break integrations → Mitigate with incremental
  changes
- A11y fixes may require design changes → Coordinate with UI/UX

---

## Quick Wins (Can Start Immediately)

1. **Fix React test warnings** - 2-3 hours, immediate quality improvement
2. **Consolidate error boundaries** - 1-2 hours, reduces confusion
3. **Add development scripts** - 2-3 hours, improves DX
4. **Add coverage reporting** - 1 hour, enables tracking

---

**Next Action:** Start with Action 1.2 (Fix React Test Warnings) as it's quick
and improves test reliability.
