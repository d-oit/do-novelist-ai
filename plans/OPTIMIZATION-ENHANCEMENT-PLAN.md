# Optimization & Enhancement Plan - Novelist.ai

**Created:** 2025-12-01 **Goal:** Optimize performance, enhance code quality,
and improve developer experience

---

## 1. Performance Optimization

### 1.1 Bundle Size Reduction

**Current State:** Bundle composition unknown **Target:** Reduce bundle size by
20%

**Actions:**

```bash
# Add analyzer
npm install -D rollup-plugin-visualizer
```

- [ ] Add bundle analyzer to `vite.config.ts`
- [ ] Identify largest dependencies
- [ ] Lazy load routes with `React.lazy()`
- [ ] Code-split heavy components:
  - `Recharts` (analytics charts)
  - `GoapVisualizer`
  - `BookViewer`
- [ ] Tree-shake unused Lucide icons
- [ ] Replace `framer-motion` with CSS animations where possible

**Files:**

- `vite.config.ts`
- `src/App.tsx`
- `src/features/*/index.ts`

### 1.2 Runtime Performance

**Actions:**

- [ ] Add `React.memo()` to heavy components:
  - `ProjectDashboard`
  - `AnalyticsDashboard`
  - `CharacterCard`
  - `ChapterList`
- [ ] Optimize Zustand selectors with shallow equality
- [ ] Implement virtual scrolling for:
  - Chapter lists (>20 items)
  - Version history
  - Character lists
- [ ] Debounce search/filter inputs (300ms)
- [ ] Use `useDeferredValue` for non-critical updates

**Files:**

- `src/features/projects/components/`
- `src/features/analytics/components/`
- `src/lib/stores/`

### 1.3 Database & Caching

**Actions:**

- [ ] Implement query result caching in `src/lib/cache.ts`
- [ ] Add stale-while-revalidate pattern for API calls
- [ ] Optimize IndexedDB batch operations
- [ ] Add request deduplication for concurrent calls

---

## 2. Code Quality Enhancement

### 2.1 Type Safety Improvements

**Actions:**

- [ ] Replace `any` types with proper generics
- [ ] Add stricter TypeScript config options:
  ```json
  {
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
  ```
- [ ] Create branded types for IDs:
  ```typescript
  type ProjectId = string & { __brand: 'ProjectId' };
  type ChapterId = string & { __brand: 'ChapterId' };
  ```
- [ ] Add Zod runtime validation at API boundaries

**Files:**

- `tsconfig.json`
- `src/types/index.ts`
- `src/shared/types/`

### 2.2 Error Handling Enhancement

**Actions:**

- [ ] Standardize error codes across services
- [ ] Add error recovery strategies per error type
- [ ] Implement circuit breaker for AI calls
- [ ] Add error telemetry hooks
- [ ] Create user-friendly error messages map

**Files:**

- `src/lib/errors/`
- `src/services/`

### 2.3 Test Coverage Expansion

**Actions:**

- [ ] Add coverage reporting:
  ```typescript
  // vitest.config.ts
  coverage: {
    provider: 'v8',
    reporter: ['text', 'html', 'lcov'],
    thresholds: { lines: 80, branches: 75 }
  }
  ```
- [ ] Write tests for uncovered services:
  - `publishingAnalyticsService.ts`
  - `character-validation.ts`
  - `epub.ts`
- [ ] Add integration tests for critical flows
- [ ] Fix Framer Motion test warnings

**Files:**

- `vitest.config.ts`
- `src/test/setup.ts`
- `src/**/**.test.ts`

---

## 3. Architecture Enhancement

### 3.1 Service Layer Standardization

**Pattern:**

```typescript
interface BaseService<T> {
  getById(id: string): Promise<Result<T, AppError>>;
  getAll(filter?: Filter): Promise<Result<T[], AppError>>;
  create(data: CreateDTO<T>): Promise<Result<T, AppError>>;
  update(id: string, data: UpdateDTO<T>): Promise<Result<T, AppError>>;
  delete(id: string): Promise<Result<void, AppError>>;
}
```

**Actions:**

- [ ] Create `BaseService` interface
- [ ] Refactor existing services to implement interface
- [ ] Add retry logic with exponential backoff
- [ ] Standardize error transformation

**Files:**

- `src/shared/types/service.ts` (new)
- `src/features/*/services/*.ts`

### 3.2 State Management Optimization

