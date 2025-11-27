# Caching Strategy Rules

## Purpose
Caching patterns for Gemini calls, state, and computed data in Novelist.ai.

## Rules
1. **Gemini Cache**
   - withCache wrapper: key by prompt+params
   - TTL: 24h generations, 1h illustrations

2. **Zustand Persistence**
   - middleware(persist): projects, worldState
   - Partialize: exclude transients

3. **React Caching**
   - useMemo for expensive computes
   - React Query? No, Zustand selectors

4. **EPUB Cache**
   - Incremental ZIP, cache chapters

## Validation
- Cache hit rate >70%
- Stale data tests

## Exceptions
- Real-time: no cache