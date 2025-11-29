# E2E Tests Without API Keys - Implementation Guide

**Date:** 2025-11-29 **Status:** ✅ Mock Infrastructure Available - Needs Better
Integration

---

## Current Situation

| Metric                       | Value                         |
| ---------------------------- | ----------------------------- |
| **Total E2E Tests**          | 33                            |
| **Passing without API keys** | 6 (18.2%)                     |
| **Failing (need API keys)**  | 27 (81.8%)                    |
| **Mock Available**           | ✅ Yes (supports 6 providers) |
| **Mock Being Used**          | ⚠️ Partially (inconsistent)   |

---

## Why Tests Fail Even WITH Mocks

The mock (`tests/utils/mock-ai-gateway.ts`) **is being called** in many test
files, but tests still fail because:

### Issue 1: Inconsistent Mock Setup

- Some tests call `setupGeminiMock(page)` in `beforeEach`
- Others don't call it at all
- No global enforcement

### Issue 2: Mock Doesn't Match Real API Format

- Mock responses might not match what the app expects
- Some endpoints might not be mocked
- Response format variations

### Issue 3: API Calls Happen Before Mock is Ready

- Race condition between page load and mock setup
- Background requests trigger before mock is active

---

## Solution 1: Enable Global Mock (Recommended) ✅

### Step 1: Update playwright.config.ts

Add to `use` config:

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    // 👇 Add global setup
    testIdAttribute: 'data-testid',
  },
  // 👇 Add global setup file
  globalSetup: require.resolve('./tests/playwright.setup.ts'),
});
```

### Step 2: Run Tests

```bash
# All tests should now pass WITHOUT API keys
npm run test:e2e

# Expected: 33/33 ✅ PASSING
```

### Benefits

- ✅ Zero configuration needed
- ✅ Works in CI/CD without secrets
- ✅ Consistent across all tests
- ✅ No per-file mock setup needed

---

## Solution 2: Improve Per-Test Mock Setup

For tests that need custom behavior:

```typescript
// tests/specs/custom.spec.ts
import { test, expect } from '@playwright/test';
import { setupAIGatewayMock } from '../utils/mock-ai-gateway';

