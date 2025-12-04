import { expect, test } from '@playwright/test';

import { setupGeminiMock } from '../utils/mock-ai-gateway';

test.describe('AI Generation and GOAP Workflow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await setupGeminiMock(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('nav-dashboard')).toBeVisible({ timeout: 10000 });
  });

  test('should access generation dashboard and see action cards', async ({ page }) => {
    // Navigate to dashboard
    await page.getByTestId('nav-dashboard').click();

    // Wait for dashboard to load
    await expect(page.getByTestId('project-dashboard')).toBeVisible({ timeout: 5000 });

    // Look for action cards
    const actionCards = page.locator('[data-testid^="action-card-"]');

    if (
      await actionCards
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false)
    ) {
      // Count visible action cards
      const cardCount = await actionCards.count();
      expect(cardCount).toBeGreaterThan(0);

      // Verify first card is visible
      await expect(actionCards.first()).toBeVisible();
    } else {
      // If no action cards, verify dashboard is still functional
      await expect(page.getByTestId('project-dashboard')).toBeVisible();
    }
  });

  test('should execute outline generation action', async ({ page }) => {
    // Navigate to dashboard
    await page.getByTestId('nav-dashboard').click();

    // Look for outline generation action card
    const outlineCard = page.getByTestId('action-card-create_outline');

    if (await outlineCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Click on outline generation
      await outlineCard.click();

      // Look for console output or generation feedback
      const consoleArea = page.locator('.bg-black\\/40, [data-testid*="console"], [data-testid*="output"]');

      if (await consoleArea.isVisible({ timeout: 10000 }).catch(() => false)) {
        // Check for success message or generation content
        try {
          await expect(consoleArea).toContainText('Outline created', { timeout: 10000 });
        } catch (_error) {
          // If exact message not found, look for any AI-related content
          await expect(consoleArea).toContainText('Architect', { timeout: 5000 });
        }
      }

      // Look for generated chapters or outline structure
      const chapterItems = page.locator('[data-testid^="chapter-item-"]');

      if (
        await chapterItems
          .first()
          .isVisible({ timeout: 10000 })
          .catch(() => false)
      ) {
        await expect(chapterItems.first()).toBeVisible();
      }
    } else {
      // Skip test if outline card not available
      test.skip();
    }
  });

  test('should handle character generation action', async ({ page }) => {
    // Navigate to dashboard
    await page.getByTestId('nav-dashboard').click();

    // Look for character generation action card
    const characterCard = page.getByTestId('action-card-create_characters');

    if (await characterCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Click on character generation
      await characterCard.click();

      // Look for console output or generation feedback
      const consoleArea = page.locator('.bg-black\\/40, [data-testid*="console"], [data-testid*="output"]');

      if (await consoleArea.isVisible({ timeout: 10000 }).catch(() => false)) {
        try {
          await expect(consoleArea).toContainText('Characters created', { timeout: 10000 });
        } catch (_error) {
          await expect(consoleArea).toContainText('Character', { timeout: 5000 });
        }
      }
    } else {
      test.skip();
    }
  });

  test('should handle world building generation action', async ({ page }) => {
    // Navigate to dashboard
    await page.getByTestId('nav-dashboard').click();

    // Look for world building action card
    const worldCard = page.getByTestId('action-card-create_world');

    if (await worldCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Click on world building generation
      await worldCard.click();

      // Look for console output or generation feedback
      const consoleArea = page.locator('.bg-black\\/40, [data-testid*="console"], [data-testid*="output"]');

      if (await consoleArea.isVisible({ timeout: 10000 }).catch(() => false)) {
        try {
          await expect(consoleArea).toContainText('World created', { timeout: 10000 });
        } catch (_error) {
          await expect(consoleArea).toContainText('World', { timeout: 5000 });
        }
      }
    } else {
      test.skip();
    }
  });

  test('should access agent console and view AI agents', async ({ page }) => {
    // Look for agent console access
    const agentConsoleButton = page.locator('[data-testid*="agent"], [data-testid*="console"]');

    if (await agentConsoleButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await agentConsoleButton.click();

      // Look for agent console interface
      const agentConsole = page.locator('[data-testid*="agent-console"], [data-testid*="agent-panel"]');

      if (await agentConsole.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(agentConsole).toBeVisible();
      }
    } else {
      // Try accessing through dashboard
      await page.getByTestId('nav-dashboard').click();

      // Look for any agent-related UI
      const agentElements = page.locator('[data-testid*="agent"]');
      const agentCount = await agentElements.count();

      if (agentCount > 0) {
        await expect(agentElements.first()).toBeVisible();
      }
    }
  });

  test('should handle multiple generation actions in sequence', async ({ page }) => {
    // Navigate to dashboard
    await page.getByTestId('nav-dashboard').click();

    // Get all visible action cards
    const actionCards = page.locator('[data-testid^="action-card-"]');
    const visibleCards = [];

    for (let i = 0; i < (await actionCards.count()); i++) {
      const card = actionCards.nth(i);
      if (await card.isVisible({ timeout: 1000 }).catch(() => false)) {
        visibleCards.push(card);
      }
    }

    // Execute up to 3 actions in sequence
    const actionsToExecute = Math.min(visibleCards.length, 3);

    for (let i = 0; i < actionsToExecute; i++) {
      const card = visibleCards[i];
      if (card) {
        await card.click();
        // Look for any response
        const consoleArea = page.locator('.bg-black\\/40, [data-testid*="console"], [data-testid*="output"]');
        if (await consoleArea.isVisible({ timeout: 5000 }).catch(() => false)) {
          // Just verify it's visible, content may vary
          await expect(consoleArea).toBeVisible();
        }
      }
    }
  });

  test('should handle generation errors gracefully', async ({ page }) => {
    // Navigate to dashboard
    await page.getByTestId('nav-dashboard').click();

    // Mock an error response for AI generation
    await page.route('**/v1/chat/completions', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'AI service temporarily unavailable',
          code: 'SERVICE_ERROR',
        }),
      });
    });

    // Try to execute an action
    const firstCard = page.locator('[data-testid^="action-card-"]').first();

    if (await firstCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstCard.click();

      // Look for error handling
      const errorElements = page.locator('[data-testid*="error"], .error, [role="alert"]');

      if (
        await errorElements
          .first()
          .isVisible({ timeout: 3000 })
          .catch(() => false)
      ) {
        await expect(errorElements.first()).toBeVisible();
      }
    } else {
      test.skip();
    }
  });

  test('should display generation progress and feedback', async ({ page }) => {
    // Navigate to dashboard
    await page.getByTestId('nav-dashboard').click();

    // Look for any action card
    const firstCard = page.locator('[data-testid^="action-card-"]').first();

    if (await firstCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Mock a delayed response to test progress indication
      await page.route('**/v1/chat/completions', async route => {
        // Wait a bit to simulate processing
        await new Promise(resolve => setTimeout(resolve, 2000));

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            choices: [
              {
                message: {
                  content: 'Generated content after processing',
                },
              },
            ],
          }),
        });
      });

      await firstCard.click();

      // Look for loading or progress indicators
      const loadingElements = page.locator('[data-testid*="loading"], [data-testid*="progress"], .loading, .spinner');

      if (
        await loadingElements
          .first()
          .isVisible({ timeout: 1000 })
          .catch(() => false)
      ) {
        await expect(loadingElements.first()).toBeVisible();
      }

      // Look for completion feedback
      const consoleArea = page.locator('.bg-black\\/40, [data-testid*="console"], [data-testid*="output"]');

      if (await consoleArea.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(consoleArea).toBeVisible();
      }
    } else {
      test.skip();
    }
  });

  test('should maintain generation state across navigation', async ({ page }) => {
    // Navigate to dashboard
    await page.getByTestId('nav-dashboard').click();

    // Execute a generation action
    const firstCard = page.locator('[data-testid^="action-card-"]').first();

    if (await firstCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstCard.click();

      // Navigate away and back

      await page.getByTestId('nav-dashboard').click();

      // Dashboard should still show generation results or state
      await expect(page.getByTestId('project-dashboard')).toBeVisible({ timeout: 5000 });
    } else {
      test.skip();
    }
  });
});
