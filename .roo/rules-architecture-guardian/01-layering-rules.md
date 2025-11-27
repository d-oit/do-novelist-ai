# Layering Rules

## Purpose
Enforces strict layer separation in Novelist.ai feature-first architecture per SPARC Process.

## Rules
1. **Layer Hierarchy**
   - Presentation: src/features/*/components/
   - Application: src/features/*/hooks/services/
   - Domain: src/lib/* (gemini.ts, db.ts, validation.ts)
   - Infrastructure: stores/, types/, lib/cache.ts

2. **Dependency Direction**
   - Downward only: Presentation → Application → Domain → Infra
   - No upward: Domain never imports UI components

3. **Layer Thickness**
   - Thin layers: <10 files/domain layer
   - Single Responsibility: one concern per layer/file

4. **SPARC Mapping**
   - Specification: .roo/rules-domain-expert/
   - Process: workflows in hooks/services
   - Artifacts: generated types/schemas
   - Roles: explicit index.ts boundaries

## Validation
- Dependency cruiser: no cyclic/upward deps
- grep: no UI imports in lib/

## Exceptions
- Global utils: lib/utils.ts (pure functions only)