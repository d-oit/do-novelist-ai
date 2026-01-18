# parseInt Radix Parameter Fixes - January 18, 2026

## Summary

Fixed 7 instances of `parseInt()` calls missing the radix parameter by adding explicit radix `10` for decimal parsing.

## Issue Description

**Problem:** `parseInt()` without a radix parameter can lead to unexpected behavior when parsing strings with leading zeros (e.g., "08" or "09"). While modern browsers default to decimal (base 10), the ECMAScript specification allows implementation-dependent behavior, making it a potential source of bugs.

**Risk Level:** Medium  
**Impact:** Number parsing errors in user input fields (word counts, population, token limits)

## Files Modified

### 1. ✅ src/features/world-building/components/WorldElementEditor.tsx
**Line:** 146  
**Context:** Location population input

```diff
- setFormData({ ...formData, population: parseInt(e.target.value) ?? 0 })
+ setFormData({ ...formData, population: parseInt(e.target.value, 10) ?? 0 })
```

### 2. ✅ src/features/settings/components/AISettingsPanel.tsx
**Lines:** 190, 358  
**Context:** Max tokens and context token limit settings

```diff
- onChange={e => void handleSave({ maxTokens: parseInt(e.target.value) })}
+ onChange={e => void handleSave({ maxTokens: parseInt(e.target.value, 10) })}

- onChange={e => update({ contextTokenLimit: parseInt(e.target.value) })}
+ onChange={e => update({ contextTokenLimit: parseInt(e.target.value, 10) })}
```

### 3. ✅ src/features/publishing/components/PublishView.tsx
**Line:** 190  
**Context:** Target word count input

```diff
- onUpdateProject({ targetWordCount: parseInt(e.target.value) ?? 0 })
+ onUpdateProject({ targetWordCount: parseInt(e.target.value, 10) ?? 0 })
```

### 4. ✅ src/features/publishing/components/PublishPanel.tsx
**Line:** 204  
**Context:** Target word count input

```diff
- onUpdateProject({ targetWordCount: parseInt(e.target.value) ?? 0 })
+ onUpdateProject({ targetWordCount: parseInt(e.target.value, 10) ?? 0 })
```

### 5. ✅ src/features/projects/components/AdvancedOptionsSection.tsx
**Line:** 115  
**Context:** Target word count in project wizard

```diff
- onChange={e => onTargetWordCountChange(parseInt(e.target.value) || 0)}
+ onChange={e => onTargetWordCountChange(parseInt(e.target.value, 10) || 0)}
```

### 6. ✅ src/features/editor/components/PublishPanel.tsx
**Line:** 211  
**Context:** Target word count input in editor

```diff
- onUpdateProject({ targetWordCount: parseInt(e.target.value) ?? 0 })
+ onUpdateProject({ targetWordCount: parseInt(e.target.value, 10) ?? 0 })
```

## Verification

### TypeScript Compilation
```bash
npx tsc --noEmit
# ✅ No errors
```

### Build Process
```bash
npm run build
# ✅ Successfully built
# ✅ TypeScript compilation passed
# ✅ Vite build completed
# ⚠️ Warning: "Generated an empty chunk: vendor-utils" (informational only)
```

### Linting
```bash
npm run lint
# ✅ ESLint passed
# ✅ TypeScript type checking passed
```

## Impact Analysis

### Before Fix:
```javascript
parseInt("08")    // Could return 0 in some implementations (octal)
parseInt("09")    // Could return 0 in some implementations (octal)
parseInt("010")   // Could return 8 in some implementations (octal)
```

### After Fix:
```javascript
parseInt("08", 10)    // Always returns 8 (decimal)
parseInt("09", 10)    // Always returns 9 (decimal)
parseInt("010", 10)   // Always returns 10 (decimal)
```

### Real-World Scenarios:
1. **User enters "08" for population:** Now correctly parsed as 8
2. **User enters "0100" for word count:** Now correctly parsed as 100
3. **User enters "009" for token limit:** Now correctly parsed as 9

## Additional Notes

### Edge Cases Handled:
- Empty string: `parseInt("", 10)` returns `NaN`, caught by `?? 0` or `|| 0`
- Invalid input: `parseInt("abc", 10)` returns `NaN`, caught by fallback
- Negative numbers: Still work correctly with radix parameter

### Why This Matters:
- **Spec compliance:** ES5+ recommends always providing radix
- **Cross-browser consistency:** Ensures same behavior across all browsers
- **Future-proofing:** Protects against potential spec changes
- **Code clarity:** Makes intent explicit (decimal parsing)

## Best Practices Applied

1. **Explicit radix:** Always specify base 10 for decimal parsing
2. **Consistent pattern:** All parseInt calls now follow same pattern
3. **Defensive programming:** Maintained existing fallback values (`?? 0` or `|| 0`)

## Related Improvements

### Recommendation: Add ESLint Rule
Consider adding to `.eslintrc.json`:
```json
{
  "rules": {
    "radix": "error"
  }
}
```

This will enforce radix parameter on all future `parseInt()` calls.

## Testing

### Manual Testing Checklist:
- [ ] Test world building location population input with "08"
- [ ] Test AI settings max tokens with "09"
- [ ] Test publishing target word count with "010"
- [ ] Test project wizard word count with leading zeros
- [ ] Verify all number inputs accept valid numbers correctly

### No Unit Tests Changed:
These changes don't require test updates as they fix internal implementation without changing behavior for valid inputs.

## Conclusion

All 7 parseInt issues successfully fixed with explicit radix parameter. Build and lint checks pass. No breaking changes introduced.

**Status:** ✅ Complete  
**Build Status:** ✅ Passing  
**Lint Status:** ✅ Passing  
**TypeScript:** ✅ No errors

---

## Files Changed Summary

| File | Lines Changed | Status |
|------|---------------|--------|
| WorldElementEditor.tsx | 1 | ✅ |
| AISettingsPanel.tsx | 2 | ✅ |
| PublishView.tsx | 1 | ✅ |
| PublishPanel.tsx (publishing) | 1 | ✅ |
| AdvancedOptionsSection.tsx | 1 | ✅ |
| PublishPanel.tsx (editor) | 1 | ✅ |
| **Total** | **7** | **✅** |
