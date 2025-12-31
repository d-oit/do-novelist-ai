# Templates

Reusable templates for skill creation and documentation.

## SKILL.md Templates

### Entry Point Template (Simple Skill)

```yaml
---
name: simple-skill
description: Concise description of what this skill does. Use when [specific scenario].
---

# Simple Skill Title

## Quick Reference

- **[Core Concepts](core-concepts.md)** - Key concepts and terminology

## When to Use

- Scenario 1
- Scenario 2

## Core Methodology

[Brief overview 3-5 bullet points]

## Integration

- **skill-creator**: For creating related skills
- **other-skill**: Related capabilities

## Best Practices

✓ [Key principle]
✓ [Key principle]
✗ [Avoid this]
```

### Entry Point Template (Complex Skill)

```yaml
---
name: complex-skill
description: Concise description of complex skill with multiple modules. Use when [scenarios].
---

# Complex Skill Title

## Quick Reference

- **[Core Concepts](core-concepts.md)** - What this skill covers
- **[Advanced Patterns](advanced-patterns.md)** - Complex patterns
- **[Integration Guide](integration.md)** - How to integrate
- **[Examples](examples/)** - Usage examples

## When to Use

- Scenario 1: [Description]
- Scenario 2: [Description]

## Core Methodology

[High-level overview]

## Content Modules

See detailed modules:
- **[Core Concepts](core-concepts.md)**: Fundamental concepts
- **[Advanced Patterns](advanced-patterns.md)**: Complex patterns
- **[Integration Guide](integration.md)**: Integration with other skills

## Integration

- **skill-creator**: Use for creating skills
- **related-skills**: Dependencies and coordination

## Best Practices

✓ [Keep SKILL.md focused]
✓ [Use modular file structure]
✓ [Optimize token usage]
✓ [Include caching strategies]
✓ [Provide clear examples]
✓ [Document anti-patterns]
```

## File Templates

### Code File Template

```typescript
/**
 * [File purpose]
 */

// Imports
import { Dependency } from '@/lib/dependency';

// Types
interface Type {
  property: string;
}

// Constants
const CONSTANT = 'value';

// Functions/Classes
export function functionName(param: Param): ReturnType {
  // Implementation
}

// Exports
export { Type, functionName };
```

### Test File Template

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { functionToTest } from './functionToTest';

describe('functionName', () => {
  beforeEach(() => {
    // Setup
  });

  it('should do something', () => {
    // Arrange
    const input = 'value';

    // Act
    const result = functionToTest(input);

    // Assert
    expect(result).toBe('expected');
  });

  it('should handle edge case', () => {
    // Test edge cases
  });

  it('should throw error for invalid input', () => {
    // Test error cases
    expect(() => functionToTest(invalidInput)).toThrow('Expected error');
  });
});
```

### Component File Template

```typescript
import { React.FC } from 'react';
import { Button } from '@/shared/components/ui/Button';

interface Props {
  title: string;
  onSave: (value: string) => void;
  disabled?: boolean;
}

export const ComponentName: React.FC<Props> = ({
  title,
  onSave,
  disabled = false,
}) => {
  const [value, setValue] = useState('');

  const handleSave = () => {
    onSave(value);
  };

  return (
    <div className="component-name">
      <h2>{title}</h2>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
      />
      <Button onClick={handleSave}>Save</Button>
    </div>
  );
};
```

## Section Templates

### Quick Reference Section

```markdown
## Quick Reference

- **[Module Name](module-name.md)** - Description
- **[Module Name](module-name.md)** - Description
- **[Module Name](module-name.md)** - Description
```

### When to Use Section

```markdown
## When to Use

Use this when:

- Scenario 1 with detail
- Scenario 2 with detail

**Trigger conditions**:

- Pattern: [What pattern to look for]
- Keywords: [Keywords in prompts]
- Context: [Project state or code pattern]
```

### Core Methodology Section

```markdown
## Core Methodology

**Approach**: [Brief description of approach]

**Key Principles**:

- Principle 1 with explanation
- Principle 2 with explanation
- Principle 3 with explanation

**Process**:

1. Step 1 - Description
2. Step 2 - Description
3. Step 3 - Description

**Decision Tree**:
```

Condition? ├─ Yes → Action A └─ No → Check next condition ├─ Yes → Action B └─
No → Action C

```

```

### Best Practices Section

```markdown
## Best Practices

### DO:

✓ [Specific do with example] ✓ [Specific do with example] ✓ [Specific do with
example]

### DON'T:

✗ [Specific don't with example] ✗ [Specific don't with example] ✗ [Specific
don't with example]

### Quick Checklist

Before using this approach:

- [ ] Requirement 1
- [ ] Requirement 2
- [ ] Requirement 3

During implementation:

- [ ] Best practice 1 followed
- [ ] Best practice 2 followed
- [ ] Best practice 3 followed

After completion:

- [ ] Test coverage met
- [ ] Documentation updated
- [ ] Code review passed
```

### Integration Section

````markdown
## Integration

### Related Skills

**Primary integration**:

- **[skill-name](.opencode/skill/skill-name/)**: How it relates

**Supporting skills**:

- **[skill-name](.opencode/skill/skill-name/)**: Additional capabilities

### Coordination Patterns

```typescript
// Use goap-agent for complex tasks
const plan = await goapAgent({
  primaryGoal: '...',
  agents: [
    { type: 'skill-1', task: '...' },
    { type: 'skill-2', task: '...' },
  ],
});

// Use agent-coordination for parallel work
const results = await parallelExecution({
  tasks: [
    { agent: 'skill-1', work: '...' },
    { agent: 'skill-2', work: '...' },
  ],
});
```
````

## Anti-Patterns Section

````markdown
## Anti-Patterns

### Anti-Pattern 1: [Name]

**Why it's bad**:

- Reason 1
- Reason 2

**Alternatives**:

```typescript
// ✗ Bad example
[Bad code pattern]

// ✅ Good example
[Good code pattern]
```
````

### Anti-Pattern 2: [Name]

**Detection**:

- [How to identify this pattern]
- [Common signs]

**Solution**:

- [How to fix]
- [Example of corrected code]

````

## Code Pattern Templates

### Error Handling Pattern

```typescript
export async function robustOperation(input: Input): Promise<Result> {
  try {
    const result = await operation(input);

    return {
      success: true,
      data: result,
      error: null,
    };
  } catch (error) {
    logger.error('Operation failed', {
      input,
      error: error.message,
      metadata: { ... },
    });

    return {
      success: false,
      data: null,
      error: error.message,
    };
  }
}

export type OperationResult<T> = {
  success: boolean;
  data: T | null;
  error: string | null;
};
````

### Validation Pattern

```typescript
import { z } from 'zod';

const InputSchema = z.object({
  requiredField: z.string().min(1),
  optionalField: z.string().optional(),
  numberField: z.number().min(0).max(100),
});

export function validateInput(input: unknown): ValidationResult {
  const result = InputSchema.safeParse(input);

  if (!result.success) {
    return {
      valid: false,
      errors: result.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    };
  }

  return { valid: true, errors: [] };
}

export type ValidationResult = {
  valid: boolean;
  errors: Array<{ field: string; message: string }>;
};
```

### Caching Pattern

```typescript
export class CacheService<T> {
  private cache = new Map<string, CacheEntry<T>>();

  async get(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  async set(key: string, value: T, ttlMs: number): Promise<void> {
    this.cache.set(key, {
      data: value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  clear(): void {
    this.cache.clear();
  }

  private invalidate(key: string): void {
    this.cache.delete(key);
  }
}

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}
```

### Logging Pattern

```typescript
import { logger } from '@/lib/logging/logger';

export function withLogging<T>(
  operation: string,
  fn: () => Promise<T>,
): Promise<T> {
  const startTime = performance.now();

  logger.info('operation_start', { operation });

  try {
    const result = await fn();

    const duration = performance.now() - startTime;

    logger.info('operation_complete', {
      operation,
      duration: `${duration.toFixed(2)}ms`,
    });

    return result;
  } catch (error) {
    const duration = performance.now() - startTime;

    logger.error('operation_failed', {
      operation,
      duration: `${duration.toFixed(2)}ms`,
      error: error.message,
      stack: error.stack,
    });

    throw error;
  }
}

// Usage
const result = await withLogging('database_query', () =>
  db.query('SELECT * FROM users'),
);
```

## Documentation Templates

### README Template

```markdown
# [Skill Name]

[Concise description - 2-3 sentences]

## Installation

No installation required for skills. Just use them with the `skill` tool.

## Usage

### Basic Usage

[Simple example]

### Advanced Usage

[Complex example]

## Examples

See [examples/](examples/) folder for detailed usage examples.

## Integration

This skill integrates with:

- [Related skill 1]
- [Related skill 2]

## Best Practices

- [Best practice 1]
- [Best practice 2]

## Anti-Patterns

- [What to avoid]
- [Why to avoid it]

## See Also

- [Related documentation]
- [Related skills]
```

### CHANGELOG Template

```markdown
# Changelog

All notable changes to [skill name] will be documented in this file.

## [Unreleased]

### Added

- [New feature]
- [New feature]

### Changed

- [Changed feature]
- [Changed feature]

### Fixed

- [Bug fix]
- [Bug fix]

### Removed

- [Removed feature]

## [Version] - YYYY-MM-DD

### Added

- [List of additions]

### Changed

- [List of changes]

### Fixed

- [List of fixes]
```

## Quality Checklist

Use these templates to ensure consistency:

### Before Creating Skill

- [ ] Purpose clearly defined
- [ ] Target use cases identified
- [ ] Existing skills reviewed for overlap
- [ ] Performance requirements considered
- [ ] Integration points planned

### During Development

- [ ] Templates followed consistently
- [ ] Code patterns applied
- [ ] Error handling included
- [ ] Logging integrated
- [ ] Tests written using test template
- [ ] Documentation follows documentation template

### Before Publishing

- [ ] SKILL.md < 200 LOC
- [ ] All modules < 500 LOC
- [ ] Quick references accurate
- [ ] Examples compile/run
- [ ] Cross-references valid
- [ ] No orphaned files
- [ ] Performance optimized
- [ ] Anti-patterns documented

---

Templates ensure consistency and reduce boilerplate across skills.
