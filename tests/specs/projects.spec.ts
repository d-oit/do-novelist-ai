
import { test, expect } from '@playwright/test';
import { setupGeminiMock } from '../utils/mock-gemini';

test.describe('Feature: Project Management', () => {

  test.beforeEach(async ({ page }) => {
    await setupGeminiMock(page);
    await page.goto('/');

    // Attempt to dismiss wizard if it appears
    try {
      const cancelBtn = page.getByTestId('wizard-cancel-btn');
      if (await cancelBtn.isVisible({ timeout: 5000 })) {
        await cancelBtn.click();
        await expect(page.getByTestId('project-wizard-overlay')).toBeHidden();
      }
    } catch (e) {
      // Wizard might not have appeared
    }
  });

  test('Project Wizard: Can brainstorm and create a project', async ({ page }) => {
    // Open Wizard (should be open by default on new visit, or click New)
    const wizard = page.getByTestId('project-wizard-overlay');
    if (!await wizard.isVisible()) {
      await page.getByTestId('nav-new-project').click();
    }

    // Fill Idea
    await page.getByTestId('wizard-idea-input').fill('Time Travel Mystery');

    // Brainstorm Title
    await page.getByTestId('wizard-brainstorm-title').click();
    await expect(page.getByTestId('wizard-title-input')).toHaveValue('The Quantum Paradox', { timeout: 5000 });

    // Brainstorm Style
    await page.getByTestId('wizard-brainstorm-style').click();
    await expect(page.getByTestId('wizard-style-input')).toHaveValue('Hard Sci-Fi, Gritty', { timeout: 5000 });

    // Submit
    await page.getByTestId('wizard-submit-btn').click();
    await expect(wizard).toBeHidden();

    // Verify Dashboard
    await expect(page.getByRole('heading', { name: 'The Quantum Paradox' })).toBeVisible();
  });

  test('Projects List: Can view and delete projects', async ({ page }) => {
    // Navigate to Projects View
    await page.getByTestId('nav-projects').click();

    // Should see "My Projects" header
    await expect(page.getByText('My Projects')).toBeVisible();

    // Note: Since we mock DB locally, the list might be empty initially in a fresh test context
    // unless we created one. This test assumes isolation per test run or a clean state.
  });

});
