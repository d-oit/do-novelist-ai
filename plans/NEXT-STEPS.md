# Next Steps - Codebase Improvements

**Created:** 2025-12-04  
**Based on:** Plans directory analysis and current codebase state  
**Priority:** HIGH - Ready for immediate implementation

---

## Executive Summary

With CI/CD optimization complete and the pipeline stable, we can now focus on
the remaining codebase improvements. **Phase 1-2 tasks are mostly complete**,
with **Phase 3 tasks ready for implementation**.

### Current Status

- ✅ **CI/CD:** Optimized with 3-shard parallelization
- ✅ **Tests:** 462+ passing, coverage reporting configured
- ✅ **Build:** Successful with bundle analysis available
- ✅ **Lint:** 0 errors
- 🔄 **Code Quality:** Phase 3 tasks pending

---

## Immediate Actions (This Session)

### 1. Complete Accessibility Audit (Task 3.1)

**Priority:** HIGH  
**Estimated Effort:** 2 hours  
**Agent:** react-typescript-code-fixer

**Steps:**

1. Install `@axe-core/react` for accessibility testing
2. Run automated scan on key components
3. Fix color contrast issues in dark mode
4. Add missing ARIA labels
5. Verify keyboard navigation
6. Run Lighthouse accessibility audit

**Success Criteria:** Lighthouse accessibility score ≥90

### 2. Standardize Class Patterns (Task 3.2)

**Priority:** HIGH  
**Estimated Effort:** 2 hours  
**Agent:** feature-implementer

**Steps:**

1. Audit codebase for template literal className usage (48 occurrences found)
2. Refactor to use `cn()` utility consistently
3. Create ESLint rule to enforce pattern
4. Verify no template literals remain

**Success Criteria:** 0 template literal className violations

### 3. Performance Optimization (Task 3.3)

**Priority:** MEDIUM  
**Estimated Effort:** 4-6 hours  
**Agent:** react-typescript-code-fixer

**Steps:**

1. Profile app with React DevTools
2. Add `React.memo` to heavy components:
   - ProjectDashboard
   - AnalyticsDashboard
   - CharacterCard
   - ChapterList
3. Optimize Zustand selectors
4. Verify performance improvements

**Success Criteria:** Reduced re-renders in DevTools

---

## Short-Term Actions (Next Week)

### 4. Shared Component Library (Task 3.4)

**Priority:** MEDIUM  
**Estimated Effort:** 6-8 hours  
**Agent:** feature-implementer

**Steps:**

1. Audit reusable components in `src/components/ui/`
2. Create `src/shared/components/` structure
3. Move components with proper TypeScript interfaces
4. Add barrel exports
5. Update all imports
6. Document component APIs

**Success Criteria:** All components importable from shared library

### 5. Bundle Size Optimization

**Priority:** MEDIUM  
**Estimated Effort:** 4-6 hours

**Current Bundle Analysis:**

- Total JS: ~1.3MB (gzipped: ~440KB)
- Largest chunks:
  - index-CsWa2HZF.js: 486KB (138KB gzipped)
  - vendor-charts-D7yWJLzU.js: 332KB (100KB gzipped)
  - vendor-ui-DJhEH3Dg.js: 182KB (55KB gzipped)

**Steps:**

1. Implement code splitting for heavy routes
2. Lazy load Recharts components
3. Tree-shake unused Lucide icons
4. Optimize imports

**Target:** Reduce bundle size by 15%

---

## Medium-Term Actions (Next 2-3 Weeks)

### 6. Documentation Enhancement

**Priority:** MEDIUM  
**Estimated Effort:** 8-12 hours

**Steps:**

1. Add JSDoc to all public APIs
2. Create component documentation
3. Add inline code examples
4. Update README with development scripts

**Target:** 80% JSDoc coverage

### 7. Type Safety Improvements

**Priority:** MEDIUM  
**Estimated Effort:** 6-8 hours

**Steps:**

1. Replace remaining `any` types
2. Add stricter TypeScript config options
3. Create branded types for IDs
4. Add Zod validation at boundaries

---

## Implementation Strategy

### Phase 1: Today (4-8 hours)

```
Accessibility Audit (2 hrs) ──┐
                              ├─→ Parallel Execution
Class Patterns (2 hrs) ───────┘
```

### Phase 2: This Week (4-6 hours)

```
Performance Optimization (4-6 hrs)
```

### Phase 3: Next Week (6-8 hours)

```
Shared Component Library (6-8 hrs)
```

### Phase 4: Following Weeks (14-20 hours)

```
Bundle Optimization (4-6 hrs) ──┐
Documentation (8-12 hrs) ───────┤
Type Safety (6-8 hrs) ────────────┘
```

---

## Quality Gates

### After Each Phase:

1. **Build Verification:** `npm run build` succeeds
2. **Lint Check:** `npm run lint` passes
3. **Test Suite:** All tests pass
4. **Performance:** No regressions

### Final Verification:

1. **Accessibility:** Lighthouse score ≥90
2. **Bundle Size:** 15% reduction achieved
3. **Coverage:** ≥80% maintained
4. **Performance:** React DevTools shows improvements

---

## Success Metrics

| Metric            | Current        | Target | Measurement       |
| ----------------- | -------------- | ------ | ----------------- |
| Lighthouse A11y   | Unknown        | ≥90    | Lighthouse audit  |
| Bundle Size       | ~440KB gzipped | ≤374KB | Bundle analyzer   |
| Template Literals | ~48            | 0      | ESLint count      |
| React Re-renders  | Baseline       | -50%   | DevTools profiler |
| JSDoc Coverage    | ~10%           | ≥80%   | TypeDoc analysis  |

---

## Dependencies & Risks

### Dependencies:

- None - all tasks independent
- CI/CD pipeline stable for validation

### Risks:

- **Performance regressions** - Mitigate with profiling
- **Breaking changes** - Incremental commits allow rollback
- **Import conflicts** - Verify builds after each update

---

## Next Actions

### Immediate (Today):

1. ✅ Create this next-steps document
2. ⏳ Start accessibility audit
3. ⏳ Begin class pattern standardization

### This Week:

1. Complete performance optimization
2. Verify all Phase 3 tasks complete
3. Update plans with progress

### Next Week:

1. Implement shared component library
2. Begin bundle optimization
3. Start documentation enhancement

---

**Status:** Ready for immediate implementation  
**Total Estimated Effort:** 26-42 hours  
**Timeline:** 2-3 weeks for all improvements  
**Priority:** HIGH - Code quality improvements ready for execution
