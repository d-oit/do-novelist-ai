# Test Strategy

## Purpose
Testing approach and coverage targets for Novelist.ai quality assurance.

## Rules
1. **Coverage Targets**
   - Unit: 80%+ src/
   - Integration: 70% hooks/services
   - E2E: 100% critical paths (project create → publish)

2. **Test Pyramid**
   - 70% unit (Vitest)
   - 20% integration
   - 10% E2E (Playwright)

3. **Test Types**
   - Unit: pure functions, hooks (msw mocks)
   - Integration: Zustand + services
   - E2E: user flows, persistence

## Validation
- vitest --coverage
- playwright show-report

## Exceptions
- Generated code: doc only