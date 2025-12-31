# Basic Usage Examples

Simple examples for creating and using skills.

## Example 1: Creating a New Skill

### Step 1: Define Purpose

**Problem**: Need a skill to enforce TypeScript strict mode compliance

**Requirements**:

- Detect TypeScript errors
- Provide fix suggestions
- Enforce `no-explicit-any` rule

**Success Criteria**:

- Skill identifies TypeScript errors
- Suggests actionable fixes
- Integrates with code-quality-management

### Step 2: Choose Structure

**Simple skill** (< 200 LOC):

```
.opencode/skill/typescript-guardian/
└── SKILL.md
```

### Step 3: Write SKILL.md

```yaml
---
name: typescript-guardian
description: Enforce TypeScript strict mode compliance, eliminate any types, ensure type safety, and maintain strict linting standards. Use when TypeScript errors occur, any types need elimination, or strict mode compliance is required.
---

# TypeScript Guardian

Enforce TypeScript strict mode and eliminate unsafe type usage.

## Quick Reference

- **[Type Safety](type-safety.md)** - Type system enforcement
- **[Lint Rules](lint-rules.md)** - Strict mode configuration

## When to Use

- TypeScript errors occur
- `any` types need elimination
- Strict mode compliance required
- Type safety violations detected

## Core Methodology

1. Detect TypeScript errors
2. Suggest type-safe alternatives
3. Enforce strict mode rules
4. Validate fixes

## Integration

- **code-quality-management**: Enforce quality gates
- **typescript-guardian**: Primary enforcement

## Best Practices

✓ Use explicit types
✓ Avoid any types
✓ Enable strict null checks
✓ Use type guards
✗ Don't use type assertions
```

### Step 4: Test Skill

```bash
# Verify skill loads
skill({ name: 'typescript-guardian' })

# Check file structure
test -f .opencode/skill/typescript-guardian/SKILL.md
```

## Example 2: Using a Skill

### Basic Invocation

```typescript
// In code or when prompted
const result = await skill({
  name: 'typescript-guardian',
  input: {
    code: 'const data: any = response;',
  },
});

console.log(result);
// {
//   status: 'success',
//   issues: [
//     { type: 'explicit-any', line: 1, suggestion: 'Use proper type' }
//   ]
// }
```

### Conditional Invocation

```typescript
if (typescriptErrors.length > 0) {
  // Use skill to fix errors
  const fixes = await skill({
    name: 'typescript-guardian',
    input: { errors: typescriptErrors },
  });
}
```

## Example 3: Skill Integration

### Complementary Skills

```typescript
// Use multiple skills together
const [typeSafetyResult, lintResult, buildResult] = await Promise.all([
  skill({ name: 'typescript-guardian', input: code }),
  skill({ name: 'code-quality-management', input: config }),
  skill({ name: 'ci-optimization-specialist', input: buildConfig }),
]);

// Process combined results
const allIssues = [
  ...typeSafetyResult.issues,
  ...lintResult.issues,
  ...buildResult.issues,
];
```

### Sequential Processing

```typescript
// Run skills in sequence when dependencies exist
const qualityResult = await skill({
  name: 'code-quality-management',
  input: { codebase },
});

if (qualityResult.needsRefactor) {
  const refactorResult = await skill({
    name: 'refactorer',
    input: { issues: qualityResult.issues },
  });

  return refactorResult;
}
```

## Example 4: Error Handling

### Graceful Degradation

```typescript
try {
  const result = await skill({ name: 'typescript-guardian', input });

  if (!result.status === 'success') {
    // Fallback: manual review
    return {
      status: 'partial',
      issues: result.issues,
      message: 'Automatic fixes failed, manual review required',
    };
  }

  return result;
} catch (error) {
  logger.error('Skill execution failed', {
    skill: 'typescript-guardian',
    error,
  });

  return {
    status: 'failed',
    issues: [],
    error: error.message,
  };
}
```

### Retry Logic

```typescript
export async function executeWithRetry<T>(
  skillName: string,
  input: unknown,
  maxRetries: number = 3,
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return (await skill({ name: skillName, input })) as Promise<T>;
    } catch (error) {
      if (attempt === maxRetries) throw error;

      // Exponential backoff
      await new Promise(resolve =>
        setTimeout(resolve, Math.pow(2, attempt) * 1000),
      );
    }
  }

  throw new Error('Max retries exceeded');
}
```

## Example 5: Skill Configuration

### Skill Parameters

```typescript
interface SkillParams<T> {
  name: string;
  input: T;
  options?: {
    timeout?: number; // ms, default 30000
    retries?: number; // default 3
    cache?: boolean; // default true
    dryRun?: boolean; // default false
  };
}

// Usage with options
const result = await skill({
  name: 'typescript-guardian',
  input: code,
  options: {
    timeout: 5000,
    retries: 1,
    cache: false,
    dryRun: true, // Preview changes only
  },
});
```

## Example 6: Performance Optimization

### Token-Efficient Usage

