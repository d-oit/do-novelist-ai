# Framework Usage Rules

## Purpose
Defines React 19.2, Tailwind, Zustand, Gemini API usage patterns for Novelist.ai.

## Rules
1. **React 19.2 Patterns**
   - Feature-first: src/features/{feature}/{components|hooks|types|services}/index.ts
   - Max 500 LOC/file, co-locate tests
   - Hooks: custom hooks for all logic, AbortController in useEffect/useCallback

2. **Tailwind CSS**
   - Utility-first only, no @apply
   - clsx + tailwind-merge for conditional classes
   - Dark-first: slate-900 base, indigo primary
   - Mobile: 100dvh drawers, grid-cols-[240px_1fr] desktop

3. **Zustand State**
   - stores/ per feature, persistence middleware
   - Selectors for granular updates
   - No useState >3/component

4. **Gemini API**
   - JSON responseSchema for structured output
   - Temperature: 0.3 validate, 0.7 creative, 0.8 brainstorm
   - Cache all generations

## Validation
- ESLint: no @apply, max-lines-per-function
- TSC strict, Zod runtime

## Exceptions
- Legacy components: migrate ASAP, flag in comments