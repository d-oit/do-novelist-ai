# E2E Test Migration Strategy

## Overview

This document outlines the strategy for migrating all 42 E2E tests to use
research-backed Playwright patterns for reliable, maintainable testing.

## Current Test Inventory

### ✅ Working Tests (3 test files)

- `mock-validation.spec.ts` - Infrastructure validation (9 tests across 3
  browsers)
- `debug.spec.ts` - Debug test patterns (currently being used)

### 🔄 Migration Required (9 test files)

#### High Priority (Core User Workflows)

1. **`accessibility.spec.ts`** - WCAG 2.1 AA compliance testing
   - **Complexity**: Medium
   - **Dependencies**: axe-core, React components
   - **Pattern**: Role-based selectors + web-first assertions
   - **Estimation**: 4-6 hours

2. **`settings.spec.ts`** - Settings panel navigation and functionality
   - **Complexity**: High (navigation issues identified)
   - **Dependencies**: React state management, routing
   - **Pattern**: Enhanced navigation helpers + app state validation
   - **Estimation**: 6-8 hours

3. **`project-management.spec.ts`** - Core project CRUD operations
   - **Complexity**: Medium
   - **Dependencies**: Database operations, React state
   - **Pattern**: Role-based interactions + data validation
   - **Estimation**: 4-6 hours

#### Medium Priority (User Features)

4. **`ai-generation.spec.ts`** - AI-powered content generation
   - **Complexity**: High
   - **Dependencies**: AI gateway, network mocking
   - **Pattern**: Enhanced mocking + async content validation
   - **Estimation**: 6-8 hours

5. **`project-wizard.spec.ts`** - New project creation workflow
   - **Complexity**: Medium
   - **Dependencies**: Form handling, navigation
   - **Pattern**: Form validation + navigation flows
   - **Estimation**: 4-6 hours

6. **`publishing.spec.ts`** - EPUB export and publishing features
   - **Complexity**: High
   - **Dependencies**: File generation, download handling
   - **Pattern**: File operations + content validation
   - **Estimation**: 6-8 hours

#### Lower Priority (Advanced Features)

7. **`versioning.spec.ts`** - Version history and rollback
   - **Complexity**: Medium
   - **Dependencies**: Data persistence, state management
   - **Pattern**: Data validation + state transitions
   - **Estimation**: 4-6 hours

8. **`world-building.spec.ts`** - Content creation and world management
   - **Complexity**: High
   - **Dependencies**: AI generation, content editing
   - **Pattern**: Complex content workflows + validation
   - **Estimation**: 6-8 hours

## Research-Backed Migration Patterns

### 1. Role-Based Locator Migration

**Before (CSS selectors - brittle):**

```typescript
await page.locator('div.settings-container button.save-btn').click();
await page.locator('[data-testid="nav-dashboard"]').click();
```

**After (Role-based - resilient):**

```typescript
await page.getByRole('button', { name: /save settings/i }).click();
await page.getByTestId('nav-dashboard').click();
```

### 2. Web-First Assertions Migration

**Before (Manual assertions - timing issues):**

```typescript
const isVisible = await page.locator('.loading-spinner').isVisible();
expect(isVisible).toBe(true);
```

**After (Web-first assertions - automatic waiting):**

```typescript
await expect(page.locator('.loading-spinner')).toBeVisible();
```

### 3. Per-Test Setup Pattern Migration

**Before (Global setup - context closure risk):**

```typescript
test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  // Complex setup causing issues
});
```

**After (Per-test setup - stable):**

```typescript
test.beforeEach(async ({ page }) => {
  await React.setupReactApp(page);
});
```

### 4. Enhanced Navigation Pattern

**Before (Simple navigation - timing issues):**

```typescript
await page.getByTestId('nav-settings').click();
await expect(page.getByTestId('settings-view')).toBeVisible();
```

**After (Enhanced navigation with fallbacks):**

```typescript
await React.navigateToSettings(page);
// Or with manual implementation
await NavigationHelpers.safeNavigateTo(page, 'settings');
```

## Migration Tools and Utilities

### 1. Test Helper Classes

```typescript
// React-specific utilities
import {
  ReactTestHelpers,
  NavigationHelpers,
  AccessibilityHelpers,
} from '../utils/test-helpers';

// Usage in tests
await React.setupReactApp(page);
await NavigationHelpers.safeNavigateTo(page, 'settings');
await AccessibilityHelpers.checkKeyboardNavigation(page);
```

### 2. Enhanced AI Gateway Mocking

```typescript
// Comprehensive AI mocking
import { setupGeminiMock } from '../utils/mock-ai-gateway';

// Usage in tests
test.beforeEach(async ({ page }) => {
  await setupGeminiMock(page);
});
```

### 3. Test Data Factories

```typescript
// Consistent test data
import { TestDataFactory } from '../utils/fixtures';

// Usage in tests
const testProject = TestDataFactory.createTestProject();
const testChapter = TestDataFactory.createTestChapter();
```

## Implementation Steps

### Phase 1: Critical Bug Fixes (Immediate)

1. **Fix Settings Navigation** - Update `settings.spec.ts` to use enhanced
   navigation
2. **Validate Infrastructure** - Ensure all test helpers work correctly
3. **Create Migration Templates** - Standardize migration patterns

### Phase 2: High Priority Migrations (Week 1)

1. **`settings.spec.ts`** - Fix navigation and test all settings features
2. **`accessibility.spec.ts`** - Convert to role-based selectors
3. **`project-management.spec.ts`** - Migrate CRUD operations

### Phase 3: Medium Priority Migrations (Week 2)

1. **`ai-generation.spec.ts`** - Enhanced AI mocking
2. **`project-wizard.spec.ts`** - Form workflow testing
3. **`publishing.spec.ts`** - File generation testing

### Phase 4: Advanced Features (Week 3)

1. **`versioning.spec.ts`** - Data persistence testing
2. **`world-building.spec.ts`** - Complex workflow testing

## Quality Gates

### For Each Migration:

- [ ] All tests pass with new patterns
- [ ] No regression in functionality
- [ ] Performance maintained or improved
- [ ] Code follows established patterns
- [ ] Documentation updated

### Success Criteria:

- **42/42 tests passing** (100% success rate)
- **Zero browser context closure errors**
- **Multi-browser compatibility maintained**
- **Improved test execution speed**
- **Enhanced test maintainability**

## Rollback Strategy

If migration causes issues:

1. **Immediate**: Revert to previous patterns for critical tests
2. **Gradual**: Fix issues incrementally
3. **Validation**: Re-test each migration step

## Future Maintenance

### Code Quality:

- Regular pattern reviews
- New feature test patterns
- Performance optimization

### Documentation:

- Keep migration guide updated
- Document new patterns discovered
- Share learnings across team

---

**Migration Timeline**: 3 weeks **Estimated Total Effort**: 40-60 hours
**Expected Outcome**: 100% test reliability and maintainability
