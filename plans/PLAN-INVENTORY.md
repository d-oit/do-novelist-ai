# Plan Inventory - December 24, 2025

**Last Updated**: December 24, 2025 **Purpose**: Master tracking of all planning
documents in the plans/ folder

---

## Active Plans

### 1. CODEBASE-IMPROVEMENTS-GOAP-PLAN.md

| Attribute    | Value                                                     |
| ------------ | --------------------------------------------------------- |
| Status       | In Progress                                               |
| Completion   | ~70%                                                      |
| Priority     | P0                                                        |
| Owner        | GOAP Agent                                                |
| Last Updated | Dec 24, 2025                                              |
| Notes        | Logging migration incomplete; requires ~5.5 hours of work |

### 2. GOAP-EXECUTION-DEC-24-2025.md

| Attribute    | Value                                       |
| ------------ | ------------------------------------------- |
| Status       | Superseded by LOGGING-MIGRATION-REQUIRED.md |
| Completion   | ~30% (was claiming 100%)                    |
| Priority     | P1                                          |
| Owner        | GOAP Agent                                  |
| Last Updated | Dec 24, 2025                                |
| Notes        | Document overclaimed completion; archived   |

### 3. LOGGING-MIGRATION-REQUIRED.md (NEW)

| Attribute    | Value                                             |
| ------------ | ------------------------------------------------- |
| Status       | Active                                            |
| Completion   | 0% (not started)                                  |
| Priority     | P0                                                |
| Owner        | GOAP Agent                                        |
| Last Updated | Dec 24, 2025                                      |
| Notes        | Created to track remaining logging migration work |

---

## Reference Documents (Not Plans)

These are analysis/reference documents, not tracking plans:

### 4. CODEBASE-ANALYSIS-DEC-2025.md

| Attribute | Value                                       |
| --------- | ------------------------------------------- |
| Type      | Analysis                                    |
| Purpose   | Multi-perspective codebase analysis         |
| Status    | Current                                     |
| Notes     | Reference for understanding codebase health |

### 5. DEPENDENCY-MANAGEMENT-STRATEGY-DEC-2025.md

| Attribute | Value                                           |
| --------- | ----------------------------------------------- |
| Type      | Strategy                                        |
| Purpose   | Dependency management approach                  |
| Status    | Complete                                        |
| Notes     | Implementation complete; document for reference |

### 6. FILE-SIZE-VIOLATIONS.md

| Attribute | Value                           |
| --------- | ------------------------------- |
| Type      | Tracking                        |
| Purpose   | Track 500 LOC policy violations |
| Status    | Active                          |
| Notes     | Used by CI to check file sizes  |

---

## Archived Strategy Documents

### 7. GITHUB-ACTIONS-MONITORING-STRATEGY.md (ARCHIVED)

| Attribute       | Value                                                 |
| --------------- | ----------------------------------------------------- |
| Type            | Strategy                                              |
| Original Status | Proposed                                              |
| Archived Date   | Dec 24, 2025                                          |
| Notes           | Strategy approach documented; implementation deferred |

### 8. GOAP-ORCHESTRATOR-STRATEGY.md (ARCHIVED)

| Attribute       | Value                                                 |
| --------------- | ----------------------------------------------------- |
| Type            | Strategy                                              |
| Original Status | Proposed                                              |
| Archived Date   | Dec 24, 2025                                          |
| Notes           | Strategy approach documented; implementation deferred |

---

## E2E Testing Documents

### 9. E2E-TEST-API-KEYS.md

| Attribute | Value                          |
| --------- | ------------------------------ |
| Type      | Documentation                  |
| Purpose   | E2E test API key configuration |
| Status    | Current                        |
| Notes     | Reference for CI/CD setup      |

---

## Summary Statistics

| Category            | Count |
| ------------------- | ----- |
| Active Plans        | 2     |
| Reference Documents | 3     |
| Archived Documents  | 2     |
| E2E Documentation   | 1     |
| **Total**           | **8** |

---

## Naming Convention

- **Active Plans**: `*-GOAP-PLAN.md`, `GOAP-EXECUTION-*.md`, `LOGGING-*.md`
- **Reference Docs**: `CODEBASE-ANALYSIS-*.md`, `*STRATEGY*.md`,
  `FILE-SIZE-*.md`
- **Archived**: `*-ARCHIVED.md` (do not modify; kept for historical reference)
- **E2E Docs**: `E2E-TEST-*.md`

---

## Maintenance Rules

1. All plans must have status and completion percentage
2. Completed plans should be archived, not deleted
3. Reference documents should be clearly marked as such
4. New plans must be added to this inventory
5. Review this inventory monthly for stale documents
