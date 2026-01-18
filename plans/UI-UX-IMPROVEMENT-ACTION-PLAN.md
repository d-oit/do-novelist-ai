# UI/UX Improvement Action Plan - Novelist.ai

**Version:** 1.0 **Date:** January 2026 **Status:** Active **Tracking:** Use
this document to track implementation progress

---

## Executive Summary

This action plan outlines prioritized UI/UX improvements for Novelist.ai based
on the comprehensive analysis conducted in UI-UX-ANALYSIS-JAN2026.md.
Improvements are categorized by priority and include implementation estimates.

### Priority Definitions

| Priority | Impact   | Urgency     | Description                             |
| -------- | -------- | ----------- | --------------------------------------- |
| **P0**   | Critical | Immediate   | Blocking issues, accessibility failures |
| **P1**   | High     | This Sprint | Major user experience gaps              |
| **P2**   | Medium   | Next Sprint | Quality of life improvements            |
| **P3**   | Low      | Backlog     | Nice-to-have enhancements               |

---

## P0: Critical Improvements

### P0-1: Add Onboarding Flow for New Users

**Problem:** First-time users have no guidance on how to use the application.

**Impact:** High user drop-off, confusion, support burden.

**Solution:** Create a guided onboarding experience.

**Implementation:**

```
src/features/onboarding/
├── components/
│   ├── OnboardingModal.tsx
│   ├── OnboardingStep.tsx
│   ├── OnboardingProgress.tsx
│   └── WelcomeScreen.tsx
├── hooks/
│   └── useOnboarding.ts
└── index.ts
```

**Steps:**

1. Create onboarding context/state to track completion
2. Build 4-5 step onboarding modal:
   - Welcome & purpose
   - Create first project
   - Explore dashboard
   - Try AI features
   - Completion celebration
3. Store completion status in localStorage
4. Show for new users (no projects)
5. Add "Restart Tour" option in Settings

**Complexity:** Medium **Estimated Effort:** 2-3 days **Files to Create:** 5-6
new files **Files to Modify:** `App.tsx`, `SettingsView.tsx`

---

### P0-2: Expand Mobile Navigation

**Problem:** World Building, Plot Engine, and Dialogue are inaccessible on
mobile.

**Impact:** Mobile users cannot access core features.

**Solution:** Add access to all views from mobile.

**Implementation Options:**

**Option A: Expandable Bottom Nav (Recommended)**

```tsx
// Add "More" button that expands to show additional views
<BottomNav>
  <NavButton view="dashboard" />
  <NavButton view="projects" />
  <NavButton view="more" /> // Opens sheet with remaining views
  <NavButton view="settings" />
</BottomNav>
```

**Option B: Swipeable Bottom Nav**

- Horizontal scroll with all 7 views
- Indicator dots for current position

**Steps:**

1. Create `MoreSheet.tsx` component with remaining views
2. Update `BottomNav.tsx` to include More button
3. Add Sheet/drawer animation
4. Ensure proper focus management

**Complexity:** Low **Estimated Effort:** 1 day **Files to Create:**
`MoreSheet.tsx` **Files to Modify:** `BottomNav.tsx`

---

### P0-3: Add Help/Documentation Section

**Problem:** Users cannot find help or learn features.

**Impact:** Reduced feature discovery, increased support load.

**Solution:** Create in-app help center.

**Implementation:**

```
src/features/help/
├── components/
│   ├── HelpCenter.tsx
│   ├── HelpSearch.tsx
│   ├── HelpArticle.tsx
│   └── KeyboardShortcuts.tsx
├── data/
│   └── helpContent.ts
└── index.ts
```

**Content Categories:**

1. Getting Started
2. Projects & Chapters
3. AI Features
4. World Building
5. Plot Engine
6. Keyboard Shortcuts
7. Troubleshooting

**Steps:**

1. Create help content structure (Markdown or JSON)
2. Build HelpCenter component with search
3. Add ? icon to header for quick access
4. Implement keyboard shortcut overlay (Cmd+/)
5. Add to Settings navigation

**Complexity:** Medium **Estimated Effort:** 3-4 days **Files to Create:** 6-8
new files **Files to Modify:** `Header.tsx`, `App.tsx`

