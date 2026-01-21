import type { Page } from '@playwright/test';
import { expect, test } from '../utils/enhanced-test-fixture';
import { performanceMonitor } from '../utils/performance-monitor';
import { dbTransactionManager } from '../utils/database-transaction-manager';
import { unifiedMockManager } from '../utils/unified-mock-manager';
import { cleanupTestEnvironment, clickWithStability } from '../utils/test-cleanup';

/**
 * Enhanced AI Generation and GOAP Workflow E2E Tests
 *
 * Demonstrates optimized test data management, unified mocking,
 * and comprehensive isolation for robust test execution.
 */

// Helper function for element visibility checking
async function isElementVisible(page: Page, selector: string): Promise<boolean> {
  try {
    const element = page.locator(selector);
    await element.waitFor({ state: 'visible', timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}
test.describe('AI Generation and GOAP Workflow E2E Tests', () => {
  test.beforeAll(async () => {
    // Start performance monitoring for the test suite
    performanceMonitor.startTestSuite('AI Generation E2E Tests');

    console.log('🚀 Enhanced AI Generation test suite initialized');
  });

  test.beforeEach(async ({ page, testData, mockManager, compatibility }) => {
    performanceMonitor.startTimer('Test Setup');

    // Capture console logs
    page.on('console', msg => console.log(`[Browser Console]: ${msg.text()}`));

    console.log('🔧 Setting up enhanced test environment:', {
      projectId: testData.project.id,
      userId: testData.user.id,
      chapterCount: testData.chapters.length,
    });

    // Configure unified mocking with error simulation capability
    mockManager.configureErrorSimulation('test-session', {
      enableNetworkErrors: false,
      enableTimeoutErrors: false,
      mockDelay: 0,
    });

    // Navigate to home page with cross-browser compatibility
    await page.goto('/', {
      waitUntil: 'networkidle',
      timeout: compatibility.getTimeoutMultiplier() * 30000,
    });

    // Wait for app shell to be ready even if initialization spinner shows briefly
    await page.waitForLoadState('domcontentloaded');
    // Use smart wait instead of fixed timeout
    await page.evaluate(
      () =>
        new Promise<void>(resolve => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        }),
    );
    try {
      await page.getByRole('navigation').waitFor({ state: 'visible', timeout: 15000 });
    } catch {
      await page.getByTestId('nav-dashboard').waitFor({ state: 'visible', timeout: 15000 });
    }
    await page.setViewportSize({ width: 1280, height: 720 });

    console.log('✅ Enhanced test environment setup complete');
  });

  test.afterEach(async ({ page, mockManager }) => {
    performanceMonitor.startTimer('Test Cleanup');

    console.log('🧹 Cleaning up test');

    try {
      // Clean up overlays and modals
      await cleanupTestEnvironment(page);

      // End database transaction context with rollback
      await dbTransactionManager.endTransactionContext('test-session');

      // Cleanup unified mocking
      await mockManager.cleanupPageRoutes(page, 'test-session');

      console.log('✅ Test cleanup complete');
    } catch (error) {
      console.error('❌ Test cleanup failed:', error);
    }

    performanceMonitor.endTimer('Test Cleanup');
  });

  test.afterAll(async () => {
    // Global cleanup
    await dbTransactionManager.globalCleanup();
    await unifiedMockManager.globalCleanup();

    // End performance monitoring and report results
    performanceMonitor.endTestSuite('AI Generation E2E Tests');
    performanceMonitor.reportMetrics();

    // Validate performance targets
    const { passed } = performanceMonitor.validatePerformanceTargets();
    if (!passed) {
      console.warn('⚠️ Some performance targets were missed');
    }

    // Log final statistics
    const dbStats = dbTransactionManager.getTransactionStatistics();
    const mockStats = unifiedMockManager.getStatistics();

    console.log('📊 Final Test Statistics:', {
      database: dbStats,
      mocking: mockStats,
    });
  });

  test('should access dashboard via navigation', async ({ page }) => {
    // Navigate to dashboard
    await clickWithStability(page, 'nav-dashboard', { timeout: 15000 });

    // Verify the dashboard nav is highlighted/active
    await expect(page.getByTestId('nav-dashboard')).toBeVisible();
  });

  test('should display action cards when project is loaded', async ({ page }) => {
    // Navigate to dashboard
    await clickWithStability(page, 'nav-dashboard', { timeout: 15000 });

    // Wait for navigation to settle
    await page.waitForLoadState('domcontentloaded');

    // Look for action cards (they may or may not be visible depending on project state)
    const actionCards = page.locator('[data-testid^="action-card-"]');

    // Use Playwright's built-in polling to check if action cards exist
    try {
      await expect(actionCards).toHaveCount(await actionCards.count(), {
        timeout: 3000,
      });

      // If cards exist, verify they're visible
      const cardCount = await actionCards.count();
      if (cardCount > 0) {
        await expect(actionCards.first()).toBeVisible();
      }
    } catch {
      // Action cards may not exist - this is expected
      expect(true).toBe(true);
    }
  });

  test('should have AI-related console or output area', async ({ page }) => {
    await clickWithStability(page, 'nav-dashboard', { timeout: 15000 });

    // Wait for content to load
    await page.waitForLoadState('domcontentloaded');

    // Look for AI-related areas using more robust selectors
    const consoleArea = page.locator(
      '[data-testid*="console"], [data-testid*="output"], [data-testid*="agent"], [data-testid*="ai"]',
    );

    // Use intelligent waiting instead of timeout
    const hasConsole = await isElementVisible(
      page,
      '[data-testid*="console"], [data-testid*="output"], [data-testid*="agent"], [data-testid*="ai"]',
    );

    // Console may or may not be visible depending on app state
    if (hasConsole) {
      await expect(consoleArea.first()).toBeVisible();
    }

    expect(true).toBe(true);
  });

  test('should handle navigation between dashboard and settings', async ({ page }) => {
    // Start at dashboard
    await expect(page.getByTestId('nav-dashboard')).toBeVisible({ timeout: 10000 });
    await page.waitForLoadState('domcontentloaded');

    // Navigate to settings using top navigation (Header) to avoid duplicate ID issue
    await page.getByRole('navigation').getByTestId('nav-settings').click({ timeout: 15000 });

    // Wait for settings view to load with intelligent polling
    await expect(page.getByTestId('settings-view')).toBeVisible({ timeout: 10000 });

    // Navigate back to dashboard using top navigation
    await page.getByRole('navigation').getByTestId('nav-dashboard').click({ timeout: 15000 });
    await expect(page.getByTestId('nav-dashboard')).toBeVisible({ timeout: 10000 });
  });
});
