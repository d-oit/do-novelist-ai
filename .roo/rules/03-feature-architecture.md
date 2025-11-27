# Feature-First Architecture Rules

## Directory Structure
```
src/
  features/<feature>/
    components/     # Feature-specific UI components
    hooks/         # Feature-specific React hooks
    types/         # Feature-specific TypeScript types
    services/      # Feature-specific services
    index.ts       # Public API boundary (REQUIRED)
  components/ui/   # Reusable primitive components
  components/layout/ # App shell and navigation
  lib/            # Shared utilities and singletons
  stores/         # Zustand state management
```

## Feature Compliance Rules
1. **Public API Boundary**: Every feature must have `index.ts` with explicit exports
2. **No Cross-Feature Imports**: Features should be isolated
3. **Co-location**: Component, logic, and tests live together
4. **500 LOC Max**: No single file exceeds 500 lines
5. **TypeScript First**: All files must be typed

## Export Patterns
```typescript
// Good - Explicit public API
export { CharacterManager } from './components/CharacterManager';
export { useCharacters } from './hooks/useCharacters';
export type { Character } from './types';

// Bad - Barrel exports that expose internals
export * from './components';
export * from './hooks';
```

## State Management
- Use Zustand for all state
- Max 3 useState per component
- AbortController required for all async operations
- Persistence middleware for important data