---

## P1: High Priority Improvements

### P1-1: Implement Undo/Redo System

**Problem:** Content edits are irreversible.

**Impact:** User anxiety, fear of making changes.

**Solution:** Add undo/redo for chapter content.

**Implementation:**

```typescript
// src/lib/hooks/useUndoRedo.ts
interface UndoRedoState<T> {
  past: T[];
  present: T;
  future: T[];
}

const useUndoRedo = <T>(initialState: T) => {
  // Implement with useReducer
  return { state, undo, redo, canUndo, canRedo };
};
```

**Steps:**

1. Create `useUndoRedo` hook with history management
2. Integrate into `ChapterContentEditor.tsx`
3. Add undo/redo buttons to editor toolbar
4. Implement keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z)
5. Show undo toast after destructive actions

**Complexity:** Medium **Estimated Effort:** 2 days **Files to Create:**
`useUndoRedo.ts` **Files to Modify:** `ChapterContentEditor.tsx`

---

### P1-2: Add Inline Form Validation

**Problem:** Users only see errors after form submission.

**Impact:** Frustration, repeated failed submissions.

**Solution:** Real-time validation feedback.

**Implementation:**

```tsx
// Pattern for validated input
<FormField label="Project Title" error={errors.title} touched={touched.title}>
  <Input
    value={title}
    onChange={handleChange}
    onBlur={handleBlur}
    aria-invalid={!!errors.title}
    aria-describedby="title-error"
  />
</FormField>
```

**Steps:**

1. Create `FormField` wrapper component
2. Add validation rules per field
3. Implement `onBlur` validation
4. Show error messages inline below fields
5. Use `aria-describedby` for accessibility
6. Apply to all forms (ProjectWizard, CharacterEditor, etc.)

**Complexity:** Medium **Estimated Effort:** 2-3 days **Files to Create:**
`FormField.tsx`, `useFormValidation.ts` **Files to Modify:** All form components
(6-8 files)

---

### P1-3: Improve AI Generation Feedback

**Problem:** AI generation progress is unclear.

**Impact:** Users don't know what's happening, may think app is frozen.

**Solution:** Granular progress indication.

**Implementation:**

```tsx
<GenerationProgress
  stage="generating" // "preparing" | "generating" | "refining" | "complete"
  progress={45} // 0-100
  currentAction="Writing chapter introduction..."
/>
```

**Steps:**

1. Create `GenerationProgress.tsx` component
2. Update generation hooks to emit progress events
3. Show stage indicators (Preparing → Generating → Refining)
4. Add estimated time remaining
5. Include cancel button

**Complexity:** Medium **Estimated Effort:** 2 days **Files to Create:**
`GenerationProgress.tsx` **Files to Modify:** Generation hooks,
`AgentConsole.tsx`

---

### P1-4: Add aria-live Regions for Dynamic Content

**Problem:** Screen reader users miss dynamic updates.

**Impact:** Accessibility gap for blind users.

**Solution:** Implement aria-live announcements.

**Implementation:**

```tsx
// src/shared/components/a11y/LiveRegion.tsx
export const LiveRegion: FC<{ message: string }> = ({ message }) => (
  <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
    {message}
  </div>
);
```

**Steps:**

1. Create `LiveRegion` component
2. Add to `App.tsx` at root level
3. Create announcement hook/store
4. Announce: toast messages, loading states, navigation changes
5. Test with screen reader

**Complexity:** Low **Estimated Effort:** 1 day **Files to Create:**
`LiveRegion.tsx`, `useLiveAnnounce.ts` **Files to Modify:** `App.tsx`,
`Toaster.tsx`

---

## P2: Medium Priority Improvements

### P2-1: Keyboard Shortcut Discovery

**Problem:** Power users can't discover keyboard shortcuts.

**Implementation:**

```tsx
// Shortcut modal triggered by Cmd+/ or ?
<KeyboardShortcutsModal>
  <ShortcutGroup title="General">
    <Shortcut keys={['⌘', 'K']} action="Open search" />
    <Shortcut keys={['⌘', 'S']} action="Save" />
    <Shortcut keys={['Esc']} action="Close modal" />
  </ShortcutGroup>
  <ShortcutGroup title="Editor">
    <Shortcut keys={['⌘', 'Z']} action="Undo" />
    <Shortcut keys={['⌘', '⇧', 'Z']} action="Redo" />
  </ShortcutGroup>
</KeyboardShortcutsModal>
```

