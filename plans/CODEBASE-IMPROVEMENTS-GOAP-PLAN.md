# Codebase Improvements - GOAP Plan

**Date**: December 8, 2025 **Plan Type**: Goal-Oriented Action Planning (GOAP)
**Status**: Ready for Implementation **Context**: Post-production readiness
optimization phase

---

## Executive Summary

Following the successful production deployment of Novelist.ai, this GOAP plan
addresses technical debt and optimization opportunities identified through
comprehensive multi-perspective codebase analysis using the analysis-swarm
methodology (RYAN, FLASH, SOCRATES personas).

**Key Findings**:

- **Environment Configuration**: No validation for required environment
  variables - MEDIUM severity
- **Logging Infrastructure**: 145 ad-hoc console statements - MEDIUM-LOW
  severity
- **Component Duplication**: Multiple implementations causing maintenance
  overhead - MEDIUM severity
- **File Size Compliance**: 5 files exceed 500 LOC policy - LOW-MEDIUM severity
- **Import Path Depth**: 20+ instances of `../../../` patterns - LOW severity
- **Type Safety**: 101 'any' type usages (primarily in tests) - LOW severity

**Overall Assessment**: ✅ **PRODUCTION-READY WITH TECHNICAL DEBT**

The application is functionally sound and deployable. Identified concerns are:

- **75%** Developer Experience issues
- **20%** Operational Hygiene issues
- **5%** Actual operational risks

---

## GOAP Methodology Overview

This plan uses Goal-Oriented Action Planning:

```
GOAL (Desired World State)
  ↓
ACTIONS (Preconditions → Effects)
  ↓
PLAN (Optimal Sequence with Dependencies)
  ↓
EXECUTION (Quality Gates & Validation)
  ↓
SUCCESS (Measurable Outcomes)
```

---

## Analysis-Swarm Key Insights

### RYAN (Methodical Analyst) - Key Findings

**Initial Assessment** (Later Recalibrated):

- Environment variable exposure risks
- 145 console statements as performance concern
- 5 files violating 500 LOC policy
- Bundle size concerns (~1.8 MB uncompressed)

**Recalibrated Assessment**:

- Environment handling is defensive (not a security vulnerability, but
  operational risk)
- Console statements are security hygiene issue, not performance
- 877-line `WritingAssistantService.ts` is cohesive (not arbitrary split needed)
- Bundle size (390 KB gzipped) is actually **excellent** vs. industry benchmarks

**Verdict**: Focus on operational hygiene and developer experience, not critical
vulnerabilities.

### FLASH (Rapid Innovator) - Counter-Analysis

**Reality Check**:

- Application is production-ready with passing tests and clean builds
- Refactoring 877-line files blocks shipping new features
- Quick wins available: environment validation (4h), logging wrapper (2h)

**Quick Win Recommendations**:

1. Centralized env validation with Zod (4 hours)
2. Structured logger wrapper (2 hours)
3. Mark duplicate components as deprecated, remove incrementally

**Key Insight**: Incremental improvement > massive refactoring. Ship features
while respecting quality standards for new code.

### SOCRATES (Questioning Facilitator) - Critical Questions

**Challenged RYAN**:

- What production incident does environment risk create? (Has defensive
  fallbacks)
- Evidence for "performance degradation" from console.log? (No profiling data)
- Is 877 LOC truly unmaintainable if cohesive? (Has high test coverage, clear
  structure)

**Challenged FLASH**:

- Silencing all logs in production prevents debugging
- Who enforces deprecation policy in solo/small team?
- When does technical debt accumulation become critical?

**Key Insight**: Distinguish between current state (functional) and velocity of
debt accumulation (future maintainability).

### Swarm Consensus

**Shared Understanding**:

1. Application is production-functional
2. File size concerns are real but not critical (cohesion > arbitrary limits)
3. Environment configuration needs improvement (operational risk, not security)
4. Component duplication exists (experimentation vs. debt)
5. Bundle size is excellent (390 KB gzipped)

**Recommended Approach**: Phased implementation with immediate actions (16
hours) and incremental improvements (ongoing).

---

## Tier 1: Immediate Priority (1-2 Weeks)

### Goal 1: Environment Configuration Validation

**Priority**: HIGH **Effort**: 4 hours **Severity**: MEDIUM **Risk**:
Configuration errors in production

#### World State Goal

