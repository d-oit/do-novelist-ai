# DIP Architecture Rules

## Purpose
Dependency Inversion Principle: high-level modules don't depend on low-level in Novelist.ai.

## Rules
1. **Abstractions**
   - Depend on interfaces, not concretes
   - IGoapService injected into hooks

2. **DI Patterns**
   - Constructor injection for services
   - Zustand middleware for store DI

3. **Examples**
   - Good: useGemini(IGeminiProvider)
   - Bad: new GeminiAPI() in hook

## Validation
- No new ConcreteClass() in high-level code
- All deps via param/interface

## Exceptions
- Pure functions: no deps