
import { test, expect } from '@playwright/test';
import { setupGeminiMock } from '../utils/mock-gemini';

test.describe('Feature: Dashboard & Tools', () => {

  test.beforeEach(async ({ page }) => {
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
    // Navigate to Overview (default, but ensuring)
    // Wait for sidebar to be visible first
    await expect(page.getByTestId('chapter-sidebar')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('chapter-item-overview').click();

    const generateBtn = page.getByTestId('generate-cover-btn');
    await expect(generateBtn).toBeVisible({ timeout: 10000 });

    await generateBtn.click();
    await expect(generateBtn).toHaveText('Generating...');
    await expect(generateBtn).toHaveText('Generate Artwork', { timeout: 10000 });
  });

});
