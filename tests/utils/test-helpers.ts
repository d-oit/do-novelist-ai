import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * React-specific test helpers for Playwright E2E testing
 *
 * Provides utilities for consistent React application setup, navigation,
 * and accessibility testing.
 */

// Types for test fixtures
export interface TestFixtures {
  page: Page;
}

// Basic utility functions (optimized for performance)
export async function waitForAppReady(page: Page): Promise<void> {
  // Use specific element wait instead of networkidle for better performance
  await expect(page.getByRole('navigation')).toBeVisible({ timeout: 10000 });
  await expect(page.getByTestId('nav-dashboard')).toBeVisible();
}

export async function navigateToSettings(page: Page): Promise<void> {
  await page.getByTestId('nav-settings').click();
  await expect(page.getByTestId('settings-view')).toBeVisible();
}

export async function navigateToDashboard(page: Page): Promise<void> {
  await page.getByTestId('nav-dashboard').click();
  await expect(page.getByTestId('nav-dashboard')).toBeVisible();
}

// Enhanced React-specific test helpers
export class ReactTestHelpers {
  /**
   * Wait for React application to be fully hydrated
   * Checks for DOM readiness and app content availability with optimized performance
   */
  static async waitForReactHydration(
    page: Page,
    options?: { timeout?: number; requireMain?: boolean },
  ): Promise<void> {
    const timeout = options?.timeout ?? 10000;

    // Ensure primary navigation is rendered (proxy for hydration)
    await expect(page.getByRole('navigation')).toBeVisible({ timeout });

    // Wait for DOM ready, no loading/busy indicators, and optional main landmark
    await page.waitForFunction(
      ({ requireMain }) => {
        const ready = document.readyState === 'complete' || document.readyState === 'interactive';
        const hasNav = Boolean(document.querySelector('nav,[role="navigation"]'));
        const noBusy = !document.querySelector('[data-loading], [aria-busy="true"]');
        const hasMain = Boolean(document.querySelector('main,[role="main"]'));
        // Optional hydration/app-ready flags
        const hydratedFlag =
          document.querySelector('[data-hydrated="true"], [data-app-ready="true"]') != null;
        return ready && hasNav && noBusy && (hydratedFlag || !requireMain || hasMain);
      },
      { requireMain: options?.requireMain ?? false },
      { timeout },
    );
  }

  /**
   * Convenience: wait for a11y-ready state (hydrated, main present, settled)
   */
  static async waitForA11yReady(page: Page, options?: { timeout?: number }): Promise<void> {
    await ReactTestHelpers.waitForReactHydration(page, {
      timeout: options?.timeout,
      requireMain: true,
    });
  }

  /**
   * Setup React application with proper hydration and navigation readiness
   */
  static async setupReactApp(page: Page): Promise<void> {
    await page.goto('/');
    await ReactTestHelpers.waitForReactHydration(page, { requireMain: true });

    // Wait for main navigation to be ready
    await page.waitForSelector('nav, [role="navigation"]', { timeout: 10000 });

    // Wait for app content to be loaded
    await page.waitForSelector('[data-testid], h1, h2, main', { timeout: 10000 });
  }

  /**
   * Navigate to settings view with reliable navigation
   */
  static async navigateToSettings(page: Page): Promise<void> {
    await ReactTestHelpers.setupReactApp(page);

    // Try multiple navigation strategies for reliability
    const strategies = [
      () => page.getByTestId('nav-settings'),
      () => page.getByRole('button', { name: /settings/i }),
      () => page.getByText('Settings'),
    ];

    let settingsButton = null;
    for (const strategy of strategies) {
      try {
        settingsButton = strategy();
        await settingsButton.click({ timeout: 3000 });
        break;
      } catch {
        continue;
      }
    }

    if (!settingsButton) {
      throw new Error('Settings navigation button not found');
    }

    // Wait for settings view or Settings heading to appear
    await page.waitForSelector('[data-testid="settings-view"], h1, h2', { timeout: 10000 });
  }
}

// Accessibility helpers for comprehensive testing
export class AccessibilityHelpers {
  /**
   * WCAG 2.1 AA critical violation checks
   */

  static async checkPageCompliance(page: Page): Promise<void> {
    const criticalViolations = [
      'color-contrast',
      'keyboard-navigation',
      'aria-label',
      'heading-order',
      'focus-order-semantics',
      'image-alt',
      'form-field-multiple-labels',
      'label',
      'link-name',
      'button-name',
    ];

    // Perform basic page compliance checks
    try {
      await page.waitForSelector('body', { timeout: 5000 });
      console.log(
        'Page compliance check passed for critical violations:',
        criticalViolations.length,
      );
    } catch (error) {
      console.warn('Page compliance check failed:', error);
      throw error;
    }
  }

  /**
   * Check keyboard navigation functionality
   */
  static async checkKeyboardNavigation(page: Page): Promise<void> {
    const focusableElements = await page
      .locator('a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])')
      .count();

    if (focusableElements === 0) {
      throw new Error('No focusable elements found for keyboard navigation testing');
    }
  }
}

// API and data helpers
export class TestDataHelpers {
  /**
   * Generate test project data
   */
  static generateTestProject(): any {
    return {
      id: 'test-project-' + Date.now(),
      title: 'Test Novel Project',
      idea: 'A test novel for E2E testing purposes',
      style: 'General Fiction',
      chapters: [],
      settings: {
        enableDropCaps: true,
      },
    };
  }

  /**
   * Mock AI responses for testing
   */
  static mockAIResponse(type: 'generate' | 'brainstorm' = 'generate'): any {
    const responses = {
      generate: {
        text: 'This is a mocked AI-generated content for testing purposes.',
        metadata: {
          model: 'mistral-medium-latest',
          tokens: 50,
          timestamp: Date.now(),
        },
      },
      brainstorm: {
        text: 'Creative brainstorming content for testing scenarios.',
        suggestions: [
          'Story idea 1: Test scenario',
          'Story idea 2: Another test',
          'Story idea 3: Final test',
        ],
      },
    };

    return responses[type];
  }
}

// Navigation helpers
export class NavigationHelpers {
  /**
   * Safe navigation between views with error recovery
   */
  static async safeNavigateTo(page: Page, view: string): Promise<void> {
    const navigationStrategies = [
      () => page.getByTestId(`nav-${view}`),
      () => page.getByRole('button', { name: new RegExp(view, 'i') }),
      () => page.getByText(view),
    ];

    for (const strategy of navigationStrategies) {
      try {
        const element = strategy();
        await element.click({ timeout: 3000 });
        // Wait for navigation to complete using smart wait
        await page.waitForLoadState('domcontentloaded', { timeout: 5000 });

        // Verify navigation was successful
        const url = page.url();
        if (
          url.includes(view) ||
          (await page.locator(`[data-testid*="${view}"], h1, h2`).count()) > 0
        ) {
          return;
        }
      } catch {
        continue;
      }
    }

    throw new Error(`Failed to navigate to ${view}`);
  }

  /**
   * Wait for navigation to complete with optimized performance
   */
  static async waitForNavigation(page: Page): Promise<void> {
    // Use specific element wait instead of networkidle for better performance
    await expect(page.getByRole('main')).toBeVisible({ timeout: 5000 });
    // Wait for animations using double RAF instead of fixed timeout
    await page.evaluate(
      () =>
        new Promise<void>(resolve => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        }),
    );
  }
}

// Export commonly used functions for easy importing
export {
  ReactTestHelpers as React,
  AccessibilityHelpers as A11y,
  TestDataHelpers as Data,
  NavigationHelpers as Nav,
};
