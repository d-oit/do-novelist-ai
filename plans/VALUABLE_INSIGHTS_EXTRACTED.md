# Valuable Insights Extracted from Completed Plans

## Key Lessons Learned

### 1. GitHub Actions Issues & Resolutions

**Major Problems Identified:**

- **Broken pnpm-lock.yaml**: `@playwright/test` version conflicts causing
  complete CI failure
- **Permission Issues**: GitHub token lacking admin permissions for label
  management
- **ESM vs CommonJS**: Security scanner using `require()` in ESM project
- **Missing Dependencies**: `wait-on` package not installed for performance
  workflows

**Solutions Implemented:**

- Regenerated pnpm-lock.yaml to resolve version conflicts
- Made permission-dependent steps non-blocking with `continue-on-error`
- Converted security scanner to ESM syntax
- Standardized GitHub Actions versions to v6

### 2. TypeScript & ESLint Configuration

**Configuration Insights:**

- `@typescript-eslint/no-unused-vars` correctly set to 'error' (not warning)
- ESM modules require proper import syntax
- TypeScript config must include all source files (including index.tsx)
- React Hook dependency warnings are acceptable as warnings, not errors

### 3. React Hook Optimization Patterns

**Common Issues Found:**

- Missing dependencies in `useEffect`, `useCallback`, `useMemo`
- Unused variables with `_` prefix not being properly handled
- Function parameters that should be marked with underscore

**Resolution Strategy:**

- Use dependency arrays correctly
- Wrap functions in `useCallback` when needed
- Use underscore prefix for intentionally unused parameters

### 4. Performance & Bundle Analysis

**Identified Optimizations:**

- Framer Motion components causing test warnings (non-blocking)
- Bundle size analysis showing vendor chunks could be optimized
- Code splitting opportunities in editor and visualization components

### 5. Security & Compliance

**Key Security Practices:**

- License compliance requires handling dev dependencies properly (MPL-2.0
  accepted)
- Security scanning should use pnpm-compatible tools
- Environment variables must be properly managed in workflows

### 6. GOAP Architecture Insights

**Implementation Patterns:**

- Timeline feature successfully implemented using GOAP principles
- Agent coordination requires clear dependency chains
- Quality gates essential for preventing regressions

## Technical Debt Resolved

1. ✅ TypeScript compilation errors (unused variables)
2. ✅ ESLint parsing errors (TSConfig inclusion)
3. ✅ React Hook dependency warnings
4. ✅ GitHub Actions workflow failures
5. ✅ Security scanner ESM conversion
6. ✅ Timeline feature implementation

## Best Practices Established

- **Atomic commits** for each major fix category
- **Quality gates** between fix phases
- **Parallel execution** for independent fixes
- **ESM consistency** across all scripts
- **pnpm compatibility** for all dependency operations

This document preserves the institutional knowledge gained from resolving these
complex technical issues.
