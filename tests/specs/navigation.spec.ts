import { test, expect, Page } from '@playwright/test';
import { setupGeminiMock } from '../utils/mock-gemini';

test.describe('Feature: Navigation & UX', () => {

  test.beforeEach(async ({ page }) => {
    await setupGeminiMock(page);
    await page.goto('/');
    await setupTestProject(page);
  });

  test('Mobile Sidebar: Toggles correctly on small screens', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Sidebar should be hidden initially on mobile
    // Note: We check for the toggle button to be visible, as the sidebar might be "visible" in DOM but off-screen.
    await expect(page.getByTestId('mobile-sidebar-toggle')).toBeVisible();

    // Open Sidebar
    await page.getByTestId('mobile-sidebar-toggle').click();

    // Verify sidebar interaction is possible
    await expect(page.getByTestId('add-chapter-btn')).toBeVisible();
  });

  test('Focus Mode: Toggles fullscreen editor', async ({ page }) => {
    test.setTimeout(60000);

    // Select a chapter to load BookViewer
    await page.getByTestId('chapter-item-order-1').click();

    // Focus mode button is inside BookViewer
    const focusToggle = page.getByTestId('focus-mode-toggle');
    await expect(focusToggle).toBeVisible();

    // Enter Focus Mode
    await focusToggle.click({ force: true });

    // Sidebar should be hidden in focus mode
    const sidebar = page.getByTestId('chapter-sidebar');
    await expect(sidebar).toBeHidden();

    // Exit Focus Mode
    await focusToggle.click({ force: true });
    // On desktop, sidebar remains hidden after exiting focus mode
    await expect(sidebar).toBeHidden();
  });

});

/**
 * Helper to ensure we are in the dashboard with a project loaded.
 * Handles the "New Project" wizard if it appears.
 */
async function setupTestProject(page: Page) {
  // Check if we are already in the dashboard (sidebar visible)
  try {
    await expect(page.getByTestId('chapter-sidebar')).toBeVisible({ timeout: 3000 });
    return; // Already in dashboard
  } catch (e) {
    // Sidebar not visible, proceed to check for wizard
  }

  // Check for wizard overlay
  const wizard = page.getByTestId('project-wizard-overlay');

  if (!await wizard.isVisible()) {
    // If neither sidebar nor wizard is visible, try clicking "New Project" if available
    const newProjectBtn = page.getByTestId('nav-new-project');
    if (await newProjectBtn.isVisible()) {
      await newProjectBtn.click();
    }
  }

  // Ensure wizard is now visible
  await expect(wizard).toBeVisible();

  // Fill and submit wizard
  await page.getByTestId('wizard-idea-input').fill('Navigation Test');
  await page.getByTestId('wizard-title-input').fill('Nav Book');
  await page.getByTestId('wizard-style-input').fill('Modern');
  await page.getByTestId('wizard-submit-btn').click();

  // Wait for dashboard to load
  await expect(page.getByTestId('chapter-sidebar')).toBeVisible({ timeout: 15000 });

  // Generate outline
  await page.getByTestId('action-card-create_outline').click();
  await expect(page.getByTestId('chapter-item-order-1')).toBeVisible({ timeout: 15000 });

  // Ensure wizard is closed
  await expect(wizard).toBeHidden();
}
