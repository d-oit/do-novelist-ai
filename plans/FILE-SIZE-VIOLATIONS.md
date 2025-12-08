# File Size Violations Documentation

**Date**: December 8, 2025  
**Purpose**: Track files exceeding 500 LOC policy  
**Status**: Active monitoring

## Overview

This document tracks files that exceed the 500 Lines of Code (LOC) policy
established in the GOAP implementation plan. While these violations exist, the
analysis-swarm determined that they are **cohesive** and **maintainable** rather
than arbitrary code bloat.

## Current Violations

### High Priority (800+ LOC)

1. **`src/lib/writing-assistant/services/writingAssistantService.ts`** - 877 LOC
   - **Assessment**: Cohesive service with high test coverage
   - **Status**: Approved as-is ( justified by functionality )
   - **Reason**: Single responsibility for writing assistance logic

2. **`src/components/BookViewer.tsx`** - 873 LOC
   - **Assessment**: Complex component with multiple sub-sections
   - **Status**: Approved as-is ( justified by functionality )
   - **Reason**: Complex UI with multiple viewing modes

### Medium Priority (700-800 LOC)

3. **`src/lib/ai-integration.ts`** - 847 LOC
   - **Assessment**: AI integration layer with multiple providers
   - **Status**: Under review for potential extraction

4. **`src/features/writing-assistant/services/writingAssistantDb.ts`** - 824 LOC
   - **Assessment**: Database operations for writing assistant
   - **Status**: Consider extracting database schemas

### Low Priority (600-700 LOC)

5. **`src/lib/db/index.ts`** - 814 LOC
   - **Assessment**: Database abstraction layer
   - **Status**: Acceptable for now

## Refactoring Strategy

### Immediate Actions (Next Sprint)

- [ ] Extract database schema definitions from `writingAssistantDb.ts`
- [ ] Consider splitting `ai-integration.ts` by provider type

### Long-term Considerations (Next Quarter)

- [ ] Review `BookViewer.tsx` for sub-component extraction opportunities
- [ ] Evaluate `writingAssistantService.ts` for modularity improvements

### Success Criteria

- [ ] Reduce violations by 50% within 3 months
- [ ] No new files exceed 500 LOC
- [ ] All existing violations have refactoring plans

## Enforcement

- **CI Checks**: File size checker runs on all PRs (warnings only)
- **NPM Script**: `npm run check:file-size` for local validation
- **Manual Review**: All new files >500 LOC require justification

## Justification Criteria

A file may exceed 500 LOC if it demonstrates:

1. **High Cohesion**: All functions serve a single, well-defined purpose
2. **High Test Coverage**: Comprehensive test suite covering all functionality
3. **Clear Structure**: Well-organized with logical separation of concerns
4. **Performance Benefits**: Splitting would introduce unnecessary overhead
5. **Domain Complexity**: Reflects complex business logic that cannot be easily
   decomposed

## Monitoring

This document should be updated monthly with:

- New violations discovered
- Violations resolved through refactoring
- Changes to refactoring plans
- Justification updates for existing violations

---

**Last Updated**: December 8, 2025  
**Next Review**: January 8, 2026  
**Owner**: Development Team
