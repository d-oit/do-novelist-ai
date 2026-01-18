# UI/UX Best Practices Design System - Novelist.ai

**Version:** 1.0 **Last Updated:** January 2026 **Maintainer:** Development Team

---

## Overview

This document defines the design system standards, component usage guidelines,
and best practices for the Novelist.ai application. All developers should
reference this guide when building or modifying UI components.

---

## 1. Design Tokens

### 1.1 Color System

#### CSS Custom Properties (HSL Format)

```css
/* Light Mode */
--background: 0 0% 100%;
--foreground: 240 10% 3.9%;
--primary: 260 70% 30%;
--primary-foreground: 0 0% 100%;
--secondary: 240 4.8% 95.9%;
--secondary-foreground: 240 5.9% 10%;
--muted: 240 4.8% 95.9%;
--muted-foreground: 240 3.8% 46.1%;
--destructive: 0 84.2% 60.2%;
--accent: 240 4.8% 95.9%;

/* Dark Mode */
--background: 240 10% 3.9%;
--foreground: 0 0% 98%;
--primary: 260 80% 45%;
--primary-foreground: 0 0% 100%;
--secondary: 240 3.7% 15.9%;
--secondary-foreground: 0 0% 98%;
```

#### Semantic Color Usage

| Color Token   | Purpose                   | Example Usage              |
| ------------- | ------------------------- | -------------------------- |
| `primary`     | Primary actions, branding | Submit buttons, active nav |
| `secondary`   | Secondary actions         | Cancel buttons, filters    |
| `destructive` | Dangerous actions         | Delete, remove             |
| `muted`       | Subdued elements          | Hints, disabled states     |
| `accent`      | Interactive highlights    | Hover states               |

#### Status Colors (Tailwind Direct)

```typescript
// Success states
'bg-green-500 text-white';
'text-green-500'; // Icons, text

// Warning states
'bg-yellow-500 text-white';
'text-yellow-500';

// Error states
'bg-destructive text-destructive-foreground';
'text-destructive';

// Info states
'bg-blue-500 text-white';
'text-blue-500';
```

### 1.2 Typography Scale

#### Font Families

```typescript
// tailwind.config.js
fontFamily: {
  sans: ['Space Grotesk', 'system-ui', 'sans-serif'],    // Headings, UI
  body: ['Inter Tight', 'system-ui', 'sans-serif'],      // Body text
  serif: ['Fraunces', 'Georgia', 'serif'],               // Literary content
  mono: ['JetBrains Mono', 'Menlo', 'monospace'],        // Code, technical
}
```

#### Type Scale

| Class       | Size | Line Height | Usage            |
| ----------- | ---- | ----------- | ---------------- |
| `text-xs`   | 12px | 16px        | Labels, hints    |
| `text-sm`   | 14px | 20px        | Body UI, buttons |
| `text-base` | 16px | 24px        | Paragraphs       |
| `text-lg`   | 18px | 28px        | Subheadings      |
| `text-xl`   | 20px | 28px        | Section titles   |
| `text-2xl`  | 24px | 32px        | Card titles      |
| `text-3xl`  | 30px | 36px        | Page headings    |

#### Font Weight Guidelines

```typescript
// Headings
'font-bold'; // Page titles (h1)
'font-semibold'; // Card titles, dialog titles
'font-medium'; // Section headings, labels

// Body
'font-normal'; // Body text, paragraphs
'font-medium'; // Emphasized text, nav items
```

### 1.3 Spacing Scale

Based on Tailwind's 4px base unit:

| Token           | Value | Usage                      |
| --------------- | ----- | -------------------------- |
| `gap-1` / `p-1` | 4px   | Icon padding, tight groups |
| `gap-2` / `p-2` | 8px   | Button padding, item gaps  |
| `gap-3` / `p-3` | 12px  | Small card padding         |
| `gap-4` / `p-4` | 16px  | Standard spacing           |
| `gap-6` / `p-6` | 24px  | Card content padding       |
| `gap-8` / `p-8` | 32px  | Section separation         |

#### Spacing Best Practices

```typescript
// Component internal spacing
<CardContent className="p-6 pt-0">  // 24px padding, no top

// List items
<div className="space-y-2">  // 8px vertical gap

// Form groups
<div className="space-y-4">  // 16px between fields

// Page sections
<section className="space-y-8">  // 32px between sections
```

