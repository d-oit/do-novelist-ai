# GOAP Strategy: UI/UX Improvement with Specialist Agents

## Overview

This document outlines a Goal Oriented Action Planning (GOAP) strategy for
continuous UI/UX improvement. It employs a "Specialist Agent" model where
distinct roles (Agents) collaborate through defined handoffs to achieve
high-quality user experiences.

## Specialist Agents

### 1. 🕵️ UX Researcher Agent

**Role:** Analyzes the current state, identifies friction points, and validates
user needs. **Goal:** `ProvideActionableInsights` **State:**

- `has_insights`: false -> true

**Actions:**

- `conduct_heuristic_evaluation(flow_name)`: Review a specific user flow against
  usability heuristics.
- `analyze_usage_data(component_id)`: Check analytics for usage patterns (if
  available).
- `review_user_feedback()`: Summarize relevant user issues or requests.

**Handoff Output:** `UX_Analysis_Report.md` (Contains identified issues, user
needs, and high-level recommendations).

---

### 2. 🎨 UI Designer Agent

**Role:** Translates insights into visual designs and system updates. **Goal:**
`DefineVisualSolution` **State:**

- `has_design_spec`: false -> true
- `design_system_updated`: false -> true (optional)

**Actions:**

- `create_mockup(description)`: Generate or describe the visual state of the UI.
- `define_design_tokens(visual_properties)`: Map visual decisions to
  Tailwind/CSS variables.
- `update_design_system_docs(changes)`: Update `SKILL.md` or design guidelines
  if patterns change.

**Handoff Input:** `UX_Analysis_Report.md` **Handoff Output:**
`UI_Design_Spec.md` (Contains mockups, token mappings, and component behavioral
specs).

---

### 3. 👨‍💻 Frontend Specialist Agent

**Role:** Implements the design specifications into the codebase. **Goal:**
`ImplementChanges` **State:**

- `code_implemented`: false -> true
- `lint_passed`: false -> true

**Actions:**

- `scaffold_component(name)`: Create new component structure.
- `refactor_component(path, changes)`: Apply design updates to existing code.
- `apply_tokens(file_path)`: Replace hardcoded values with design tokens.
- `verify_local_build()`: Ensure code compiles and lints.

**Handoff Input:** `UI_Design_Spec.md` **Handoff Output:** `Pull_Request` (or
committed code branch).

---

### 4. 🔍 QA Specialist Agent

**Role:** Verifies the implementation against the specs and ensures no
regressions. **Goal:** `VerifyQuality` **State:**

- `tests_passed`: false -> true
- `visuals_verified`: false -> true

**Actions:**

- `run_unit_tests()`: Execute Vitest suite.
- `run_e2e_tests()`: Execute Playwright scenarios.
- `perform_visual_check(url)`: Compare implementation against
  `UI_Design_Spec.md`.
- `audit_accessibility()`: Check for a11y violations.

**Handoff Input:** `Pull_Request` / Implemented Code **Handoff Output:**
`QA_Signoff` (or rejection with bug report).

## Handoff Coordination Protocol

The workflow follows a linear dependency chain, but allows for feedback loops.

1.  **Trigger**: A new UI/UX initiative is defined (e.g., "Improve Project
    Dashboard").
2.  **Phase 1 (Discovery)**:
    - **Actor**: UX Researcher
    - **Input**: Initiative description.
    - **Process**: Executes analysis actions.
    - **Output**: Writes `plans/ux-analysis-[initiative].md`.
3.  **Phase 2 (Design)**:
    - **Actor**: UI Designer
    - **Input**: `plans/ux-analysis-[initiative].md`.
    - **Process**: Defines visuals and tokens.
    - **Output**: Writes `plans/ui-spec-[initiative].md`.
4.  **Phase 3 (Implementation)**:
    - **Actor**: Frontend Specialist
    - **Input**: `plans/ui-spec-[initiative].md`.
    - **Process**: Writes code in `src/`.
    - **Output**: Code changes committed.
5.  **Phase 4 (Verification)**:
    - **Actor**: QA Specialist
    - **Input**: Committed code.
    - **Process**: Runs tests and manual checks.
    - **Output**: Updates `plans/ui-spec-[initiative].md` with "Verified" status
      or creates new bug tasks.

## Example Workflow: "Refine Book Viewer Typography"

1.  **UX Researcher**: Notes that reading long chapters is straining. Suggests
    larger line-height and max-width.
2.  **UI Designer**: Selects `prose-lg`, defines `max-w-prose`, and chooses a
    serif font for body text. Updates `typography` tokens.
3.  **Frontend Specialist**: Updates `BookViewer.tsx` to use new classes.
    Updates `tailwind.config.js` if needed.
4.  **QA Specialist**: Verifies readability on mobile and desktop. Checks for
    layout regressions.