```typescript
// ❌ Bad - Verbose, wastes tokens
const result = await skill({
  name: 'typescript-guardian',
  input: {
    code: 'const data: any = response;',
    instructions:
      'Please analyze this code and find all TypeScript errors including any type usage, missing type annotations, implicit any types, type assertion issues, and strict mode violations. Provide detailed suggestions for each error including the exact line number, the specific error message, and the recommended fix with code examples. Also check for potential runtime errors that might occur due to type issues.',
  },
});

// ✅ Good - Concise, token-efficient
const result = await skill({
  name: 'typescript-guardian',
  input: {
    code: 'const data: any = response;',
    focus: 'strict-mode, any-types',
  },
});
```

### Caching Results

```typescript
const skillCache = new Map<string, SkillResult>();

export async function cachedSkill<T>(
  name: string,
  input: T,
): Promise<SkillResult> {
  const cacheKey = `${name}:${JSON.stringify(input)}`;

  if (skillCache.has(cacheKey)) {
    logger.debug('Skill cache hit', { skill: name });
    return skillCache.get(cacheKey)!;
  }

  const result = await skill({ name, input });
  skillCache.set(cacheKey, result);

  logger.debug('Skill cache miss', { skill: name });
  return result;
}
```

## Example 7: Batch Operations

### Parallel Skill Execution

```typescript
// Execute multiple independent skills in parallel
const [lintResult, testResult, typecheckResult] = await Promise.all([
  skill({ name: 'code-quality-management', input: 'lint' }),
  skill({ name: 'qa-engineer', input: 'test:unit' }),
  skill({ name: 'typescript-guardian', input: 'typecheck' }),
]);

// Combine results
const allIssues = [
  ...lintResult.issues,
  ...testResult.issues,
  ...typecheckResult.issues,
];

logger.info('Batch skill execution complete', {
  totalIssues: allIssues.length,
  duration: '...',
});
```

### Sequential Skill Execution

```typescript
// Execute dependent skills in sequence
const typecheckResult = await skill({
  name: 'typescript-guardian',
  input: 'typecheck',
});

if (typecheckResult.hasErrors) {
  const fixResult = await skill({
    name: 'typescript-guardian',
    input: { fix: typecheckResult.issues },
  });

  const verifyResult = await skill({
    name: 'typescript-guardian',
    input: 'verify',
  });

  return verifyResult;
}
```

## Example 8: Common Patterns

### Error Recovery Pattern

```typescript
export async function executeWithFallback<T>(
  primarySkill: string,
  fallbackSkill: string,
  input: unknown,
): Promise<T> {
  try {
    return (await skill({ name: primarySkill, input })) as Promise<T>;
  } catch (error) {
    logger.warn('Primary skill failed, using fallback', {
      skill: primarySkill,
      error: error.message,
    });

    return (await skill({ name: fallbackSkill, input })) as Promise<T>;
  }
}
```

### Result Validation Pattern

```typescript
export function validateSkillResult<T>(result: SkillResult<T>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!result.status) {
    errors.push('Missing status field');
  }

  if (result.status === 'success' && !result.data) {
    errors.push('Status is success but data is missing');
  }

  if (result.status === 'error' && !result.error) {
    errors.push('Status is error but error message is missing');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
```

### Monitoring Pattern

```typescript
export async function monitoredSkill<T>(
  name: string,
  input: unknown,
): Promise<T> {
  const startTime = performance.now();

  try {
    const result = (await skill({ name, input })) as Promise<T>;

    const duration = performance.now() - startTime;

    logger.info('Skill execution', {
      skill: name,
      duration: `${duration.toFixed(2)}ms`,
      status: result.status,
    });

    if (duration > 5000) {
      logger.warn('Slow skill execution', {
        skill: name,
        duration: `${duration.toFixed(2)}ms`,
      });
    }

    return result;
  } catch (error) {
    const duration = performance.now() - startTime;

    logger.error('Skill execution failed', {
      skill: name,
      duration: `${duration.toFixed(2)}ms`,
      error: error.message,
    });

    throw error;
  }
}
```

## Quick Reference

### Skill Invocation Patterns

| Pattern                | When to Use            | Example                                                   |
| ---------------------- | ---------------------- | --------------------------------------------------------- |
| Basic invocation       | Simple, single use     | `skill({ name, input })`                                  |
| Conditional invocation | Based on conditions    | `if (hasErrors) skill(...)`                               |
| Parallel execution     | Independent operations | `await Promise.all([skill1, skill2])`                     |
| Sequential execution   | Dependent operations   | `const r1 = await skill1(); const r2 = await skill2(r1);` |
| Retry logic            | Transient failures     | `executeWithRetry(name, input, 3)`                        |
| Cache-first            | Repeated inputs        | `cachedSkill(name, input)`                                |

### Error Handling Patterns

| Pattern              | Description                         |
| -------------------- | ----------------------------------- |
| Graceful degradation | Return partial results on failure   |
| Retry with backoff   | Retry failed operations with delays |
| Fallback mechanism   | Use alternative skill on failure    |
| Circuit breaker      | Stop failing skill temporarily      |

---

These examples provide patterns for common skill usage scenarios.
