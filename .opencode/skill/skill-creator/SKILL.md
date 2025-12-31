---
name: skill-creator
description:
  Create new Claude Code skills with proper structure, modular organization, and
  performance optimization. Use when building new skills, refactoring existing
  skills, or improving skill maintainability.
---

# Skill Creator

Create high-performance, maintainable Claude Code skills following modular best
practices.

## Quick Reference

- **[Skill Structure Guide](structure.md)** - File organization and module
  patterns
- **[Performance Optimization](performance.md)** - Token optimization and
  caching strategies
- **[Templates and Examples](templates.md)** - Ready-to-use skill templates

## When to Use

- Creating new reusable skills
- Refactoring monolithic skills
- Optimizing existing skill performance
- Splitting large skills into modules
- Setting up skill documentation structure
- Improving skill discoverability

## Skill Structure Best Practices

### Modular File Organization

```
.opencode/skill/skill-name/
├── SKILL.md                    # Main entry point (keep < 200 LOC)
├── structure.md               # File organization guide
├── performance.md            # Optimization strategies
├── templates.md              # Reusable patterns
└── examples/                 # Concrete usage examples
    ├── basic-usage.md
    └── advanced-usage.md
```

### SKILL.md Entry Point

**Keep SKILL.md focused (< 200 lines)**:

- Concise description in frontmatter
- Quick reference links to modules
- When to use section
- Core methodology summary
- Integration points
- Best practices summary

**Move detailed content to modules**:

- Detailed guides → separate .md files
- Code examples → examples/ folder
- Templates → templates.md
- Performance tips → performance.md

## Performance Optimization

### Token Usage Optimization

**Input Optimization**:

```yaml
# ❌ Bad - Verbose description
description: This skill helps with creating new Claude Code skills by providing comprehensive guidance on file structure, naming conventions, best practices for documentation, templates for different skill types, and examples of how to use them effectively in various scenarios.

# ✅ Good - Concise and complete
description: Create new Claude Code skills with proper structure, modular organization, and performance optimization. Use when building new skills, refactoring existing skills, or improving skill maintainability.
```

**Output Optimization**:

- Use structured data when appropriate
- Return JSON instead of prose when possible
- Include only requested information
- Use numeric codes for categories

### Smart Caching

````markdown
# In skill documentation:

## Caching Strategy

Cache skill results based on input hash:

```typescript
const cacheKey = hashInput(parameters);
if (cache.has(cacheKey)) {
  return cache.get(cacheKey);
}
const result = await process(parameters);
cache.set(cacheKey, result, { ttl: 5 * 60 * 1000 }); // 5 minutes
return result;
```
````

Use appropriate TTL:

- Static data: 1 hour
- User preferences: 10 minutes
- Real-time data: 30 seconds

````

## Skill Creation Workflow

### Step 1: Define Purpose

```markdown
## Problem Statement

What problem does this skill solve?

- Specific task: [e.g., "Create new skill"]
- Domain: [e.g., "skill development"]
- User need: [e.g., "Ensure consistent structure"]

## Success Criteria

- Skill creates functional SKILL.md files
- Follows OpenCode skill format
- All files under 500 LOC
- Modular organization for complex skills
````

### Step 2: Choose Name and Structure

**Naming Requirements**:

- Lowercase letters only
- Numbers allowed
- Hyphens for word separation (no underscores)
- No spaces
- Max 64 characters
- Descriptive and clear

**Examples**:

```
✅ Good:
- skill-creator
- qa-engineer
- performance-optimizer

✗ Bad:
- SkillCreator (uppercase)
- skill_creator (underscores)
- Skill Creator (spaces)
- very-long-descriptive-name-exceeding-limit (too long)
```

### Step 3: Design Modular Structure

**For simple skills (< 200 LOC)**:

```
.opencode/skill/simple-skill/
└── SKILL.md
```

**For complex skills (> 200 LOC)**:

```
.opencode/skill/complex-skill/
├── SKILL.md              # Entry point (< 200 LOC)
├── core-guidance.md     # Main content
├── patterns.md          # Design patterns
├── examples/            # Usage examples
│   ├── basic.md
│   └── advanced.md
└── templates.md         # Reusable templates
```

### Step 4: Write SKILL.md Entry Point

```yaml
---
name: skill-name
description: [Concise description 1-1024 chars]. Use when [specific scenarios].
---