**Complexity:** Low **Estimated Effort:** 1 day **Files to Create:**
`KeyboardShortcutsModal.tsx`

---

### P2-2: Settings Page Reorganization

**Problem:** Settings is one long scrolling page.

**Solution:** Add tabbed navigation.

**Implementation:**

```tsx
<SettingsTabs defaultValue="general">
  <SettingsTabsList>
    <SettingsTab value="general">General</SettingsTab>
    <SettingsTab value="database">Database</SettingsTab>
    <SettingsTab value="ai">AI Provider</SettingsTab>
    <SettingsTab value="appearance">Appearance</SettingsTab>
    <SettingsTab value="gamification">Gamification</SettingsTab>
  </SettingsTabsList>
  <SettingsTabContent value="general">...</SettingsTabContent>
</SettingsTabs>
```

**Complexity:** Low **Estimated Effort:** 1 day **Files to Modify:**
`SettingsView.tsx`

---

### P2-3: Empty State Components

**Problem:** Empty views lack guidance.

**Solution:** Create reusable empty state component.

**Implementation:**

```tsx
// src/shared/components/ui/EmptyState.tsx
<EmptyState
  icon={<FileText className="h-12 w-12" />}
  title="No projects yet"
  description="Get started by creating your first project"
  action={
    <Button onClick={onCreateProject}>
      <Plus className="mr-2 h-4 w-4" />
      Create Project
    </Button>
  }
/>
```

**Apply to:**

- Projects view (no projects)
- Chapters list (no chapters)
- Characters list (no characters)
- Search results (no results)

**Complexity:** Low **Estimated Effort:** 1 day **Files to Create:**
`EmptyState.tsx` **Files to Modify:** 4-5 view components

---

### P2-4: Add Tooltips to Icon Buttons

**Problem:** Icon-only buttons lack context.

**Solution:** Add hover tooltips.

**Implementation:**

```tsx
// Create Tooltip wrapper
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

<Tooltip content="Settings">
  <Button variant="ghost" size="icon">
    <Settings className="h-4 w-4" />
  </Button>
</Tooltip>;
```

**Complexity:** Low (if using Radix primitives) **Estimated Effort:** 1 day
**Files to Create:** `Tooltip.tsx` **Files to Modify:** Multiple components with
icon buttons

---

### P2-5: Reduced Motion Support

**Problem:** Animations may cause issues for users with vestibular disorders.

**Solution:** Respect `prefers-reduced-motion` media query.

**Implementation:**

```css
/* src/index.css */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

```typescript
// For Framer Motion
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

<motion.div
  initial={prefersReducedMotion ? false : { opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3 }}
/>
```

**Complexity:** Low **Estimated Effort:** 0.5 days **Files to Modify:**
`index.css`, animation components

---

### P2-6: Command Palette Enhancement

**Problem:** Search (Ctrl+K) is basic, could be more powerful.

**Solution:** Create full command palette.

**Implementation:**

```tsx
<CommandPalette
  commands={[
    { id: 'new-project', label: 'Create New Project', action: () => {} },
    { id: 'search', label: 'Search Content', action: () => {} },
    { id: 'settings', label: 'Open Settings', action: () => {} },
    { id: 'help', label: 'Open Help', action: () => {} },
    { id: 'shortcuts', label: 'Keyboard Shortcuts', action: () => {} },
  ]}