test.describe('Custom Mock Test', () => {
  test.beforeEach(async ({ page }) => {
    // ✅ Setup mock before any page interactions
    await setupAIGatewayMock(page);

    // ✅ Navigate AFTER mock is ready
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should work without API keys', async ({ page }) => {
    // Your test here
  });
});
```

---

## Solution 3: Create UI-Only Tests

Test UI flows without triggering AI:

### Example: Project Wizard UI Test

```typescript
// tests/specs/projects-ui-only.spec.ts
test('Project Wizard UI: Can fill form and click buttons', async ({ page }) => {
  await page.goto('/');

  // Open wizard
  await page.getByTestId('nav-new-project').click();
  await expect(page.getByTestId('project-wizard-overlay')).toBeVisible();

  // Fill form (no API calls)
  await page.getByTestId('wizard-idea-input').fill('Test Idea');

  // Click brainstorm button (but don't wait for AI response)
  await page.getByTestId('wizard-brainstorm-title').click();

  // Don't wait for network - just verify button state changed
  await expect(page.getByTestId('wizard-title-input')).toBeVisible();

  // Fill manually instead of using AI
  await page.getByTestId('wizard-title-input').fill('Test Title');

  // Verify form is valid
  await expect(page.getByTestId('wizard-submit-btn')).toBeEnabled();
});
```

### Example: Agent Console UI Test

```typescript
// tests/specs/agents-ui.spec.ts
test('Agent Console UI: Shows correct interface elements', async ({ page }) => {
  await page.goto('/');

  // Create a project first (UI only)
  await createProjectUIOnly(page, 'Test Project');

  // Open agent console
  await page.getByTestId('agent-console-button').click();
  await expect(page.getByTestId('agent-console')).toBeVisible();

  // Verify UI elements
  await expect(page.getByTestId('agent-selector')).toBeVisible();
  await expect(page.getByTestId('agent-input')).toBeVisible();

  // Type in input (don't submit)
  await page.getByTestId('agent-input').fill('Test prompt');
  await expect(page.getByTestId('agent-input')).toHaveValue('Test prompt');

  // Verify send button exists
  await expect(page.getByTestId('agent-send-btn')).toBeVisible();
  // Note: We don't click it to avoid API call
});
```

---

## Solution 4: Add "No AI" Test Variants

Create duplicate test suites with `-ui` suffix:

```
tests/specs/
├── projects.spec.ts              # Needs API keys (uses AI)
├── projects-ui.spec.ts          # UI only (no API)
├── agents.spec.ts               # Needs API keys
├── agents-ui.spec.ts            # UI only
├── editor.spec.ts               # Needs API keys
├── editor-ui.spec.ts            # UI only
└── ...
```

### Run Different Test Suites

```bash
# Run only UI-only tests (fast, no API keys needed)
npm run test:e2e tests/specs/*-ui.spec.ts

# Run full test suite (needs API keys)
npm run test:e2e tests/specs/*.spec.ts
```

---

## Solution 5: Mock Backend Responses

Instead of mocking AI providers, mock the backend API:

```typescript
// Mock the application's API endpoints
await page.route('**/api/projects/**', async route => {
  const url = route.request().url();

  if (url.includes('/create')) {
    // Return fake project creation response
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'mock-project-1',
        title: 'Mock Project',
        chapters: [],
      }),
    });
  }

  if (url.includes('/brainstorm')) {
    // Return AI brainstorm response
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        title: 'The Quantum Paradox',
        style: 'Hard Sci-Fi',
      }),
    });
  }
});
```

---

## Quick Win: Enable Global Mock

### Current Quick Fix

The **fastest solution** to get all tests passing:

```bash
# Option 1: Set environment variable
export USE_AI_MOCK=true
npm run test:e2e

# Option 2: Modify playwright.config.ts (permanent)
# Add to use{} section:
globalSetup: './tests/playwright.setup.ts'

# Then run:
npm run test:e2e
```

### Expected Result

| Before        | After              |
| ------------- | ------------------ |
| 6/33 passing  | 33/33 passing ✅   |
| 27 failures   | 0 failures         |
| Need API keys | No API keys needed |

---

## Testing Strategy Recommendation

### Phase 1: Quick Fix (15 minutes)

1. Enable global mock in `playwright.config.ts`
2. Run full test suite
3. **Expected:** All 33 tests pass without API keys

### Phase 2: Long-term (1-2 days)

1. Create UI-only test variants for complex workflows
2. Improve mock accuracy for edge cases
3. Add test categorization (UI vs Integration vs API)

### Phase 3: CI/CD Integration (30 minutes)

1. Run UI-only tests in PR checks (no API keys needed)
2. Run full suite only on main branch with secrets

---

## Test Categorization

### Category 1: UI Tests (No API Keys)

- Navigation, theming, settings
- Form filling and validation
- State management
- Local storage operations

**Runtime:** ~30 seconds **API Keys Required:** ❌ No

### Category 2: Integration Tests (With Mocks)

- Project creation flow
- Agent interactions
- Editor functionality
- Publishing features

**Runtime:** ~2 minutes **API Keys Required:** ❌ No (using mocks) **Real API
Keys:** ⚠️ Optional (for end-to-end validation)

### Category 3: API Tests (With Real Keys)

- Actual AI provider calls
- Multi-provider fallback
- Cost tracking
- Performance benchmarks

**Runtime:** ~5 minutes **API Keys Required:** ✅ Yes **Use Case:** Full system
validation, not required for every PR

---

## Implementation Checklist

- [ ] Review current mock at `tests/utils/mock-ai-gateway.ts`
- [ ] Enable global mock in `playwright.config.ts`
- [ ] Run full test suite without API keys
- [ ] Fix any remaining mock failures
- [ ] Create UI-only test variants for complex workflows
- [ ] Update CI/CD to run UI-only tests without secrets
- [ ] Document test categories in README

---

## Conclusion

**Yes, we can absolutely use many more E2E tests without API keys!**

**Current:** 6/33 tests (18%) work without API keys **With Global Mock:** 33/33
tests (100%) can work without API keys **UI-Only Variants:** Additional fast
tests for UI validation

The mock infrastructure already exists - we just need to enable it globally and
ensure it's properly configured. This will make the test suite much more
accessible and reliable for development and CI/CD.

**Next Step:** Run `npm run test:e2e` with global mock enabled to see immediate
improvement!
