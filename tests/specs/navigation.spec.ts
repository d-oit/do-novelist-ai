import { test, expect, Page } from '@playwright/test';

import { setupGeminiMock } from '../utils/mock-ai-gateway';

test.describe('Feature: Navigation & UX', () => {
  test.beforeEach(async ({ page }) => {
    await setupGeminiMock(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await setupTestProject(page);
  });

  test('Mobile Sidebar: Toggles correctly on small screens', async ({ page }) => {
    test.setTimeout(30000);

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
    await expect(page.getByTestId('chapter-sidebar')).toBeVisible({ timeout: 2000 });
    // Verify we have chapters
    try {
      await expect(page.getByTestId('chapter-item-order-1')).toBeVisible({ timeout: 1000 });
      return; // Already in dashboard with chapters
    } catch (_e) {
      // Sidebar visible but no chapters, proceed to create outline
    }
  } catch (_e) {
    // Sidebar not visible, proceed to check for wizard
  }

  // Check for wizard overlay
  const wizard = page.getByTestId('project-wizard-overlay');

  // Wait for wizard to appear or check if it's already visible
  const wizardVisible = await wizard.isVisible().catch(() => false);

  if (!wizardVisible) {
    // Try clicking "New Project" if available
    const newProjectBtn = page.getByTestId('nav-new-project');
    if (await newProjectBtn.isVisible().catch(() => false)) {
      await newProjectBtn.click();
    }
    // Wait for wizard to appear after button click
    await page.waitForSelector('[data-testid="project-wizard-overlay"]', { state: 'visible', timeout: 5000 });
  }

  // Wait for wizard form fields to be loaded
  await page.waitForSelector('[data-testid="wizard-idea-input"]', { state: 'visible', timeout: 5000 });

  // Fill and submit wizard
  await page.getByTestId('wizard-idea-input').fill('Navigation Test');
  await page.getByTestId('wizard-title-input').fill('Nav Book');
  await page.getByTestId('wizard-style-input').fill('Modern');
  await page.getByTestId('wizard-submit-btn').click();

  // Wait for wizard to close (check that it's no longer visible)
  await expect(wizard).toBeHidden({ timeout: 5000 });

  // Wait for sidebar to appear after wizard closes
  const sidebar = page.getByTestId('chapter-sidebar');
  await expect(sidebar).toBeVisible({ timeout: 8000 });

  // Generate outline - click the action card
  const createOutlineBtn = page.getByTestId('action-card-create_outline');
  await expect(createOutlineBtn).toBeEnabled({ timeout: 5000 });
  await createOutlineBtn.click();

  // Wait for action to complete by checking console log for success message
  const consoleArea = page.locator('.bg-black\\/40');
  await expect(consoleArea).toContainText('Outline generated', { timeout: 20000 });

  // Wait for chapter items to appear
  await expect(page.getByTestId('chapter-item-order-1')).toBeVisible({ timeout: 10000 });
}
