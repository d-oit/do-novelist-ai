import { test, expect } from '@playwright/test';

import { setupGeminiMock } from '../utils/mock-ai-gateway';

test.describe('Version History Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Setup AI mocks FIRST - critical for outline generation
    await setupGeminiMock(page);

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Create a test project - open wizard first
    await page.getByTestId('nav-new-project').click();
    await page.waitForSelector('[data-testid="wizard-idea-input"]', { state: 'visible' });
    await page.getByTestId('wizard-idea-input').fill('Version Test Novel');
    await page.getByTestId('wizard-title-input').fill('Version Test Title');
    await page.getByTestId('wizard-style-input').fill('Mystery');
    await page.getByTestId('wizard-submit-btn').click();
    await expect(page.getByTestId('project-wizard-overlay')).toBeHidden();

    // Create outline to get chapters
    await page.getByTestId('action-card-create_outline').click();

    // Wait for chapter items to appear - the most reliable indicator
    // The console text may be delayed, so we wait for the actual UI element instead
    await expect(page.getByTestId('chapter-item-order-1')).toBeVisible({ timeout: 20000 });

    // Navigate to first chapter
    await page.getByTestId('chapter-item-order-1').click();

    // Wait for editor to be visible after navigation
    await expect(page.getByTestId('chapter-editor')).toBeVisible({ timeout: 10000 });
  });

  test('should save and display version history', async ({ page }) => {
    test.setTimeout(60000); // Increase timeout to account for beforeEach setup

    // Add some initial content
    const contentEditor = page.getByTestId('chapter-content-input');
    await expect(contentEditor).toBeVisible({ timeout: 5000 });
    await contentEditor.fill('This is the initial content of the chapter.');
    await contentEditor.blur();

    // Wait for auto-save
    await page.waitForTimeout(3500);

    // Wait for the AI toolbar to be visible, which contains the version buttons
    const saveVersionBtn = page.getByTestId('save-version-btn');
    await expect(saveVersionBtn).toBeVisible({ timeout: 10000 });

    // Save a manual version
    await saveVersionBtn.click();
    await page.waitForTimeout(1000);

    // Add more content
    await contentEditor.fill('This is the initial content of the chapter. Now with additional content added.');
    await contentEditor.blur();

    // Wait for auto-save
    await page.waitForTimeout(3500);

    // Open version history
    const historyBtn = page.getByTestId('version-history-btn');
    await expect(historyBtn).toBeVisible({ timeout: 10000 });
    await historyBtn.click();

    // Check that the version history modal is visible
    await expect(page.getByText('Version History')).toBeVisible({ timeout: 15000 });

    // Check for version content in the modal
    await expect(page.getByText(/initial|chapter/i)).toBeVisible({ timeout: 5000 });
  });

  test('should restore a previous version', async ({ page }) => {
    test.setTimeout(60000);

    const contentEditor = page.getByTestId('chapter-content-input');
    await expect(contentEditor).toBeVisible({ timeout: 5000 });

    // Wait for version buttons to be visible
    const saveVersionBtn = page.getByTestId('save-version-btn');
    await expect(saveVersionBtn).toBeVisible({ timeout: 10000 });

    // Add initial content and save version
    await contentEditor.fill('Original content that we want to restore later.');
    await contentEditor.blur();
    await saveVersionBtn.click();
    await page.waitForTimeout(1000);

    // Change content
    await contentEditor.fill('Modified content that should be replaced.');
    await contentEditor.blur();

    // Wait for auto-save
    await page.waitForTimeout(3500);

    // Open version history
    const historyBtn = page.getByTestId('version-history-btn');
    await expect(historyBtn).toBeVisible({ timeout: 10000 });
    await historyBtn.click();

    await expect(page.getByText('Version History')).toBeVisible({ timeout: 15000 });

    // Find the original version by looking for text in version items
    const versionItems = page.locator('text=/Original/');
    await expect(versionItems.first()).toBeVisible({ timeout: 10000 });
    await versionItems.first().click();
    await page.waitForTimeout(500); // Wait for expansion

    // Click restore button in the expanded details
    await expect(page.getByText('Restore This Version')).toBeVisible({ timeout: 5000 });
    await page.getByText('Restore This Version').click();

    // Wait for restore action and then check content
    await page.waitForTimeout(1000);
    await expect(contentEditor).toHaveValue('Original content that we want to restore later.');
  });

  test('should search through version history', async ({ page }) => {
    test.setTimeout(60000);

    const contentEditor = page.getByTestId('chapter-content-input');
    await expect(contentEditor).toBeVisible({ timeout: 5000 });

    // Wait for version buttons to be visible
    const saveVersionBtn = page.getByTestId('save-version-btn');
    await expect(saveVersionBtn).toBeVisible({ timeout: 10000 });

    // Create multiple versions with different content
    await contentEditor.fill('Chapter about dragons and magic.');
    await contentEditor.blur();
    await saveVersionBtn.click();
    await page.waitForTimeout(1000);

    await contentEditor.fill('Chapter about knights and battles.');
    await contentEditor.blur();
    await saveVersionBtn.click();
    await page.waitForTimeout(1000);

    await contentEditor.fill('Chapter about wizards and spells.');
    await contentEditor.blur();
    await saveVersionBtn.click();
    await page.waitForTimeout(1000);

    // Open version history
    const historyBtn = page.getByTestId('version-history-btn');
    await expect(historyBtn).toBeVisible({ timeout: 10000 });
    await historyBtn.click();

    await expect(page.getByText('Version History')).toBeVisible({ timeout: 15000 });

    // Search for specific content
    const searchInput = page.getByPlaceholder('Search versions...');
    await expect(searchInput).toBeVisible({ timeout: 5000 });
    await searchInput.fill('dragons');
    await page.waitForTimeout(500); // Wait for search to filter

    // Should show dragon content
    await expect(page.getByText(/dragons|magic/i)).toBeVisible({ timeout: 5000 });
  });

  test('should export version history', async ({ page }) => {
    test.setTimeout(60000);

    const contentEditor = page.getByTestId('chapter-content-input');
    await expect(contentEditor).toBeVisible({ timeout: 5000 });

    // Wait for version buttons to be visible
    const saveVersionBtn = page.getByTestId('save-version-btn');
    await expect(saveVersionBtn).toBeVisible({ timeout: 10000 });

    // Add content and create versions
    await contentEditor.fill('First version of the chapter.');
    await contentEditor.blur();
    await saveVersionBtn.click();
    await page.waitForTimeout(1000);

    await contentEditor.fill('Second version with more content.');
    await contentEditor.blur();
    await saveVersionBtn.click();
    await page.waitForTimeout(1000);

    // Open version history
    const historyBtn = page.getByTestId('version-history-btn');
    await expect(historyBtn).toBeVisible({ timeout: 10000 });
    await historyBtn.click();

    await expect(page.getByText('Version History')).toBeVisible({ timeout: 15000 });

    // Set up download handler
    const downloadPromise = page.waitForEvent('download');

    // Click export button
    const exportBtn = page.getByText('Export');
    await expect(exportBtn).toBeVisible({ timeout: 5000 });
    await exportBtn.click();

    // Wait for download
    const download = await downloadPromise;

    // Verify download properties
    expect(download.suggestedFilename()).toMatch(/version.*history.*json/i);
  });

  test('should filter versions by type', async ({ page }) => {
    test.setTimeout(60000);

    const contentEditor = page.getByTestId('chapter-content-input');
    await expect(contentEditor).toBeVisible({ timeout: 5000 });

    // Wait for version buttons to be visible
    const saveVersionBtn = page.getByTestId('save-version-btn');
    await expect(saveVersionBtn).toBeVisible({ timeout: 10000 });

    // Create manual version
    await contentEditor.fill('Manual save content.');
    await contentEditor.blur();
    await saveVersionBtn.click();
    await page.waitForTimeout(1000);

    // Create auto version by waiting for auto-save
    await contentEditor.fill('Auto save content that triggers automatic versioning.');
    await contentEditor.blur();
    await page.waitForTimeout(3500);

    // Open version history
    const historyBtn = page.getByTestId('version-history-btn');
    await expect(historyBtn).toBeVisible({ timeout: 10000 });
    await historyBtn.click();

    await expect(page.getByText('Version History')).toBeVisible({ timeout: 15000 });

    // Open filters
    const filterBtn = page.getByText('Filters');
    await expect(filterBtn).toBeVisible({ timeout: 5000 });
    await filterBtn.click();
    await page.waitForTimeout(500);

    // Find and select the filter dropdown - look for the select that contains filter options
    const filterSelects = page.locator('select');
    await expect(filterSelects.first()).toBeVisible({ timeout: 5000 });
    await filterSelects.first().selectOption('manual');

    // Should show version content in the filtered list
    await expect(page.getByText(/Manual|Save/i)).toBeVisible({ timeout: 5000 });
  });

  test('should show version statistics', async ({ page }) => {
    test.setTimeout(60000);

    const contentEditor = page.getByTestId('chapter-content-input');
    await expect(contentEditor).toBeVisible({ timeout: 5000 });

    // Wait for version buttons to be visible
    const saveVersionBtn = page.getByTestId('save-version-btn');
    await expect(saveVersionBtn).toBeVisible({ timeout: 10000 });

    // Add content with different word counts
    await contentEditor.fill('Short version.');
    await contentEditor.blur();
    await saveVersionBtn.click();
    await page.waitForTimeout(1000);

    await contentEditor.fill(
      'This is a much longer version with significantly more words to test word count tracking.',
    );
    await contentEditor.blur();
    await saveVersionBtn.click();
    await page.waitForTimeout(1000);

    // Open version history
    const historyBtn = page.getByTestId('version-history-btn');
    await expect(historyBtn).toBeVisible({ timeout: 10000 });
    await historyBtn.click();

    await expect(page.getByText('Version History')).toBeVisible({ timeout: 15000 });

    // Click on a version to see details - look for versions with our content
    const versionItems = page.locator('text=/longer|Short/');
    await expect(versionItems.first()).toBeVisible({ timeout: 10000 });
    await versionItems.first().click();
    await page.waitForTimeout(500); // Wait for expansion animation

    // Should show word count and character information
    await expect(page.getByText(/Words/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/Characters/i)).toBeVisible({ timeout: 5000 });
  });

  test('should handle version history in focus mode', async ({ page }) => {
    test.setTimeout(60000);

    const contentEditor = page.getByTestId('chapter-content-input');
    await expect(contentEditor).toBeVisible({ timeout: 5000 });

    // First add some content without focus mode to ensure editor is ready
    await contentEditor.fill('Initial content before focus mode.');
    await contentEditor.blur();

    // Wait for version buttons to be visible (they appear after editor is ready)
    const saveVersionBtn = page.getByTestId('save-version-btn');
    await expect(saveVersionBtn).toBeVisible({ timeout: 10000 });

    // Enter focus mode
    const focusToggle = page.getByTestId('focus-mode-toggle');
    await expect(focusToggle).toBeVisible({ timeout: 5000 });
    await focusToggle.click();
    await page.waitForTimeout(500); // Wait for focus mode transition

    // In focus mode, the AI toolbar is hidden, but we can still access via the top buttons
    await contentEditor.fill('Focus mode content for versioning test.');
    await contentEditor.blur();
    await page.waitForTimeout(1000);

    // Save version in focus mode (button may be hidden but still clickable)
    await saveVersionBtn.click();
    await page.waitForTimeout(1000);

    // Open version history in focus mode
    const historyBtn = page.getByTestId('version-history-btn');
    await historyBtn.click();

    // Modal should overlay focus mode
    await expect(page.getByText('Version History')).toBeVisible({ timeout: 15000 });
  });

  test('should close version history modal', async ({ page }) => {
    test.setTimeout(60000);

    const contentEditor = page.getByTestId('chapter-content-input');
    await expect(contentEditor).toBeVisible({ timeout: 5000 });

    // Wait for version buttons to be visible
    const saveVersionBtn = page.getByTestId('save-version-btn');
    await expect(saveVersionBtn).toBeVisible({ timeout: 10000 });

    await contentEditor.fill('Test content for modal closing.');
    await contentEditor.blur();
    await page.waitForTimeout(1000);

    // Open version history
    const historyBtn = page.getByTestId('version-history-btn');
    await expect(historyBtn).toBeVisible({ timeout: 10000 });
    await historyBtn.click();

    // Modal should be visible
    await expect(page.getByText('Version History')).toBeVisible({ timeout: 15000 });

    // Close modal - look for the Close button in the header
    const closeBtn = page.getByText('Close');
    await expect(closeBtn).toBeVisible({ timeout: 5000 });
    await closeBtn.click();

    // Modal should be hidden - wait for it to animate out
    await expect(page.getByText('Version History')).not.toBeVisible({ timeout: 5000 });

    // Should be back to editor view
    await expect(contentEditor).toBeVisible({ timeout: 5000 });
  });
});
