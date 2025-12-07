# Phase 2-4 Execution Plan: Type System Cleanup & CI Resolution

## Overview

Complete the remaining phases to fully resolve all issues and achieve production
readiness.

## Phase 2: Type System Cleanup Strategy

**Objective**: Update all imports from root `types.ts` to consolidated location

### Files Requiring Updates (from grep search):

- `src/app/App.tsx`
- `src/components/GoapVisualizer.tsx`
- `src/components/ProjectDashboard.tsx`
- `src/features/analytics/` (multiple files)
- `src/features/characters/` (multiple files)
- `src/features/editor/` (multiple files)
- `src/features/projects/` (multiple files)
- `src/features/worlds/` (multiple files)
- `src/lib/` (multiple files)
- `src/services/` (multiple files)
- `src/test/` (multiple files)

### Execution Strategy:

1. **Batch Processing**: Update imports in logical groups (components, features,
   lib, services)
2. **Import Path Strategy**: Use `@/types` alias (should be configured in
   tsconfig)
3. **Validation**: Test compilation after each batch
4. **Cleanup**: Delete root `types.ts` when complete

## Phase 3: CI Workflow Resolution

**Objective**: Fix all failing CI workflows (3/5 currently failing)

### Failed Workflows:

1. YAML Lint failures
2. Performance Monitoring & Bundle Analysis
3. Complete CI/CD Pipeline

### Execution Strategy:

1. **Trigger New Runs**: Commit changes to force fresh CI execution
2. **Workflow Analysis**: Investigate specific failure reasons
3. **YAML Fixes**: Correct syntax/configuration issues
4. **Performance Monitoring**: Fix bundle analysis and monitoring scripts
5. **Validation**: Ensure all 5 workflows pass

## Phase 4: Final Validation

**Objective**: Confirm production readiness

### Validation Checklist:

- [ ] E2E tests pass (Playwright)
- [ ] All CI workflows passing (5/5)
- [ ] Type system clean (no root types.ts)
- [ ] Build process smooth
- [ ] Deployment ready

## Agent Coordination Plan

### Phase 2 Agents:

- **feature-implementer**: Systematic import updates across all files
- **code-reviewer**: Review import changes for correctness
- **react-typescript-code-fixer**: Handle any compilation issues

### Phase 3 Agents:

- **github-action-editor**: Fix CI workflow YAML files
- **ci-optimization-specialist**: Optimize and fix CI processes
- **quality-engineer**: Validate CI pipeline health

### Phase 4 Agents:

- **test-runner**: Execute E2E validation
- **quality-engineer**: Final production readiness check

## Success Criteria

✅ All imports updated to use `@/types` alias ✅ Root `types.ts` file deleted ✅
All CI workflows passing (5/5) ✅ E2E tests passing ✅ Production deployment
ready

## Risk Mitigation

- **Parallel Processing**: Execute non-dependent tasks simultaneously
- **Quality Gates**: Validate after each phase
- **Rollback Plan**: Keep original files backed up
- **Incremental Testing**: Test after each batch update

## Timeline Estimate

- **Phase 2**: ~30-45 minutes (systematic file updates)
- **Phase 3**: ~20-30 minutes (CI workflow fixes)
- **Phase 4**: ~15-20 minutes (validation)
- **Total**: ~65-95 minutes
