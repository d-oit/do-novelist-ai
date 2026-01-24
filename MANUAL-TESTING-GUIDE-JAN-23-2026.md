# Manual Testing Guide - Session Features

**Date**: January 23, 2026 **Purpose**: Test all features implemented in this
session **Features to Test**: Help Center, Undo/Redo, Form Validation

---

## Prerequisites

### 1. Start Development Server

```bash
# Install dependencies (if needed)
npm ci

# Start development server
npm run dev

# Expected output:
# VITE ready in XXXms ➜  Local:   http://localhost:3000/
# ➜  Network: use --host to expose
```

Open browser to: http://localhost:3000

### 2. Check Browser Console

Open DevTools (F12) and verify:

- ✅ No console errors
- ✅ No warnings (except React dev warnings)
- ✅ All JavaScript loads correctly

---

## Feature 1: Help/Documentation Center

### Test Overview

The Help Center was implemented with 8 categories and 18+ articles with search
functionality.

### Test Steps

#### 1.1 Access Help Center

**Method 1: Header Button**

1. Look for help button in header (top right)
2. Expected: ? icon button with "Help" label
3. Click button

**Method 2: Keyboard Shortcut**

1. Press `Ctrl+/` (or `Cmd+/` on Mac)
2. Expected: Help Center modal opens

#### 1.2 Verify Help Center Modal

**Expected UI**:

- Modal with title "Help Center"
- Search input at top
- Category list on left side
- Article list in center
- Close button (X) in top right

**Test Cases**:

1. ✅ Modal opens with animation
2. ✅ Backdrop is visible
3. ✅ Modal is centered on screen
4. ✅ Close button is visible and functional
5. ✅ Escape key closes modal
6. ✅ Clicking backdrop closes modal

#### 1.3 Test Search Functionality

**Test Cases**:

1. Type "character" in search box
   - ✅ Results should filter to show character-related articles
   - ✅ Category "Characters" should highlight

2. Type "editor" in search box
   - ✅ Results should show editor-related articles
   - ✅ Category "Editor" should highlight

3. Type "nonexistent topic"
   - ✅ "No results found" message should appear
   - ✅ Clear search button should be visible

4. Clear search
   - ✅ All articles should reappear

#### 1.4 Browse by Category

**Available Categories**:

1. Getting Started Guide
2. Project Creation Tutorial
3. Character Development Guide
4. Plot Engine Tutorial
5. World Building Guide
6. Publishing Guide
7. AI Features Guide
8. Settings & Configuration

**Test Each Category**:

1. Click on category name
   - ✅ Category should highlight (active state)
   - ✅ Article list should update to show relevant articles

2. Click article title
   - ✅ Article content should display
   - ✅ Back button should appear
   - ✅ Related articles section should show

#### 1.5 Read Article

**Test Article Content**:

1. ✅ Title displayed at top
2. ✅ Content formatted correctly (paragraphs, lists, code blocks)
3. ✅ Related articles shown (if applicable)
4. ✅ Back button navigates to previous view

**Test Article Navigation**:

1. Click related article
   - ✅ Navigate to that article
   - ✅ Update URL/history

2. Click back button
   - ✅ Return to article list or search results

#### 1.6 Test Accessibility

**Keyboard Navigation**:

1. ✅ Tab key navigates through interactive elements
2. ✅ Enter key activates focused buttons
3. ✅ Escape key closes modal

**Screen Reader**:

1. Open VoiceOver (Mac) or NVDA (Windows)
2. Navigate through Help Center
3. ✅ All elements have proper ARIA labels
4. ✅ Headings are announced correctly
5. ✅ Links/buttons are announced with context

---

## Feature 2: Undo/Redo System

### Test Overview

The Undo/Redo system was implemented in ChapterEditor with 50 action history.

### Test Steps

#### 2.1 Access Editor

1. Navigate to editor: http://localhost:3000/projects
2. Click on existing project or create new project
3. Open chapter in editor

#### 2.2 Locate Undo/Redo Controls

