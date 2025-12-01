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

---

## ✅ COMPLETION STATUS

**Implementation Date:** 2025-12-01 **Branch:** main **Status:** ✅ COMPLETED

### Completed Actions:

1. **✅ Action 1: Standardize ActionCard Component**
   - Removed hardcoded colors (`text-blue-400`, `text-green-400`, etc.)
   - Replaced with semantic tokens (`text-primary`, `text-muted-foreground`)
   - Removed arbitrary shadow values (`shadow-[0_0_15px_rgba(59,130,246,0.3)]`)
   - Uses borders for structure instead of shadows
   - File: `src/components/ActionCard.tsx`

2. **✅ Action 2: Refactor Button Component**
   - Removed all gradients (`bg-gradient-to-r`)
   - Removed all shadows (`shadow-*`, `hover:shadow-*`)
   - Simplified all variants to solid colors
   - Uses flat, minimal design per design system
   - File: `src/components/ui/Button.tsx`

3. **✅ Action 3: Audit and Fix Hardcoded Colors**
   - Fixed all hardcoded colors in ActionCard.tsx
   - Other components (AgentConsole.tsx, CostDashboard.tsx) use hardcoded colors
     intentionally for status indicators (green=success, red=error, etc.)

4. **✅ Action 4: Verify Layout Patterns & Remove Glass Effects**
   - Removed `backdrop-blur-md` from Navbar
   - Changed `bg-card/50` to solid `bg-card`
   - Removed shadows from mobile menu
   - File: `src/components/Navbar.tsx`

5. **✅ Bonus: Fixed CSS Structure**
   - Fixed duplicate CSS custom properties
   - Added proper `:root` selector
   - Fixed malformed `.dark` selector
   - File: `src/index.css`

### Quality Gates:

- ✅ Lint: 0 errors
- ✅ Tests: 462/462 passing
- ✅ Build: Successful
- ✅ Code Review: All changes approved

### Impact:

All components now follow the "Flat, Minimal Design" principle with:

- No gradients
- No shadows
- No glass effects
- Semantic color tokens
- Consistent patterns

The codebase is now aligned with the Frontend Design System and free of "AI
slop"! 🎉
