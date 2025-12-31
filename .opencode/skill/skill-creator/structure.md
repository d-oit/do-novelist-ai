# Skill Structure Guide

Organizational patterns for maintaining skill structure and scalability.

## Directory Structure

### Simple Skill (< 200 LOC)

```
skill-name/
└── SKILL.md
```

**Use case**: Skills with focused, straightforward guidance.

### Complex Skill (≥ 200 LOC)

```
skill-name/
├── SKILL.md              # Entry point (< 200 LOC)
├── core-guidance.md      # Main methodology
├── patterns.md           # Design patterns
├── templates.md          # Reusable templates
└── examples/            # Concrete usage examples
    ├── basic.md
    └── advanced.md
```

**Use case**: Skills requiring detailed guidance and multiple examples.

## File Purpose

### SKILL.md (Entry Point)

**Purpose**: Quick navigation and skill discovery **Max lines**: 200
**Content**:

- YAML frontmatter
- Quick reference links
- When to use section
- Core methodology summary
- Best practices summary

### core-guidance.md

**Purpose**: Detailed methodology and implementation **Max lines**: 500
**Content**:

- Step-by-step processes
- Detailed explanations
- Code examples
- Edge cases

### patterns.md

**Purpose**: Reusable design patterns **Max lines**: 500 **Content**:

- Pattern catalog
- Anti-patterns
- When to apply each pattern
- Pattern implementation examples

### templates.md

**Purpose**: Ready-to-use templates **Max lines**: 500 **Content**:

- File templates
- Code templates
- Section templates
- Configuration templates

### examples/

**Purpose**: Concrete usage demonstrations **Max lines per file**: 500
**Content**:

- Basic examples (examples/basic.md)
- Advanced examples (examples/advanced.md)
- Real-world scenarios
- Common pitfalls

## Naming Conventions

### Directory Names

```bash
✅ Good:
- skill-creator
- qa-engineer
- performance-optimizer

✗ Bad:
- skill_creator (underscores)
- SkillCreator (PascalCase)
- skill-creator-templates (too specific)
```

### File Names

```bash
✅ Good:
- SKILL.md (always uppercase)
- core-guidance.md (lowercase, kebab-case)
- patterns.md (lowercase, kebab-case)
- examples/basic.md (organized in folder)

✗ Bad:
- skill.md (lowercase)
- coreGuidance.md (camelCase)
- basic-examples.md (no folder)
```

## Content Organization

### SKILL.md Structure

````markdown
---
name: skill-name
description: [Concise 1-1024 chars]. Use when [scenarios].
---

# Skill Title

[Quick summary]

## Quick Reference

- **[Module Name](module-name.md)** - Description
- **[Module Name](module-name.md)** - Description

## When to Use

- Scenario 1
- Scenario 2

## Core Methodology

[Brief overview 3-5 bullet points]

## Integration

- **skill-creator**: Relationship
- **other-skill**: Relationship

## Best Practices

✓ [Key principle] ✓ [Key principle] ✗ [Avoid this]

---

## Content Module Structure

### core-guidance.md

```markdown
# Core Guidance

## Overview

[What this module covers]

## Detailed Process

[Step-by-step guidance]

## Code Examples

[Implementation examples]

## Edge Cases

[How to handle edge cases]
```
````

### patterns.md

```markdown
# Design Patterns

## Pattern Catalog

### Pattern 1: Name

**When to use**: [Scenarios] **Implementation**: [Code example] **Pros**:
[Benefits] **Cons**: [Tradeoffs]

## Anti-Patterns

### Anti-Pattern 1: Name

**Why avoid**: [Reason] **Alternatives**: [Better approaches]
```

### templates.md

```markdown
# Templates

## File Templates

### Template 1

[Reusable file template]

## Code Templates

### Template 1

[Reusable code template]

## Section Templates

### Section Template

[Reusable section structure]
```

## Module Boundaries

### What Goes Where

| Module Type          | Content                        | Max Lines |
| -------------------- | ------------------------------ | --------- |
| SKILL.md             | Entry point, quick reference   | 200       |
| core-guidance.md     | Detailed methodology           | 500       |
| patterns.md          | Design patterns, anti-patterns | 500       |
| templates.md         | Reusable templates             | 500       |
| examples/basic.md    | Basic usage examples           | 500       |
| examples/advanced.md | Advanced examples              | 500       |

### Cross-Module References

**In SKILL.md**:

```markdown
## Quick Reference

- **[Core Concepts](core-guidance.md)** - What this skill does
- **[Patterns](patterns.md)** - How to structure solutions
```

**In core-guidance.md**:

```markdown
## See Also

- **[Templates](templates.md)** - Ready-to-use templates
- **[Examples](examples/basic.md)** - Usage examples
```

## Migration Strategy

### Refactoring Existing Skills

**From monolithic to modular**:

1. Assess current skill structure
2. Identify natural modules
3. Create module files
4. Move content (preserving order)
5. Update SKILL.md to entry point
6. Verify all links work
7. Update .roo/ references if needed

**Example transformation**:

```markdown
# Before (monolithic, 600 lines)

.opencode/skill/my-skill/ └── SKILL.md (600 lines)

# After (modular, < 200 lines each)

.opencode/skill/my-skill/ ├── SKILL.md (180 lines - entry point) ├──
core-guidance.md (350 lines) ├── patterns.md (300 lines) ├── templates.md (200
lines) └── examples/ └── basic.md (150 lines)
```

## Quality Checks

### Before Publishing Skill

**Structure**:

- [ ] SKILL.md exists and < 200 LOC
- [ ] All modules < 500 LOC
- [ ] Directory structure is correct
- [ ] All files use kebab-case (except SKILL.md)
- [ ] No orphaned files

**Content**:

- [ ] SKILL.md has quick reference links
- [ ] All cross-references work
- [ ] Examples are up to date
- [ ] Templates match current best practices
- [ ] No obsolete content

**Metadata**:

- [ ] YAML frontmatter is valid
- [ ] Name follows naming rules
- [ ] Description is concise (< 1024 chars)
- [ ] Version information if needed

### After Skill Creation

**Validation**:

```bash
# Check structure
test -f .opencode/skill/skill-name/SKILL.md
test -f .opencode/skill/skill-name/core-guidance.md

# Check naming conventions
# Ensure lowercase-with-hyphens directory names

# Validate YAML
head -n 5 .opencode/skill/skill-name/SKILL.md | grep "^name:"
```

## Best Practices Summary

### DO:

✓ Keep SKILL.md as focused entry point (< 200 LOC) ✓ Split detailed content into
modules (< 500 LOC each) ✓ Use descriptive, kebab-case file names ✓ Organize
examples in folders ✓ Provide quick reference links in SKILL.md ✓ Update
cross-references when moving content ✓ Maintain consistent structure across
modules ✓ Add examples for common use cases

### DON'T:

✗ Create monolithic SKILL.md files (> 200 LOC) ✗ Mix unrelated content in single
file ✗ Use uppercase or underscores in filenames ✗ Skip quick reference links ✗
Make examples disorganized ✗ Leave dead cross-references ✗ Forget to update
.roo/ rules ✗ Create orphaned files without structure ✗ Exceed 500 LOC in any
module

---

Well-structured skills are discoverable, maintainable, and performant.
