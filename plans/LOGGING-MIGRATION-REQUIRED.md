# Logging Migration Required - December 24, 2025

**Date**: December 24, 2025 **Status**: PENDING - Not Started **Priority**: P0
(Critical) **Estimated Effort**: 5.5 hours

---

## Executive Summary

The structured logging migration is **incomplete**. Despite claims of 100%
completion, approximately **173 console statements** remain across **41 files**
in production code.

**Reality Check**:

- Claims: 0 console statements remaining (100% done)
- Reality: 173 console statements in 41 files (~30% done)

---

## GOAP Goal

**Goal**: Complete structured logging migration across entire codebase

**Target State**:

- Zero console.log/error/warn/info in production code (excluding logger.ts)
- All logging routed through centralized `logger` from `@/lib/logging/logger`
- Consistent log metadata (component, context) across all log entries

**Preconditions**:

- Logger infrastructure exists and is functional
- ESLint rule disables console in production

**Effects**:

- Improved production debugging
- Consistent log format
- Enable log aggregation in production

---

## Current State Analysis

### Files with Console Statements (41 total)

| Directory                   | Files  | Console Statements |
| --------------------------- | ------ | ------------------ |
| lib/db/                     | 1      | 12                 |
| features/settings/          | 1      | 6                  |
| features/writing-assistant/ | 4      | 28                 |
| features/world-building/    | 1      | 10                 |
| features/publishing/        | 2      | 4                  |
| features/versioning/        | 5      | 10                 |
| features/analytics/         | 1      | 1                  |
| features/gamification/      | 1      | 1                  |
| components/ai/              | 2      | 3                  |
| lib/stores/                 | 1      | 4                  |
| lib/errors/                 | 1      | 1                  |
| lib/utils/                  | 1      | 2                  |
| Root src/                   | 4      | 6                  |
| **Total**                   | **41** | **~173**           |

### Files by Priority

#### P0 - Critical (Imports logger but uses console)

```
src/features/writing-assistant/services/writingAssistantService.ts
src/lib/stores/versioningStore.ts
```

These files import `logger` but still use `console.error`, indicating incomplete
migration.

#### P1 - High Priority (High statement count)

| File                                                          | Count |
| ------------------------------------------------------------- | ----- |
| src/lib/db/ai-preferences.ts                                  | 12    |
| src/features/world-building/hooks/useWorldBuilding.ts         | 10    |
| src/features/writing-assistant/services/writingAssistantDb.ts | 6     |
| src/features/settings/services/settingsService.ts             | 6     |
| src/features/writing-assistant/hooks/useWritingAssistant.ts   | 6     |

#### P2 - Medium Priority (Moderate count)

| File                                                           | Count |
| -------------------------------------------------------------- | ----- |
| src/features/versioning/components/VersionHistory.tsx          | 2     |
| src/features/versioning/components/VersionComparison.tsx       | 1     |
| src/app/App.tsx                                                | 3     |
| src/features/publishing/services/publishingAnalyticsService.ts | 3     |

#### P3 - Low Priority (Few statements)

| File                                | Count |
| ----------------------------------- | ----- |
| src/lib/utils.ts                    | 2     |
| src/index.tsx                       | 2     |
| src/code-splitting.tsx              | 2     |
| src/performance.ts                  | 1     |
| And 20+ files with 1 statement each |

---

## Migration Pattern

### Before (Production Code)

```typescript
console.error('Failed to save project', error);
console.log('User action:', action);
console.warn('Deprecated feature used');
```

### After (Production Code)

```typescript
import { logger } from '@/lib/logging/logger';

// Error with context
logger.error('Failed to save project', {
  component: 'ProjectService',
  error,
  projectId,
});

// Info with metadata
logger.info('User action', {
  component: 'UserInteractionTracker',
  action,
  userId,
});

// Warning with context
logger.warn('Deprecated feature used', {
  component: 'FeatureFlags',
  feature: 'legacy-mode',
  suggestion: 'Use new API instead',
});
```

### ESLint Configuration

The ESLint rule should catch new console statements:

```json
{
  "no-console": "error",
  "no-debugger": "error"
}
```

Exception: `src/lib/logging/logger.ts` - intentionally uses console for output

---

## Execution Plan

### Phase 1: Critical Fixes (Priority P0)

**Time Estimate**: 30 minutes

1. Fix `writingAssistantService.ts` - Remove console statements
2. Fix `versioningStore.ts` - Remove console statements

**Quality Gate**: Zero console statements in these files

### Phase 2: High-Priority Files (Priority P1)

**Time Estimate**: 2 hours

1. `ai-preferences.ts` (12 statements)
2. `useWorldBuilding.ts` (10 statements)
3. `writingAssistantDb.ts` (6 statements)
4. `settingsService.ts` (6 statements)
5. `useWritingAssistant.ts` (6 statements)

**Quality Gate**: No console statements in lib/db/, features/writing-assistant/

### Phase 3: Medium-Priority Files (Priority P2)

**Time Estimate**: 1.5 hours

1. Versioning components (3 files)
2. App.tsx
3. Publishing services

### Phase 4: Low-Priority Files (Priority P3)

**Time Estimate**: 1.5 hours

1. Root src/ files
2. Utils and helpers
3. Remaining AI components

---

## File-by-File Migration Guide

### lib/db/ai-preferences.ts (12 statements)

```typescript
// Line 45: console.error -> logger.error
logger.error('Failed to load AI preferences', {
  component: 'AIPreferencesDB',
  error,
});

// Lines 78, 112, 156, 189, 234, 267, 289, 312, 345, 378: Similar pattern
```

### features/world-building/hooks/useWorldBuilding.ts (10 statements)

```typescript
// All console.error calls should become logger.error with hook context
logger.error('Validation failed', {
  component: 'WorldBuilding',
  operation: 'validate',
  elementId,
  errors,
});
```

### features/writing-assistant/services/writingAssistantDb.ts (6 statements)

```typescript
// Console.warn and console.error -> logger.warn/error
logger.warn('Cache miss for writing session', {
  component: 'WritingAssistantDB',
  sessionId,
});

logger.error('Failed to persist writing session', {
  component: 'WritingAssistantDB',
  error,
  sessionId,
});
```

---

## Validation Checklist

- [ ] ESLint `no-console` passes
- [ ] No console statements in grep for src/ (excluding test files)
- [ ] All tests pass (588 tests)
- [ ] Build succeeds
- [ ] Linting passes
- [ ] Log output verified in development mode

---

## Anti-Patterns to Avoid

1. **Don't wrap logger calls in try/catch** - logger handles errors internally
2. **Don't pass sensitive data in log context** - use sanitizeLogContext
3. **Don't use console for debugging** - use logger.debug() instead
4. **Don't log the same message multiple times** - consolidate to single log
   entry

---

## Related Documents

- `CODEBASE-IMPROVEMENTS-GOAP-PLAN.md` - Original plan
- `GOAP-EXECUTION-DEC-24-2025.md` - Previous execution attempt (archived)
- `PLAN-INVENTORY.md` - Master plan inventory

---

## Success Criteria

1. **Zero console statements** in production code (excluding logger.ts)
2. **All log entries** include component context
3. **Consistent format** across all logged messages
4. **Tests pass** without modification
5. **Build succeeds** without warnings

---

**Plan Status**: Ready for Execution **Next Action**: Execute Phase 1 (Critical
Fixes)