### 1.4 Border Radius

```typescript
// CSS variable
--radius: 0.75rem;  // 12px base

// Tailwind classes
'rounded-sm'   // calc(--radius - 4px) = 8px
'rounded-md'   // calc(--radius - 2px) = 10px
'rounded-lg'   // var(--radius) = 12px
'rounded-xl'   // 16px - Cards, dialogs
'rounded-full' // Pills, badges, avatars
```

### 1.5 Shadows

```typescript
// Card shadows
default: 'shadow-[0_8px_30px_rgb(0,0,0,0.04)]'
dark:    'dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)]'

// Elevated cards
elevated: 'shadow-[0_16px_50px_rgb(0,0,0,0.08)]'

// Hover states
hover: 'hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)]'

// Brand shadows (indigo tint)
'shadow-indigo-sm'  // Subtle
'shadow-indigo'     // Default
'shadow-indigo-md'  // Medium
'shadow-indigo-lg'  // Large
```

---

## 2. Component Patterns Library

### 2.1 Button Component

**Location:** `src/shared/components/ui/Button.tsx`

#### Variants

| Variant       | Usage             | Example               |
| ------------- | ----------------- | --------------------- |
| `default`     | Primary actions   | Save, Submit, Create  |
| `secondary`   | Secondary actions | Cancel, Back          |
| `outline`     | Tertiary actions  | Edit, View            |
| `destructive` | Dangerous actions | Delete, Remove        |
| `ghost`       | Minimal emphasis  | Icon buttons, toggles |
| `link`        | Navigation-like   | Read more, Learn more |

#### Sizes

| Size      | Height  | Usage                      |
| --------- | ------- | -------------------------- |
| `sm`      | 36px    | Inline actions, compact UI |
| `default` | 40px    | Standard buttons           |
| `lg`      | 44px    | Primary CTA, emphasis      |
| `icon`    | 40x40px | Icon-only buttons          |

#### Usage Examples

```tsx
// Primary action
<Button variant="default" size="lg">
  Create Project
</Button>

// Secondary action
<Button variant="secondary">
  Cancel
</Button>

// Destructive with confirmation
<Button variant="destructive">
  <Trash2 className="mr-2 h-4 w-4" />
  Delete
</Button>

// Icon button
<Button variant="ghost" size="icon">
  <Settings className="h-4 w-4" />
</Button>
```

#### Best Practices

- Always include text for primary actions (not icon-only)
- Use `aria-label` for icon-only buttons
- Pair icons with text: icon left, text right
- Icon size: `h-4 w-4` (16px)
- Gap between icon and text: `mr-2` (8px)

### 2.2 Card Component

**Location:** `src/shared/components/ui/Card.tsx`

#### Variants

| Variant    | Visual Style                | Usage                 |
| ---------- | --------------------------- | --------------------- |
| `default`  | Subtle border, light shadow | Standard containers   |
| `elevated` | Higher shadow, more blur    | Featured content      |
| `glass`    | Glassmorphism effect        | Overlays, floating UI |
| `outline`  | Border only, transparent    | Secondary containers  |

#### Structure

```tsx
<Card variant="default">
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description text</CardDescription>
  </CardHeader>
  <CardContent>{/* Main content */}</CardContent>
  <CardFooter>{/* Actions */}</CardFooter>
</Card>
```

#### Interactive Cards

```tsx
// Clickable card
<Card variant="default" interactive>
  {/* Card becomes clickable with hover/active states */}
</Card>
```

### 2.3 Dialog Component

**Location:** `src/shared/components/ui/Dialog.tsx`

#### Structure

