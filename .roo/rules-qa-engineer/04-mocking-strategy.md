# Mocking Strategy Rules

## Purpose
Mocking guidelines for reliable, fast Novelist.ai tests.

## Rules
1. **msw for API**
   - Mock Gemini, Turso endpoints
   - Example: rest.post('/gemini', handler)

2. **vi.mock for Modules**
   - External deps only (gemini.ts)
   - Restore mocks afterEach

3. **Zustand Testing**
   - createTestStore for isolated tests
   - No real persistence in tests

4. **No Mock Chains**
   - Mock at boundary (service layer)

## Validation
- No unmocked external calls
- Mock reset between tests

## Exceptions
- Pure utils: no mocks