# Skill Title

[Quick summary - 2-3 sentences]

## Quick Reference

- **[Module Name](module-name.md)** - What this module covers

## When to Use

- Scenario 1
- Scenario 2

## Core Methodology

[Brief overview of approach - 3-5 bullet points]

## Integration

- **skill-creator**: For creating new skills
- **other-skills**: Related skills

## Best Practices

✓ [Key principle]
✓ [Key principle]
✗ [Avoid this]

---

## Content Modules

See detailed modules:
- **[Core Guidance](core-guidance.md)**: Detailed methodology
- **[Patterns](patterns.md)**: Design patterns and anti-patterns
- **[Templates](templates.md)**: Ready-to-use templates
- **[Examples](examples/)**: Concrete usage examples
```

### Step 5: Create Content Modules

**structure.md**:

```markdown
# Skill Structure

## File Organization

[Directory structure explanation]

## File Naming

[Naming conventions]

## Module Boundaries

[What goes in which file]

## Entry Points

[How to navigate the skill]
```

**performance.md**:

```markdown
# Performance Optimization

## Token Optimization

[Input/output optimization strategies]

## Caching

[Result caching, partial caching, TTL strategies]

## Parallel Processing

[When and how to use parallel execution]

## Monitoring

[Metrics to track, logging strategy]
```

**templates.md**:

```markdown
# Templates

## Basic Template

[Minimal structure for simple skills]

## Advanced Template

[Modular structure for complex skills]

## Section Templates

[Reusable section patterns]
```

### Step 6: Add Examples

**examples/basic-usage.md**:

````markdown
# Basic Usage

## Example 1: Simple Scenario

```typescript
// Code example
const result = useSkill({
  parameters,
});
```
````

## Example 2: Common Pattern

[Another common usage]

````

**examples/advanced-usage.md**:
```markdown
# Advanced Usage

## Complex Scenario

[Complex usage pattern]

## Integration Example

[How to integrate with other skills]
````

## Anti-Patterns to Avoid

### ❌ Monolithic SKILL.md

```markdown
# ✗ Bad - Everything in one file (> 500 LOC)

.opencode/skill/bad-skill/ └── SKILL.md (800 lines)
```

```markdown
# ✅ Good - Modular structure

.opencode/skill/good-skill/ ├── SKILL.md (180 lines - entry point) ├──
core-guidance.md (250 lines) ├── patterns.md (200 lines) ├── templates.md (150
lines) └── examples/ ├── basic.md (100 lines) └── advanced.md (120 lines)
```

### ❌ Verbose Descriptions

```yaml
# ✗ Bad - Too long and vague
description: This skill provides comprehensive guidance and best practices for creating new skills in the Claude Code environment, including file structure, naming conventions, documentation standards, templates, examples, and integration patterns.

# ✅ Good - Concise and complete
description: Create new Claude Code skills with proper structure, modular organization, and performance optimization. Use when building new skills, refactoring existing skills, or improving skill maintainability.
```

### ❌ No Performance Considerations

```markdown
# ✗ Bad - No optimization guidance

# Content only, no performance tips
```

```markdown
# ✅ Good - Includes performance module

- Token optimization strategies
- Caching recommendations
- Monitoring guidance
```

## Performance Metrics for Skills

### Key Indicators

1. **Token Usage**:
   - Input tokens per invocation: Target < 2000
   - Output tokens per response: Target < 3000
   - Cache hit rate: Target > 40%

2. **Execution Speed**:
   - Response time: Target < 3s for 95% requests
   - Cold start: Target < 2s
   - Cached response: Target < 500ms

3. **Reliability**:
   - Success rate: Target > 99.5%
   - Error handling coverage: All error paths documented

4. **Maintainability**:
   - File size: Max 500 LOC per file
   - Module cohesion: Single responsibility per module
   - Documentation: All APIs documented

## Skill Quality Checklist

### Structure

