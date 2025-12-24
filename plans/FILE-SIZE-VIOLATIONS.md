# File Size Violations Tracking

**Status**: ✅ ACCEPTABLE - All violations marked as acceptable **Last
Updated**: December 24, 2025

This document tracks files exceeding the 500 LOC limit and refactoring
decisions.

**Policy**: Maximum 500 lines of code per file for maintainability.

## Current Status (4 files exceeding limit)

| File                                                                 | LOC  | Excess | Priority | Status        | Notes                                        |
| -------------------------------------------------------------------- | ---- | ------ | -------- | ------------- | -------------------------------------------- |
| `src/features/editor/components/BookViewer.tsx`                      | 67   | 0      | -        | ✅ Solved     | Refactored into sub-components               |
| `src/lib/ai.ts`                                                      | ~15  | 0      | -        | ✅ Solved     | Split into `ai-core.ts` & `ai-operations.ts` |
| `src/features/writing-assistant/services/writingAssistantService.ts` | 766  | +266   | LOW      | ✅ Acceptable | Cohesive service with high test coverage     |
| `src/features/publishing/services/epubService.ts`                    | 722  | +222   | LOW      | ✅ Acceptable | Complex EPUB generation logic                |
| `src/lib/character-validation.ts`                                    | 692  | +192   | LOW      | ✅ Acceptable | Type validation schemas, mostly data         |
| `src/lib/validation.ts`                                              | 516  | +16    | LOW      | ✅ Acceptable | Validation logic                             |
| `src/features/generation/components/BookViewer.tsx`                  | ~250 | 0      | -        | ✅ Solved     | Refactored into sub-components               |
| `src/features/projects/components/ProjectWizard.tsx`                 | 532  | +32    | LOW      | ✅ Acceptable | Monitor growth                               |

## Decision: Acceptable Violations

After review, the following files are marked as **ACCEPTABLE** because:

1. **Cohesive functionality** - Each file contains related logic
2. **Well-structured** - Clear organization, no unnecessary complexity
3. **Test coverage** - Writing assistant and validation have comprehensive tests
4. **Low churn** - These files don't change frequently

No refactoring is required. The file size policy is enforced for new violations
only.

## History

- **2024-12-19**: Initial audit - 7 violations identified
- **2024-12-19**: Created tracking document and CI integration
- **2024-12-24**: BookViewer refactoring completed (2 files)
- **2024-12-24**: AI layer split completed
- **2024-12-24**: All violations marked as ACCEPTABLE

## CI Integration

The file size checker runs on every PR to prevent new violations:

```bash
npm run check:file-size
```

This will exit with code 1 if any NEW violations are found, blocking the merge.
Existing violations are grandfathered in.

## Notes

- LOC count excludes comments and empty lines
- Violations are tracked at the component/service level
- Focus on maintainability over arbitrary line limits
- Some complex files may remain acceptable if well-structured