```
BEFORE:
- No validation for required environment variables
- Silent failures when VITE_AI_GATEWAY_API_KEY missing
- Multiple env var names (AI_GATEWAY_API_KEY vs VITE_AI_GATEWAY_API_KEY)
- No startup checks for critical configuration

AFTER:
- Startup validation with Zod schema
- Clear error messages for missing/invalid configuration
- Type-safe environment variable access
- Development-time warnings for missing optional config
```

#### Actions & Dependencies

**Action 1.1: Create Environment Validation Module** (2 hours)

- **File**: `src/lib/env-validation.ts` (NEW)
- **Preconditions**: None
- **Effects**: Centralized environment validation

```typescript
// src/lib/env-validation.ts

import { z } from 'zod';

const envSchema = z.object({
  // Required
  VITE_AI_GATEWAY_API_KEY: z.string().min(1, 'AI Gateway API key is required'),

  // Optional with defaults
  VITE_DEFAULT_AI_PROVIDER: z
    .enum(['openai', 'anthropic', 'google', 'mistral'])
    .default('mistral'),
  VITE_DEFAULT_AI_MODEL: z.string().default('mistral:mistral-medium-latest'),
  VITE_THINKING_AI_MODEL: z.string().default('mistral:mistral-medium'),
});

export type ValidatedEnv = z.infer<typeof envSchema>;

export interface ValidationResult {
  success: boolean;
  env?: ValidatedEnv;
  errors?: Array<{
    path: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
}

export function validateEnvironment(): ValidationResult {
  try {
    const validated = envSchema.parse(import.meta.env);
    return { success: true, env: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message,
        severity: 'error' as const,
      }));
      return { success: false, errors };
    }
    return {
      success: false,
      errors: [
        {
          path: 'unknown',
          message: 'Unknown validation error',
          severity: 'error',
        },
      ],
    };
  }
}

export function getValidatedEnv(): ValidatedEnv {
  const result = validateEnvironment();
  if (!result.success || !result.env) {
    const errorMessages = result.errors
      ?.map(e => `${e.path}: ${e.message}`)
      .join('\n');
    throw new Error(`Environment validation failed:\n${errorMessages}`);
  }
  return result.env;
}
```

**Action 1.2: Update Application Entry Point** (30 minutes)

- **File**: `src/index.tsx` (MODIFY)
- **Preconditions**: Action 1.1 complete
- **Effects**: Validation runs at startup

```typescript
// src/index.tsx - Add at top after imports

import { validateEnvironment } from './lib/env-validation';

const envValidation = validateEnvironment();

if (!envValidation.success) {
  console.error('❌ Environment validation failed:', envValidation.errors);

  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="padding: 2rem; font-family: system-ui; max-width: 800px; margin: 2rem auto;">
        <h1 style="color: #dc2626;">⚠️ Configuration Error</h1>
        <p>The application cannot start due to missing or invalid environment configuration:</p>
        <ul style="color: #dc2626;">
          ${envValidation.errors?.map(e => `<li><strong>${e.path}</strong>: ${e.message}</li>`).join('')}
        </ul>
        <p>Please check your <code>.env</code> file and ensure all required variables are set.</p>
      </div>
    `;
  }

  throw new Error('Environment validation failed');
}

console.log('✅ Environment validation passed');
```

**Action 1.3: Update AI Configuration** (1 hour)

- **File**: `src/lib/ai-config.ts` (MODIFY)
- **Preconditions**: Action 1.1 complete
- **Effects**: Type-safe environment access

**Action 1.4: Add CI Validation** (30 minutes)

- **File**: `.github/workflows/ci.yml` (MODIFY)
- **Effects**: CI catches missing env vars

#### Success Criteria

✅ **Validation**:

- [ ] All required environment variables validated at startup
- [ ] Clear error messages displayed for missing configuration
- [ ] No silent failures from missing environment variables
- [ ] TypeScript types enforce environment variable structure

✅ **Testing**:

- [ ] Start app with missing VITE_AI_GATEWAY_API_KEY → shows error UI
- [ ] Start app with valid config → loads normally
- [ ] Missing optional config → shows warning but continues

✅ **Metrics**:

- Zero configuration-related runtime errors
- 100% of required variables validated
- <100ms validation overhead at startup

---

### Goal 2: Structured Logging Implementation

**Priority**: MEDIUM-HIGH **Effort**: 8 hours **Severity**: MEDIUM-LOW **Risk**:
Difficult debugging and monitoring in production

#### World State Goal

```
BEFORE:
- 145 ad-hoc console.log/error statements
- No log levels or structured format
- Difficult to filter and analyze logs
- No production log aggregation strategy

