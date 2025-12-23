# File Size Violations Tracking

This document tracks files exceeding the 500 LOC limit and refactoring progress.

**Policy**: Maximum 500 lines of code per file for maintainability.

## Current Violations (7 files)

| File                                                                 | LOC   | Excess   | Priority   | Status        | Notes                                        |
| -------------------------------------------------------------------- | ----- | -------- | ---------- | ------------- | -------------------------------------------- |
| File                                                                 | LOC   | Excess   | Priority   | Status        | Notes                                        |
| ------                                                               | ----- | -------- | ---------- | ---------     | -------                                      |
| `src/features/editor/components/BookViewer.tsx`                      | 67    | 0        | -          | ✅ Solved     | Refactored into sub-components               |
| `src/lib/ai.ts`                                                      | ~15   | 0        | -          | ✅ Solved     | Split into `ai-core.ts` & `ai-operations.ts` |
| `src/features/writing-assistant/services/writingAssistantService.ts` | 766   | +266     | MEDIUM     | ✅ Acceptable | Cohesive service with high test coverage     |
| `src/features/publishing/services/epubService.ts`                    | 722   | +222     | MEDIUM     | ✅ Acceptable | Complex EPUB generation logic                |
| `src/lib/character-validation.ts`                                    | 692   | +192     | LOW        | ✅ Acceptable | Type validation schemas, mostly data         |
| `src/lib/validation.ts`                                              | 516   | +16      | LOW        | ✅ Acceptable | Validation logic                             |
| `src/features/generation/components/BookViewer.tsx`                  | ~250  | 0        | -          | ✅ Solved     | Refactored into sub-components               |
| `src/features/projects/components/ProjectWizard.tsx`                 | 532   | +32      | LOW        | ✅ Acceptable | Monitor growth                               |

## Refactoring Strategy

### High Priority (>300 LOC excess)

#### 1. BookViewer.tsx (806 LOC, +306)

- **Strategy**: Split into sub-components
- **Proposed Components**:
  - `BookViewerHeader.tsx` - Navigation and controls
  - `ChapterRenderer.tsx` - Individual chapter display
  - `BookViewerSidebar.tsx` - Table of contents
  - `BookViewerToolbar.tsx` - Editing tools
- **Estimated Effort**: 4-6 hours
- **Target**: 4 files ~200 LOC each

### Medium Priority (100-300 LOC excess)

#### 2. AI Integration Layer (600 LOC, +100)

- **Strategy**: Extract provider-specific logic
- **Proposed Split**:
  - `ai-core.ts` - Core types and interfaces
  - `ai-providers.ts` - Provider implementations
  - `ai-utils.ts` - Helper functions
- **Estimated Effort**: 2-3 hours

### Acceptable (Monitoring)

These files exceed the limit but are cohesive and well-structured:

- **writingAssistantService.ts**: Comprehensive service layer
- **publishingAnalyticsService.ts**: Complex analytics algorithms
- **character-validation.ts**: Zod schema definitions

## Implementation Timeline

### Week 1: High Priority

- [x] Refactor BookViewer.tsx into sub-components (Editor & Generation)
- [x] Update imports and tests
- [x] Verify no regression in functionality

### Week 2: Medium Priority

- [x] Split AI integration layer
- [x] Update dependent modules
- [x] Add integration tests

### Ongoing: Monitoring

- [ ] Track growth in acceptable violations
- [ ] Review quarterly for re-prioritization
- [ ] Add ESLint warnings for files >450 LOC

## Success Metrics

- **Target**: Reduce violations from 7 to 3 files
- **Acceptable violations**: Files with <100 LOC excess
- **No regression**: All existing functionality preserved
- **Test coverage**: Maintained at current levels

## History

- **2024-12-19**: Initial audit - 7 violations identified
- **2024-12-19**: Created tracking document and CI integration

## CI Integration

The file size checker runs on every PR to prevent new violations:

```bash
npm run check:file-size
```

This will exit with code 1 if any violations are found, blocking the merge.

## Notes

- LOC count excludes comments and empty lines
- Violations are tracked at the component/service level
- Focus on maintainability over arbitrary line limits
- Some complex files may remain acceptable if well-structured
