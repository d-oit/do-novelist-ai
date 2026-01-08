# File Size Violations - January 2026

## Overview

This document tracks files that exceed the project's 600 Lines of Code (LOC)
limit. These files have been granted temporary exceptions and are tracked for
future refactoring.

**Project Standard**: Maximum 600 LOC per file **Warning Threshold**: 550 LOC
**Last Updated**: January 8, 2026

## Policy Update History

- **January 8, 2026**: Increased limit from 500 LOC to 600 LOC to reduce
  refactoring burden while maintaining reasonable file sizes
- **Previous**: 500 LOC limit with 450 LOC warning threshold

## Current Violations

### Production Files (4 files)

| File                                                                  | LOC  | Excess | Priority | Status  |
| --------------------------------------------------------------------- | ---- | ------ | -------- | ------- |
| `src/features/plot-engine/services/plotGenerationService.ts`          | 1061 | +461   | High     | Tracked |
| `src/features/publishing/services/publishingAnalyticsService.ts`      | 712  | +112   | Medium   | Tracked |
| `src/lib/character-validation.ts`                                     | 690  | +90    | Medium   | Tracked |
| `src/features/writing-assistant/services/grammarSuggestionService.ts` | 634  | +34    | Low      | Tracked |

### Test Files (4 files)

| File                                                                                    | LOC | Excess | Priority | Status  |
| --------------------------------------------------------------------------------------- | --- | ------ | -------- | ------- |
| `src/features/plot-engine/services/__tests__/rag-end-to-end.test.ts`                    | 935 | +335   | Low      | Tracked |
| `src/features/plot-engine/services/__tests__/plotGenerationService.integration.test.ts` | 839 | +239   | Low      | Tracked |
| `src/features/plot-engine/services/__tests__/plotGenerationService.test.ts`             | 795 | +195   | Low      | Tracked |
| `src/features/plot-engine/services/__tests__/plotStorageService.test.ts`                | 706 | +106   | Low      | Tracked |

## Refactoring In Progress

### January 8, 2026

**plotGenerationService.ts** (1061 LOC - needs refactoring)

- 📋 Refactoring plan created in `plans/PLOT-ENGINE-REFACTORING-JAN2026.md`
- 📋 Proposed split into 7 focused modules
- ⏳ Awaiting implementation
- Target: Reduce to ~350 LOC main orchestrator

## Refactoring Plans

### High Priority

1. **plotGenerationService.ts** (1061 LOC) - **MOST CRITICAL**
   - **Suggested Split**:
     - `plot-generation-utils.ts` - Utility functions and retry logic
     - `plot-context-retrieval.ts` - RAG context gathering
     - `plot-prompt-builder.ts` - AI prompt construction
     - `plot-response-parser.ts` - Response parsing and validation
     - `plot-suggestions-generator.ts` - Suggestion generation
     - `plot-template-generator.ts` - Template structures
     - `plotGenerationService.ts` - Main orchestrator (~350 LOC)
   - **Effort**: High (4-6 hours)
   - **Impact**: Critical - significantly improves maintainability
   - **Status**: Refactoring plan documented, ready for implementation
   - **Details**: See `plans/PLOT-ENGINE-REFACTORING-JAN2026.md`

### Medium Priority

1. **publishingAnalyticsService.ts** (712 LOC)
   - **Suggested Split**:
     - `publishing-metrics-calculator.ts` - Metrics computation
     - `publishing-analytics-aggregator.ts` - Data aggregation
     - `publishing-report-generator.ts` - Report generation
     - `publishingAnalyticsService.ts` - Main orchestrator (~250 LOC)
   - **Effort**: Medium (2-3 hours)
   - **Impact**: Improved maintainability for analytics features

2. **character-validation.ts** (690 LOC)
   - **Suggested Split**:
     - `character-validation-rules.ts` - Validation rule definitions
     - `character-constraint-checks.ts` - Business logic constraints
     - `character-validation-errors.ts` - Error formatting
     - `character-validation.ts` - Main validator (~250 LOC)
   - **Effort**: Medium (2-3 hours)
   - **Impact**: Better validation rule management