AFTER:
- Centralized logging service with levels (debug/info/warn/error)
- Structured log format (JSON in production)
- Context-aware logging (component, action, IDs)
- Production-ready with log aggregation support
```

#### Actions & Dependencies

**Action 2.1: Create Logging Service** (3 hours)

- **File**: `src/lib/logging/logger.ts` (NEW)
- **Preconditions**: None
- **Effects**: Centralized logging infrastructure

```typescript
// src/lib/logging/logger.ts

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  userId?: string;
  projectId?: string;
  component?: string;
  action?: string;
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private minLevel: LogLevel = import.meta.env.DEV ? 'debug' : 'info';
  private context: LogContext = {};

  public setContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  private log(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error,
  ): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...this.context, ...context },
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    const formatted = import.meta.env.PROD
      ? JSON.stringify(entry)
      : `[${entry.timestamp}] ${level.toUpperCase()} ${message} ${JSON.stringify(entry.context || {})}`;

    switch (level) {
      case 'debug':
        console.debug(formatted);
        break;
      case 'info':
        console.info(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'error':
        console.error(formatted);
        break;
    }

    if (import.meta.env.PROD) {
      this.sendToAggregator(entry);
    }
  }

  private sendToAggregator(entry: LogEntry): void {
    // TODO: Implement log aggregation (Sentry, LogRocket, Datadog)
  }

  public debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  public info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  public warn(message: string, context?: LogContext, error?: Error): void {
    this.log('warn', message, context, error);
  }

  public error(message: string, context?: LogContext, error?: Error): void {
    this.log('error', message, context, error);
  }

  public child(context: LogContext): Logger {
    const childLogger = new Logger();
    childLogger.setContext({ ...this.context, ...context });
    return childLogger;
  }
}

export const logger = new Logger();

