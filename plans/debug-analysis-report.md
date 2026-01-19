# Debug Analysis Report

**Date**: January 19, 2026 **Agent**: Debugger Agent **Status**: ✅ Complete

## Executive Summary

Root cause analysis of E2E test failures, accessibility violations, and build
warnings identified the following issues:

### E2E Test Failures

#### 1. `waitForTimeout` Anti-patterns (Critical)

**Impact**: Tests timing out, flaky behavior on retry **Files Affected**:

- `tests/specs/navigation.spec.ts` (lines 19, 128)
- `tests/specs/accessibility.spec.ts` (lines 19, 45, 288, 332, 390)

**Root Cause**: Tests are using fixed timeouts (`page.waitForTimeout(1000)`)
instead of smart waits. This causes:

- Unnecessary delays (test takes longer than needed)
- Flakiness when animations take different durations
- Timeouts in CI environments

**Solution**: Replace all `waitForTimeout` calls with smart waits:

- Use `expect(element).toBeVisible()` - Playwright auto-waits
- Use `page.waitForSelector(selector, { state: 'attached' })`
- Use `page.waitForLoadState('domcontentloaded')`

#### 2. Navigation Test Flakiness

**Test**: `should handle navigation between dashboard and settings` **Root
Cause**: Test depends on timing to find `nav-settings` element which may not be
immediately visible

**Code Location**:

```typescript
// tests/specs/navigation.spec.ts (line 67-72)
const settingsButton = page
  .getByRole('button', { name: /settings/i })
  .or(page.getByRole('link', { name: /settings/i }));

if (await settingsButton.first().isVisible()) {
  await settingsButton.first().click();
```

**Issue**: The `.first()` call and conditional check race with React rendering

**Solution**:

- Remove conditional check - let Playwright handle element not found
- Use specific `data-testid` selectors instead of role-based fallbacks
- Add proper loading state detection

#### 3. AI Mock Configuration Failure

**Test**: `AI mocks are configured` **Root Cause**: Mock setup depends on
`nav-settings` element, which may not exist in all views

**Code Location**:

```typescript
// tests/specs/mock-validation.spec.ts (line 32)
await expect(page.getByTestId('nav-settings')).toBeVisible({ timeout: 10000 });
```

**Issue**: `nav-settings` data-testid doesn't exist in current Navbar component

**Solution**:

- Add `data-testid="nav-settings"` to Settings button in Navbar
- Or update test to use available selectors
- Ensure mock setup completes before navigation checks

### Accessibility Violations

#### 1. `aria-required-parent` (Critical) - 6 Nodes

**Impact**: ARIA attributes improperly nested, breaking screen reader
functionality **Root Cause**: Dialogs, modals, or list items without proper
parent structure

**Likely Culprits**:

- Dialog/Modal components without `role="dialog"` wrapper
- List items without `<ul>` or `<ol>` parent
- Menu items without `<menu>` or `<ul>` parent

**Affected Components** (to be verified with axe scan):

- `src/shared/components/ui/Dialog.tsx`
- `src/shared/components/ui/Toaster.tsx`
- `src/features/onboarding/components/OnboardingModal.tsx`
- Dialog modals in Settings view

**Solution**:

- Ensure all dialogs have proper `role="dialog"` wrapper
- Wrap list items in semantic `<ul>`/`<ol>` elements
- Add ARIA roles where semantic HTML insufficient

#### 2. Landmark Hierarchy Issues

**2a. `landmark-banner-is-top-level`** **Issue**: Navigation bar not wrapped in
`<header role="banner">` **Current Structure**:

```tsx
// src/components/layout/MainLayout.tsx
// Navbar is a direct child, not in header
<Navbar />
```

**Solution**:

```tsx
<header role="banner">
  <Navbar />
</header>
```

**2b. `landmark-main-is-top-level`** **Issue**: `<main>` element is nested
inside other containers **Current Structure** (App.tsx):

```tsx
<div className="animate-in fade-in ...">  // Extra wrapper
  <main role="main" ...>  // main not top-level
```