3. **grammarSuggestionService.ts** (634 LOC)
   - **Suggested Split**:
     - `grammar-rules.ts` - Grammar rule definitions
     - `grammar-checkers.ts` - Individual checking functions
     - `grammar-suggestion-formatter.ts` - Suggestion formatting
     - `grammarSuggestionService.ts` - Main service (~250 LOC)
   - **Effort**: Low (1-2 hours)
   - **Impact**: Easier to extend grammar checking rules

### Low Priority

Test files generally acceptable to be longer as they contain many test cases.
Refactoring is optional:

1. **rag-end-to-end.test.ts** (935 LOC)
   - Could split into separate E2E test suites by feature
   - Split by RAG workflow stages
   - Low priority as tests are comprehensive

2. **plotGenerationService.integration.test.ts** (839 LOC)
   - Split by integration scenario
   - Separate template tests from AI tests
   - Low priority as integration tests benefit from being comprehensive

3. **plotGenerationService.test.ts** (795 LOC)
   - Now obsolete after refactoring (was testing old 1176 LOC service)
   - Should be updated to test new modular structure
   - May naturally shrink with focused module tests

4. **plotStorageService.test.ts** (706 LOC)
   - Split by storage operation type (create/read/update/delete)
   - Low priority as storage tests are thorough

## Rationale for 600 LOC Limit

The 600 LOC limit balances several concerns:

### Benefits

- ✅ **Cognitive Load**: Files under 600 LOC fit in most editor viewports
- ✅ **Maintainability**: Easier to understand and modify
- ✅ **Testing**: Smaller files are easier to test thoroughly
- ✅ **Code Review**: Reviewers can grasp entire file context
- ✅ **Merge Conflicts**: Smaller files reduce conflict likelihood

### Flexibility

- ✅ **Templates**: Allows for comprehensive template definitions (e.g.,
  `plot-template-generator.ts` at 644 LOC)
- ✅ **Complex Services**: Permits moderately complex orchestration logic
- ✅ **Test Suites**: Accommodates comprehensive test coverage
- ✅ **Reduced Churn**: Fewer mandatory refactorings vs. 500 LOC limit

### Comparison

- **500 LOC**: Very strict, required 12 files to be refactored
- **600 LOC**: Balanced, only 7 files need attention (3 production, 4 tests)
- **No Limit**: Poor maintainability, files can grow unbounded

## Monitoring

File size compliance is checked in CI via `scripts/check-file-size.js`:

```bash
# Run locally
npm run check:file-size

# CI configuration
- Job: "Build"
- Step: "Check file sizes"
- Fails if any non-exempted file > 600 LOC
```

## Exception Process

To add a new exception:

1. **Justify**: Explain why the file legitimately needs to exceed 600 LOC
2. **Document**: Add entry to this file with refactoring plan
3. **Track**: Add to `ALLOWED_VIOLATIONS` in `scripts/check-file-size.js`
4. **Review**: Must be approved in PR review
5. **Time-box**: Set expected refactoring timeline (if applicable)

## Enforcement

- ❌ **CI Fails**: Non-exempted files > 600 LOC fail the build
- ⚠️ **CI Warns**: Files > 550 LOC trigger warnings
- ✅ **CI Passes**: All files ≤ 600 LOC (or exempted)

## Success Metrics

- **Target**: < 5 exempted production files
- **Current**: 4 exempted production files (1 high priority)
- **Test Files**: 4 exempted (acceptable)
- **Trend**: Stable after increasing limit to 600 LOC

## Related Documentation

- `AGENTS.md` - Coding guidelines including "Max 500 LOC per file" (now 600)
- `plans/PLOT-ENGINE-REFACTORING-JAN2026.md` - Example of large file refactoring
- `scripts/check-file-size.js` - Enforcement script

## Recommendations

1. **Accept Current State**: 3 production violations are manageable
2. **Monitor Growth**: Watch for files approaching 550 LOC
3. **Opportunistic Refactoring**: Split files during major feature work
4. **No Rush**: Don't force premature refactoring

The current exceptions represent a reasonable technical debt level and don't
require immediate action.
