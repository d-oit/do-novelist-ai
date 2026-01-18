# Potential Bugs Analysis - January 18, 2026

## Executive Summary

Conducted comprehensive code analysis searching for runtime bugs, edge cases, and potential issues. Found **3 categories of issues** requiring attention:

- 🟡 **Medium Priority**: 2 issues (parseInt without radix, window.confirm usage)
- 🟢 **Low Priority**: 1 issue (JSON.parse error handling)
- ✅ **No Issues Found**: Async/await patterns, XSS vulnerabilities, race conditions

---

## 🟡 Medium Priority Issues

### 1. parseInt() Missing Radix Parameter

**Severity:** Medium  
**Impact:** Potential incorrect number parsing (e.g., leading zeros interpreted as octal)

**Affected Files:**
1. `src/features/world-building/components/WorldElementEditor.tsx:146`
2. `src/features/settings/components/AISettingsPanel.tsx:190`
3. `src/features/settings/components/AISettingsPanel.tsx:358`
4. `src/features/publishing/components/PublishView.tsx:190`
5. `src/features/publishing/components/PublishPanel.tsx:204`
6. `src/features/projects/components/AdvancedOptionsSection.tsx:116`
7. `src/features/editor/components/PublishPanel.tsx:211`

**Example:**
```typescript
// Current (potentially problematic):
setFormData({ ...formData, population: parseInt(e.target.value) ?? 0 })

// Should be:
setFormData({ ...formData, population: parseInt(e.target.value, 10) ?? 0 })
```

**Risk:**
- If user enters "08" or "09", parseInt without radix may return 0 (octal interpretation)
- Modern browsers treat it as decimal, but spec allows implementation-dependent behavior

**Recommendation:** Add explicit radix parameter (10) to all parseInt calls.

---

### 2. window.confirm() Usage for Destructive Actions

**Severity:** Medium  
**Impact:** Poor UX, not accessible, blocks UI thread

**Affected Files:**
1. `src/features/analytics/components/GoalsManager.tsx:428`
2. `src/features/versioning/components/VersionHistory.tsx:109`

**Example:**
```typescript
const handleDeleteGoal = (goalId: string): void => {
  if (window.confirm('Are you sure you want to delete this goal?')) {
    // Implementation would call analytics service to delete goal
    logger.info('Delete goal:', { goalId });
  }
};
```

**Issues:**
- Blocks main UI thread
- Not keyboard accessible
- No customization (styling, animations)
- Cannot be tested easily
- Poor mobile experience

**Recommendation:** Replace with custom modal dialog component:
```typescript
const handleDeleteGoal = (goalId: string): void => {
  setConfirmDialog({
    open: true,
    title: 'Delete Goal',
    message: 'Are you sure you want to delete this goal?',
    onConfirm: () => {
      // Delete logic
      logger.info('Delete goal:', { goalId });
    }
  });
};
```

---

## 🟢 Low Priority Issues

### 3. JSON.parse() Error Handling on localStorage

**Severity:** Low  
**Impact:** App crash if localStorage contains corrupted data

**Affected Files:**
- `src/lib/db.ts:255, 393, 450, 486`
- `src/lib/database/services/project-service.ts:195, 255, 322, 361`
- `src/features/projects/services/db.ts:259, 367, 410, 442`

**Current Pattern:**
```typescript
const projects = JSON.parse(localStorage.getItem(LOCAL_PROJECTS_KEY) ?? '{}') as Record<
  string,
  Project
>;
```

**Risk:**
- If localStorage is corrupted or manually edited, JSON.parse throws exception
- App crash with no recovery path
- Nullish coalescing (`??`) provides default only if `getItem` returns null, not if parsing fails

**Recommendation:** Add try-catch wrapper:
```typescript
let projects: Record<string, Project> = {};
try {
  const stored = localStorage.getItem(LOCAL_PROJECTS_KEY);
  if (stored) {
    projects = JSON.parse(stored) as Record<string, Project>;
  }
} catch (error) {
  logger.error('Failed to parse localStorage projects', { error });
  // Optionally clear corrupted data
  localStorage.removeItem(LOCAL_PROJECTS_KEY);
}
```

---

## ✅ No Issues Found

### Async/Await Patterns
✅ **All async map calls properly wrapped in Promise.all()**
- `src/features/generation/hooks/useGoapEngine.utils.ts:187` - ✅ Good
- `src/features/semantic-search/services/search-service.ts:93` - ✅ Good  
- `src/features/editor/hooks/useGoapEngine.ts:286` - ✅ Good

### XSS Vulnerabilities
✅ **No dangerous HTML injection patterns found**
- Only 2 innerHTML usages: test setup and error display (controlled)
- No `dangerouslySetInnerHTML` in production code
- No `eval()` or `Function()` constructor usage

