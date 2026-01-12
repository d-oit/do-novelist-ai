# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records (ADRs) for Novelist.ai - a
comprehensive log of significant architectural and technical decisions made
during development.

## Purpose

ADRs help us:

- Document the reasoning behind key technical choices
- Provide context for future architectural changes
- Onboard new team members efficiently
- Learn from past decisions
- Avoid revisiting settled debates

## ADR Format

Each ADR follows this structure:

- **Context**: The situation prompting the decision
- **Decision**: What we decided to do
- **Consequences**: Positive and negative outcomes
- **Alternatives Considered**: Other options and why they were rejected
- **Status**: Accepted, Superseded, Deprecated, or Rejected

## Index of ADRs

### Meta

- [ADR-0000: Use Architecture Decision Records](./0000-use-architecture-decision-records.md)
  - Establishes the ADR practice itself
  - Status: **Accepted**

### Architecture & Structure

- [ADR-0001: Feature-Based Modular Architecture](./0001-feature-based-modular-architecture.md)
  - Why we organize code by feature rather than by layer
  - Colocation principle and 600 LOC file limit enforcement
  - Status: **Accepted**

### Type Safety & Validation

- [ADR-0002: TypeScript Strict Mode and Type Safety](./0002-typescript-strict-mode-and-type-safety.md)
  - Zero tolerance for implicit `any` and loose typing
  - Strict mode configuration and ESLint enforcement
  - Status: **Accepted**

- [ADR-0004: Zod for Runtime Validation](./0004-zod-for-runtime-validation.md)
  - Runtime validation with automatic type inference
  - Validating AI responses and user input
  - Status: **Accepted**

### Data Layer

- [ADR-0003: Drizzle ORM for Database Access](./0003-drizzle-orm-for-database-access.md)
  - Type-safe database operations with LibSQL/Turso
  - Migration system and schema management
  - Status: **Accepted**

## Creating a New ADR

When making a significant architectural decision:

1. **Copy the template** from ADR-0000
2. **Number it sequentially** (next available number)
3. **Fill in all sections**:
   - Context (why this decision is needed)
   - Decision (what we're doing)
   - Consequences (tradeoffs)
   - Alternatives (what else we considered)
4. **Set initial status** to "Proposed" or "Accepted"
5. **Get team review** before merging
6. **Update this index** with the new ADR

## What Deserves an ADR?

Document decisions that:

- ✅ Impact multiple features or the whole system
- ✅ Are difficult or expensive to reverse
- ✅ Involve tradeoffs between competing concerns
- ✅ Establish patterns for future development
- ✅ Require team alignment

Don't document:

- ❌ Implementation details within a single feature
- ❌ Trivial or easily reversible choices
- ❌ Framework-standard practices

## ADR Status Lifecycle

```
Proposed → Accepted → (Superseded | Deprecated)
    ↓
Rejected
```

- **Proposed**: Under discussion
- **Accepted**: Active and followed
- **Superseded**: Replaced by a newer ADR
- **Deprecated**: No longer recommended but not yet removed
- **Rejected**: Considered but not adopted

## References

- [ADR GitHub Organization](https://adr.github.io/)
- [Michael Nygard's ADR Article](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- [When to Write an ADR](https://github.com/joelparkerhenderson/architecture-decision-record#when-to-write-an-adr)

---

**Last Updated**: 2026-01-11 **Total ADRs**: 5 **Active ADRs**: 5
