
import { test, expect } from '@playwright/test';
import { setupGeminiMock } from '../utils/mock-gemini';

test.describe('Feature: Publishing Panel', () => {
  
  test.beforeEach(async ({ page }) => {
    await setupGeminiMock(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Create Project
    await page.getByTestId('nav-new-project').click();
    await page.waitForSelector('[data-testid="wizard-idea-input"]', { state: 'visible' });
    await page.getByTestId('wizard-idea-input').fill('Publishing Test');
    await page.getByTestId('wizard-title-input').fill('Book to Export');
    await page.getByTestId('wizard-style-input').fill('Simple');
    await page.getByTestId('wizard-submit-btn').click();
    await expect(page.getByTestId('project-wizard-overlay')).toBeHidden({ timeout: 10000 });

    // Wait for sidebar to be visible
    await expect(page.getByTestId('chapter-sidebar')).toBeVisible({ timeout: 10000 });

    // Navigate to Publish Panel
    await page.getByTestId('chapter-item-publish').click();
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
