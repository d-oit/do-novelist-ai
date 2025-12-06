# Codebase Analysis & Improvement Plan

## 1. Architecture & Code Quality

### 1.1 Type System Consolidation

**Observation:** Duplicate type definitions exist between root `types.ts` and
`src/types/index.ts`.

- `d:\git\do-novelist-ai\types.ts` contains core enums (`AgentMode`,
  `ChapterStatus`) and interfaces (`Project`, `WorldState`).
- `d:\git\do-novelist-ai\src\types\index.ts` re-exports schemas and some types,
  but also imports from the root `types.ts`.

**Recommendation:**

- **Single Source of Truth:** Move all types to `src/types/`.
- **Refactor:** Delete root `types.ts` and migrate all imports to `src/types/`.
- **Schema Validation:** Ensure all core interfaces have corresponding Zod
  schemas for runtime validation (especially for AI responses).

### 1.2 Feature Modularity

**Observation:** `src/features` is well-structured, but some core logic resides
in `src/hooks` or `src/lib`.

- Example: `useGoapEngine.ts` is in `features/editor/hooks`, which is good.
- Ensure `src/components` only contains truly generic UI components.
  Feature-specific components should stay within
  `src/features/<feature>/components`.

### 1.3 State Management

**Observation:** Zustand is used (dependency in `package.json`), which is
excellent.

- Verify if `useAnalytics.ts` or `useProject.ts` fully leverage Zustand
  selectors to optimize re-renders.
- **Action Item:** Audit Zustand stores for granular selectors.

## 2. Performance Optimizations

### 2.1 Lazy Loading & Code Splitting

**Observation:** React 19 & Vite 6 are used.

- **Route-based Splitting:** Ensure top-level routes (Editor, Dashboard,
  Settings) are lazy-loaded using `React.lazy` or Vite's import glob features.
- **Heavy Component Splitting:** The `GoapVisualizer` and `BookViewer` might be
  large.
- **Suggestion:** Use `React.Suspense` boundaries around the "Editor" and
  "Visualizer" panels to unblock the main thread during hydration.

### 2.2 Bundle Analysis

**Observation:** `npm run analyze` script exists (`vite build --mode analyze`).

- **Action Item:** Run analysis to identify large chunks. High probability
  candidates for optimization: `@google/genai` (if not tree-shaken),
  `framer-motion` (use `framer-motion/dom` or `m` component for size reduction),
  and `lucide-react` (ensure tree-shaking works).

## 3. Developer Experience (DX)

### 3.1 AI Agent Debugging

**Observation:** The GOAP system is complex. Tracing why an agent chose action X
over Y can be hard.

- **Proposal:** Enhance `AgentConsole` to show "Rejected Actions" and
  "Precondition Failures" in a collapsible detail view. This "Explainable AI"
  feature is crucial for debugging the planner.

### 3.2 Story Consistency Tools

**Observation:** Current tests cover E2E and Unit.

- **Proposal:** Add a "Sanity Check" script that validates the JSON integrity of
  all saved projects (local storage or simple DB query checks). Note: Turso is
  used.

## 4. Proposed Timeline

- **Phase 1 (Immediate):** Type consolidation & Bundler optimization (1 day).
- **Phase 2 (Short-term):** DX improvements (Agent Debugger) (2-3 days).
- **Phase 3 (Medium-term):** New Feature Implementation (Interactive Story
  Timeline) (5-7 days).
