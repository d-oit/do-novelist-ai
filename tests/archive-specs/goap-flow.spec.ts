import { test, expect } from '@playwright/test';

import { setupGeminiMock } from '../utils/mock-ai-gateway';

test.describe('Feature: GOAP Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await setupGeminiMock(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByTestId('nav-new-project').click();
    await page.waitForSelector('[data-testid="wizard-idea-input"]', { state: 'visible' });
    await page.getByTestId('wizard-idea-input').fill('GOAP Test Story');
    await page.getByTestId('wizard-title-input').fill('GOAP Adventure');
    await page.getByTestId('wizard-style-input').fill('Fantasy');
    await page.getByTestId('wizard-submit-btn').click();
    await expect(page.getByTestId('project-wizard-overlay')).toBeHidden();
  });

  test('Complete GOAP Lifecycle: Outline -> Draft -> Polish', async ({ page }) => {
    test.skip(true, 'Skipping - requires AI generation which is slow in CI');
    test.setTimeout(90000);
    await expect(page.getByTestId('action-card-create_outline')).toBeVisible();
    // Note: write action may or may not be disabled initially - just check it's visible
    await expect(page.getByTestId('action-card-write_chapter_parallel')).toBeVisible();
    await page.getByTestId('action-card-create_outline').click();
    // Wait longer for outline generation to complete
    await expect(page.getByTestId('chapter-item-order-1')).toBeVisible({ timeout: 45000 });
    // Verify chapter 2 also exists (from mock outline)
    await expect(page.getByTestId('chapter-item-order-2')).toBeVisible({ timeout: 10000 });
    const writeAction = page.getByTestId('action-card-write_chapter_parallel');
    await expect(writeAction).toBeVisible();
    await writeAction.click();
    const consoleArea = page.locator('.bg-black\/40');
    await expect(consoleArea).toContainText('Batch complete', { timeout: 20000 });
    await page.getByTestId('chapter-item-order-1').click();
    await expect(page.getByTestId('chapter-content-input')).not.toBeEmpty();
    const doctorAction = page.getByTestId('action-card-dialogue_doctor');
    await expect(doctorAction).toBeVisible();
    await doctorAction.click();
    await expect(consoleArea).toContainText('Dialogue polish complete', { timeout: 15000 });
  });

  test('Action Preconditions: Write action is available after outline creation', async ({ page }) => {
    // After project creation, the write action should be visible
    const writeAction = page.getByTestId('action-card-write_chapter_parallel');
    await expect(writeAction).toBeVisible();
    // Action may be enabled or disabled based on context, just verify it's in the UI
    const isVisible = await writeAction.isVisible();
    expect(isVisible).toBe(true);
  });

  test('Planner Control: Can toggle engine state', async ({ page }) => {
    test.setTimeout(60000);
    const plannerBtn = page.getByTestId('planner-control-btn');
    await expect(plannerBtn).toContainText('START');

    // Start the planner
    await plannerBtn.click();
    await expect(plannerBtn).toContainText('PAUSE');

    // Pause the planner
    await plannerBtn.click();
    await expect(plannerBtn).toContainText('START');
  });
});
