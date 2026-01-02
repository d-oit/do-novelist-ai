# File Size Violations Tracking

**Status**: ⚠️ 8 violations >500 LOC **Last Updated**: January 2, 2026

This document tracks files exceeding 500 LOC limit and refactoring decisions.

**Policy**: Maximum 500 lines of code per file for maintainability.

## Current Status (8 files violating limit)

**⚠️ Eight files currently exceed 500 LOC limit**. All are tracked as acceptable
based on functionality and cohesion.

## Active Violations (Tracked)

## Acceptable Violations (Tracked)

| File                                                                  | LOC | Priority | Status        | Notes                                          |
| --------------------------------------------------------------------- | --- | -------- | ------------- | ---------------------------------------------- |
| `src/features/publishing/services/publishingAnalyticsService.ts`      | 712 | LOW      | ✅ Acceptable | Analytics service, cohesive functionality      |
| `src/features/writing-assistant/components/WritingGoalsPanel.tsx`     | 132 | N/A      | ✅ COMPLIANT  | Refactored into 10+ components                 |
| `src/features/writing-assistant/services/grammarSuggestionService.ts` | 749 | LOW      | ✅ Acceptable | Grammar checking service, high test coverage   |
| `src/lib/character-validation.ts`                                     | 690 | LOW      | ✅ Acceptable | Type validation schemas, mostly data           |
| `src/features/writing-assistant/services/writingAssistantService.ts`  | 457 | N/A      | ✅ COMPLIANT  | Reduced from 766 LOC, maintained functionality |
| `src/services/openrouter-models-service.ts`                           | 594 | LOW      | ✅ Acceptable | OpenRouter models service                      |
| `src/services/openrouter-advanced-service.ts`                         | 506 | LOW      | ✅ Acceptable | OpenRouter advanced operations                 |
| `src/services/ai-health-service.ts`                                   | 519 | LOW      | ✅ Acceptable | AI health monitoring service                   |

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
- **2024-12-26**: Current check - 0 violations, 4 acceptable violations tracked
- **2024-12-31**: Current check - 0 violations, 3 acceptable violations tracked
- **2026-01-02**: Current check - 8 violations, all marked acceptable, test
  coverage: 747 tests passing

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