- [ ] SKILL.md < 200 LOC (entry point)
- [ ] All modules < 500 LOC
- [ ] Clear directory structure
- [ ] Consistent naming convention
- [ ] Quick reference links work

### Performance

- [ ] Token-efficient description
- [ ] Caching strategy documented
- [ ] Parallel processing considered
- [ ] Error handling with fallbacks
- [ ] Monitoring guidance included

### Documentation

- [ ] When to use section clear
- [ ] Core methodology concise
- [ ] Integration points documented
- [ ] Examples provided
- [ ] Anti-patterns highlighted

### Best Practices

- [ ] DO sections clear
- [ ] DON'T sections included
- [ ] Quick reference prominent
- [ ] External references accurate
- [ ] Version information included

## Skill Creation Template

### Simple Skill Template

```yaml
---
name: simple-skill
description: Concise description of what this skill does. Use when [specific scenario].
---

# Simple Skill Title

## Quick Reference

- **[Core Concepts](concepts.md)** - Key concepts and terminology

## When to Use

- Scenario 1
- Scenario 2

## Core Methodology

[Brief overview - 3 bullet points]

## Best Practices

✓ [Principle 1]
✓ [Principle 2]
✗ [Avoid this]
```

### Complex Skill Template

```yaml
---
name: complex-skill
description: Concise description of complex skill with multiple modules. Use when [scenarios].
---

# Complex Skill Title

## Quick Reference

- **[Core Concepts](core-concepts.md)** - Key concepts
- **[Advanced Patterns](advanced-patterns.md)** - Complex patterns
- **[Integration Guide](integration.md)** - How to integrate
- **[Examples](examples/)** - Usage examples

## When to Use

- Scenario 1: [Description]
- Scenario 2: [Description]

## Core Methodology

[High-level overview]

## Content Modules

Detailed guidance available in:
- **[Core Concepts](core-concepts.md)**: Fundamental concepts
- **[Advanced Patterns](advanced-patterns.md)**: Complex patterns
- **[Integration Guide](integration.md)**: Integration with other skills

## Integration

- **skill-creator**: Use for creating skills
- **other-skills**: Related skills

## Best Practices Summary

### DO:
✓ Keep SKILL.md focused (< 200 LOC)
✓ Use modular file structure
✓ Optimize token usage
✓ Include caching strategies
✓ Add performance monitoring
✓ Provide clear examples
✓ Document anti-patterns

### DON'T:
✗ Create monolithic SKILL.md files
✗ Use verbose descriptions
✗ Skip performance considerations
✗ Ignore caching opportunities
✗ Forget error handling
✗ Make files > 500 LOC
✗ Skip documentation
✗ Omit examples
```

## Continuous Improvement

### Performance Tracking

Track metrics over time:

- Token usage trends
- Cache hit rates
- Response times
- Error rates

### User Feedback

Collect feedback on:

- Skill discoverability
- Documentation clarity
- Example usefulness
- Performance improvements

### Optimization Iterations

Regular review cycles:

- Quarterly: Review and optimize token usage
- Monthly: Update examples and templates
- Weekly: Monitor cache performance
- Continuous: Fix reported issues

## Integration with Other Skills

- **goap-agent**: Plan complex skill creation projects
- **code-quality-management**: Enforce skill quality standards
- **qa-engineer**: Test skill implementations
- **documentation-curator**: Maintain skill documentation

## Best Practices Summary

### DO:

✓ Keep SKILL.md focused (< 200 LOC) ✓ Use modular file structure for complex
skills ✓ Optimize token usage in descriptions ✓ Implement caching strategies ✓
Add performance monitoring ✓ Provide clear examples ✓ Document anti-patterns ✓
Keep files < 500 LOC ✓ Use quick references for navigation

### DON'T:

✗ Create monolithic SKILL.md files (> 200 LOC) ✗ Use verbose descriptions ✗ Skip
performance considerations ✗ Ignore modular structure ✗ Forget caching
strategies ✗ Skip error handling ✗ Make examples unclear ✗ Omit anti-patterns ✗
Exceed 500 LOC per file

---

Build skills that are performant, maintainable, and easy to discover.