**Actions:**

- [ ] Split large stores into focused slices
- [ ] Add Zustand devtools in development
- [ ] Implement persist middleware for critical state
- [ ] Create selector factories for common patterns

**Example:**

```typescript
// Optimized selector
const useProjectTitle = (id: string) =>
  useProjectStore(
    useShallow(state => state.projects.find(p => p.id === id)?.title),
  );
```

**Files:**

- `src/lib/stores/`
- `src/features/*/hooks/`

### 3.3 Component Architecture

**Actions:**

- [ ] Consolidate duplicate components:
  - `error-boundary.tsx` + `ErrorBoundary.tsx`
  - `ProjectDashboard.tsx` + `ProjectDashboardOptimized.tsx`
- [ ] Create compound component patterns for complex UI
- [ ] Extract shared hooks to `src/shared/hooks/`
- [ ] Implement render props for flexible composition

---

## 4. Developer Experience

### 4.1 Tooling Enhancement

**New Scripts:**

```json
{
  "scripts": {
    "analyze": "vite build --mode analyze",
    "coverage": "vitest run --coverage",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf dist .cache node_modules/.vite",
    "lint:strict": "eslint . --max-warnings 0 --rule 'no-console: error'",
    "test:ci": "vitest run --reporter=junit --outputFile=test-results.xml"
  }
}
```

**Actions:**

- [ ] Add scripts to `package.json`
- [ ] Configure VS Code tasks
- [ ] Add pre-push hook for tests
- [ ] Set up commit message linting

### 4.2 Documentation

**Actions:**

- [ ] Add JSDoc to all public APIs
- [ ] Create `ARCHITECTURE.md` in root
- [ ] Document component props with TypeDoc
- [ ] Add inline code examples in comments
- [ ] Create `CONTRIBUTING.md`

### 4.3 Debug Tooling

**Actions:**

- [ ] Add React DevTools profiler markers
- [ ] Create debug logging utility
- [ ] Add performance marks for critical paths
- [ ] Implement feature flags system

---

## 5. Security & Reliability

### 5.1 Security Hardening

**Actions:**

- [ ] Audit dependencies with `npm audit`
- [ ] Add Content Security Policy headers
- [ ] Sanitize user input in editor
- [ ] Implement rate limiting for AI calls
- [ ] Add request signing for API calls

### 5.2 Reliability Improvements

**Actions:**

- [ ] Add health check endpoint
- [ ] Implement graceful degradation for AI failures
- [ ] Add offline detection and handling
- [ ] Create data backup/export functionality
- [ ] Add auto-save with conflict resolution

---

## Implementation Priority

| Phase      | Focus                               | Effort    | Impact |
| ---------- | ----------------------------------- | --------- | ------ |
| **Week 1** | Quick wins (scripts, consolidation) | 8-12 hrs  | Medium |
| **Week 2** | Performance (memo, lazy loading)    | 12-16 hrs | High   |
| **Week 3** | Type safety & testing               | 16-20 hrs | High   |
| **Week 4** | Architecture refactoring            | 20-24 hrs | High   |
| **Week 5** | Documentation & DX                  | 8-12 hrs  | Medium |
| **Week 6** | Security & reliability              | 12-16 hrs | High   |

**Total:** 76-100 hours (~3-4 sprints)

---

## Quick Start Checklist

Start with these high-impact, low-effort items:

- [ ] Add bundle analyzer (30 min)
- [ ] Add coverage reporting (30 min)
- [ ] Consolidate error boundaries (1 hr)
- [ ] Add `React.memo` to 5 heavy components (2 hrs)
- [ ] Fix test warnings (2 hrs)
- [ ] Add new npm scripts (30 min)

---

## Success Metrics

| Metric                 | Current      | Target |
| ---------------------- | ------------ | ------ |
| Bundle Size            | ~500KB (est) | <400KB |
| Lighthouse Performance | Unknown      | ≥90    |
| Test Coverage          | Unknown      | ≥80%   |
| TypeScript Strict      | Partial      | Full   |
| Build Time             | ~15s         | <10s   |
| First Contentful Paint | Unknown      | <1.5s  |

---

## Related Documents

- `plans/CODEBASE-IMPROVEMENT-GOAP.md` - Detailed technical debt items
- `plans/ROADMAP-2025-Q1.md` - Timeline integration
- `plans/ERROR-HANDLING-GUIDE.md` - Error patterns reference
