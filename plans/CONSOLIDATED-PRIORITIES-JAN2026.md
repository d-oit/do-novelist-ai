# Consolidated Priorities - January 2026

**Date**: 2026-01-13  
**Status**: Active  
**Purpose**: Single source of truth for current priorities

---

## Immediate (This Week)

### 1. Export Enhancements (PRIORITY)

- **Goal**: Professional-grade export with PDF templates
- **Owner**: feature-implementer-01
- **Database**: Turso DB (local + cloud) for export history
- **Reference**:
  [FEATURE-OPPORTUNITIES-JAN2026.md](FEATURE-OPPORTUNITIES-JAN2026.md)

### 2. Phase 1B: Begin Large File Refactoring

- **File**: `character-validation.ts` (766 LOC → 7 modules)
- **Owner**: feature-implementer-02
- **Reference**:
  [PHASE-1A-REFACTORING-ANALYSIS-JAN2026.md](PHASE-1A-REFACTORING-ANALYSIS-JAN2026.md)
- **Quality Gate**: All files <600 LOC, tests passing

### 3. React Query: Migrate Characters Feature

- **Source**: Projects feature patterns
- **Owner**: feature-implementer-03
- **Database**: Turso DB queries via React Query
- **Reference**:
  [REACT-QUERY-INTEGRATION-SUMMARY-JAN2026.md](REACT-QUERY-INTEGRATION-SUMMARY-JAN2026.md)
- **Quality Gate**: Query hooks + optimistic updates + tests

---

## Short-term (Next 2 Weeks)

### 3. Phase 1B: Complete Remaining File Refactors

- `publishingAnalyticsService.ts` (751 LOC)
- `world-building-service.ts` (698 LOC)
- `grammarSuggestionService.ts` (689 LOC)
- `plotStorageService.ts` (619 LOC)

### 4. React Query: Migrate Additional Features

- Analytics feature
- World-building feature
- Publishing feature

### 5. Test Coverage: Reach 50% Milestone

- Current: 45.4%
- Target: 50%
- Focus: UI components (currently 45%)

---

## Medium-term (Next Month)

### 6. Repository Pattern: Design & Prototype

- Design repository interfaces
- Prototype for Projects entity
- Reference:
  [ARCHITECTURE-INTEGRITY-ASSESSMENT-JAN2026.md](ARCHITECTURE-INTEGRITY-ASSESSMENT-JAN2026.md)

### 7. Dependency Injection: Evaluate Approaches

- Research DI patterns for TypeScript
- Design lightweight container
- Reference: ARCHITECTURE document Phase 3

### 8. Documentation: Feature-Level READMEs

- 0/14 features currently documented
- Target: Top 5 features (projects, editor, plot-engine, characters, publishing)

---

## Long-term (Next Quarter)

### 9. Test Coverage: Reach 60% Target

- Line coverage goal
- UI component coverage to 70%

### 10. Advanced Features

- Circuit breaker pattern for API calls
- Performance optimization (virtualization)
- Bundle size optimization

---

## Quality Metrics to Track

| Metric               | Current | Target | Status         |
| -------------------- | ------- | ------ | -------------- |
| Files >600 LOC       | 5       | 0      | ⚠️ In Progress |
| Line Coverage        | 45.4%   | 60%    | ⚠️ In Progress |
| React Query Features | 1/14    | 14/14  | 🔄 Active      |
| Lint Errors          | 0       | 0      | ✅ Maintained  |
| Build Status         | ✅      | ✅     | ✅ Maintained  |

---

## Dependencies Map

```
Phase 1B Refactoring
    └── Enables better testability
            └── Test Coverage Expansion
                    └── Confidence for Architecture Changes
                            └── Repository Pattern
                            └── Dependency Injection

React Query Migration (parallel track)
    └── Reduces boilerplate
    └── Improves caching
    └── Better error handling
```

---

## Cross-References

- [IMPLEMENTATION-STATUS-JAN2026.md](IMPLEMENTATION-STATUS-JAN2026.md) -
  Detailed task status
- [GOAP-EXECUTION-PLAN-JAN2026.md](GOAP-EXECUTION-PLAN-JAN2026.md) - Agent
  orchestration
- [PHASE-1A-REFACTORING-ANALYSIS-JAN2026.md](PHASE-1A-REFACTORING-ANALYSIS-JAN2026.md) -
  File analysis
- [FEATURE-OPPORTUNITIES-JAN2026.md](FEATURE-OPPORTUNITIES-JAN2026.md) - New
  features

---

**Review Cadence**: Weekly  
**Next Review**: 2026-01-20  
**Owner**: GOAP Orchestration Agent