**Solution**: Remove unnecessary wrapper around `<main>` element

**2c. `landmark-no-duplicate-main`** **Issue**: Multiple `<main role="main">`
elements on page **Likely Cause**: MainLayout may have a main, and App.tsx also
has one

**Solution**: Ensure only one `<main role="main">` per page - remove duplicate

**2d. `landmark-unique`** **Issue**: Multiple landmarks without unique labels
**Likely Cause**: Multiple nav elements without `aria-label`

**Solution**: Add unique `aria-label` to all navigation elements:

```tsx
<nav aria-label="Main navigation">
<nav aria-label="Bottom navigation">
<nav aria-label="Settings navigation">
```

### Build Warning

#### Chunk Size Issue

**Chunk**: `vendor-misc-exUg0-bV.js` - 566.28 kB (exceeds 500kB limit)

**Current Code Splitting Analysis**:

- `vendor-misc` contains all remaining node_modules
- Large libraries in this chunk:
  - `posthog-js` (analytics)
  - `sanitize-html` (content sanitization)
  - Various smaller utilities

**Solution**: Split vendor-misc further:

1. Extract `posthog-js` → `vendor-analytics` (already exists, may need
   adjustment)
2. Extract `sanitize-html` → `vendor-sanitize` (already exists, may need
   adjustment)
3. Add more granular splits for remaining misc libraries

## Recommended Fixes Priority

### Priority 1 (Critical - Fix First)

1. ✅ Remove all `waitForTimeout` anti-patterns
2. ✅ Add `data-testid="nav-settings"` to Navbar
3. ✅ Fix landmark banner wrapper
4. ✅ Ensure single `<main>` element

### Priority 2 (High - Fix Next)

5. ✅ Fix aria-required-parent violations
6. ✅ Add unique aria-labels to nav elements
7. ✅ Split vendor-misc chunk

### Priority 3 (Medium - Optimization)

8. ✅ Improve test isolation between specs
9. ✅ Add proper loading state detection
10. ✅ Optimize bundle size further

## Test Execution Strategy

### E2E Test Fixes

1. **Replace waitForTimeout**: Use smart waits
2. **Fix navigation selectors**: Add stable data-testids
3. **Improve retry logic**: Handle temporary failures gracefully
4. **Mock setup**: Ensure mocks initialize before tests

### Accessibility Fixes

1. **Landmark structure**: Add proper HTML5 semantic elements
2. **ARIA attributes**: Ensure correct parent/child relationships
3. **Unique labels**: Distinguish similar landmarks
4. **Test coverage**: Add axe-core tests for all views

### Performance Fixes

1. **Code splitting**: Optimize manual chunks
2. **Lazy loading**: Improve dynamic imports
3. **Tree shaking**: Remove unused code
4. **Cache optimization**: Better chunk caching

## Next Steps

1. **Execute E2E Test Optimizer Agent**:
   - Remove all waitForTimeout
   - Implement smart waits
   - Fix navigation test selectors

2. **Execute UX Designer Agent**:
   - Fix landmark hierarchy
   - Add ARIA attributes
   - Ensure unique labels

3. **Execute Performance Engineer Agent**:
   - Split vendor-misc chunk
   - Optimize bundle size
   - Test build performance

## Risk Assessment

### Low Risk Changes

- Removing `waitForTimeout` - only improves test reliability
- Adding data-testids - no functional impact
- Adding aria-labels - improves accessibility

### Medium Risk Changes

- Changing landmark structure - minimal UI impact
- Modifying chunk splitting - requires testing

### High Risk Changes

- None identified - all fixes are well-contained

## Success Criteria

- ✅ All E2E tests pass without retries
- ✅ Zero axe-core violations
- ✅ All chunks < 500 kB
- ✅ Build completes without warnings
- ✅ GitHub Actions passing

---

**Agent Output**: Complete **Next Agent**: E2E-Test-Optimizer Agent (Phase 1,
Action 2) **Parallel Agent**: UX Designer Agent (Phase 1, Action 3)
