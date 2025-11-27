# OCP Patterns

## Purpose
Open/Closed Principle patterns for Novelist.ai extensibility without modification.

## Rules
1. **Strategy Pattern**
   - AgentStrategy interface for GOAP agents
   - Extend via new impl, no core changes

2. **Plugin Architecture**
   - GeminiProvider interface, swap Imagen/OpenAI
   - Register via DI container/Zustand

3. **Composition over Inheritance**
   - Hook composition: useEditor = useChapters + useGoap
   - Feature plugins via index.ts

4. **Examples**
   - Good: New genre style via StyleStrategy
   - Bad: if (genre === 'fantasy') in core logic

## Validation
- No switch/if on extensible types
- 100% interface coverage for plugins

## Exceptions
- Core primitives: React components