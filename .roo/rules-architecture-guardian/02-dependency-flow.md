# Dependency Flow Rules

## Purpose
Ensures unidirectional dependency flow in Novelist.ai codebase per Dependency Inversion Principle.

## Rules
1. **Dependency Direction**
   - Features depend on lib/stores
   - lib depends on types/ (pure)
   - No cycles: features never depend on other features

2. **Public Boundaries**
   - index.ts only: explicit re-exports
   - No * barrel exports exposing internals
   - Example: export { useGoapEngine } from './hooks/useGoapEngine';

3. **Abstraction over Details**
   - Depend on interfaces: IGoapPlanner not GoapEngineImpl
   - Hooks/services inject deps via params/Zustand

4. **Cross-Feature Communication**
   - Events only: Zustand global store or custom event bus
   - No direct imports

## Validation
- madge --circular src/
- grep '^import .*from "src/features/[^/]+/features/'

## Exceptions
- Shared UI primitives: src/components/ui/
- Global stores: src/lib/stores/