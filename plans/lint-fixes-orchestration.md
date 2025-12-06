# Lint Fixes Orchestration Plan

## Overview

Systematically resolve all lint issues in the React/TypeScript project using
parallel execution with specialized agents.

## Current State

- **Total lint issues**: ~151 issues (127 errors + 24 warnings as mentioned by
  user)
- **Project**: Novelist.ai React/TypeScript application
- **Configuration**: ESLint with TypeScript, React hooks, and security plugins

## Issue Categories Identified

### 1. Unused Variables (~70% of issues)

- **Pattern**: Variables prefixed with `_` that are unused
- **Files**: Components, services, hooks, tests
- **Example**: `_err`, `_e`, `_content`, `_summary`, `_reject`
- **Fix Strategy**: Remove unused variables or properly handle them

### 2. React Hook Dependencies (~20% of issues)

- **Rule**: `react-hooks/exhaustive-deps` warnings
- **Issues**: Missing dependencies in useEffect/useCallback/useMemo
- **Fix Strategy**: Add missing dependencies or wrap functions in useCallback

### 3. React Hook State Destructuring (~5% of issues)

- **Rule**: `react/hook-use-state` warnings
- **Issues**: useState calls not properly destructured
- **Fix Strategy**: Destructure useState into value + setter pairs

### 4. Import Type Annotations (~2% of issues)

- **Rule**: `@typescript-eslint/consistent-type-imports` error
- **Issues**: Forbidden `import()` type annotations
- **Fix Strategy**: Convert to proper type imports

## Execution Strategy

### Phase 1: Parallel Issue Resolution (40 minutes)

**Parallel execution of specialized agents:**

1. **Unused Variables Agent** - Remove unused variables
   - Handle components with unused `_` prefixed variables
   - Remove unused imports and parameters
   - Fix destructured variables not used

2. **React Hook Dependencies Agent** - Fix dependency arrays
   - Add missing dependencies to useEffect/useCallback hooks
   - Wrap functions in useCallback where appropriate
   - Handle complex dependency scenarios

3. **State Destructuring Agent** - Fix useState patterns
   - Convert non-destructured useState calls
   - Ensure proper value + setter pairs

4. **Import Type Agent** - Fix type import issues
   - Convert dynamic imports to static type imports
   - Fix forbidden `import()` type annotations

### Phase 2: Quality Gates (10 minutes)

- Run lint check to verify all issues resolved
- Ensure no functionality broken
- Validate TypeScript compilation passes

### Phase 3: Integration Testing (10 minutes)

- Run unit tests to ensure fixes don't break functionality
- Test critical user flows
- Validate build process

## Agent Coordination

### Handoff Strategy

1. **Phase 1**: Execute all 4 agents in parallel on different file sets
2. **Phase 2**: Coordinate validation across all fixes
3. **Phase 3**: Test integration across components

### File Distribution Strategy

- **Unused Variables Agent**: Components, services, hooks, tests
- **Hook Dependencies Agent**: Components using hooks, hooks files
- **State Destructuring Agent**: Components with useState calls
- **Import Type Agent**: Type definition files, import statements

## Success Criteria

- ✅ All 127 errors resolved
- ✅ All 19 warnings resolved
- ✅ ESLint passes with 0 errors/warnings
- ✅ TypeScript compilation successful
- ✅ Unit tests pass
- ✅ No functionality regressions

## Risk Mitigation

- Backup critical files before mass changes
- Use staged commits for each agent's work
- Validate each fix doesn't break imports/dependencies
- Test critical paths after each batch of fixes

## Deliverables

1. All lint issues resolved
2. Updated codebase maintaining functionality
3. Documentation of fixes applied
4. Validation of build/test pipeline
