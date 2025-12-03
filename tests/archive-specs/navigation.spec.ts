import { test, expect, Page } from '@playwright/test';

import { setupGeminiMock } from '../utils/mock-ai-gateway';

test.describe('Feature: Navigation & UX', () => {
  test.beforeEach(async ({ page }) => {
    await setupGeminiMock(page);
    // Start with mobile viewport to match first test
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await setupTestProject(page);
  });

  test('Mobile Sidebar: Toggles correctly on small screens', async ({ page }) => {
    test.setTimeout(30000);

    // Viewport is already mobile from beforeEach

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

    // Set desktop viewport for this test since it needs chapter selection
    await page.setViewportSize({ width: 1280, height: 720 });

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

  // Wait for dashboard to render after wizard closes
  // The ProjectDashboard renders the action cards, so wait for those to appear
  const createOutlineBtn = page.getByTestId('action-card-create_outline');
  await expect(createOutlineBtn).toBeVisible({ timeout: 15000 });

  // Wait a bit for any lazy-loaded components to finish loading
  await page.waitForTimeout(500);

  // Dashboard is now loaded with action cards visible
  // Get the project ID and inject test chapters directly
  const projectId = await page.evaluate(() => {
    // The project ID should be visible in the localStorage keys or in the current app state
    const keys = Object.keys(localStorage).filter(k => k.startsWith('project_'));
    if (keys.length > 0) {
      return keys[0].replace('project_', '');
    }
    return `test_proj_${Date.now()}`;
  });

  // Create a project with chapters
  const projectData = {
    id: projectId,
    title: 'Nav Book',
    idea: 'Navigation Test',
    style: 'Modern',
    chapters: [
      {
        id: `${projectId}_ch_1`,
        orderIndex: 1,
        title: 'Chapter 1: The Beginning',
        summary: 'Introduction to the story',
        content: 'Test chapter content',
        status: 'pending',
        illustration: '',
        wordCount: 100,
        characterCount: 500,
        estimatedReadingTime: 2,
        tags: [],
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `${projectId}_ch_2`,
        orderIndex: 2,
        title: 'Chapter 2: The Journey',
        summary: 'The adventure continues',
        content: 'Test chapter 2 content',
        status: 'pending',
        illustration: '',
        wordCount: 120,
        characterCount: 600,
        estimatedReadingTime: 2,
        tags: [],
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    worldState: {
      hasTitle: true,
      hasOutline: true,
      chaptersCount: 2,
      chaptersCompleted: 0,
      styleDefined: true,
      isPublished: false,
      hasCharacters: false,
      hasWorldBuilding: false,
      hasThemes: false,
      plotStructureDefined: false,
      targetAudienceDefined: false,
    },
    isGenerating: false,
    status: 'draft',
    language: 'en',
    targetWordCount: 50000,
    settings: {
      enableDropCaps: true,
      autoSave: true,
      autoSaveInterval: 120,
      showWordCount: true,
      enableSpellCheck: true,
      darkMode: false,
      fontSize: 'medium',
      lineHeight: 'normal',
      editorTheme: 'default',
    },
    genre: [],
    targetAudience: 'adult',
    contentWarnings: [],
    keywords: [],
    synopsis: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    authors: [],
    analytics: {
      totalWordCount: 220,
      averageChapterLength: 110,
      estimatedReadingTime: 2,
      generationCost: 0,
      editingRounds: 0,
    },
    version: '1.0.0',
    changeLog: [],
  };

  // Update project data in localStorage
  await page.evaluate(proj => {
    localStorage.setItem(`project_${proj.id}`, JSON.stringify(proj));
  }, projectData);

  // Update the React state directly to reflect the chapters
  // This is more efficient than reloading the page
  await page.evaluate(proj => {
    // Dispatch a custom event that the app can listen to for project updates
    const event = new CustomEvent('projectUpdate', {
      detail: { project: proj },
    });
    window.dispatchEvent(event);
  }, projectData);

  // Wait a moment for the React state to update
  await page.waitForTimeout(500);
}