### Race Conditions
✅ **No obvious race conditions detected**
- useEffect cleanup functions properly implemented
- Event listeners properly removed
- No unsynchronized shared state mutations

### Empty Catch Blocks
✅ **No silent error swallowing**
- All catch blocks either log errors or have explanatory comments

### Division by Zero
✅ **Math operations appear safe**
- No obvious division operations without guards

---

## Code Quality Observations

### Good Practices Found:

1. **Proper Logger Usage** ✅
   - No `console.log` in production code (only JSDoc examples)
   - Consistent use of `logger.error()`, `logger.info()`, etc.

2. **Type Safety** ✅
   - Strict TypeScript enabled
   - Minimal use of `@ts-ignore` (only in test files)

3. **Error Handling** ✅
   - Try-catch blocks around async operations
   - Proper error logging with context

4. **Window/Document Guards** ✅
   - Most window/document usage properly guarded with `typeof` checks
   - SSR-safe patterns

5. **Input Validation** ✅
   - Zod schemas for runtime validation
   - Type guards for type narrowing

---

## Detailed Breakdown by Category

### parseInt Issues (7 occurrences)
| File | Line | Context |
|------|------|---------|
| WorldElementEditor.tsx | 146 | Population input parsing |
| AISettingsPanel.tsx | 190 | Max tokens setting |
| AISettingsPanel.tsx | 358 | Context token limit |
| PublishView.tsx | 190 | Target word count |
| PublishPanel.tsx | 204 | Target word count |
| AdvancedOptionsSection.tsx | 116 | Target word count |
| PublishPanel.tsx (editor) | 211 | Target word count |

### window.confirm Issues (2 occurrences)
| File | Line | Context |
|------|------|---------|
| GoalsManager.tsx | 428 | Delete goal confirmation |
| VersionHistory.tsx | 109 | Delete version confirmation |

### JSON.parse localStorage Issues (14 occurrences)
| File | Lines | Pattern |
|------|-------|---------|
| db.ts | 255, 393, 450, 486 | Project storage |
| project-service.ts | 195, 255, 322, 361 | Project service |
| db.ts (features/projects) | 259, 367, 410, 442 | Duplicate service |
| versioning-service.ts | 31 | Settings storage |

---

## Recommendations Summary

### Immediate Actions (Medium Priority)
1. ✅ Add radix parameter to all `parseInt()` calls (7 files)
2. ✅ Replace `window.confirm()` with custom dialog components (2 files)

### Preventive Actions (Low Priority)
3. ✅ Add try-catch around localStorage JSON.parse operations (3 files)

### Future Improvements
4. Consider adding ESLint rule: `radix: "error"` to enforce parseInt radix
5. Consider adding ESLint rule: `no-restricted-globals` to prevent window.confirm
6. Add utility function for safe JSON parsing from localStorage

---

## Implementation Priority

### Phase 1: Quick Wins (Estimated: 30 minutes)
- Fix all parseInt calls (simple find-replace with verification)

### Phase 2: UX Improvements (Estimated: 2 hours)
- Create reusable ConfirmDialog component
- Replace window.confirm usages
- Add tests for new component

### Phase 3: Robustness (Estimated: 1 hour)
- Add safe JSON parsing wrapper
- Replace all localStorage JSON.parse calls
- Add error recovery logic

---

## Testing Strategy

### Unit Tests Needed:
1. Test parseInt with edge cases (leading zeros, empty string, NaN)
2. Test ConfirmDialog component (keyboard navigation, accessibility)
3. Test localStorage error recovery (corrupted data, quota exceeded)

### E2E Tests Needed:
1. Test delete confirmations flow
2. Test number input validation
3. Test data persistence and recovery

---

## Additional Notes

### False Positives Investigated:
- **Async map patterns**: All properly wrapped in Promise.all() ✅
- **Array indexing**: All appear safe with proper bounds checking ✅
- **State updates**: No stale closure issues found ✅

### Code Smells (Not Bugs):
- Some duplicate code between `src/lib/db.ts` and `src/features/projects/services/db.ts`
- Consider consolidating localStorage project storage logic

---

## Conclusion

The codebase is generally **well-maintained** with good error handling practices. The issues found are minor and easily fixable. No critical bugs or security vulnerabilities detected.

**Risk Assessment:**
- 🔴 Critical: 0
- 🟠 High: 0  
- 🟡 Medium: 2
- 🟢 Low: 1
- ✅ Info: Multiple good practices observed

**Recommended Action:** Proceed with Phase 1 fixes for parseInt issues as they're quick wins with minimal risk.
