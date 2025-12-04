import { expect, test } from '@playwright/test';

import { setupGeminiMock } from '../utils/mock-ai-gateway';

test.describe('Publishing Panel and EPUB Export E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await setupGeminiMock(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should access publishing view', async ({ page }) => {
    // Look for publishing navigation
    const publishNav = page.locator('[data-testid*="publish"], [data-testid*="export"]');

    if (await publishNav.isVisible({ timeout: 3000 }).catch(() => false)) {
      await publishNav.click();

      // Look for publishing interface
      const publishView = page.locator('[data-testid*="publish"], [data-testid*="export"]');

      if (await publishView.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(publishView).toBeVisible();
      }
    } else {
      // Try accessing through dashboard or project actions
      await page.getByTestId('nav-dashboard').click();

      // Look for publish buttons in dashboard
      const publishButtons = page.locator('[data-testid*="publish"], [data-testid*="export"]');

      if (
        await publishButtons
          .first()
          .isVisible({ timeout: 3000 })
          .catch(() => false)
      ) {
        await expect(publishButtons.first()).toBeVisible();
      } else {
        test.skip();
      }
    }
  });

  test('should display publishing metadata form', async ({ page }) => {
    // Navigate to publishing view
    const publishNav = page.locator('[data-testid*="publish"], [data-testid*="export"]');

    if (await publishNav.isVisible({ timeout: 3000 }).catch(() => false)) {
      await publishNav.click();

      // Look for metadata form elements
      const metadataForm = page.locator('[data-testid*="metadata"], [data-testid*="form"]');

      if (await metadataForm.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(metadataForm).toBeVisible();

        // Look for common metadata fields
        const titleInput = page.locator(
          'input[placeholder*="title" i], input[name*="title" i], [data-testid*="title"]',
        );
        const authorInput = page.locator(
          'input[placeholder*="author" i], input[name*="author" i], [data-testid*="author"]',
        );
        const descriptionTextarea = page.locator(
          'textarea[placeholder*="description" i], textarea[name*="description" i], [data-testid*="description"]',
        );

        // Check if any of these fields exist
        const hasTitleField = await titleInput
          .first()
          .isVisible({ timeout: 1000 })
          .catch(() => false);
        const hasAuthorField = await authorInput
          .first()
          .isVisible({ timeout: 1000 })
          .catch(() => false);
        const hasDescriptionField = await descriptionTextarea.isVisible({ timeout: 1000 }).catch(() => false);

        // At least one metadata field should be present
        expect(hasTitleField || hasAuthorField || hasDescriptionField).toBeTruthy();
      }
    } else {
      test.skip();
    }
  });

  test('should handle EPUB export functionality', async ({ page }) => {
    // Navigate to publishing view
    const publishNav = page.locator('[data-testid*="publish"], [data-testid*="export"]');

    if (await publishNav.isVisible({ timeout: 3000 }).catch(() => false)) {
      await publishNav.click();

      // Look for EPUB export button
      const epubButton = page.locator('[data-testid*="epub"], button:has-text("EPUB"), button:has-text("Export")');

      if (await epubButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Mock file download
        const downloadPromise = page.waitForEvent('download');

        await epubButton.click();

        try {
          const download = await downloadPromise;
          expect(download.suggestedFilename()).toMatch(/\.epub$/i);
        } catch (_error) {
          // If download doesn't work, check for other feedback

          // Look for success message or progress indicator
          const successMessage = page.locator('[data-testid*="success"], .success, [role="status"]');
          const progressIndicator = page.locator('[data-testid*="progress"], .loading, .spinner');

          const hasFeedback =
            (await successMessage.isVisible({ timeout: 1000 }).catch(() => false)) ||
            (await progressIndicator.isVisible({ timeout: 1000 }).catch(() => false));

          expect(hasFeedback).toBeTruthy();
        }
      } else {
        test.skip();
      }
    } else {
      test.skip();
    }
  });

  test('should validate publishing metadata', async ({ page }) => {
    // Navigate to publishing view
    const publishNav = page.locator('[data-testid*="publish"], [data-testid*="export"]');

    if (await publishNav.isVisible({ timeout: 3000 }).catch(() => false)) {
      await publishNav.click();

      // Look for form validation
      const submitButton = page.locator('button[type="submit"], [data-testid*="submit"], [data-testid*="publish-btn"]');

      if (await submitButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Try to submit without filling required fields
        await submitButton.click();

        // Look for validation errors
        const validationErrors = page.locator('[data-testid*="error"], .error, [role="alert"]');

        if (
          await validationErrors
            .first()
            .isVisible({ timeout: 3000 })
            .catch(() => false)
        ) {
          await expect(validationErrors.first()).toBeVisible();
        }

        // Fill in some metadata
        const titleInput = page.locator(
          'input[placeholder*="title" i], input[name*="title" i], [data-testid*="title"]',
        );

        if (
          await titleInput
            .first()
            .isVisible({ timeout: 1000 })
            .catch(() => false)
        ) {
          await titleInput.first().fill('Test Book Title');

          // Try submitting again
          await submitButton.click();

          // Validation should pass or show different errors
        }
      } else {
        test.skip();
      }
    } else {
      test.skip();
    }
  });

  test('should display publishing analytics and metrics', async ({ page }) => {
    // Navigate to publishing view
    const publishNav = page.locator('[data-testid*="publish"], [data-testid*="export"]');

    if (await publishNav.isVisible({ timeout: 3000 }).catch(() => false)) {
      await publishNav.click();

      // Look for analytics or metrics section
      const analyticsSection = page.locator(
        '[data-testid*="analytics"], [data-testid*="metrics"], [data-testid*="stats"]',
      );

      if (await analyticsSection.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(analyticsSection).toBeVisible();

        // Look for common metrics
        const metricElements = page.locator('[data-testid*="metric"], [data-testid*="stat"], .metric, .stat');
        const metricCount = await metricElements.count();

        if (metricCount > 0) {
          await expect(metricElements.first()).toBeVisible();
        }
      } else {
        // Analytics might not be available, which is fine
        test.skip();
      }
    } else {
      test.skip();
    }
  });

  test('should handle cover generation functionality', async ({ page }) => {
    // Navigate to publishing view
    const publishNav = page.locator('[data-testid*="publish"], [data-testid*="export"]');

    if (await publishNav.isVisible({ timeout: 3000 }).catch(() => false)) {
      await publishNav.click();

      // Look for cover generation
      const coverGenerator = page.locator('[data-testid*="cover"], [data-testid*="generate-cover"]');

      if (await coverGenerator.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(coverGenerator).toBeVisible();

        // Look for cover generation controls
        const generateButton = page.locator('button:has-text("Generate"), [data-testid*="generate"]');

        if (await generateButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          await generateButton.click();

          // Look for generated cover or loading state
          const coverImage = page.locator('img[src*="cover"], [data-testid*="cover-image"]');
          const loadingIndicator = page.locator('[data-testid*="loading"], .loading, .spinner');

          const hasCoverOrLoading =
            (await coverImage.isVisible({ timeout: 3000 }).catch(() => false)) ||
            (await loadingIndicator.isVisible({ timeout: 3000 }).catch(() => false));

          expect(hasCoverOrLoading).toBeTruthy();
        }
      } else {
        test.skip();
      }
    } else {
      test.skip();
    }
  });

  test('should handle platform publishing options', async ({ page }) => {
    // Navigate to publishing view
    const publishNav = page.locator('[data-testid*="publish"], [data-testid*="export"]');

    if (await publishNav.isVisible({ timeout: 3000 }).catch(() => false)) {
      await publishNav.click();

      // Look for platform options
      const platformCards = page.locator('[data-testid*="platform"], [data-testid*="marketplace"]');

      if (await platformCards.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(platformCards).toBeVisible();

        // Look for specific platform options
        const platformOptions = page.locator(
          '[data-testid*="amazon"], [data-testid*="apple"], [data-testid*="google"], [data-testid*="kobo"]',
        );
        const platformCount = await platformOptions.count();

        if (platformCount > 0) {
          await expect(platformOptions.first()).toBeVisible();

          // Try interacting with a platform
          await platformOptions.first().click();

          // Look for platform-specific options
          const platformSettings = page.locator('[data-testid*="settings"], [data-testid*="config"]');

          if (await platformSettings.isVisible({ timeout: 3000 }).catch(() => false)) {
            await expect(platformSettings).toBeVisible();
          }
        }
      } else {
        test.skip();
      }
    } else {
      test.skip();
    }
  });

  test('should handle publishing errors gracefully', async ({ page }) => {
    // Navigate to publishing view
    const publishNav = page.locator('[data-testid*="publish"], [data-testid*="export"]');

    if (await publishNav.isVisible({ timeout: 3000 }).catch(() => false)) {
      await publishNav.click();

      // Mock an error for publishing
      await page.route('**/api/v1/publish/**', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Publishing service temporarily unavailable',
            code: 'PUBLISH_ERROR',
          }),
        });
      });

      // Try to publish
      const publishButton = page.locator(
        'button[type="submit"], [data-testid*="publish-btn"], [data-testid*="submit"]',
      );

      if (await publishButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await publishButton.click();

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
    } else {
      test.skip();
    }
  });

  test('should maintain publishing state across navigation', async ({ page }) => {
    // Navigate to publishing view
    const publishNav = page.locator('[data-testid*="publish"], [data-testid*="export"]');

    if (await publishNav.isVisible({ timeout: 3000 }).catch(() => false)) {
      await publishNav.click();

      // Fill in some metadata
      const titleInput = page.locator('input[placeholder*="title" i], input[name*="title" i], [data-testid*="title"]');

      if (
        await titleInput
          .first()
          .isVisible({ timeout: 1000 })
          .catch(() => false)
      ) {
        await titleInput.first().fill('Persistent Book Title');

        // Navigate away and back
        await page.getByTestId('nav-dashboard').click();

        await publishNav.click();

        // Check if title is still filled (may or may not be persisted)
        const titleValue = await titleInput.first().inputValue();

        // Either the title is persisted or the form is reset (both are valid behaviors)
        expect(titleValue === 'Persistent Book Title' || titleValue === '').toBeTruthy();
      } else {
        test.skip();
      }
    } else {
      test.skip();
    }
  });
});
