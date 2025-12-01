# GOAP Plan: UI/UX Standardization

## Goal

Align the codebase with the Frontend Design System
(`.claude/skills/frontend-design-system/SKILL.md`), specifically eliminating "AI
slop" (arbitrary values, hardcoded colors) and ensuring consistent component
patterns.

## Current State Analysis

- **Violations**:
  - `ActionCard.tsx`: Uses hardcoded colors (`text-blue-400`, `text-green-400`,
    etc.) instead of semantic tokens.
  - `ActionCard.tsx`: Uses arbitrary shadow values
    (`shadow-[0_0_15px_rgba(59,130,246,0.3)]`) and glass effects, violating
    "Flat, Minimal Design" principles.
  - `Button.tsx`: Uses gradients (`bg-gradient-to-r`) and shadows, which
    conflicts with the "No shadows, gradients, or glass effects" rule.
  - `Navbar.tsx`: Uses `backdrop-blur-md`, which is a glass effect to be
    removed.
- **Compliance**:

# GOAP Plan: UI/UX Standardization

## Goal

Align the codebase with the Frontend Design System
(`.claude/skills/frontend-design-system/SKILL.md`), specifically eliminating "AI
slop" (arbitrary values, hardcoded colors) and ensuring consistent component
patterns.

## Current State Analysis

- **Violations**:
  - `ActionCard.tsx`: Uses hardcoded colors (`text-blue-400`, `text-green-400`,
    etc.) instead of semantic tokens.
  - `ActionCard.tsx`: Uses arbitrary shadow values
    (`shadow-[0_0_15px_rgba(59,130,246,0.3)]`) and glass effects, violating
    "Flat, Minimal Design" principles.
  - `Button.tsx`: Uses gradients (`bg-gradient-to-r`) and shadows, which
    conflicts with the "No shadows, gradients, or glass effects" rule.
  - `Navbar.tsx`: Uses `backdrop-blur-md`, which is a glass effect to be
    removed.
- **Compliance**:
  - `tailwind.config.js`: Defines semantic colors and fonts correctly.
  - `Button.tsx`: Uses `cva` and semantic tokens, serving as a good reference
    implementation.

## Plan

### Action 1: Standardize ActionCard Component (Flat & Minimal)

- **Preconditions**: `ActionCard.tsx` exists and contains hardcoded values,
  shadows, and glows.
- **Steps**:
  1.  **Remove Effects**: Remove all `shadow-*`, `drop-shadow-*`, and
      `backdrop-blur-*` classes.
  2.  **Remove Gradients**: Ensure background is solid (`bg-card` or
      `bg-secondary`).
  3.  **Semantic Colors**: Replace hardcoded colors with semantic tokens
      (`text-primary`, `text-muted-foreground`).
  4.  **Borders**: Use `border` and `border-border` to define structure instead
      of shadows.
  5.  **Hover States**: Use subtle background color changes
      (`hover:bg-secondary`) or border color changes (`hover:border-primary`)
      instead of scaling or shadow expansion.
- **Effects**: `ActionCard` aligns with the "Flat, Minimal Design" principle.

### Action 2: Refactor Button Component

- **Preconditions**: `Button.tsx` uses gradients and shadows.
- **Steps**:
  1.  Remove `bg-gradient-to-r` from all variants.
  2.  Remove `shadow-*` from all variants.
  3.  Simplify `default` variant to solid `bg-primary` with
      `text-primary-foreground`.
  4.  Simplify `secondary` and `destructive` variants similarly.
  5.  Ensure focus states use `ring` but avoid "glow" effects.
- **Effects**: Buttons are flat, minimal, and consistent.

### Action 3: Audit and Fix Hardcoded Colors

- **Preconditions**: Codebase may contain other hardcoded hex values or
  non-semantic Tailwind colors.
- **Steps**:
  1.  Search for `text-[color]-[number]` (e.g., `text-blue-400`) and
      `bg-[color]-[number]`.
  2.  Search for `#[0-9a-fA-F]{3,6}` (hex codes) in `tsx` files.
  3.  Replace found instances with `primary`, `secondary`, `muted`, `accent`,
      `destructive` tokens.
- **Effects**: No hardcoded colors in UI components.

### Action 4: Verify Layout Patterns & Remove Glass Effects

- **Preconditions**: `Navbar.tsx` uses backdrop blur.
- **Steps**:
  1.  Remove `backdrop-blur-md` and `bg-card/50` from `Navbar`. Use solid
      `bg-card` or `bg-background` with a simple `border-b`.
  2.  Verify mobile menu transitions are simple (slide/fade) without complex 3D
      effects.
- **Effects**: Consistent flat layout.
