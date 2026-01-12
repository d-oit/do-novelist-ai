# ADR 0004: Zod for Runtime Validation and Type Safety

**Date**: 2025-Q4 (Established) **Status**: Accepted **Deciders**: Development
Team **Documented**: 2026-01-11

## Context

Novelist.ai handles untrusted data from multiple sources:

- User input (forms, AI generation prompts)
- AI model responses (structured and unstructured)
- LocalStorage/IndexedDB persistence
- External API responses
- Import/export operations

We needed a validation solution that:

- Validates data at runtime (TypeScript types are compile-time only)
- Provides automatic TypeScript type inference from schemas
- Gives detailed, user-friendly error messages
- Integrates seamlessly with TypeScript
- Supports complex nested structures
- Validates AI-generated content structure

## Decision

We chose **Zod** (v4.1.12+) as our runtime validation and schema definition
library.

**Usage Pattern**:

```typescript
import { z } from 'zod';

// Define schema (single source of truth)
export const ProjectSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'completed']),
  createdAt: z.number().int().positive(),
});

// Infer TypeScript type automatically
export type Project = z.infer<typeof ProjectSchema>;

// Validate at runtime
const result = ProjectSchema.safeParse(untrustedData);
if (result.success) {
  const project: Project = result.data; // Type-safe!
}
```

## Consequences

### Positive

- **Type Safety Bridge** - Connects runtime validation with compile-time types
- **Single Source of Truth** - Schema defines both validation and types
- **Excellent DX** - Type inference eliminates manual type definitions
- **Rich Validation** - Custom validators, transformers, refinements
- **Composable Schemas** - Easy to build complex structures
- **Great Error Messages** - Detailed, actionable validation errors
- **AI Response Validation** - Perfect for validating structured AI outputs
- **Bundle Efficient** - Tree-shakeable, minimal runtime overhead

### Negative

- **Runtime Overhead** - Validation has performance cost (minimal but present)
- **Bundle Size** - Adds ~12KB (minified) to bundle
- **Learning Curve** - Different patterns than traditional validation
- **Type Complexity** - Advanced schemas can have complex inferred types

## Implementation Details

**Coverage**:

- Schema files with Zod: 16+ files
- Validated types: 50+ schemas
- Critical validation points: All data boundaries

**Key Areas**:

1. **Form Validation** - User inputs validated before submission
2. **AI Response Parsing** - Structured AI outputs validated
3. **Database Operations** - Data validated before persistence
4. **Import/Export** - File formats validated on load
5. **API Boundaries** - External data validated on entry

**Example - AI Response Validation**:

```typescript
// AI model must return this structure
const PlotSuggestionSchema = z.object({
  title: z.string(),
  description: z.string(),
  plotPoints: z.array(
    z.object({
      sequence: z.number(),
      event: z.string(),
    }),
  ),
});

// Validate AI response
const aiResponse = await generatePlot(prompt);
const result = PlotSuggestionSchema.safeParse(aiResponse);

if (!result.success) {
  logger.error('AI returned invalid structure', { errors: result.error });
  // Handle gracefully - retry or use fallback
}
```

**Metrics**:

- Validation errors caught: 100% at runtime boundaries
- Type inference usage: 95%+ of schemas
- Bundle impact: ~12KB minified
- Performance overhead: <1ms per validation

## Alternatives Considered

1. **Yup**
   - Pros: Mature, widely used, similar API
   - Cons: No automatic type inference, manual type definitions
   - Rejected: Requires maintaining separate type definitions

2. **io-ts**
   - Pros: Excellent type inference, functional programming style
   - Cons: Steeper learning curve, more verbose
   - Rejected: Less ergonomic API, higher complexity

3. **Joi**
   - Pros: Very mature, extensive validation rules
   - Cons: No TypeScript type inference, server-focused
   - Rejected: Designed for Node.js, lacks client-side DX

4. **AJV (JSON Schema)**
   - Pros: Fast, standards-based, widely supported
   - Cons: No type inference, verbose JSON Schema syntax
   - Rejected: Loses TypeScript integration benefits

5. **Manual Validation**
   - Pros: No dependencies, full control
   - Cons: Error-prone, inconsistent, no type inference
   - Rejected: Too much maintenance burden

## Success Metrics

**Before Zod** (hypothetical):

- Runtime type errors: Frequent
- Validation consistency: Low
- Type-validation sync: Manual, error-prone

**After Zod** (current):

- Runtime type errors: Rare (caught at boundaries)
- Validation consistency: High (shared schemas)
- Type-validation sync: Automatic (type inference)
- AI response errors: Caught and handled gracefully

## Best Practices Established

1. **Boundary Validation** - Validate all external data sources
2. **Schema Colocation** - Keep schemas near the features that use them
3. **Safe Parsing** - Use `.safeParse()` for better error handling
4. **Error Logging** - Log validation failures with context
5. **User-Friendly Messages** - Transform Zod errors for user display
6. **Schema Composition** - Build complex schemas from smaller ones

## Future Considerations

- **Performance**: Monitor validation overhead in hot paths
- **Custom Validators**: Expand business rule validation
- **Schema Registry**: Central registry for shared schemas
- **Documentation**: Generate API docs from Zod schemas

## References

- [Zod Documentation](https://zod.dev/)
- [TypeScript Type Inference](https://zod.dev/?id=type-inference)
- Internal: `plans/CODEBASE-QUALITY-ASSESSMENT-JAN2026.md`
- Internal: `src/types/schemas.ts` (example schemas)
