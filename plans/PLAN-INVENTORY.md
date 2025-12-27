# Plan Inventory - January 26, 2026

**Last Updated**: January 26, 2026 **Purpose**: Master tracking of all planning
documents in the plans/ folder

---

## Active Plans

### 1. AI-STACK-SIMPLIFICATION-OPENROUTER-ONLY-JAN-2026.md

| Attribute    | Value                                                                           |
| ------------ | ------------------------------------------------------------------------------- |
| Status       | ✅ COMPLETED                                                                    |
| Completion   | 100%                                                                            |
| Priority     | P0                                                                              |
| Owner        | OpenCode                                                                        |
| Last Updated | Jan 27, 2026                                                                    |
| Notes        | Migration was already complete. Cleaned up legacy test mocks and configuration. |

### 2. NEW-FEATURES-PLAN-JAN-2026.md

| Attribute    | Value                                                   |
| ------------ | ------------------------------------------------------- |
| Status       | Draft                                                   |
| Completion   | 5%                                                      |
| Priority     | P1                                                      |
| Owner        | Analysis-Swarm + GOAP Agent                             |
| Last Updated | Jan 26, 2026                                            |
| Notes        | Updated to use OpenRouter SDK only instead of AI SDK v6 |

### 3. CODEBASE-IMPROVEMENTS-GOAP-PLAN.md

| Attribute    | Value                                                                          |
| ------------ | ------------------------------------------------------------------------------ |
| Status       | ✅ COMPLETED                                                                   |
| Completion   | 100%                                                                           |
| Priority     | P0                                                                             |
| Owner        | GOAP Agent                                                                     |
| Last Updated | Jan 26, 2026                                                                   |
| Notes        | All goals achieved: env validation, logging, consolidation, file size, imports |

### 4. LOGGING-MIGRATION-REQUIRED.md

| Attribute    | Value                                             |
| ------------ | ------------------------------------------------- |
| Status       | ✅ COMPLETED                                      |
| Completion   | 100%                                              |
| Priority     | P0                                                |
| Owner        | GOAP Agent                                        |
| Last Updated | Dec 24, 2025                                      |
| Notes        | All console statements migrated to logger service |

### 5. OPENROUTER-MIGRATION.md

| Attribute    | Value                                                                   |
| ------------ | ----------------------------------------------------------------------- |
| Status       | ✅ COMPLETED                                                            |
| Completion   | 100%                                                                    |
| Priority     | P0                                                                      |
| Owner        | GOAP Agent                                                              |
| Last Updated | Dec 26, 2025                                                            |
| Notes        | Migration was already complete; only playwright.config.ts needed update |

### 6. WRITING-ASSISTANT-ENHANCEMENT-PLAN.md

| Attribute    | Value                                                                                                                       |
| ------------ | --------------------------------------------------------------------------------------------------------------------------- |
| Status       | Draft                                                                                                                       |
| Completion   | 0%                                                                                                                          |
| Priority     | P1                                                                                                                          |
| Owner        | GOAP Agent                                                                                                                  |
| Last Updated | Dec 25, 2025                                                                                                                |
| Notes        | Comprehensive plan for enhancing writing assistant feature; requires validation and potentially breaking into smaller tasks |

---

## Reference Documents (Not Plans)

These are analysis/reference documents, not tracking plans:

### 7. CODEBASE-ANALYSIS-JAN-2026.md

| Attribute | Value                                                      |
| --------- | ---------------------------------------------------------- |
| Type      | Analysis                                                   |
| Purpose   | Multi-perspective codebase analysis                        |
| Status    | Current                                                    |
| Notes     | Updated for January 2026; reflects OpenRouter SDK decision |

### 8. CODEBASE-ANALYSIS-DEC-2025.md

| Attribute | Value                                       |
| --------- | ------------------------------------------- |
| Type      | Analysis                                    |
| Purpose   | Multi-perspective codebase analysis         |
| Status    | Superseded                                  |
| Notes     | Superseded by CODEBASE-ANALYSIS-JAN-2026.md |

### 9. DEPENDENCY-MANAGEMENT-STRATEGY-DEC-2025.md

| Attribute | Value                                           |
| --------- | ----------------------------------------------- |
| Type      | Strategy                                        |
| Purpose   | Dependency management approach                  |
| Status    | Complete                                        |
| Notes     | Implementation complete; document for reference |

### 10. FILE-SIZE-VIOLATIONS.md

| Attribute | Value                           |
| --------- | ------------------------------- |
| Type      | Tracking                        |
| Purpose   | Track 500 LOC policy violations |
| Status    | Active                          |
| Notes     | Used by CI to check file sizes  |

---

## Archived Strategy Documents

### 11. GOAP-EXECUTION-DEC-24-2025-ARCHIVED.md

| Attribute       | Value                                                                 |
| --------------- | --------------------------------------------------------------------- |
| Type            | Execution Tracking                                                    |
| Original Status | Superseded                                                            |
| Archived Date   | Jan 26, 2026                                                          |
| Notes           | Document overclaimed completion; all GOAP work completed in main plan |

### 12. GITHUB-ACTIONS-MONITORING-STRATEGY.md.bak

| Attribute       | Value                                                 |
| --------------- | ----------------------------------------------------- |
| Type            | Strategy                                              |
| Original Status | Proposed                                              |
| Archived Date   | Dec 24, 2025                                          |
| Notes           | Strategy approach documented; implementation deferred |

### 13. GOAP-ORCHESTRATOR-STRATEGY.md.bak

| Attribute       | Value                                                 |
| --------------- | ----------------------------------------------------- |
| Type            | Strategy                                              |
| Original Status | Proposed                                              |
| Archived Date   | Dec 24, 2025                                          |
| Notes           | Strategy approach documented; implementation deferred |

---

## Summary Statistics

| Category            | Count  |
| ------------------- | ------ |
| Active Plans        | 6      |
| Reference Documents | 4      |
| Archived Documents  | 3      |
| Tracking Documents  | 1      |
| **Total**           | **14** |

---

## Naming Convention

- **Active Plans**: `*-GOAP-PLAN.md`, `*-PLAN-JAN-2026.md`, `AI-STACK-*.md`
- **Reference Docs**: `CODEBASE-ANALYSIS-*.md`, `*STRATEGY*.md`,
  `FILE-SIZE-*.md`
- **Archived**: `*-ARCHIVED.md`, `*.bak` (do not modify; kept for historical
  reference)
- **E2E Docs**: `E2E-TEST-*.md`

---

## Maintenance Rules

1. All plans must have status and completion percentage
2. Completed plans should be archived, not deleted
3. Reference documents should be clearly marked as such
4. New plans must be added to this inventory
5. Review this inventory monthly for stale documents
6. Archive date format: Use `.bak` for renamed archived files
