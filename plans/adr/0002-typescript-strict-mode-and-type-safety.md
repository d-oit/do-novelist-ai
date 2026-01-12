# ADR 0002: TypeScript Strict Mode and Type Safety

**Date**: 2025-Q4 (Established) **Status**: Accepted **Deciders**: Development
Team **Documented**: 2026-01-11

## Context

As a complex application dealing with AI generation, data persistence, and user
content, Novelist.ai requires high reliability and bug prevention. We needed to
choose how strictly to enforce TypeScript typing to:

- Catch errors at compile-time rather than runtime
- Provide better IDE support and autocomplete
- Improve code maintainability and refactoring safety
- Enforce consistency across the codebase
- Reduce production bugs

## Decision

We adopted **TypeScript Strict Mode** with zero tolerance for:

- Implicit `any` types
- Unchecked indexed access
- Loose null checks
- Unused variables and parameters

**Configuration** (`tsconfig.json`):

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

**ESLint Enforcement**:

- `@typescript-eslint/no-explicit-any: "error"` (production code)
- `@typescript-eslint/explicit-function-return-type: "warn"`
- `@typescript-eslint/strict-boolean-expressions: "error"`

**Exception**: Test files allow `any` types where necessary for mocking and test
utilities.

## Consequences

### Positive

- **Zero TypeScript compilation errors** - 100% type-safe codebase
- **Better refactoring** - Type system catches breaking changes immediately
- **Improved IDE experience** - Autocomplete and inline documentation
- **Runtime error prevention** - Many bugs caught at compile time
- **Self-documenting code** - Types serve as inline documentation
- **Consistent code quality** - Enforced across all developers

### Negative

- **Steeper learning curve** - Strict types require more TypeScript knowledge
- **More verbose code** - Explicit types add lines of code
- **Slower initial development** - Type definitions take time upfront
- **Generic complexity** - Some patterns require complex generics

## Implementation Details

**Type Safety Tools**:

1. **Zod Schemas** - Runtime validation with type inference
2. **Explicit Return Types** - All functions declare return types
3. **Type Guards** - Custom type narrowing functions
4. **Branded Types** - Prevent primitive type confusion
5. **Discriminated Unions** - Type-safe state management

**Metrics**:

- TypeScript errors: **0** ✅
- ESLint errors: **0** ✅
- `any` types in production code: **0** ✅
- Type coverage: **~95%** (estimated)

## Alternatives Considered

1. **Loose TypeScript** (strict: false)
   - Pros: Faster initial development, easier for beginners
   - Cons: Runtime errors, poor refactoring safety, inconsistent code

2. **Gradual Typing** (strict mode with exceptions)
   - Pros: Balanced approach, allows pragmatic exceptions
   - Cons: Inconsistent, exceptions tend to grow over time

3. **No TypeScript** (Plain JavaScript)
   - Pros: No type overhead, maximum flexibility
   - Cons: No compile-time safety, poor tooling, high bug risk

## Success Metrics

**Before Strict Mode** (hypothetical):

- Runtime type errors: Frequent
- Refactoring confidence: Low
- Onboarding difficulty: High (implicit contracts)

**After Strict Mode** (current):

- Runtime type errors: Rare
- Refactoring confidence: High
- Onboarding difficulty: Moderate (explicit contracts help)
- Build errors caught: 100% at compile time

## Migration Strategy

Since strict mode was adopted early, no migration was needed. For future
reference:

1. Enable strict mode incrementally per file/module
2. Fix errors in infrastructure layer first
3. Work up to feature layer
4. Use `@ts-expect-error` with TODO comments only as last resort
5. Document any unavoidable exceptions

## References

- [TypeScript Strict Mode](https://www.typescriptlang.org/tsconfig#strict)
- [TypeScript Deep Dive - Strict Mode](https://basarat.gitbook.io/typescript/intro-1/strictnullchecks)
- Internal: `plans/CODEBASE-QUALITY-ASSESSMENT-JAN2026.md`