```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>
        Supporting text explaining the dialog purpose.
      </DialogDescription>
    </DialogHeader>

    {/* Dialog body content */}

    <DialogFooter>
      <Button variant="secondary" onClick={onClose}>
        Cancel
      </Button>
      <Button onClick={onConfirm}>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### Best Practices

- Always include `DialogTitle` for accessibility
- Use `DialogDescription` for context
- Footer buttons: Cancel left, Confirm right
- Close button (X) positioned top-right automatically
- Escape key and backdrop click close dialog

### 2.4 Badge Component

**Location:** `src/shared/components/ui/Badge.tsx`

#### Variants

| Variant       | Color       | Usage             |
| ------------- | ----------- | ----------------- |
| `default`     | Primary     | Default tags      |
| `secondary`   | Muted       | Neutral status    |
| `destructive` | Red         | Errors, critical  |
| `outline`     | Border only | Minimal emphasis  |
| `success`     | Green       | Completed, active |
| `warning`     | Yellow      | Caution           |
| `info`        | Blue        | Information       |

#### Usage

```tsx
<Badge variant="success">Published</Badge>
<Badge variant="secondary">Draft</Badge>
<Badge variant="destructive">Error</Badge>
```

### 2.5 Toast/Notification

**Location:** `src/shared/components/ui/Toaster.tsx`

#### Usage via Store

```typescript
import { useToastStore } from '@/lib/stores/toastStore';

const { addToast } = useToastStore();

// Success
addToast({
  title: 'Success',
  description: 'Project saved successfully',
  variant: 'success',
});

// Error
addToast({
  title: 'Error',
  description: 'Failed to save project',
  variant: 'destructive',
});
```

---

## 3. Layout Patterns

### 3.1 Page Layout

```tsx
<MainLayout currentView={view} onNavigate={setView}>
  <Navbar ... />
  <main id="main-content" role="main">
    {/* Page content */}
  </main>
</MainLayout>
```

### 3.2 Dashboard Layout (2-Column)

```tsx
<div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col gap-6 p-4 md:flex-row">
  {/* Sidebar - 1/3 width on desktop */}
  <div className="w-full md:w-1/3">
    <div className="space-y-6 md:sticky md:top-20">
      {/* Controls, stats, etc. */}
    </div>
  </div>

  {/* Main content - 2/3 width on desktop */}
  <div className="min-h-[600px] w-full md:w-2/3">{/* Primary content */}</div>
</div>
```

### 3.3 Grid Layouts

```tsx
// Card grid - responsive columns
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id} ... />)}
</div>

// Form 2-column layout
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <Input label="First Name" />
  <Input label="Last Name" />
</div>
```

### 3.4 Responsive Patterns

```tsx
// Hide on mobile, show on desktop
className = 'hidden md:block';

// Show on mobile, hide on desktop
className = 'md:hidden';

// Full width mobile, constrained desktop
className = 'w-full max-w-lg md:max-w-2xl';

// Stack mobile, row desktop
className = 'flex flex-col md:flex-row gap-4';
```

---

## 4. Animation Guidelines

### 4.1 Framer Motion Patterns

#### Page/Component Entry

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
```

#### Button Interactions

```tsx
<motion.button
  whileHover={{ scale: 0.98 }}
  whileTap={{ scale: 0.97 }}
  transition={{ duration: 0.15, type: 'tween' }}
>
```

#### Dialog Animation

```tsx
// Backdrop
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
exit={{ opacity: 0 }}

// Content
initial={{ opacity: 0, scale: 0.95, y: 10 }}
animate={{ opacity: 1, scale: 1, y: 0 }}
exit={{ opacity: 0, scale: 0.95, y: 10 }}
transition={{ duration: 0.2, ease: 'easeOut' }}
```

### 4.2 Tailwind Animation Classes

```tsx
// View transitions
className = 'animate-in fade-in slide-in-from-bottom-4 duration-500';

// Loading states
className = 'animate-pulse';
className = 'animate-spin';

// Entrance animations
className = 'animate-in fade-in zoom-in-95 duration-200';
```

### 4.3 Motion Best Practices

1. **Duration:** Keep animations under 300ms for responsiveness
2. **Easing:** Use `ease-out` for entries, `ease-in` for exits
3. **Reduced Motion:** Respect `prefers-reduced-motion`
4. **Purpose:** Animations should guide attention, not distract

---

## 5. Accessibility Checklist

### 5.1 Component Requirements

#### Buttons

- [ ] Has visible text or `aria-label`
- [ ] Focus ring visible (2px solid)
- [ ] Disabled state visible and non-interactive
- [ ] Touch target minimum 44x44px

#### Forms

- [ ] Labels associated with inputs (`htmlFor`)
- [ ] Required fields indicated
- [ ] Error messages linked (`aria-describedby`)
- [ ] Focus order logical

#### Dialogs

