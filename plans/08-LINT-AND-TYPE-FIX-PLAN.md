# Lint and Type Fix Plan

> **Goal**: Eliminate all 282+ TypeScript linting errors to ensure a stable build and reliable test execution.

## 🎯 Objective
The codebase currently has significant type safety issues that are blocking the build and causing test failures. The primary objective is to resolve these errors systematically.

## 📊 Error Analysis
The 282 errors fall into the following categories:

1.  **Type Mismatches (High Priority)**
    *   `string` vs String Literals (Enums): `ChapterStatus`, `Language`, `Genre`, `Role`, `Arc`.
    *   Object shape mismatches in `AnalyticsFilter`, `CharacterValidationResult`.
2.  **Missing Properties (High Priority)**
    *   `ValidationResult` missing `data` property.
    *   `Character` objects missing fields like `aliases`, `importance`, `summary`.
    *   `Project` objects missing `style` specific types.
3.  **Zod/Schema Issues (Medium Priority)**
    *   `ValidationResult` not being generic.
    *   `ZodDefault` overload mismatches in `character-schemas.ts`.
4.  **Unused Variables (Low Priority)**
    *   `TS6133`: Variables declared but never read.
5.  **Module Resolution (Medium Priority)**
    *   Missing exports in `src/types/index.ts`.

## 🛠️ Action Plan

### Phase 1: Fix Core Type Definitions ✅ PARTIAL
**Target Files:** `src/types/index.ts`, `src/types/schemas.ts`, `src/lib/validation.ts`

**Progress:**
- ✅ Exported missing publishing types from `src/types/index.ts`
- ⏸️ Need to add `ValidationResult<T>` generic type (file edits keep getting corrupted)
- ⏸️ Need to fix Zod schema overload errors in `src/types/character-schemas.ts`

**Next Steps:**
1.  Add `ValidationResult<T>` type to `src/types/schemas.ts` (line ~330)
2.  Fix Zod `.default({})` calls to use proper default values
3.  Verify all publishing types are accessible

### Phase 2: Resolve Type Mismatches
**Target Files:** `src/features/editor/components/PublishPanel.tsx`, `src/features/projects/services/projectService.ts`, `src/lib/db.ts`

1.  **Enforce Enums**: Replace loose `string` types with proper union types (`Language`, `Genre`, `ChapterStatus`).
    *   Fix `PublishPanel.tsx`: `targetLang` should be `Language`.
    *   Fix `projectService.ts`: `style` should be `Genre`.
    *   Fix `db.ts`: Cast database string results to their respective Enum types after validation.

### Phase 3: Fix Object Shapes & Missing Properties
**Target Files:** `src/features/characters/hooks/useCharacterValidation.ts`, `src/features/analytics/services/__tests__/analyticsService.test.ts`

1.  **Update Mock Data**: Ensure test mocks in `analyticsService.test.ts` match the actual interface shapes.
2.  **Update Character Hooks**: Ensure `useCharacterValidation` returns the complete `CharacterValidationResult` object.

### Phase 4: Cleanup Unused Variables
**Target Files:** Global

1.  **Remove or Prefix**: Remove unused variables or prefix them with `_` if they are needed for signature matching.

## 🔄 Execution Order

1.  **Step 1**: Fix `src/types` and `src/lib/validation.ts` (The Foundation).
2.  **Step 2**: Fix `src/features/projects` and `src/lib/db.ts` (Data Layer).
3.  **Step 3**: Fix `src/features/editor` and `src/features/characters` (UI/Logic Layer).
4.  **Step 4**: Fix Tests (Mocks and Assertions).

## 📉 Success Metrics
*   **Lint Errors**: 0
*   **Build Status**: Success
*   **Test Status**: Tests can run (even if some fail logic, they shouldn't fail to compile).
