# ADR 0001: Feature-Based Modular Architecture

**Date**: 2025-Q4 (Established) **Status**: Accepted **Deciders**: Development
Team **Documented**: 2026-01-11

## Context

Novelist.ai is a complex application with 14+ distinct feature areas including
plot generation, character management, world-building, semantic search, and
more. We needed an architecture that:

- Scales with feature growth
- Enables independent feature development
- Maintains clear boundaries between concerns
- Facilitates code discoverability and maintainability
- Enforces the 600 LOC file size limit through natural boundaries

## Decision

We adopted a **feature-based modular architecture** where code is organized by
feature rather than by technical layer.

**Structure**:

```
src/features/
├── [feature-name]/
│   ├── components/    # Feature-specific UI components
│   ├── hooks/         # Feature-specific React hooks
│   ├── services/      # Business logic and data operations
│   ├── types/         # Feature-specific type definitions
│   └── index.ts       # Public feature exports
```

**Principles**:

1. **Colocation**: Related code lives together
2. **Encapsulation**: Features export only what's needed publicly
3. **Separation of Concerns**: Each feature has single responsibility
4. **Minimal Coupling**: Features depend on infrastructure, not each other
5. **File Size**: 600 LOC maximum enforced per file

## Consequences

### Positive

- **Excellent code discoverability** - Developers can find code by feature, not
  by layer
- **High cohesion** - Related functionality naturally groups together
- **Low coupling** - Feature boundaries prevent tight coupling
- **Easy testing** - Features can be tested in isolation
- **Scalable** - New features added without impacting existing ones
- **Clear ownership** - Teams can own entire features
- **Natural file size limits** - Features encourage splitting when too large

### Negative

- **Code duplication risk** - Similar patterns might be repeated across features
- **Learning curve** - New developers must understand feature boundaries
- **Shared utilities** - Need careful placement of cross-feature utilities
- **Dependency management** - Must prevent feature-to-feature imports

## Implementation Details

**Allowed Dependencies**:

- Features → Infrastructure (`src/lib/`, `src/services/`)
- Features → Shared types (`src/types/`)
- Features → Shared components (`src/components/`, `src/shared/`)

**Forbidden Dependencies**:

- Features → Other features (direct imports)
- Infrastructure → Features (reverse dependency)

**Current Features** (14 total):

- analytics, characters, editor, gamification, generation
- plot-engine, projects, publishing, semantic-search, settings
- timeline, versioning, world-building, writing-assistant

## Alternatives Considered

1. **Layered Architecture** (Controller-Service-Repository)
   - Pros: Familiar, clear separation by technical concern
   - Cons: Code scattered across layers, harder navigation, scales poorly

2. **Domain-Driven Design (DDD)**
   - Pros: Strong domain modeling, bounded contexts
   - Cons: Heavy for current team size, requires deep domain expertise

3. **Monolithic Structure** (everything in src/)
   - Pros: Simple, no boundaries
   - Cons: Doesn't scale, becomes unmaintainable quickly

## Measurements

- **Cohesion Score**: 95% (excellent)
- **Coupling Level**: Low-Medium (appropriate)
- **Feature Count**: 14 modules
- **Average Feature Size**: ~15-20 files per feature
- **Cross-feature Imports**: Minimal (only through shared infrastructure)

## References

- [Feature-Sliced Design](https://feature-sliced.design/)
- [Screaming Architecture](https://blog.cleancoder.com/uncle-bob/2011/09/30/Screaming-Architecture.html)
- Internal: `plans/ARCHITECTURE-INTEGRITY-ASSESSMENT-JAN2026.md`