- [ ] `role="dialog"` and `aria-modal="true"`
- [ ] Title provided (`DialogTitle`)
- [ ] Focus trapped inside
- [ ] Escape key closes
- [ ] Focus returns on close

#### Navigation

- [ ] Current page indicated (`aria-current="page"`)
- [ ] Skip links provided
- [ ] Landmark roles used (`nav`, `main`)
- [ ] Keyboard accessible

### 5.2 Color & Contrast

- Minimum contrast ratio: 4.5:1 (normal text)
- Large text contrast: 3:1
- Focus indicators: Visible against all backgrounds
- Never rely on color alone for meaning

### 5.3 Keyboard Navigation

| Key        | Action                         |
| ---------- | ------------------------------ |
| Tab        | Move to next focusable element |
| Shift+Tab  | Move to previous element       |
| Enter      | Activate button/link           |
| Escape     | Close dialog/modal             |
| Arrow keys | Navigate within menus          |

---

## 6. Form Design Patterns

### 6.1 Standard Form Field

```tsx
<div className="space-y-2">
  <label
    htmlFor="field-id"
    className="text-xs font-bold uppercase text-muted-foreground"
  >
    Field Label
  </label>
  <input
    id="field-id"
    type="text"
    placeholder="Placeholder text"
    className={cn(
      'w-full rounded-md border border-input bg-background',
      'px-3 py-2 text-sm',
      'focus:outline-none focus:ring-2 focus:ring-primary',
      'focus-visible:ring-ring focus-visible:ring-offset-2',
    )}
  />
  {error && <p className="text-xs text-destructive">{error}</p>}
</div>
```

### 6.2 Select/Dropdown

```tsx
<div className="relative">
  <select
    className={cn(
      'w-full appearance-none rounded-md border border-input',
      'bg-background px-3 py-2 pr-8 text-sm',
      'focus:border-primary focus:outline-none',
    )}
  >
    <option value="">Select option</option>
    {options.map(opt => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </select>
  <ChevronDown
    className={cn(
      'pointer-events-none absolute right-2 top-1/2',
      'h-4 w-4 -translate-y-1/2 opacity-50',
    )}
  />
</div>
```

### 6.3 Form Layout Patterns

```tsx
// Vertical stack (default)
<form className="space-y-4">
  <FormField />
  <FormField />
  <FormActions />
</form>

// Two-column grid
<form className="space-y-4">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <FormField />
    <FormField />
  </div>
</form>

// Form actions
<div className="flex justify-end gap-2 pt-4 border-t">
  <Button variant="secondary">Cancel</Button>
  <Button type="submit">Save</Button>
</div>
```

---

## 7. Error Handling Patterns

### 7.1 Inline Error Display

```tsx
{
  error && (
    <div
      className={cn(
        'flex items-center gap-2 rounded-md',
        'bg-destructive/10 p-3 text-sm text-destructive',
      )}
    >
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      {error}
    </div>
  );
}
```

### 7.2 Toast Notifications

```typescript
// Error toast
addToast({
  title: 'Error',
  description: 'Failed to save. Please try again.',
  variant: 'destructive',
  duration: 5000,
});

// Success toast
addToast({
  title: 'Saved',
  description: 'Your changes have been saved.',
  variant: 'success',
  duration: 3000,
});
```

### 7.3 Error Boundaries

```tsx
<ErrorBoundary fallback={<ErrorFallback />}>
  <FeatureComponent />
</ErrorBoundary>
```

---

## 8. Empty States & Loading States

### 8.1 Loading Skeleton

```tsx
<div className="space-y-3">
  <Skeleton className="h-4 w-3/4" />
  <Skeleton className="h-4 w-1/2" />
  <Skeleton className="h-32 w-full" />
</div>
```

### 8.2 Loading Spinner

```tsx
<div className="flex items-center justify-center p-8">
  <Loader2 className="h-8 w-8 animate-spin text-primary" />
</div>
```

### 8.3 Empty State Pattern

```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <FileText className="mb-4 h-12 w-12 text-muted-foreground/50" />
  <h3 className="mb-1 text-lg font-medium">No projects yet</h3>
  <p className="mb-4 text-sm text-muted-foreground">
    Get started by creating your first project
  </p>
  <Button>
    <Plus className="mr-2 h-4 w-4" />
    Create Project
  </Button>
</div>
```