**Expected UI Location**:

- Undo button in toolbar (or keyboard shortcut Ctrl+Z)
- Redo button in toolbar (or keyboard shortcut Ctrl+Y)
- Buttons should be disabled when no history available

**Test Cases**:

1. ✅ Undo button is disabled initially
2. ✅ Redo button is disabled initially
3. ✅ Buttons have proper tooltips
4. ✅ Keyboard shortcuts documented in tooltips

#### 2.3 Test Undo Functionality

**Test Scenario 1: Content Editing**

1. Type some text in editor: "Hello world"
2. Modify text: "Hello beautiful world"
3. Press `Ctrl+Z` (or click Undo)
   - ✅ Should revert to "Hello world"
4. Press `Ctrl+Z` again
   - ✅ Should revert to empty editor
5. Undo button should be disabled

**Test Scenario 2: Multiple Changes**

1. Type: "A"
2. Type: "B"
3. Type: "C"
4. Undo 3 times
   - ✅ Should revert to empty editor
   - ✅ Redo button should be enabled

**Test Scenario 3: Deep Undo**

1. Make 20+ edits to chapter
2. Undo all the way to beginning
3. ✅ Should maintain 50 action history limit
4. ✅ Oldest actions should be dropped when limit reached

#### 2.4 Test Redo Functionality

**Test Scenario 1: After Undo**

1. Undo some changes
2. Press `Ctrl+Y` (or click Redo)
   - ✅ Should advance forward through history
3. Continue until at most recent state
4. ✅ Redo button should be disabled

**Test Scenario 2: New Actions Clear Redo**

