# CI Fix GOAP Orchestrator - Phase 1: Component Architecture Recovery

## Task Context

Deploying 4 parallel agents to restore missing layout components in the
novelist.ai codebase and fix critical CI issues.

## Critical CI Issues Identified

- Missing: `./layout/AppBackground`, `./layout/MainLayout`, `./layout/Sidebar`
- Missing: `./Navbar` component
- Missing: `@/components/layout/Header` component
- Broken exports in `src/components/index.ts`

## Root Cause Analysis

- Components exist in `src/shared/components/layout/` directory
- Exports in `src/components/index.ts` point to wrong paths (`./layout/` vs
  `@shared/components/layout/`)
- Navbar component missing entirely
- Test expectations mismatch actual component locations

## 4 Parallel Agents Execution Plan

### Agent 1: Layout Component Export Fixer

**Task**: Fix broken exports for AppBackground, MainLayout, Sidebar **Target**:
`src/components/index.ts` lines 34-36 **Action**: Update exports to point to
`@shared/components/layout/` **Success Criteria**: All layout component imports
resolve

### Agent 2: Navbar Component Creator

**Task**: Create Navbar component based on test expectations **Location**:
`src/components/Navbar.tsx` **Interface**: Match
`src/components/Navbar.test.tsx` requirements **Success Criteria**: Navbar
component renders with projectTitle, onNewProject, currentView, onNavigate

### Agent 3: Header Component Export Fixer

**Task**: Fix Header component export path **Target**: `src/components/index.ts`
line 33 **Action**: Change from `@shared/components/layout/Header` to existing
path **Success Criteria**: Header import in accessibility test resolves

### Agent 4: Export Validation Manager

**Task**: Validate all component exports and imports **Target**:
`src/components/index.ts` and related test files **Action**: Ensure no broken
imports, run type check **Success Criteria**: All imports resolve, no TypeScript
errors

## Quality Gate Requirements

- ✓ All components created with proper TypeScript interfaces
- ✓ Exports working correctly in index.ts files
- ✓ No import resolution errors
- ✓ Code follows existing patterns and AGENTS.md standards
- ✓ Tests pass with new components

## Expected Outcome

Complete restoration of layout component architecture with working exports and
resolved CI failures.

---

**Status**: Launching parallel execution **Timestamp**: 2025-01-02
