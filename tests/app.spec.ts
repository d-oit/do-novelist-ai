
import { test, expect } from '@playwright/test';
import { setupGeminiMock } from './utils/mock-gemini';

test.describe('Smoke Test: Critical User Journey', () => {
  
  test.beforeEach(async ({ page }) => {
    await setupGeminiMock(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Open the wizard
    await page.getByTestId('nav-new-project').click();
    await page.waitForSelector('[data-testid="wizard-idea-input"]', { state: 'visible' });
  });

  test('End-to-End Flow: Wizard -> Outline -> Export', async ({ page }) => {
    test.setTimeout(60000); // Extend for full flow

    // 1. Wizard
    await page.getByTestId('wizard-idea-input').fill('Smoke Test Idea');
    await page.getByTestId('wizard-title-input').fill('Smoke Test Title');
    await page.getByTestId('wizard-style-input').fill('Smoke Style');
    await page.getByTestId('wizard-submit-btn').click();

    // 2. Outline
    await page.getByTestId('action-card-create_outline').click();
    await expect(page.getByTestId('chapter-item-order-1')).toBeVisible({ timeout: 15000 });

    // 3. Verify Editor Load
    await page.getByTestId('chapter-item-order-1').click();
    await expect(page.getByTestId('chapter-editor')).toBeVisible();

    // 4. Verify Export Access
    await page.getByTestId('chapter-item-publish').click();
    await expect(page.getByTestId('export-epub-btn')).toBeVisible();
  });

});
