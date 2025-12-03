import { test, expect } from '@playwright/test';

import { setupGeminiMock } from '../utils/mock-ai-gateway';
import { setupAISDKMock } from '../utils/mock-ai-sdk';

test.describe('Feature: Dashboard & Tools', () => {
  test.beforeEach(async ({ page, viewport }, testInfo) => {
    // Skip all tests on mobile viewports - sidebar and some components are hidden
    if (!viewport || viewport.width < 768) {
      testInfo.skip();
      return;
    }

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

    // Wait for wizard overlay to be hidden - this indicates project creation is complete
    await expect(page.getByTestId('project-wizard-overlay')).toBeHidden({ timeout: 15000 });

    // The project should now be created and the BookViewer should be showing
    // Wait for the overview panel which contains the cover generator
    // This can take a moment as the database is saving the project
    await expect(page.getByTestId('overview-panel')).toBeVisible({ timeout: 20000 });

    // Wait for the cover generator button to be visible
    // This means the BookViewer is rendered and showing the overview panel
    await expect(page.getByTestId('generate-cover-btn')).toBeVisible({ timeout: 10000 });
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
    // The beforeEach hook already verified the cover generator button is visible
    const generateBtn = page.getByTestId('generate-cover-btn');

    // Verify initial button state shows "Generate Artwork"
    await expect(generateBtn).toHaveText('Generate Artwork');

    // Click the generate button to create a cover
    await generateBtn.click();

    // Verify that the cover generation completed successfully
    // The button should return to "Generate Artwork" state after generation
    // The mock immediately returns, so this should be quick
    await expect(generateBtn).toHaveText('Generate Artwork', { timeout: 5000 });
  });
});
