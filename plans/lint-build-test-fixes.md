# GOAP Plan: Fix All Lint, Build, and Test Issues

## Executive Summary

This plan orchestrates specialist agents to systematically resolve all lint,
build, and test issues in the React/TypeScript/Vite project. The approach
follows atomic git commits and never disables linting rules - instead
implementing proper fixes.

## Identified Issues Analysis

### Critical Issues (Blocking Build)

1. **TypeScript Compilation Errors:**
   - `branchId`, `sourceBranchId`, `targetBranchId` unused variables in
     `versioningService.ts`
   - `sourceBranchId`, `targetBranchId` unused variables in `versioningStore.ts`
   - Function calls with incorrect argument counts in `versioningStore.ts`
   - `page` parameter unused in `test-helpers.ts`

2. **ESLint Parsing Error:**
   - `src/index.tsx` not included in TSConfig, causing parser configuration
     issues

### React Hook Dependency Warnings (9 issues)

1. `useMemo`/`useCallback`/`useEffect` with missing or unnecessary dependencies
   across multiple components

### Test Environment Warnings

1. Framer Motion `whileHover`/`whileTap` prop warnings on DOM elements
2. Canvas element getContext warnings (non-critical)

## GOAP Orchestration Strategy

### Phase 1: Foundation Fixes (Sequential Dependencies)

**Agent 1: TypeScript Configuration Specialist**

- Fix TSConfig to include `src/index.tsx`
- Update ESLint parser configuration for Vite+React setup
- Ensure proper `include` patterns in tsconfig.json

**Agent 2: Variable Usage Specialist**

- Fix unused variables by either implementing usage or prefixing with underscore
- Apply underscore prefix convention for intentionally unused parameters
- Maintain strict `noUnusedLocals` and `noUnusedParameters` checks

### Phase 2: Function Signature Fixes (Parallel Execution)

**Agent 3: Function Parameter Specialist**

- Fix function calls with incorrect argument counts
- Align implementation signatures with call sites
- Add proper parameter validation where needed

### Phase 3: React Hook Optimization (Parallel Swarm)

**Agent 4: React Hook Dependency Specialist (North)**

- Fix dependency arrays in components: `ProjectDashboardOptimized.tsx`,
  `BookViewer.tsx`

**Agent 5: React Hook Dependency Specialist (South)**

- Fix dependency arrays in hooks: `useGoapEngine.ts`,
  `usePublishingAnalytics.ts`, `useWorldBuilding.ts`

**Agent 6: React Hook Dependency Specialist (East)**

- Fix dependency arrays in components: `AnalyticsDashboard.tsx`,
  `PublishingDashboard.tsx`

**Agent 7: React Hook Dependency Specialist (West)**

- Fix dependency arrays in components: `VersionHistory.tsx`

### Phase 4: Test Environment Optimization

**Agent 8: Testing Environment Specialist**

- Address Framer Motion prop warnings
- Optimize test setup for motion components
- Handle Canvas warnings gracefully

### Phase 5: Verification and Quality Assurance

**Agent 9: Quality Assurance Specialist**

- Run comprehensive lint, build, and test validation
- Ensure all changes maintain code quality
- Validate that no regressions were introduced

## Agent Handoff Coordination

### Dependency Chain Management

1. **Sequential Dependencies:** TypeScript config → Variable fixes → Function
   signatures
2. **Parallel Execution:** React Hook fixes (multiple agents simultaneously)
3. **Validation Gate:** All fixes must pass before QA verification
4. **Rollback Strategy:** Each agent implements atomic changes with clear git
   commits

### Quality Gates

- **Pre-execution:** Verify current state matches analysis
- **Post-execution:** Ensure all lint, build, and test commands pass
- **Atomic Commits:** Each agent commits changes immediately after completion
- **Cross-validation:** QA agent validates all previous agent work

## Risk Mitigation

### High-Risk Areas

1. **React Hook Changes:** Could affect component behavior - requires careful
   dependency analysis
2. **Function Signature Changes:** May break existing call sites - requires
   comprehensive testing
3. **TypeScript Config Changes:** Could affect entire codebase - requires
   careful validation

### Mitigation Strategies

- Implement changes incrementally with immediate testing
- Use feature flags where applicable
- Maintain backward compatibility during transitions
- Document all changes in commit messages

## Success Criteria

1. ✅ `npm run lint` completes with 0 errors, minimal warnings acceptable
2. ✅ `npm run build` completes successfully with no TypeScript errors
3. ✅ `npm run test` continues to pass all 571+ tests
4. ✅ All changes follow established coding conventions
5. ✅ No linting rules are disabled or skipped
6. ✅ Atomic git commits for each major change category

## Timeline and Execution

- **Estimated Duration:** 45-60 minutes
- **Agent Coordination:** Real-time handoffs with immediate validation
- **Parallel Execution:** React Hook fixes run simultaneously for efficiency
- **Quality Assurance:** Continuous validation throughout execution

## Post-Execution Verification

Final verification will be performed by the analysis-swarm agent to ensure:

- All identified issues are resolved
- No new issues were introduced
- Code quality standards are maintained
- Performance is not negatively impacted

This GOAP plan ensures systematic, high-quality resolution of all lint, build,
and test issues while maintaining code quality and following best practices.
