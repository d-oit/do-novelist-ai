# File Size Violations Tracking

This document tracks files exceeding the 500 LOC limit and refactoring progress.

**Policy**: Maximum 500 lines of code per file for maintainability.

## Current Violations (7 files)

| File | LOC | Excess | Priority | Status | Notes |
|------|-----|--------|----------|---------|-------|
| `src/features/editor/components/BookViewer.tsx` | 806 | +306 | HIGH | 🔄 Planning | Complex UI component with multiple views |
| `src/features/writing-assistant/services/writingAssistantService.ts` | 710 | +210 | MEDIUM | ✅ Acceptable | Cohesive service with high test coverage |
| `src/features/publishing/services/publishingAnalyticsService.ts` | 700 | +200 | MEDIUM | ✅ Acceptable | Complex analytics logic, well-structured |
| `src/lib/character-validation.ts` | 690 | +190 | LOW | ✅ Acceptable | Type validation schemas, mostly data |
| `src/lib/ai.ts` | 600 | +100 | MEDIUM | 🔄 Planning | AI integration layer, consider splitting |
| `src/features/generation/components/BookViewer.tsx` | 559 | +59 | LOW | ✅ Acceptable | Minor violation, monitor growth |
| `src/features/projects/components/ProjectWizard.tsx` | 532 | +32 | LOW | ✅ Acceptable | Minor violation, monitor growth |

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
- [ ] Refactor BookViewer.tsx into sub-components
- [ ] Update imports and tests
- [ ] Verify no regression in functionality

### Week 2: Medium Priority  
- [ ] Split AI integration layer
- [ ] Update dependent modules
- [ ] Add integration tests

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