# Codebase Reorganization Plan

## Current State Analysis

### Large Files (Near 500 LOC limit)
- ProjectWizard.tsx: 387 lines
- BookViewer.tsx: 378 lines
- aiService.ts: 309 lines (AI SDK Gateway with database-driven provider/model config)
- validation.ts: 365 lines

### Current Structure
```
/components
  /ui (base UI components)
  /views (page-level views)
  *.tsx (feature components)
/services (business logic)
/hooks (custom hooks)
/utils (utilities)
```

### Problems Identified
1. Mixed concerns in services/ directory
2. Large components with multiple responsibilities
3. No clear domain boundaries
4. No shared module/library structure
5. Hooks and utilities are flat-structured

## Proposed Modern Structure

```
/src
  /app (application shell)
  /features (domain-driven features)
    /projects
      /components
      /hooks
      /services
      /types
      /tests
    /generation
      /components
      /hooks
      /services
      /types
      /tests
    /publishing
      /components
      /hooks
      /services
      /types
      /tests
  /shared
    /components (reusable UI)
    /hooks (shared hooks)
    /services (shared services)
    /utils (shared utilities)
    /types (shared types)
    /constants (constants)
  /lib (third-party integrations, config)
```

## Execution Strategy

### Phase 1: Create New Structure (Parallel)
1. Create feature-based directory structure
2. Set up shared module structure
3. Create lib/ for integrations

### Phase 2: Migrate Code (Parallel)
1. Migrate domain-specific services
2. Migrate domain-specific components
3. Migrate domain-specific hooks
4. Migrate shared utilities

### Phase 3: Update Imports (Sequential)
1. Update all import statements
2. Fix relative paths
3. Update barrel exports

### Phase 4: Validate (Sequential)
1. Run tests
2. Run linting
3. Run build
4. Commit changes

## Quality Gates
- All imports must resolve correctly
- No TypeScript errors
- All tests passing
- Build succeeds
- Linting passes
