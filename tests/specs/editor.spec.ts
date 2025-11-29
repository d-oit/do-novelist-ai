
import { test, expect } from '@playwright/test';
import { setupGeminiMock } from '../utils/mock-gemini';

test.describe('Feature: Book Editor', () => {

  test.beforeEach(async ({ page }) => {
    await setupGeminiMock(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Open the wizard
    await page.getByTestId('nav-new-project').click();
    await page.waitForSelector('[data-testid="wizard-idea-input"]', { state: 'visible' });

    // Setup: Create a project quickly
    await page.getByTestId('wizard-idea-input').fill('Test Book');
    await page.getByTestId('wizard-title-input').fill('Test Title');
    await page.getByTestId('wizard-style-input').fill('Test Style');
    await page.getByTestId('wizard-submit-btn').click();
    await expect(page.getByTestId('project-wizard-overlay')).toBeHidden();

    // Generate Outline to get chapters
    await page.getByTestId('action-card-create_outline').click();

    // Wait for action to complete by checking console log
    const consoleArea = page.locator('.bg-black\\/40');
    await expect(consoleArea).toContainText('Outline created', { timeout: 30000 });

    // Now wait for chapter items to appear
    await expect(page.getByTestId('chapter-item-order-1')).toBeVisible({ timeout: 30000 });
  });

  test('Editor: Can navigate chapters and edit content', async ({ page }) => {
    // Select Chapter 1
    await page.getByTestId('chapter-item-order-1').click();
    await expect(page.getByTestId('chapter-editor')).toBeVisible();

    // Edit Summary
    await page.getByTestId('chapter-summary-input').fill('New Summary');

    // Edit Content
    const contentInput = page.getByTestId('chapter-content-input');
    await contentInput.fill('Manual content entry.');

    // Check Auto-save indicator (it pulses then goes solid)
    const saveStatus = page.getByTestId('save-status-indicator');
    await expect(saveStatus).toBeVisible();
    // Wait for debounce
    await page.waitForTimeout(3500);
    await expect(saveStatus).toContainText('Saved');
  });

  test('Editor: Can use AI Tools (Refine & Continue)', async ({ page }) => {
    await page.getByTestId('chapter-item-order-1').click();
    await page.getByTestId('chapter-content-input').fill('Draft content.');
    await page.getByTestId('chapter-content-input').blur();
    await page.waitForTimeout(1000);

    // Refine
    const refineBtn = page.getByTestId('refine-chapter-btn');
    await expect(refineBtn).toBeEnabled();
    await refineBtn.click();
    await expect(page.getByTestId('chapter-content-input')).toContainText('# Refined Content');

    // Continue
    const continueBtn = page.getByTestId('continue-chapter-btn');
    await expect(continueBtn).toBeEnabled();
    await continueBtn.click();
    // Should append text
    await expect(page.getByTestId('chapter-content-input')).toContainText('# Generated Content');
  });

  test('Editor: Can add new chapter manually', async ({ page }) => {
    const initialCount = await page.getByTestId(/^chapter-item-order-/).count();
    await page.getByTestId('add-chapter-btn').click();
    const newCount = await page.getByTestId(/^chapter-item-order-/).count();
    expect(newCount).toBeGreaterThan(initialCount);
  });

});