/>
```

**Complexity:** Medium **Estimated Effort:** 2-3 days **Files to Create:**
`CommandPalette.tsx`, command registry

---

## P3: Low Priority Improvements

### P3-1: Template System for Projects

**Problem:** Users start from scratch every time.

**Solution:** Pre-built project templates.

**Templates:**

- Novel (10+ chapters)
- Short Story (1-3 chapters)
- Series Bible (world-building focused)
- Screenplay format

**Complexity:** Medium **Estimated Effort:** 2-3 days

---

### P3-2: Customizable Keyboard Shortcuts

**Problem:** Users can't change default shortcuts.

**Solution:** Settings page for shortcut customization.

**Complexity:** High **Estimated Effort:** 3-4 days

---

### P3-3: Batch Operations for Chapters

**Problem:** No way to operate on multiple chapters at once.

**Solution:** Multi-select with batch actions.

**Actions:**

- Delete selected
- Export selected
- Regenerate selected
- Move/reorder

**Complexity:** Medium **Estimated Effort:** 2-3 days

---

### P3-4: Theme Customization

**Problem:** Only light/dark modes available.

**Solution:** Custom accent color selection.

**Complexity:** Low **Estimated Effort:** 1 day

---

### P3-5: Recent Actions History

**Problem:** No visibility into past actions.

**Solution:** Activity feed/history panel.

**Complexity:** Medium **Estimated Effort:** 2-3 days

---

## New Components to Create

| Component                | Priority | Purpose                     |
| ------------------------ | -------- | --------------------------- | ------- |
| `OnboardingModal`        | P0       | First-time user guidance    |
| `MoreSheet`              | P0       | Mobile nav expansion        | ✅ DONE |
| `HelpCenter`             | P0       | In-app documentation        |
| `FormField`              | P1       | Validated form inputs       |
| `GenerationProgress`     | P1       | AI progress feedback        |
| `LiveRegion`             | P1       | Screen reader announcements | ✅ DONE |
| `KeyboardShortcutsModal` | P2       | Shortcut discovery          |
| `EmptyState`             | P2       | Guidance for empty views    |
| `Tooltip`                | P2       | Icon button context         |
| `CommandPalette`         | P2       | Quick actions               |
| `SettingsTabs`           | P2       | Settings organization       |

---

## Implementation Roadmap

### Sprint 1: Critical Accessibility & Onboarding

- [ ] P0-1: Onboarding flow (3 days)
- [x] P0-2: Mobile navigation (1 day) - COMPLETED: Added MoreSheet component
      with slide-up navigation for World Building, Plot Engine, Metrics,
      Dialogue
- [x] P1-4: aria-live regions (1 day) - COMPLETED: Added LiveRegion component
      with useLiveAnnounce hook, integrated with Toaster

**Total: ~5 days**

### Sprint 2: Core UX Improvements

- [ ] P0-3: Help center (4 days)
- [ ] P1-2: Inline validation (3 days)

**Total: ~7 days**

### Sprint 3: Editor & Feedback

- [ ] P1-1: Undo/redo (2 days)
- [ ] P1-3: Generation progress (2 days)
- [ ] P2-5: Reduced motion (0.5 days)

**Total: ~4.5 days**

### Sprint 4: Polish & Discovery

- [ ] P2-1: Keyboard shortcuts modal (1 day)
- [ ] P2-2: Settings reorganization (1 day)
- [ ] P2-3: Empty states (1 day)
- [ ] P2-4: Tooltips (1 day)

**Total: ~4 days**

### Backlog (As Time Permits)

- P2-6: Command palette
- P3-1: Templates
- P3-2: Custom shortcuts
- P3-3: Batch operations
- P3-4: Theme customization
- P3-5: Recent actions

---

## Success Metrics

### User Experience

- [ ] New user activation rate increases
- [ ] Time to first project creation decreases
- [ ] Feature discovery improves (measured via analytics)

### Accessibility

- [ ] Lighthouse accessibility score > 95
- [ ] axe-core violations = 0
- [ ] Screen reader testing passes

### Mobile

- [ ] All features accessible on mobile
- [ ] Mobile session duration increases

### Developer Experience

- [ ] Design system adoption > 90%
- [ ] Component reuse increases
- [ ] Consistent patterns across features

---

## Review Checklist

Before marking any improvement complete:

- [ ] Tested on desktop (Chrome, Firefox, Safari)
- [ ] Tested on mobile (iOS Safari, Android Chrome)
- [ ] Keyboard navigation verified
- [ ] Screen reader tested (VoiceOver/NVDA)
- [ ] Dark mode verified
- [ ] Reduced motion verified
- [ ] Loading states present
- [ ] Error states handled
- [ ] Documentation updated
- [ ] Tests written

---

_This action plan should be reviewed and updated monthly. Track progress using
the checkbox items above._