export function createLogger(context: LogContext): Logger {
  return logger.child(context);
}
```

**Action 2.2: Replace Console Statements** (4 hours)

- **Files**: All `src/**/*.ts` and `src/**/*.tsx` files
- **Strategy**: Automated script + manual review

```bash
# Migration script
find src -type f \( -name "*.ts" -o -name "*.tsx" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/*.test.*" \
  -exec sed -i "s/console\.log(/logger.info(/g" {} +

# Manual review required for:
# 1. Adding import { logger } from '@/lib/logging/logger'
# 2. Converting string concatenation to context objects
# 3. Passing Error objects as third parameter
```

**Action 2.3: Add Logging to Critical Paths** (1 hour)

- **Files**:
  - `src/lib/ai-integration.ts` - AI API calls
  - `src/features/projects/services/projectService.ts` - Project operations
  - `src/features/editor/hooks/useGoapEngine.ts` - GOAP execution
  - `src/lib/db/index.ts` - Database operations

**Action 2.4: Add ESLint Rule** (30 minutes)

- **File**: `eslint.config.js` (MODIFY)

```javascript
{
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
}
```

#### Success Criteria

✅ **Validation**:

- [ ] All console.log replaced with logger.info
- [ ] Critical service paths have structured logging
- [ ] ESLint warns on new console.log usage
- [ ] Logs include relevant context

✅ **Testing**:

- [ ] Development logs are human-readable
- [ ] Production logs are JSON format
- [ ] Child loggers inherit parent context
- [ ] Log levels filter correctly

✅ **Metrics**:

- Zero console.\* calls in production code (excluding tests)
- 100% of service operations logged
- <1ms logging overhead per call

---

## Tier 2: This Month (2-4 Weeks)

### Goal 3: Component Duplication Consolidation

**Priority**: MEDIUM **Effort**: 8-16 hours **Severity**: MEDIUM **Risk**:
Maintenance overhead, inconsistent behavior

#### World State Goal

```
BEFORE:
- Multiple duplicate components
- Inconsistent component APIs
- Multiple import paths for same functionality

AFTER:
- Single source of truth for each component
- Consistent component APIs
- Clear import paths via @/ aliases
```

#### Component Duplication Analysis

Based on codebase analysis, key duplicates identified:

1. **Badge** - Multiple implementations in `src/shared/components/`
2. **Card** - UI and display variants
3. **Button** - Forms and UI variants
4. **BookViewer** - Editor vs Generation variants (593 vs 873 lines)
5. **ProjectDashboard** - Main vs Optimized vs Simplified variants
6. **AnalyticsDashboard** - Main vs Refactored variants

#### Actions & Dependencies

**Action 3.1: Component Audit** (2 hours)

- **Deliverable**: `plans/COMPONENT-DUPLICATION-AUDIT.md`
- **Effects**: Detailed analysis of duplicates

**Action 3.2: UI Components Consolidation** (4 hours)

- **Files**: Badge, Card, Button, MetricCard, ScrollArea
- **Strategy**: Consolidate to `src/shared/components/ui/`

**Action 3.3: Feature Components Consolidation** (6 hours)

- **Files**: ProjectDashboard, AnalyticsDashboard, BookViewer
- **Strategy**: Merge best features, remove deprecated variants

**Action 3.4: Create Import Map** (1 hour)

- **File**: `src/components/index.ts` (UPDATE)
- **Effects**: Clear component import paths

**Action 3.5: Add ESLint Rule** (1 hour)

- **File**: `eslint.config.js` (MODIFY)
- **Effects**: Prevent future duplication

**Action 3.6: Update Documentation** (30 minutes)

- **File**: `AGENTS.md` (UPDATE)
- **Effects**: Clear guidelines for developers

#### Success Criteria

✅ **Validation**:

- [ ] Each component has single canonical implementation
- [ ] All imports updated to use canonical paths
- [ ] Zero duplicate component files
- [ ] ESLint prevents imports from old paths

✅ **Testing**:

- [ ] All existing tests pass
- [ ] No visual regressions
- [ ] All features work identically

✅ **Metrics**:

- 10+ duplicate files removed
- 30+ import statements updated
- 100% ESLint compliance

---

### Goal 4: File Size Policy Enforcement

**Priority**: LOW-MEDIUM **Effort**: 2 hours (CI setup) + 20-40 hours
(refactoring if needed) **Severity**: LOW-MEDIUM **Risk**: Code maintainability
degradation

#### World State Goal

```
BEFORE:
- No automated enforcement of 500 LOC limit
- 5 files exceed 500 LOC (877, 873, 847, 824, 814 lines)
- Manual review required

AFTER:
- Automated CI check for file size violations
- Clear reporting and tracking
- Gradual refactoring of oversized files
```

#### Analysis of Violations

Based on swarm analysis:

- **877-line `WritingAssistantService.ts`**: Cohesive service with high test
  coverage
- **873-line `BookViewer.tsx`**: Complex component with multiple sub-sections
- **Verdict**: Not arbitrary split needed, but worth monitoring and incremental
  improvement

#### Actions & Dependencies

**Action 4.1: Create File Size Checker** (1 hour)

- **File**: `scripts/check-file-size.js` (NEW)
- **Effects**: Automated file size checking

**Action 4.2: Add NPM Script** (5 minutes)

- **File**: `package.json` (MODIFY)

```json
{
  "scripts": {
    "check:file-size": "node scripts/check-file-size.js"
  }
}
```

**Action 4.3: Add CI Job** (15 minutes)

- **File**: `.github/workflows/ci.yml` (MODIFY)

**Action 4.4: Document Existing Violations** (30 minutes)

- **File**: `plans/FILE-SIZE-VIOLATIONS.md` (NEW)
- **Effects**: Track refactoring progress

#### Success Criteria

✅ **Validation**:

- [ ] Script identifies all files >500 LOC
- [ ] CI job warns on new violations (not failure)
- [ ] Existing violations documented
- [ ] Clear refactoring plan for each violation

✅ **Metrics**:

- Zero new files exceed 500 LOC
- Tracked reduction of existing violations

---

## Tier 3: Monitor and Address When Touching Code

### Goal 5: Import Path Depth Cleanup

**Priority**: LOW **Effort**: 6 hours **Severity**: LOW **Risk**: Readability
and maintainability

**Strategy**: Opportunistic refactoring - fix imports when touching files for
other reasons.

#### Actions

**Action 5.1: Add ESLint Rule** (30 minutes)

- Warn on relative parent imports (`../../../`)

**Action 5.2: Automated Fix Script** (1 hour)

- Create script to bulk-fix common patterns

**Action 5.3: Document in PR Template** (15 minutes)

- Remind developers to use `@/` alias

---

### Goal 6: 'any' Type Usage Reduction

**Priority**: LOW **Effort**: 10-20 hours **Severity**: LOW **Risk**: Type
safety gaps

**Analysis**: 101 'any' usages, primarily in test files (allowed by ESLint
config).

**Strategy**: Gradual improvement - fix 'any' types when working in those files.

#### Actions

**Action 6.1: Categorize 'any' Usage** (2 hours)

- Audit and categorize by priority

**Action 6.2: Fix High-Value Files** (6 hours)

- Target production code with 'any'

**Action 6.3: Use 'unknown' Instead** (2 hours)

- Replace 'any' in error handling

**Action 6.4: Add ESLint Rule** (15 minutes)

- Prevent new 'any' in production code

---

## Implementation Roadmap

### Week 1-2: Tier 1 (Immediate Priority)

**Days 1-2**: Environment Configuration Validation (4 hours)

- Create env-validation.ts module
- Update application entry point
- Update AI configuration
- Add CI validation
- Test and validate

**Days 3-5**: Structured Logging Implementation (8 hours)

- Create logging service
- Migrate console statements
- Add logging to critical paths
- Add ESLint rule
- Test and validate

### Week 3-4: Tier 2 (This Month)

**Days 1-3**: Component Duplication Consolidation (8-16 hours)

- Component audit
- UI components consolidation
- Feature components consolidation
- Create import map
- Add ESLint rule
- Update documentation

**Day 4**: File Size Policy Enforcement (2 hours)

- Create file size checker
- Add NPM script
- Add CI job
- Document violations

### Ongoing: Tier 3 (Monitor and Address)

**Continuous**:

- Fix import paths when touching files
- Reduce 'any' usage when working in files
- Track progress in quarterly reviews

---

## Validation & Quality Gates

### Quality Gate 1: Environment Validation

**Checklist**:

- [ ] Application starts with valid .env
- [ ] Application shows clear error with missing config
- [ ] CI validates .env.example completeness
- [ ] All tests pass

**Acceptance Criteria**:

- Zero configuration-related runtime errors
- <100ms validation overhead

### Quality Gate 2: Logging Implementation

**Checklist**:

- [ ] All console.log replaced with logger
- [ ] Critical paths have structured logging
- [ ] ESLint warns on console.log
- [ ] All tests pass

**Acceptance Criteria**:

- Zero console.\* in production code
- <1ms logging overhead

### Quality Gate 3: Component Consolidation

**Checklist**:

- [ ] Each component has single implementation
- [ ] All imports updated
- [ ] No duplicate files remain
- [ ] All tests pass

**Acceptance Criteria**:

- 10+ duplicate files removed
- 100% ESLint compliance

---

## Risk Management

### Risk 1: Breaking Changes During Consolidation

**Mitigation**:

- Comprehensive test suite run after each consolidation
- Gradual rollout (one component type at a time)
- Rollback plan (git revert strategy)

### Risk 2: Performance Impact from Logging

**Mitigation**:

- Logging overhead measured (<1ms target)
- Production logs are JSON (minimal formatting)
- Log level filtering
- Async log aggregation (non-blocking)

### Risk 3: Developer Adoption

**Mitigation**:

- Clear documentation in AGENTS.md
- ESLint rules guide developers
- PR template includes checklist
- Code review focuses on standards

---

## Success Metrics

### Overall Success Criteria

**Code Quality**:

- [ ] Zero configuration errors
- [ ] 100% structured logging adoption
- [ ] 10+ duplicate components removed
- [ ] <20 'any' types in production code
- [ ] Zero deep import paths in new code

**Process**:

- [ ] CI enforces all policies
- [ ] Documentation updated
- [ ] Team trained on new standards

**Performance**:

- [ ] <100ms startup validation
- [ ] <1ms logging overhead
- [ ] No visual regressions
- [ ] All tests passing

---

## Conclusion

This GOAP plan provides a systematic approach to addressing technical debt while
maintaining production stability. The tiered priority system ensures critical
improvements are addressed first, while lower-priority items are handled
opportunistically.

**Key Principles**:

1. **Validation First**: Every goal has clear success criteria
2. **Quality Gates**: Checkpoints prevent regressions
3. **Incremental Progress**: Changes are manageable and testable
4. **Documentation**: Standards are documented
5. **Automation**: CI enforces policies consistently

**Key Insight from Analysis-Swarm**:

- The application is **production-ready** with organic technical debt
- Focus on **operational hygiene** and **developer experience**
- **Incremental improvement** > massive refactoring
- **Ship features** while respecting quality standards for new code

**Next Steps**:

1. Review and approve this plan
2. Begin Tier 1 implementation (Environment Validation)
3. Schedule weekly progress reviews
4. Track metrics in `plans/IMPROVEMENT-PROGRESS.md`

---

**Plan Generated By**: Analysis-Swarm + GOAP Agent **Status**: Ready for
Implementation **Estimated Total Effort**: 32-48 hours **Timeline**: 4-6 weeks
**Priority**: Post-production optimization **Severity**: Overall MEDIUM (75% DX,
20% Operational Hygiene, 5% Actual Risk)