1. Undo some changes
2. Make new edit (don't redo)
3. ✅ Redo history should be cleared
4. ✅ Redo button should be disabled

#### 2.5 Test History Limit (50 Actions)

**Test Case**:

1. Make 60 edits to chapter (add/remove text rapidly)
2. Undo all the way back
3. ✅ Should stop at first edit (not at 60th)
4. ✅ Should maintain last 50 states
5. Check console - no errors about memory issues

#### 2.6 Test Integration with Save

**Test Cases**:

1. Make some edits
2. Undo to previous state
3. Click Save button
   - ✅ Should save current (undone) state
4. Make new edits
5. Click Save
   - ✅ Should save new state

#### 2.7 Test Edge Cases

**Test Case 1: Empty Editor**

1. Undo when editor is empty
   - ✅ Button remains disabled
   - ✅ No errors in console

**Test Case 2: Long Content**

1. Paste large text (1000+ words)
2. Undo
   - ✅ Should handle large content efficiently
   - ✅ No performance degradation

**Test Case 3: Special Characters**

1. Add emojis, special characters, formatting
2. Undo/Redo
   - ✅ Should handle all content types correctly

---

## Feature 3: Inline Form Validation

### Test Overview

Inline form validation was implemented with real-time error display for all
major forms.

### Test Steps

#### 3.1 Project Creation Form

**Access Form**:

1. Click "New Project" button
2. Fill in project details

**Test Validation Rules**:

**Field 1: Project Title**

1. Leave title empty
2. Try to submit form
   - ✅ "Project title is required" error should appear
   - ✅ Error should appear inline near field
   - ✅ Field border should turn red
   - ✅ Error icon should appear

3. Type 1 character: "A"
4. ✅ Error should disappear
5. Type "A" × 200
6. Try to submit
   - ✅ Error "Project title is too long" (if max length enforced)

**Field 2: Genre Selection**

1. Leave genre unselected
2. Try to submit
   - ✅ "Genre is required" error should appear

3. Select genre
4. ✅ Error should disappear

**Field 3: Idea/Description**

1. Leave idea empty
2. Try to submit
   - ✅ "Idea is required" error should appear

3. Type idea
4. ✅ Error should disappear

#### 3.2 Character Editor Form

**Access Form**:

1. Navigate to character editor
2. Create new character

**Test Validation Rules**:

**Field 1: Character Name**

1. Leave name empty
   - ✅ "Character name is required" error
2. Type name with special characters: `<script>alert()</script>`
   - ✅ "Invalid characters" error
3. Type valid name
   - ✅ Error disappears

**Field 2: Role/Tier**

1. Leave role unselected
   - ✅ "Role is required" error
2. Select valid role
   - ✅ Error disappears

**Field 3: Description**

1. Type very long description (>1000 chars)
   - ✅ May show warning or truncate
2. Type valid description
   - ✅ Warning disappears

#### 3.3 Chapter Editor Form

**Access Form**:

1. Navigate to chapter editor
2. Create new chapter

**Test Validation Rules**:

**Field 1: Chapter Title**

1. Leave title empty
   - ✅ "Chapter title is required" error
2. Type title with only spaces
   - ✅ "Title cannot be only spaces" error
3. Type valid title
   - ✅ Error disappears

**Field 2: Chapter Content**

1. Leave content empty
   - ✅ "Chapter content is required" error
2. Type valid content
   - ✅ Error disappears

#### 3.4 Settings Forms

**Access Settings**:

1. Navigate to Settings page

**Test Validation Rules**:

**Field 1: API Keys**

1. Enter invalid API key format (e.g., "not-a-key")
   - ✅ "Invalid API key format" error
2. Enter valid-looking key
   - ✅ Error disappears

**Field 2: Preferences**

1. Set invalid values (e.g., font size: -1)
   - ✅ "Value must be positive" error
2. Set valid values
   - ✅ Error disappears

#### 3.5 Test Real-Time Validation

**Test Behavior**:

1. Start typing in field
2. Remove focus from field (blur)
   - ✅ Validation should trigger
3. Type invalid value while focused
   - ✅ Error should appear in real-time
4. Type valid value
   - ✅ Error should disappear immediately

#### 3.6 Test Accessibility

**Error Display**:

1. Open screen reader
2. Navigate to form with errors
3. ✅ Error messages should be announced
4. ✅ `aria-describedby` attributes should link errors to fields
5. ✅ `aria-invalid="true"` should be set on invalid fields

**Keyboard Navigation**:

1. Tab through form fields
2. ✅ Focus should move to first error
3. ✅ Error should be announced when focused

---

## Feature 4: Onboarding Flow (Verification)

### Test Overview

Onboarding flow was verified to already exist in codebase.

### Test Steps

#### 4.1 Test New User Experience

**Test Case 1: Fresh Install**

1. Clear localStorage: `localStorage.clear()`
2. Reload page: http://localhost:3000
3. Expected:
   - ✅ Onboarding modal should appear
   - ✅ Welcome message displayed
   - ✅ Step 1 of X shown

**Test Case 2: Skip Onboarding**

1. Click "Skip" button (if available)
2. Expected:
   - ✅ Modal closes
   - ✅ Dashboard loads
   - ✅ Skip preference saved

**Test Case 3: Complete Onboarding**

1. Go through all onboarding steps
2. Expected:
   - ✅ Progress indicator shows current step
   - ✅ Each step completes successfully
   - ✅ Final step shows completion celebration
   - ✅ Onboarding preference saved as "completed"

#### 4.2 Test Returning User

**Test Case 1: Previous User**

1. Set `localStorage.setItem('onboardingCompleted', 'true')`
2. Reload page
3. Expected:
   - ✅ No onboarding modal
   - ✅ Dashboard loads directly

**Test Case 2: Restart Tour**

1. Navigate to Settings
2. Click "Restart Tour" or "Show Onboarding"
3. Expected:
   - ✅ Onboarding modal appears
   - ✅ User can go through steps again

---

## Feature 5: Mobile Navigation (Verification)

### Test Overview

Mobile navigation with "More" sheet was verified to already exist.

### Test Steps

#### 5.1 Test Mobile View

**Setup**:

1. Open DevTools (F12)
2. Toggle device toolbar: Click phone/tablet icon
3. Select "iPhone 12 Pro" or "Pixel 5"

**Test Bottom Navigation**:

1. Expected: Bottom navigation bar visible
2. Expected: Main views available (Dashboard, Projects, Settings)

**Test More Sheet**:

1. Click "More" button in bottom nav
2. Expected: Sheet/drawer opens from bottom
3. Expected: Additional views shown (Plot Engine, World Building, Dialogue,
   etc.)
4. Expected: Clicking view closes sheet and navigates

---

## Cross-Feature Testing

### Test 1: Undo/Redo + Form Validation

**Scenario**:

1. Edit chapter content
2. Make some edits
3. Undo changes
4. Try to save with invalid form data elsewhere
5. ✅ Form validation should still work independently
6. ✅ Undo/Redo should maintain editor state

### Test 2: Help Center + Editor

**Scenario**:

1. Open Help Center
2. Read "Editor Features" article
3. Navigate to editor
4. ✅ Should find editor features as described
5. ✅ Help Center accessibility maintained

### Test 3: Form Validation + Onboarding

**Scenario**:

1. Complete onboarding (create project)
2. Leave required fields empty
3. Try to proceed
4. ✅ Validation should prevent progress
5. ✅ Error messages should be clear

---

## Performance Testing

### Test 1: Initial Load Performance

**Setup**:

1. Open DevTools Network tab
2. Select "Disable cache" checkbox
3. Reload page: http://localhost:3000

**Expected**:

- ✅ Initial HTML loads in <2 seconds
- ✅ JavaScript chunks load progressively
- ✅ Largest chunk (vendor-misc) loads in <5 seconds
- ✅ No render-blocking requests

**Measure**:

- Total load time: **\_\_** seconds
- Time to interactive: **\_\_** seconds
- Largest asset size: **\_\_** KB

### Test 2: Navigation Performance

**Test Case**:

1. Navigate between 5 different routes
2. Measure each navigation
3. ✅ Each should complete in <1 second (after initial load)
4. ✅ No layout shift

### Test 3: Memory Usage

**Setup**:

1. Open DevTools Memory tab
2. Take heap snapshot (baseline)
3. Navigate through app for 2-3 minutes
4. Take heap snapshot (after)

**Expected**:

- ✅ No significant memory leak (>10 MB growth)
- ✅ Heap size stabilizes after navigation
- ✅ Component unmounting cleans up properly

---

## Accessibility Testing

### Test 1: Keyboard Navigation

**Test All Pages**:

1. Tab through all interactive elements
2. ✅ Focus order is logical
3. ✅ All interactive elements reachable
4. ✅ Focus indicator visible
5. ✅ Skip links (for repeated content)

### Test 2: Screen Reader

**Setup**:

1. Enable VoiceOver (Mac) or NVDA (Windows)
2. Navigate through each feature tested

**Help Center**:

- ✅ All headings announced
- ✅ Articles announced with context
- ✅ Search results announced
- ✅ Buttons announced with labels

**Editor with Undo/Redo**:

- ✅ Undo/Redo buttons announced
- ✅ Keyboard shortcuts documented in aria-labels
- ✅ Editor content announced

**Form Validation**:

- ✅ Errors announced with field context
- ✅ Success messages announced
- ✅ Required fields marked with aria-required

### Test 3: Color Contrast

**Test All UI Elements**:

1. Check text/background contrast
2. Expected: WCAG AA compliant (4.5:1 minimum)
3. Check error message colors (red on light, white on dark)
4. ✅ All text readable

---

## Browser Testing Matrix

### Test in Multiple Browsers

| Browser          | Status        | Issues Found |
| ---------------- | ------------- | ------------ |
| Chrome (Latest)  | ⬜ Not tested | -            |
| Firefox (Latest) | ⬜ Not tested | -            |
| Safari (Latest)  | ⬜ Not tested | -            |
| Edge (Latest)    | ⬜ Not tested | -            |

**Test Each Feature**:

1. Help Center
2. Undo/Redo in Editor
3. Form Validation
4. Onboarding
5. Mobile Navigation

**Test Responsive**:

1. Desktop (1920×1080)
2. Tablet (768×1024)
3. Mobile (375×667)

---

## Issue Reporting

### If Issues Found

**Report Format**:

```markdown
## [Feature Name]

### Issue Title

Brief description of issue

### Steps to Reproduce

1. Step 1
2. Step 2
3. Step 3

### Expected Behavior

What should happen

### Actual Behavior

What actually happened

### Screenshots

[Paste screenshots]

### Browser/OS

- Browser: [Chrome/Firefox/Safari/Edge + version]
- OS: [Windows/Mac/Linux + version]
- Screen Size: [width × height]

### Console Errors

[Paste any console errors]

### Severity

- [Critical/High/Medium/Low]
```

---

## Completion Checklist

### Feature 1: Help Center

- [ ] Modal opens from header button
- [ ] Modal opens from keyboard shortcut (Ctrl+/)
- [ ] Search filters articles correctly
- [ ] Categories navigate correctly
- [ ] Articles display correctly
- [ ] Back navigation works
- [ ] Related articles show correctly
- [ ] Accessibility (screen reader, keyboard, contrast)
- [ ] Performance (loads quickly)

### Feature 2: Undo/Redo

- [ ] Undo button works (Ctrl+Z)
- [ ] Redo button works (Ctrl+Y)
- [ ] History limit of 50 actions maintained
- [ ] Buttons disable when no history
- [ ] New actions clear redo history
- [ ] Works with save operations
- [ ] Handles long content efficiently
- [ ] No memory leaks

### Feature 3: Form Validation

- [ ] Required field errors show inline
- [ ] Real-time validation works
- [ ] Error clears on valid input
- [ ] Multiple errors show simultaneously
- [ ] Accessibility attributes correct
- [ ] Error messages are clear
- [ ] All major forms validated

### Feature 4: Onboarding

- [ ] Modal shows for new users
- [ ] Steps complete successfully
- [ ] Completion celebration shows
- [ ] Skip option works
- [ ] Restart tour works
- [ ] Returning users don't see onboarding

### Feature 5: Mobile Navigation

- [ ] Bottom nav visible on mobile
- [ ] More sheet opens correctly
- [ ] All views accessible
- [ ] Sheet closes on view selection
- [ ] Proper touch targets (44×44 minimum)

### Performance

- [ ] Initial load <5 seconds on 3G
- [ ] Navigation <1 second
- [ ] No significant memory leaks
- [ ] Bundle sizes acceptable (<5 MB)

### Accessibility

- [ ] Keyboard navigation complete
- [ ] Screen reader compatible
- [ ] Color contrast WCAG AA
- [ ] Focus indicators visible
- [ ] ARIA labels present

### Cross-Browser

- [ ] Chrome: All features working
- [ ] Firefox: All features working
- [ ] Safari: All features working
- [ ] Edge: All features working

---

## Next Steps

### After Testing

1. **Document Results**
   - Update this file with actual results
   - Mark tested features as passing/failing
   - Note any issues found

2. **Report Issues**
   - Create issues in GitHub for any bugs found
   - Include screenshots and reproduction steps
   - Tag with appropriate labels (bug, accessibility, performance)

3. **Generate Test Report**
   - Create test summary
   - Include pass/fail rates
   - Note performance metrics

---

## Notes

### Testing Environment

- Date: \***\*\_\_\_\*\***
- Tester: \***\*\_\_\_\*\***
- Browser Versions:
  - Chrome: \***\*\_\_\_\*\***
  - Firefox: \***\*\_\_\_\*\***
  - Safari: \***\*\_\_\_\*\***
  - Edge: \***\*\_\_\_\*\***
- OS: \***\*\_\_\_\*\***

### General Observations

- [Add any observations during testing]

### Recommendations

- [Add any recommendations based on testing]

---

**Guide Created**: January 23, 2026 **Version**: 1.0 **For Testing Session**:
Manual Feature Testing - Jan 23, 2026