---

## 9. Mobile-First Best Practices

### 9.1 Touch Targets

```tsx
// Minimum touch target
className="min-h-[44px] min-w-[44px]"

// Utility function
import { iconButtonTarget } from '@/lib/utils';
className={iconButtonTarget('additional-classes')}
```

### 9.2 Safe Areas

```tsx
// Bottom navigation with safe area
className = 'pb-safe'; // Adds padding for notched devices
```

### 9.3 Mobile Navigation

- Bottom nav for primary navigation (4 items max)
- Hamburger menu for additional items
- Gestures: Swipe to go back (if supported)
- Touch feedback: scale/opacity on press

---

## 10. Dark Mode Considerations

### 10.1 Implementation

```tsx
// Class-based dark mode
<html className="dark">

// Toggle
const root = document.documentElement;
root.classList.toggle('dark');
```

### 10.2 Color Adjustments

| Element    | Light Mode | Dark Mode          |
| ---------- | ---------- | ------------------ |
| Background | White #fff | Near-black #0a0a0a |
| Text       | Near-black | Near-white         |
| Borders    | Light gray | Dark gray          |
| Shadows    | Subtle     | More prominent     |

### 10.3 Dark Mode Classes

```tsx
// Conditional dark mode styling
className = 'bg-white dark:bg-slate-950';
className = 'text-gray-900 dark:text-gray-100';
className = 'border-gray-200 dark:border-gray-800';
```

---

## 11. Z-Index Management

```typescript
// src/lib/z-index.config.ts
export const Z_INDEX = {
  BASE: 0,
  CONTENT_DECORATIVE: 10,
  CONTENT_ELEVATED: 20,
  STICKY_NAV: 40,
  MODAL_BACKDROP: 50,
  MODAL: 50,
  TOAST: 100,
  TOOLTIP: 100,
};

// Usage
import { zIndex } from '@/lib/z-index.config';
className={zIndex('MODAL')}  // Returns 'z-50'
```

---

## 12. Icon Usage

### 12.1 Icon Library

Using `lucide-react` for all icons.

### 12.2 Standard Sizes

| Context          | Size | Class       |
| ---------------- | ---- | ----------- |
| Inline with text | 16px | `h-4 w-4`   |
| Navigation       | 20px | `h-5 w-5`   |
| Card icons       | 24px | `h-6 w-6`   |
| Empty states     | 48px | `h-12 w-12` |

### 12.3 Icon Best Practices

```tsx
// Always set aria-hidden for decorative icons
<Settings className="h-4 w-4" aria-hidden="true" />

// Provide aria-label for icon-only buttons
<Button variant="ghost" size="icon" aria-label="Settings">
  <Settings className="h-4 w-4" />
</Button>

// Icon + text pattern
<Button>
  <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
  Add Item
</Button>
```

---

## 13. Code Organization

### 13.1 Component File Structure

```
src/shared/components/ui/
├── Button.tsx
├── Card.tsx
├── Dialog.tsx
├── Badge.tsx
├── Progress.tsx
├── Skeleton.tsx
├── Toaster.tsx
└── index.ts  // Barrel export
```

### 13.2 Import Pattern

```typescript
// Recommended: Absolute imports
import { Button } from '@/shared/components/ui/Button';
import { Card, CardHeader, CardTitle } from '@/shared/components/ui/Card';

// Or via barrel
import { Button, Card } from '@/shared/components/ui';
```

### 13.3 Style Colocation

```tsx
// CVA for variants (preferred)
const buttonVariants = cva([...], { variants: {...} });

// cn utility for conditional classes
import { cn } from '@/lib/utils';
className={cn('base-classes', condition && 'conditional-class')}
```

---

## Quick Reference

### Common Class Combinations

```tsx
// Card-like container
'rounded-xl border bg-card p-6 shadow-sm';

// Section heading
'text-lg font-medium mb-4';

// Muted text
'text-sm text-muted-foreground';

// Form label
'text-xs font-bold uppercase text-muted-foreground';

// Input field
'w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary';

// Icon button
'p-2 rounded-md hover:bg-muted transition-colors';

// Divider
'h-px bg-border';
```

---

_This design system is maintained alongside the codebase. For
implementation-specific questions, reference the component source files in
`src/shared/components/ui/`._
