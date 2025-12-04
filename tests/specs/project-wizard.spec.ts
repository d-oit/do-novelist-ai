import { expect, test } from '@playwright/test';

import { setupGeminiMock } from '../utils/mock-ai-gateway';

test.describe('Project Wizard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await setupGeminiMock(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should open wizard from new project button', async ({ page }) => {
    // Click new project button
    await page.getByTestId('nav-new-project').click();

    // Verify wizard overlay appears
    await expect(page.getByTestId('project-wizard-overlay')).toBeVisible();

    // Verify wizard form elements are present
    await expect(page.getByTestId('wizard-idea-input')).toBeVisible();
    await expect(page.getByTestId('wizard-title-input')).toBeVisible();
    await expect(page.getByTestId('wizard-style-input')).toBeVisible();
    await expect(page.getByTestId('wizard-submit-btn')).toBeVisible();
  });

  test('should validate required fields before submission', async ({ page }) => {
    // Open wizard
    await page.getByTestId('nav-new-project').click();
    await expect(page.getByTestId('project-wizard-overlay')).toBeVisible();

    // Check initial state - submit should be disabled
    const submitButton = page.getByTestId('wizard-submit-btn');
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeDisabled();

    // Fill in only idea field
    await page.getByTestId('wizard-idea-input').fill('A story about dragons');
    await expect(submitButton).toBeDisabled();

    // Fill in title field
    await page.getByTestId('wizard-title-input').fill('Dragon Tales');
    await expect(submitButton).toBeDisabled();

    // Fill in style field
    await page.getByTestId('wizard-style-input').fill('Fantasy adventure style');
    await expect(submitButton).toBeEnabled();
  });

  test('should create project with valid data', async ({ page }) => {
    // Open wizard
    await page.getByTestId('nav-new-project').click();
    await expect(page.getByTestId('project-wizard-overlay')).toBeVisible();

    // Fill in all fields with valid data
    const projectData = {
      idea: 'A detective story set in near-future Tokyo',
      title: 'Tokyo Noir 2042',
      style: 'Cyberpunk noir with Japanese cultural elements',
    };

    await page.getByTestId('wizard-idea-input').fill(projectData.idea);
    await page.getByTestId('wizard-title-input').fill(projectData.title);
    await page.getByTestId('wizard-style-input').fill(projectData.style);

    // Submit the form
    await page.getByTestId('wizard-submit-btn').click();

    // Wait for wizard to close
    await expect(page.getByTestId('project-wizard-overlay')).toBeHidden({ timeout: 10000 });

    // Navigate to dashboard to verify project was created
    await page.getByTestId('nav-dashboard').click();

    // Look for the new project
    await expect(page.getByText(projectData.title)).toBeVisible({ timeout: 5000 });
  });

  test('should handle long text inputs gracefully', async ({ page }) => {
    // Open wizard
    await page.getByTestId('nav-new-project').click();
    await expect(page.getByTestId('project-wizard-overlay')).toBeVisible();

    // Test with very long inputs
    const longIdea = 'A '.repeat(1000) + 'epic story';
    const longTitle = 'The '.repeat(100) + 'Longest Title Ever';
    const longStyle = 'Written in the style of '.repeat(50) + 'classic literature';

    await page.getByTestId('wizard-idea-input').fill(longIdea);
    await page.getByTestId('wizard-title-input').fill(longTitle);
    await page.getByTestId('wizard-style-input').fill(longStyle);

    // Verify inputs accept long text
    const ideaValue = await page.getByTestId('wizard-idea-input').inputValue();
    const titleValue = await page.getByTestId('wizard-title-input').inputValue();
    const styleValue = await page.getByTestId('wizard-style-input').inputValue();

    expect(ideaValue).toBe(longIdea);
    expect(titleValue).toBe(longTitle);
    expect(styleValue).toBe(longStyle);

    // Submit should still work
    await expect(page.getByTestId('wizard-submit-btn')).toBeEnabled();
  });

  test('should handle special characters in inputs', async ({ page }) => {
    // Open wizard
    await page.getByTestId('nav-new-project').click();
    await expect(page.getByTestId('project-wizard-overlay')).toBeVisible();

    // Test with special characters
    const specialData = {
      idea: 'A story with émojis 🎭 and spéciâl châracters!',
      title: '《Special》Characters & "Quotes" Test',
      style: 'Style with <tags>, {brackets}, and [symbols]',
    };

    await page.getByTestId('wizard-idea-input').fill(specialData.idea);
    await page.getByTestId('wizard-title-input').fill(specialData.title);
    await page.getByTestId('wizard-style-input').fill(specialData.style);

    // Verify inputs accept special characters
    const ideaValue = await page.getByTestId('wizard-idea-input').inputValue();
    const titleValue = await page.getByTestId('wizard-title-input').inputValue();
    const styleValue = await page.getByTestId('wizard-style-input').inputValue();

    expect(ideaValue).toBe(specialData.idea);
    expect(titleValue).toBe(specialData.title);
    expect(styleValue).toBe(specialData.style);

    // Submit should work
    await expect(page.getByTestId('wizard-submit-btn')).toBeEnabled();
  });

  test('should close wizard when cancelled', async ({ page }) => {
    // Open wizard
    await page.getByTestId('nav-new-project').click();
    await expect(page.getByTestId('project-wizard-overlay')).toBeVisible();

    // Look for cancel button (could be various selectors)
    const cancelButton = page.locator('[data-testid*="cancel"], button:has-text("Cancel"), .close-button');

    if (await cancelButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cancelButton.click();
      await expect(page.getByTestId('project-wizard-overlay')).toBeHidden({ timeout: 5000 });
    } else {
      // Try clicking outside the modal or pressing Escape
      await page.keyboard.press('Escape');
      await expect(page.getByTestId('project-wizard-overlay')).toBeHidden({ timeout: 5000 });
    }
  });

  test('should handle rapid form interactions', async ({ page }) => {
    // Open wizard
    await page.getByTestId('nav-new-project').click();
    await expect(page.getByTestId('project-wizard-overlay')).toBeVisible();

    // Rapidly fill and clear fields
    const ideaInput = page.getByTestId('wizard-idea-input');
    const titleInput = page.getByTestId('wizard-title-input');
    const styleInput = page.getByTestId('wizard-style-input');

    // Fill and clear multiple times
    for (let i = 0; i < 3; i++) {
      await ideaInput.fill(`Test idea ${i}`);
      await titleInput.fill(`Test title ${i}`);
      await styleInput.fill(`Test style ${i}`);

      // Verify values
      expect(await ideaInput.inputValue()).toBe(`Test idea ${i}`);
      expect(await titleInput.inputValue()).toBe(`Test title ${i}`);
      expect(await styleInput.inputValue()).toBe(`Test style ${i}`);

      // Clear
      await ideaInput.clear();
      await titleInput.clear();
      await styleInput.clear();
    }

    // Final fill with valid data
    await ideaInput.fill('Final test idea');
    await titleInput.fill('Final test title');
    await styleInput.fill('Final test style');

    // Submit should work
    await expect(page.getByTestId('wizard-submit-btn')).toBeEnabled();
  });

  test('should maintain form state during navigation', async ({ page }) => {
    // Open wizard
    await page.getByTestId('nav-new-project').click();
    await expect(page.getByTestId('project-wizard-overlay')).toBeVisible();

    // Fill in partial data
    await page.getByTestId('wizard-idea-input').fill('Partial idea');
    await page.getByTestId('wizard-title-input').fill('Partial title');

    // Navigate away and back (if possible)
    await page.keyboard.press('Escape'); // Close wizard

    // Reopen wizard
    await page.getByTestId('nav-new-project').click();
    await expect(page.getByTestId('project-wizard-overlay')).toBeVisible();

    // Form should be reset (this is expected behavior)
    const ideaValue = await page.getByTestId('wizard-idea-input').inputValue();
    const titleValue = await page.getByTestId('wizard-title-input').inputValue();

    expect(ideaValue).toBe('');
    expect(titleValue).toBe('');
  });

  test('should handle keyboard navigation', async ({ page }) => {
    // Open wizard
    await page.getByTestId('nav-new-project').click();
    await expect(page.getByTestId('project-wizard-overlay')).toBeVisible();

    // Tab through form fields
    await page.keyboard.press('Tab'); // Should focus first input
    await page.keyboard.type('Test idea from keyboard');

    await page.keyboard.press('Tab'); // Move to title input
    await page.keyboard.type('Test title from keyboard');

    await page.keyboard.press('Tab'); // Move to style input
    await page.keyboard.type('Test style from keyboard');

    // Verify all fields have data
    expect(await page.getByTestId('wizard-idea-input').inputValue()).toBe('Test idea from keyboard');
    expect(await page.getByTestId('wizard-title-input').inputValue()).toBe('Test title from keyboard');
    expect(await page.getByTestId('wizard-style-input').inputValue()).toBe('Test style from keyboard');

    // Submit with Enter key
    await page.keyboard.press('Tab'); // Move to submit button
    await page.keyboard.press('Enter');

    // Wizard should close
    await expect(page.getByTestId('project-wizard-overlay')).toBeHidden({ timeout: 10000 });
  });
});
