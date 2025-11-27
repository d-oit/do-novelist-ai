
import { test, expect } from '@playwright/test';
import { setupGeminiMock } from '../utils/mock-gemini';

test.describe('Feature: Persistence', () => {

  test.beforeEach(async ({ page }) => {
    await setupGeminiMock(page);

    // Force Local Storage mode (override env vars in playwright.config.ts)
    await page.addInitScript(() => {
      window.localStorage.setItem('novelist_db_config', JSON.stringify({
        url: '',
        authToken: '',
        useCloud: false
      }));
    });
  });

  test('Local Storage: Retains project data after reload', async ({ page }) => {
    await page.goto('/');

    // 1. Create Project
    await page.getByTestId('wizard-idea-input').fill('Persistence Test');
    await page.getByTestId('wizard-title-input').fill('Saved Book');
    await page.getByTestId('wizard-style-input').fill('Memoir');
    await page.getByTestId('wizard-submit-btn').click();
    await expect(page.getByTestId('project-wizard-overlay')).toBeHidden();

    await expect(page.getByRole('heading', { name: 'Saved Book' })).toBeVisible();

    // 2. Reload Page
    await page.reload();

    // Close wizard if it reappears after reload
    if (await page.getByTestId('project-wizard-overlay').isVisible()) {
      await page.keyboard.press('Escape');
      await expect(page.getByTestId('project-wizard-overlay')).toBeHidden();
    }

    // 3. Navigate to Projects
    await page.getByTestId('nav-projects').click();

    // 4. Verify Project Exists
    // Note: The "Active Session" card should show the last edited project
    await expect(page.getByText('Saved Book')).toBeVisible();

    // 5. Open it
    await page.getByText('Saved Book').first().click();
    await expect(page.getByTestId('overview-panel')).toBeVisible();
    await expect(page.getByText('Persistence Test')).toBeVisible();
  });

  test('Theme: Retains theme preference after reload', async ({ page }) => {
    await page.goto('/');

    // Close wizard to access settings
    if (await page.getByTestId('wizard-cancel-btn').isVisible()) {
      await page.getByTestId('wizard-cancel-btn').click();
    }

    // Switch to Light
    await page.getByTestId('nav-settings').click();
    await page.getByRole('button', { name: 'Light' }).click();
    await expect(page.locator('html')).not.toHaveClass(/dark/);

    // Reload
    await page.reload();

    // Close wizard again if it reappears
    if (await page.getByTestId('project-wizard-overlay').isVisible()) {
      await page.keyboard.press('Escape');
      await expect(page.getByTestId('project-wizard-overlay')).toBeHidden();
    }

    // Verify still Light
    await expect(page.locator('html')).not.toHaveClass(/dark/);
  });

});
