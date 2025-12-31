---
name: architecture-guardian
description:
  Enforce clean architecture principles, proper layering rules, dependency flow,
  module boundaries, and interface design. Use when designing new features,
  refactoring code, or reviewing architecture.
---

# Architecture Guardian

Enforce clean architecture principles, proper layer separation, and well-defined
boundaries between architectural layers.

## Quick Reference

- **[Core Guidance](core-guidance.md)** - Detailed methodology and
  implementation
- **[Layering Rules](layering-rules.md)** - Layer separation principles
- **[Dependency Flow](dependency-flow.md)** - Allowed and prohibited
  dependencies
- **[Interface Design](interface-design.md)** - API and interface design
- **[Module Boundaries](module-boundaries.md)** - Module coupling and cohesion

## When to Use

- Designing new feature modules
- Refactoring existing architecture
- Creating new interfaces between layers
- Reviewing code for architectural compliance
- Setting up dependency injection
- Decoupling modules

## Core Methodology

Enforce clean architecture through systematic layering, dependency flow control,
and boundary management.

**Key Principles**:

1. Layer separation (Presentation, Application, Domain, Infrastructure)
2. Upward dependency flow (depends on abstractions, not implementations)
3. Clear module boundaries (bounded contexts)
4. Interface-based design (depend on contracts, not concretions)
5. SOLID principles adherence

**Quality Gates**:

- No circular dependencies
- No layering violations
- Clear public APIs
- Proper dependency directions
- Single responsibility per module

## Integration

- **domain-expert**: Ensures proper domain modeling
- **typescript-guardian**: Type safety in interfaces
- **feature-module-architect**: Structures features correctly
- **tech-stack-specialist**: Framework and tool configuration

## Best Practices

✓ Keep layers strictly separated ✓ Depend on abstractions, not concretions ✓
Define clear public APIs ✓ Use repository interfaces in domain layer ✓ Implement
dependency inversion ✓ Enforce bounded contexts ✓ Design interfaces with
segregation principle ✗ Mix responsibilities across layers ✗ Leak infrastructure
into domain ✗ Create tight coupling between features ✗ Allow circular
dependencies ✗ Make interfaces too large (segregate) ✗ Skip dependency flow
validation

---

## Content Modules

See detailed modules:

- **[Core Guidance](core-guidance.md)** - Implementation details and patterns
- **[Layering Rules](layering-rules.md)** - Layer separation
- **[Dependency Flow](dependency-flow.md)** - Dependency management
- **[Interface Design](interface-design.md)** - API design patterns
- **[Module Boundaries](module-boundaries.md)** - Coupling and cohesion
