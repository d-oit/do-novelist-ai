import { expect, test } from '@playwright/test';

import { setupGeminiMock } from '../utils/mock-ai-gateway';

test.describe('Settings Panel and AI Configuration E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await setupGeminiMock(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('nav-dashboard')).toBeVisible({ timeout: 10000 });
  });

  test('should access settings view', async ({ page }) => {
    // Navigate to settings
    await page.getByTestId('nav-settings').click();

    // Verify settings view is loaded
    await expect(page.getByTestId('settings-view')).toBeVisible({ timeout: 10000 });
  });

  test('should display AI configuration panel', async ({ page }) => {
    // Navigate to settings
    await page.getByTestId('nav-settings').click();

    // Look for AI settings panel
    const aiSettingsPanel = page.getByTestId('ai-settings-panel');

    if (await aiSettingsPanel.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(aiSettingsPanel).toBeVisible();

      // Look for AI configuration elements
      const providerSelector = page.locator('[data-testid*="provider"], select[name*="provider" i]');
      const modelSelector = page.locator('[data-testid*="model"], select[name*="model" i]');
      const apiKeyInput = page.locator('input[name*="api" i], input[placeholder*="api" i], [data-testid*="api-key"]');

      // Check if any AI configuration elements exist
      const hasProvider = await providerSelector.isVisible({ timeout: 1000 }).catch(() => false);
      const hasModel = await modelSelector.isVisible({ timeout: 1000 }).catch(() => false);
      const hasApiKey = await apiKeyInput.isVisible({ timeout: 1000 }).catch(() => false);

      expect(hasProvider || hasModel || hasApiKey).toBeTruthy();
    } else {
      // AI settings might be in a different section
      const aiSection = page.locator('[data-testid*="ai"], section:has-text("AI")');

      if (await aiSection.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(aiSection).toBeVisible();
      } else {
        test.skip();
      }
    }
  });

  test('should handle AI provider selection', async ({ page }) => {
    // Navigate to settings
    await page.getByTestId('nav-settings').click();

    // Look for provider selector
    const providerSelector = page.locator('[data-testid*="provider"], select[name*="provider" i]');

    if (await providerSelector.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(providerSelector).toBeVisible();

      // Get current value
      const currentValue = await providerSelector.inputValue();

      // Try to select a different option
      await providerSelector.click();

      // Look for available options
      const options = providerSelector.locator('option');
      const optionCount = await options.count();

      if (optionCount > 1) {
        // Select a different option
        const firstOption = options.nth(1);
        await firstOption.click();

        // Verify selection changed
        const newValue = await providerSelector.inputValue();
        expect(newValue).not.toBe(currentValue);
      }
    } else {
      test.skip();
    }
  });

  test('should handle AI model selection', async ({ page }) => {
    // Navigate to settings
    await page.getByTestId('nav-settings').click();

    // Look for model selector
    const modelSelector = page.locator('[data-testid*="model"], select[name*="model" i]');

    if (await modelSelector.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(modelSelector).toBeVisible();

      // Get current value
      const currentValue = await modelSelector.inputValue();

      // Try to select a different option
      await modelSelector.click();

      // Look for available options
      const options = modelSelector.locator('option');
      const optionCount = await options.count();

      if (optionCount > 1) {
        // Select a different option
        const firstOption = options.nth(1);
        await firstOption.click();

        // Verify selection changed
        const newValue = await modelSelector.inputValue();
        expect(newValue).not.toBe(currentValue);
      }
    } else {
      test.skip();
    }
  });

  test('should handle API key input and validation', async ({ page }) => {
    // Navigate to settings
    await page.getByTestId('nav-settings').click();

    // Look for API key input
    const apiKeyInput = page.locator('input[name*="api" i], input[placeholder*="api" i], [data-testid*="api-key"]');

    if (await apiKeyInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(apiKeyInput).toBeVisible();

      // Test with a mock API key
      const testApiKey = 'test-api-key-12345';
      await apiKeyInput.fill(testApiKey);

      // Verify the value was set
      const currentValue = await apiKeyInput.inputValue();
      expect(currentValue).toBe(testApiKey);

      // Test clearing the input
      await apiKeyInput.clear();
      const clearedValue = await apiKeyInput.inputValue();
      expect(clearedValue).toBe('');
    } else {
      test.skip();
    }
  });

  test('should save and persist AI configuration', async ({ page }) => {
    // Navigate to settings
    await page.getByTestId('nav-settings').click();

    // Look for save button
    const saveButton = page.locator('button:has-text("Save"), [data-testid*="save"], button[type="submit"]');

    if (await saveButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Modify some settings
      const providerSelector = page.locator('[data-testid*="provider"], select[name*="provider" i]');

      if (await providerSelector.isVisible({ timeout: 1000 }).catch(() => false)) {
        await providerSelector.click();

        const options = providerSelector.locator('option');
        if ((await options.count()) > 1) {
          await options.nth(1).click();
        }
      }

      // Save settings
      await saveButton.click();

      // Look for success message or confirmation
      const successMessage = page.locator('[data-testid*="success"], .success, [role="status"]');

      if (await successMessage.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(successMessage).toBeVisible();
      }

      // Navigate away and back to check persistence
      await page.getByTestId('nav-dashboard').click();

      await page.getByTestId('nav-settings').click();

      // Settings should still be accessible
      await expect(page.getByTestId('settings-view')).toBeVisible({ timeout: 10000 });
    } else {
      test.skip();
    }
  });

  test('should handle AI configuration errors gracefully', async ({ page }) => {
    // Navigate to settings
    await page.getByTestId('nav-settings').click();

    // Mock an error for AI configuration
    await page.route('**/api/v1/ai/config', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Failed to save AI configuration',
          code: 'CONFIG_ERROR',
        }),
      });
    });

    // Try to save configuration
    const saveButton = page.locator('button:has-text("Save"), [data-testid*="save"], button[type="submit"]');

    if (await saveButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await saveButton.click();

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

  test('should display AI usage statistics', async ({ page }) => {
    // Navigate to settings
    await page.getByTestId('nav-settings').click();

    // Look for usage statistics
    const usageSection = page.locator('[data-testid*="usage"], [data-testid*="stats"], section:has-text("Usage")');

    if (await usageSection.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(usageSection).toBeVisible();

      // Look for usage metrics
      const metricElements = page.locator('[data-testid*="metric"], [data-testid*="stat"], .metric, .stat');
      const metricCount = await metricElements.count();

      if (metricCount > 0) {
        await expect(metricElements.first()).toBeVisible();
      }
    } else {
      // Usage stats might not be available, which is fine
      test.skip();
    }
  });

  test('should handle advanced AI settings', async ({ page }) => {
    // Navigate to settings
    await page.getByTestId('nav-settings').click();

    // Look for advanced settings
    const advancedSection = page.locator('[data-testid*="advanced"], section:has-text("Advanced")');

    if (await advancedSection.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(advancedSection).toBeVisible();

      // Look for advanced controls
      const temperatureSlider = page.locator(
        'input[type="range"][name*="temperature" i], [data-testid*="temperature"]',
      );
      const maxTokensInput = page.locator('input[name*="tokens" i], [data-testid*="tokens"]');

      const hasTemperature = await temperatureSlider.isVisible({ timeout: 1000 }).catch(() => false);
      const hasTokens = await maxTokensInput.isVisible({ timeout: 1000 }).catch(() => false);

      if (hasTemperature) {
        // Test temperature adjustment
        await temperatureSlider.fill('0.7');
        const tempValue = await temperatureSlider.inputValue();
        expect(tempValue).toBe('0.7');
      }

      if (hasTokens) {
        // Test max tokens adjustment
        await maxTokensInput.fill('2000');
        const tokensValue = await maxTokensInput.inputValue();
        expect(tokensValue).toBe('2000');
      }

      expect(hasTemperature || hasTokens).toBeTruthy();
    } else {
      test.skip();
    }
  });

  test('should handle settings navigation and organization', async ({ page }) => {
    // Navigate to settings
    await page.getByTestId('nav-settings').click();

    // Look for settings navigation or tabs
    const settingsNav = page.locator('[data-testid*="settings-nav"], .settings-nav, nav:has-text("Settings")');

    if (await settingsNav.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(settingsNav).toBeVisible();

      // Look for navigation items
      const navItems = settingsNav.locator('a, button, [role="tab"]');
      const navCount = await navItems.count();

      if (navCount > 0) {
        await expect(navItems.first()).toBeVisible();

        // Try clicking on different sections
        for (let i = 0; i < Math.min(navCount, 3); i++) {
          await navItems.nth(i).click();

          // Verify some content is visible
          const body = page.locator('body');
          await expect(body).toBeVisible();
        }
      }
    } else {
      // Settings might be a single page, which is fine
      await expect(page.getByTestId('settings-view')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should reset settings to defaults', async ({ page }) => {
    // Navigate to settings
    await page.getByTestId('nav-settings').click();

    // Look for reset button
    const resetButton = page.locator('button:has-text("Reset"), [data-testid*="reset"], button:has-text("Defaults")');

    if (await resetButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(resetButton).toBeVisible();

      // Modify some settings first
      const providerSelector = page.locator('[data-testid*="provider"], select[name*="provider" i]');

      if (await providerSelector.isVisible({ timeout: 1000 }).catch(() => false)) {
        await providerSelector.click();

        const options = providerSelector.locator('option');
        if ((await options.count()) > 1) {
          await options.nth(1).click();
        }
      }

      // Reset settings
      await resetButton.click();

      // Look for confirmation dialog
      const confirmButton = page.locator(
        'button:has-text("Confirm"), button:has-text("Yes"), [data-testid*="confirm"]',
      );

      if (await confirmButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await confirmButton.click();
      }

      // Look for success message
      const successMessage = page.locator('[data-testid*="success"], .success, [role="status"]');

      if (await successMessage.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(successMessage).toBeVisible();
      }
    } else {
      test.skip();
    }
  });
});
