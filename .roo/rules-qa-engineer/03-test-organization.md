# Test Organization Rules

## Purpose
File structure and co-location standards for Novelist.ai tests.

## Rules
1. **Co-location**
   - Unit: src/features/*/components/*.test.tsx
   - Hooks: src/features/*/hooks/*.test.ts

2. **Directory Structure**
   ```
   __tests__/
     components/   # UI unit
     hooks/        # logic unit
     integration/  # service + store
   tests/specs/     # E2E
   ```

3. **Test Files**
   - .test.ts(x) for unit
   - .e2e.ts for Playwright

## Validation
- Test files adjacent to source

## Exceptions
- Shared utilities: src/test/utils.tsx