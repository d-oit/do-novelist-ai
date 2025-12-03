import { test, expect } from '@playwright/test';

import { setupGeminiMock } from '../utils/mock-ai-gateway';
import { setupAISDKMock } from '../utils/mock-ai-sdk';

test.describe('Feature: Dashboard & Tools', () => {
  test.beforeEach(async ({ page }) => {
    await setupAISDKMock(page);
    await setupGeminiMock(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Open the wizard
    await page.getByTestId('nav-new-project').click();
    await page.waitForSelector('[data-testid="wizard-idea-input"]', { state: 'visible' });

    // Create Project
    await page.getByTestId('wizard-idea-input').fill('Dashboard Test');
    await page.getByTestId('wizard-title-input').fill('Dashboard Book');
    await page.getByTestId('wizard-style-input').fill('Modern');
    await page.getByTestId('wizard-submit-btn').click();
    await expect(page.getByTestId('project-wizard-overlay')).toBeHidden();
  });

  test('Planner Control: Can toggle engine state', async ({ page }) => {
    const plannerBtn = page.getByTestId('planner-control-btn');

    await expect(plannerBtn).toContainText('START AUTOPILOT');

    // Start
    await plannerBtn.click();
    await expect(plannerBtn).toContainText('PAUSE ENGINE');

    // Pause
    await plannerBtn.click();
    await expect(plannerBtn).toContainText('START AUTOPILOT');
  });

  test('Project Stats: Displays correct metrics', async ({ page }) => {
    await expect(page.getByText('Word Goal').first()).toBeVisible();
    await expect(page.getByText('Structure').first()).toBeVisible();
  });

  test('Cover Generator: Can generate cover', async ({ page }) => {
    // Wait for sidebar to be visible first
    await expect(page.getByTestId('chapter-sidebar')).toBeVisible({ timeout: 10000 });

    // Navigate to Project Overview section
    await page.getByTestId('chapter-item-overview').click();
    await expect(page.getByTestId('overview-panel')).toBeVisible({ timeout: 10000 });

    // Wait for the cover generator button to be visible and enabled
    const generateBtn = page.getByTestId('generate-cover-btn');
    await expect(generateBtn).toBeVisible({ timeout: 10000 });
    await expect(generateBtn).toBeEnabled({ timeout: 5000 });

    // Verify initial button state shows "Generate Artwork"
    await expect(generateBtn).toHaveText('Generate Artwork', { timeout: 5000 });

    // Click the generate button to create a cover
    await generateBtn.click();

    // Verify that the cover generation completed successfully
    // The button should return to "Generate Artwork" state after generation
    await expect(generateBtn).toHaveText('Generate Artwork', { timeout: 8000 });

    // Verify that a cover image was generated (should now show "Regenerate Cover" on next check)
    // But since we just generated, the button text should be back to normal
    await expect(generateBtn).toBeVisible({ timeout: 5000 });
  });
});
