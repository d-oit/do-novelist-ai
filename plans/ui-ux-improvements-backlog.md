# UI/UX Improvements Backlog

This document lists specific UI/UX improvements identified during the codebase
analysis. These tasks are designed to be picked up by the Specialist Agents
defined in `plans/ui-ux-improvement-goap.md`.

## 🚨 High Priority: Eliminate "AI Slop" (Hardcoded Values)

### Component: `AgentConsole.tsx`

**Agent:** Frontend Specialist

- [ ] **Issue**: Hardcoded status colors (`text-green-500`, `text-red-500`,
      etc.).
  - **Fix**: Replace with semantic tokens (e.g., `text-success`,
    `text-destructive`, `text-warning`, `text-info`).
  - **Ref**: `src/components/AgentConsole.tsx`
- [ ] **Issue**: Hardcoded background opacities (`bg-black/40`,
      `bg-secondary/50`).
  - **Fix**: Use solid semantic backgrounds or defined alpha tokens if
    transparency is strictly necessary.
- [ ] **Issue**: "Traffic light" circles use hardcoded `bg-red-500/20`.
  - **Fix**: Use `bg-destructive/20` or similar semantic variants.

### Component: `BookViewerRefactored.tsx`

**Agent:** Frontend Specialist

- [ ] **Issue**: Arbitrary border opacities (`border-border/50`).
  - **Fix**: Use `border-border` (solid) or define a subtle border token.
- [ ] **Issue**: Arbitrary background opacities (`bg-background/50`,
      `bg-card/30`).
  - **Fix**: Use solid colors (`bg-card`, `bg-background`) to align with "Flat,
    Minimal Design" principles and avoid muddy layering.

## 🎨 Visual Polish & Consistency

### Global Typography

**Agent:** UI Designer

- [ ] **Issue**: Inconsistent font sizes or weights might exist (needs
      verification).
  - **Action**: Audit `text-xs`, `text-sm` usage in `AgentConsole` vs other
    panels. Ensure hierarchy is deliberate.

### Layout & Spacing

**Agent:** UI Designer / Frontend Specialist

- [ ] **Issue**: `BookViewerRefactored` uses `rounded-lg` while other parts
      might use different radii.
  - **Action**: Standardize on a single radius token (e.g., `rounded-md` or
    `rounded-lg` globally).

## 🧠 UX Improvements

### Agent Console Readability

**Agent:** UX Researcher

- [ ] **Issue**: The console can get very long.
  - **Action**: Evaluate if "auto-scroll" behavior needs a "pause on hover"
    feature (it currently just scrolls).
  - **Action**: Consider collapsible groups for long "thought" chains.

### Book Viewer Focus

**Agent:** UX Researcher

- [ ] **Issue**: The "Overview" vs "Chapter" toggle might be hidden or unclear.
  - **Action**: Review the navigation flow between Project Overview and specific
    chapters.

## Next Steps

1.  **Approve** this backlog.
2.  **Execute** the "High Priority" items using the Frontend Specialist Agent.
