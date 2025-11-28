import { test, expect } from '@playwright/test';

test.describe('Version History Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // Create a test project - open wizard first
    await page.getByTestId('nav-new-project').click();
    await page.getByTestId('wizard-idea-input').fill('Version Test Novel');
    await page.getByTestId('wizard-title-input').fill('Version Test Title');
    await page.getByTestId('wizard-style-input').fill('Mystery');
    await page.getByTestId('wizard-submit-btn').click();
    await expect(page.getByTestId('project-wizard-overlay')).toBeHidden();

    // Create outline to get chapters
    await page.getByTestId('action-card-create_outline').click();
    await expect(page.getByTestId('chapter-item-order-1')).toBeVisible({ timeout: 10000 });

    // Navigate to first chapter
    await page.getByTestId('chapter-item-order-1').click();
  });

  test('should save and display version history', async ({ page }) => {
    // Add some initial content
    const contentEditor = page.getByTestId('chapter-content-input');
    await contentEditor.fill('This is the initial content of the chapter.');

    // Wait for auto-save
    await page.waitForTimeout(3500);

    // Save a manual version
    await page.getByTestId('save-version-btn').click();

    // Add more content
    await contentEditor.fill('This is the initial content of the chapter. Now with additional content added.');

    // Wait for auto-save
    await page.waitForTimeout(3500);

    // Open version history
    await page.getByTestId('version-history-btn').click();

    // Check that the version history modal is visible
    await expect(page.getByText('Version History')).toBeVisible();

    // Should show at least 2 versions (auto-save and manual save)
    const versionCount = page.locator('[data-testid*="version-"]').first();
    await expect(versionCount).toBeVisible();

    // Check for version types
    await expect(page.getByText('Manual', { exact: false })).toBeVisible();
  });

  test('should restore a previous version', async ({ page }) => {
    const contentEditor = page.getByTestId('chapter-content-input');

    // Add initial content and save version
    await contentEditor.fill('Original content that we want to restore later.');
    await page.getByTestId('save-version-btn').click();

    // Wait for save
    await page.waitForTimeout(1000);

    // Change content
    await contentEditor.fill('Modified content that should be replaced.');

    // Wait for auto-save
    await page.waitForTimeout(3500);

    // Open version history
    await page.getByTestId('version-history-btn').click();

    // Find and click on the original version
    const originalVersion = page.getByText('Original content', { exact: false }).first();
    await originalVersion.click();

    // Click restore button
    await page.getByText('Restore This Version').click();

    // Check that content is restored
    await expect(contentEditor).toHaveValue('Original content that we want to restore later.');
  });

  test('should search through version history', async ({ page }) => {
    const contentEditor = page.getByTestId('chapter-content-input');

    // Create multiple versions with different content
    await contentEditor.fill('Chapter about dragons and magic.');
    await page.getByTestId('save-version-btn').click();
    await page.waitForTimeout(1000);

    await contentEditor.fill('Chapter about knights and battles.');
    await page.getByTestId('save-version-btn').click();
    await page.waitForTimeout(1000);

    await contentEditor.fill('Chapter about wizards and spells.');
    await page.getByTestId('save-version-btn').click();
    await page.waitForTimeout(1000);

    // Open version history
    await page.getByTestId('version-history-btn').click();

    // Search for specific content
    const searchInput = page.getByPlaceholder('Search versions...');
    await searchInput.fill('dragons');

    // Should show only the dragon version
    await expect(page.getByText('dragons', { exact: false })).toBeVisible();
    await expect(page.getByText('knights', { exact: false })).not.toBeVisible();
  });

  test('should export version history', async ({ page }) => {
    const contentEditor = page.getByTestId('chapter-content-input');

    // Add content and create versions
    await contentEditor.fill('First version of the chapter.');
    await page.getByTestId('save-version-btn').click();
    await page.waitForTimeout(1000);

    await contentEditor.fill('Second version with more content.');
    await page.getByTestId('save-version-btn').click();
    await page.waitForTimeout(1000);

    // Open version history
    await page.getByTestId('version-history-btn').click();

    // Set up download handler
    const downloadPromise = page.waitForEvent('download');

    // Click export button
    await page.getByText('Export').click();

    // Wait for download
    const download = await downloadPromise;

    // Verify download properties
    expect(download.suggestedFilename()).toContain('version_history');
    expect(download.suggestedFilename()).toContain('.json');
  });

  test('should filter versions by type', async ({ page }) => {
    const contentEditor = page.getByTestId('chapter-content-input');

    // Create manual version
    await contentEditor.fill('Manual save content.');
    await page.getByTestId('save-version-btn').click();
    await page.waitForTimeout(1000);

    // Create auto version by waiting for auto-save
    await contentEditor.fill('Auto save content that triggers automatic versioning.');
    await page.waitForTimeout(3500);

    // Open version history
    await page.getByTestId('version-history-btn').click();

    // Open filters
    await page.getByText('Filters').click();

    // Filter by manual saves only
    await page.selectOption('select[value="all"]', 'manual');

    // Should show only manual versions
    await expect(page.getByText('Manual', { exact: false })).toBeVisible();
  });

  test('should show version statistics', async ({ page }) => {
    const contentEditor = page.getByTestId('chapter-content-input');

    // Add content with different word counts
    await contentEditor.fill('Short version.');
    await page.getByTestId('save-version-btn').click();
    await page.waitForTimeout(1000);

    await contentEditor.fill('This is a much longer version with significantly more words to test word count tracking.');
    await page.getByTestId('save-version-btn').click();
    await page.waitForTimeout(1000);

    // Open version history
    await page.getByTestId('version-history-btn').click();

    // Click on a version to see details
    const versionItem = page.getByText('longer version', { exact: false }).first();
    await versionItem.click();

    // Should show word count and character information
    await expect(page.getByText('Words:', { exact: false })).toBeVisible();
    await expect(page.getByText('Characters:', { exact: false })).toBeVisible();
  });

  test('should handle version history in focus mode', async ({ page }) => {
    // Enter focus mode
    await page.getByTestId('focus-mode-toggle').click();

    const contentEditor = page.getByTestId('chapter-content-input');
    await contentEditor.fill('Focus mode content for versioning test.');

    // Version buttons should still be accessible even in focus mode
    await expect(page.getByTestId('save-version-btn')).toBeVisible();
    await expect(page.getByTestId('version-history-btn')).toBeVisible();

    // Save version in focus mode
    await page.getByTestId('save-version-btn').click();

    // Open version history in focus mode
    await page.getByTestId('version-history-btn').click();

    // Modal should overlay focus mode
    await expect(page.getByText('Version History')).toBeVisible();
  });

  test('should close version history modal', async ({ page }) => {
    const contentEditor = page.getByTestId('chapter-content-input');
    await contentEditor.fill('Test content for modal closing.');

    // Open version history
    await page.getByTestId('version-history-btn').click();

    // Modal should be visible
    await expect(page.getByText('Version History')).toBeVisible();

    // Close modal
    await page.getByText('Close').click();

    // Modal should be hidden
    await expect(page.getByText('Version History')).not.toBeVisible();

    // Should be back to editor view
    await expect(contentEditor).toBeVisible();
  });
});
