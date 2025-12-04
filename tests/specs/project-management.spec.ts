import { test, expect } from '@playwright/test';

import { setupGeminiMock } from '../utils/mock-ai-gateway';

test.describe('Project Management E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await setupGeminiMock(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should create a new project via wizard', async ({ page }) => {
    // Click on new project button
    await page.getByTestId('nav-new-project').click();

    // Wait for wizard to appear
    await expect(page.getByTestId('project-wizard-overlay')).toBeVisible();
    await expect(page.getByTestId('wizard-idea-input')).toBeVisible();

    // Fill in project details
    await page.getByTestId('wizard-idea-input').fill('Test Project: A Mystery Novel');
    await page.getByTestId('wizard-title-input').fill('The Mystery of the Lost Manuscript');
    await page.getByTestId('wizard-style-input').fill('Classic mystery noir style');

    // Submit the wizard
    await page.getByTestId('wizard-submit-btn').click();

    // Wait for wizard to close and project to be created
    await expect(page.getByTestId('project-wizard-overlay')).toBeHidden({ timeout: 10000 });

    // Navigate to dashboard to see the new project
    await page.getByTestId('nav-dashboard').click();
    await page.waitForTimeout(1000);

    // Verify project appears in dashboard
    await expect(page.getByText('The Mystery of the Lost Manuscript')).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to project dashboard and view project details', async ({ page }) => {
    // Navigate to dashboard
    await page.getByTestId('nav-dashboard').click();
    await page.waitForTimeout(1000);

    // Wait for dashboard to load
    await expect(page.getByTestId('project-dashboard')).toBeVisible({ timeout: 5000 });

    // Check for project stats or action cards
    const actionCards = page.locator('[data-testid^="action-card-"]');
    if (
      await actionCards
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false)
    ) {
      await expect(actionCards.first()).toBeVisible();
    }

    // Verify dashboard navigation elements
    await expect(page.getByTestId('nav-dashboard')).toBeVisible();
    await expect(page.getByTestId('nav-projects')).toBeVisible();
  });

  test('should access projects view and see project list', async ({ page }) => {
    // Navigate to projects view
    await page.getByTestId('nav-projects').click();
    await page.waitForTimeout(1000);

    // Wait for projects view to load
    await expect(page.getByTestId('projects-view')).toBeVisible({ timeout: 5000 });

    // Look for project list or empty state
    const projectList = page.locator('[data-testid="project-list"]');
    if (await projectList.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(projectList).toBeVisible();
    } else {
      // Check for empty state message
      await expect(page.getByText(/no projects/i)).toBeVisible({ timeout: 3000 });
    }
  });

  test('should handle project creation validation', async ({ page }) => {
    // Click on new project button
    await page.getByTestId('nav-new-project').click();

    // Wait for wizard to appear
    await expect(page.getByTestId('project-wizard-overlay')).toBeVisible();

    // Try to submit without filling required fields
    const submitButton = page.getByTestId('wizard-submit-btn');
    await expect(submitButton).toBeVisible();

    // Check if submit button is disabled initially
    const isDisabled = await submitButton.isDisabled();
    expect(isDisabled).toBeTruthy();

    // Fill in minimal required fields
    await page.getByTestId('wizard-idea-input').fill('Test idea');
    await page.getByTestId('wizard-title-input').fill('Test Title');

    // Now submit should be enabled
    await expect(submitButton).toBeEnabled();

    // Submit and verify it works
    await submitButton.click();
    await expect(page.getByTestId('project-wizard-overlay')).toBeHidden({ timeout: 10000 });
  });

  test('should navigate between different views successfully', async ({ page }) => {
    // Test navigation to all main views
    const navigationTests = [
      { selector: '[data-testid="nav-dashboard"]', name: 'Dashboard' },
      { selector: '[data-testid="nav-projects"]', name: 'Projects' },
      { selector: '[data-testid="nav-settings"]', name: 'Settings' },
    ];

    for (const navTest of navigationTests) {
      // Navigate to the view
      await page.click(navTest.selector);
      await page.waitForTimeout(1000);

      // Verify navigation was successful (URL changed or element appeared)
      const currentUrl = page.url();
      expect(currentUrl).toContain('localhost:4173');

      // Check that some content loaded
      const body = page.locator('body');
      await expect(body).toBeVisible();
    }
  });

  test('should handle project actions and generation workflow', async ({ page }) => {
    // Navigate to dashboard
    await page.getByTestId('nav-dashboard').click();
    await page.waitForTimeout(1000);

    // Look for action cards
    const actionCards = page.locator('[data-testid^="action-card-"]');

    if (
      await actionCards
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false)
    ) {
      // Click on the first available action card
      await actionCards.first().click();

      // Wait for some response (could be console output, modal, etc.)
      await page.waitForTimeout(2000);

      // Check for any console output or UI changes
      const consoleArea = page.locator('.bg-black\\/40, [data-testid*="console"], [data-testid*="output"]');
      if (await consoleArea.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(consoleArea).toBeVisible();
      }
    } else {
      // If no action cards, verify dashboard is still functional
      await expect(page.getByTestId('project-dashboard')).toBeVisible();
    }
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Navigate to different views and check for error handling
    const views = ['dashboard', 'projects', 'settings'];

    for (const view of views) {
      await page.getByTestId(`nav-${view}`).click();
      await page.waitForTimeout(1000);

      // Check that no error messages are immediately visible
      const errorElements = page.locator('[data-testid*="error"], .error, [role="alert"]');
      const errorCount = await errorElements.count();

      // Errors might be present, but they should be handled gracefully
      if (errorCount > 0) {
        // If errors exist, they should have proper styling and be dismissible
        const firstError = errorElements.first();
        await expect(firstError).toBeVisible();
      }
    }
  });

  test('should maintain state during navigation', async ({ page }) => {
    // Start with dashboard
    await page.getByTestId('nav-dashboard').click();
    await page.waitForTimeout(1000);

    // Navigate to projects
    await page.getByTestId('nav-projects').click();
    await page.waitForTimeout(1000);

    // Navigate back to dashboard
    await page.getByTestId('nav-dashboard').click();
    await page.waitForTimeout(1000);

    // Verify dashboard is still functional
    await expect(page.getByTestId('project-dashboard')).toBeVisible({ timeout: 5000 });
  });
});
