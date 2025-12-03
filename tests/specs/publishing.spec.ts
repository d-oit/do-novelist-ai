import { test, expect } from '@playwright/test';

import { setupGeminiMock } from '../utils/mock-ai-gateway';
import { setupAISDKMock } from '../utils/mock-ai-sdk';

test.describe('Feature: Publishing Panel', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000); // Extended timeout for setup
    await setupAISDKMock(page);
    await setupGeminiMock(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Open the wizard
    await page.getByTestId('nav-new-project').click();
    await page.waitForSelector('[data-testid="wizard-idea-input"]', { state: 'visible' });

    // Setup: Create a project quickly
    await page.getByTestId('wizard-idea-input').fill('Publishing Test Book');
    await page.getByTestId('wizard-title-input').fill('Book to Export');
    await page.getByTestId('wizard-style-input').fill('Simple Fiction');
    await page.getByTestId('wizard-submit-btn').click();
    await expect(page.getByTestId('project-wizard-overlay')).toBeHidden();

    // Wait a moment for the project to be fully loaded
    await page.waitForTimeout(500);

    // Wait for dashboard to be visible - first wait for sidebar to be in DOM
    await page.waitForSelector('[data-testid="chapter-sidebar"]', { state: 'attached', timeout: 10000 });

    // On mobile, open the sidebar if it's hidden
    const mobileToggle = page.getByTestId('mobile-sidebar-toggle');
    if (await mobileToggle.isVisible().catch(() => false)) {
      await mobileToggle.click();
      await page.waitForTimeout(300);
    }

    // Navigate to Publish Panel directly (doesn't require chapters)
    await page.getByTestId('chapter-item-publish').click();

    // Wait for publish panel to load
    await expect(page.getByTestId('publish-status-select')).toBeVisible({ timeout: 5000 });
  });

  test('Can modify manuscript metadata', async ({ page }) => {
    // Change Status
    const statusSelect = page.getByTestId('publish-status-select');
    await statusSelect.selectOption('Editing');
    await expect(statusSelect).toHaveValue('Editing');

    // Change Language
    const langSelect = page.getByTestId('publish-language-select');
    await langSelect.selectOption('French');
    await expect(langSelect).toHaveValue('French');

    // Change Word Count Target
    const wordInput = page.getByTestId('publish-target-words-input');
    await wordInput.fill('75000');
    await expect(wordInput).toHaveValue('75000');
  });

  test('Can toggle export options', async ({ page }) => {
    const dropCapsCheckbox = page.getByTestId('export-dropcaps-checkbox');

    // Default is Checked
    await expect(dropCapsCheckbox).toBeChecked();

    // Toggle Off
    await dropCapsCheckbox.click();
    await expect(dropCapsCheckbox).not.toBeChecked();
  });

  test('Export button is available', async ({ page }) => {
    const exportBtn = page.getByTestId('export-epub-btn');
    await expect(exportBtn).toBeVisible();
    await expect(exportBtn).toBeEnabled();
  });
});
