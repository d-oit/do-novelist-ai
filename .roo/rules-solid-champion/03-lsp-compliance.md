# LSP Compliance Rules

## Purpose
Liskov Substitution Principle: subtypes must be substitutable for base types in Novelist.ai.

## Rules
1. **Behavioral Compatibility**
   - Subclasses preserve base contracts (pre/post conditions)
   - No narrowing return types, widening inputs

2. **Examples**
   - Good: ContentGenerator impls all return Promise<string>
   - Bad: ChapterWriter returns Promise<Chapter> (unexpected)

3. **Interface Impl**
   - All required methods implemented
   - No throwing NotImplementedException

4. **Error Handling**
   - Subtypes don't throw new exception types

## Validation
- Unit tests with base interface mocking
- Subtype polymorphism tests

## Exceptions
- Abstract base: explicit NotImplemented allowed