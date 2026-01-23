/**
 * Test Pattern Extractors for Common E2E Test Scenarios
 *
 * Provides reusable patterns for:
 * - Modal interactions
 * - Form submissions
 * - Navigation patterns
 * - Error handling
 * - Loading states
 */

import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { BrowserCompatibility } from './browser-compatibility';
import {
  browserSpecificClick,
  crossBrowserWait,
  dismissModalCompat,
  browserSpecificFill,
} from './browser-helpers';

/**
 * Modal interaction patterns
 */
export const ModalPattern = {
  /**
   * Open a modal and verify it's visible
   */
  async open(
    page: Page,
    compatibility: BrowserCompatibility,
    openSelector: string,
    modalSelector: string,
  ): Promise<void> {
    await browserSpecificClick(page, compatibility, openSelector);
    await crossBrowserWait(page, compatibility, modalSelector, { state: 'visible' });
    await expect(page.locator(modalSelector)).toBeVisible();
  },

  /**
   * Close a modal using multiple strategies
   */
  async close(
    page: Page,
    compatibility: BrowserCompatibility,
    modalSelector: string,
  ): Promise<void> {
    await dismissModalCompat(page, compatibility, modalSelector);
    await expect(page.locator(modalSelector)).toBeHidden({ timeout: 5000 });
  },

  /**
   * Verify modal content
   */
  async verifyContent(page: Page, contentSelector: string, expectedText: string): Promise<void> {
    const content = page.locator(contentSelector);
    await expect(content).toContainText(expectedText);
  },

  /**
   * Interact with modal form
   */
  async fillAndSubmit(
    page: Page,
    compatibility: BrowserCompatibility,
    formSelector: string,
    fields: Record<string, string>,
    submitSelector: string,
  ): Promise<void> {
    const form = page.locator(formSelector);

    // Fill all fields
    for (const [fieldSelector, value] of Object.entries(fields)) {
      const field = form.locator(fieldSelector);
      await field.fill(value);
    }

    // Submit
    await browserSpecificClick(page, compatibility, submitSelector);
  },
};

/**
 * Form submission patterns
 */
export const FormPattern = {
  /**
   * Fill a form field with error handling
   */
  async fillField(
    page: Page,
    compatibility: BrowserCompatibility,
    selector: string,
    value: string,
    options?: { clear?: boolean },
  ): Promise<void> {
    const field = page.locator(selector);
    await crossBrowserWait(page, compatibility, selector, { state: 'visible' });

    if (options?.clear) {
      await field.click();
      await page.keyboard.press('Control+a');
    }

    await browserSpecificFill(page, compatibility, selector, value);
  },

  /**
   * Submit a form and verify success/error
   */
  async submit(
    page: Page,
    compatibility: BrowserCompatibility,
    submitSelector: string,
    options?: {
      waitForNavigation?: boolean;
      successSelector?: string;
      errorSelector?: string;
    },
  ): Promise<{ success: boolean; message?: string }> {
    await browserSpecificClick(page, compatibility, submitSelector);

    if (options?.waitForNavigation) {
      await page.waitForLoadState('domcontentloaded');
    }

    // Check for success
    if (options?.successSelector) {
      const success = await page
        .locator(options.successSelector)
        .isVisible({ timeout: 3000 })
        .catch(() => false);
      if (success) {
        return { success: true };
      }
    }

    // Check for errors
    if (options?.errorSelector) {
      const error = await page
        .locator(options.errorSelector)
        .isVisible({ timeout: 3000 })
        .catch(() => false);
      if (error) {
        const message = await page.locator(options.errorSelector).textContent();
        return { success: false, message: message || undefined };
      }
    }

    return { success: true };
  },

  /**
   * Validate form fields
   */
  async validateField(
    page: Page,
    selector: string,
    validation: { required?: boolean; minLength?: number; pattern?: RegExp },
  ): Promise<boolean> {
    const field = page.locator(selector);

    // Check required
    if (validation.required) {
      const isRequired = await field.getAttribute('aria-required');
      if (isRequired !== 'true') {
        return false;
      }
    }

    // Check pattern
    if (validation.pattern) {
      const value = await field.inputValue();
      if (!validation.pattern.test(value)) {
        return false;
      }
    }

    // Check min length
    if (validation.minLength) {
      const value = await field.inputValue();
      if (value.length < validation.minLength) {
        return false;
      }
    }

    return true;
  },
};

/**
 * Navigation patterns
 */
export const NavigationPattern = {
  /**
   * Navigate to a page and verify
   */
  async goto(
    page: Page,
    compatibility: BrowserCompatibility,
    url: string,
    expectedSelector?: string,
  ): Promise<void> {
    await page.goto(url, {
      timeout: 30000 * compatibility.getTimeoutMultiplier(),
      waitUntil: 'networkidle',
    });

    if (expectedSelector) {
      await crossBrowserWait(page, compatibility, expectedSelector);
      await expect(page.locator(expectedSelector)).toBeVisible();
    }
  },

  /**
   * Click a navigation link and verify page change
   */
  async clickLink(
    page: Page,
    compatibility: BrowserCompatibility,
    linkSelector: string,
    expectedSelector: string,
  ): Promise<void> {
    await browserSpecificClick(page, compatibility, linkSelector);
    await page.waitForLoadState('domcontentloaded');
    await crossBrowserWait(page, compatibility, expectedSelector);
    await expect(page.locator(expectedSelector)).toBeVisible();
  },

  /**
   * Navigate browser back/forward
   */
  async browserBack(page: Page, expectedSelector: string): Promise<void> {
    await page.goBack();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator(expectedSelector)).toBeVisible();
  },

  async browserForward(page: Page, expectedSelector: string): Promise<void> {
    await page.goForward();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator(expectedSelector)).toBeVisible();
  },

  /**
   * Navigate using keyboard
   */
  async keyboardNavigate(page: Page, keySequence: string[]): Promise<void> {
    for (const key of keySequence) {
      await page.keyboard.press(key);
      await page.waitForTimeout(100);
    }
  },
};

/**
 * Error handling patterns
 */
export const ErrorPattern = {
  /**
   * Catch and verify error message
   */
  async verifyError(page: Page, errorSelector: string, expectedMessage?: string): Promise<boolean> {
    const error = await page
      .locator(errorSelector)
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    if (!error) {
      return false;
    }

    if (expectedMessage) {
      const text = await page.locator(errorSelector).textContent();
      return text?.includes(expectedMessage) || false;
    }

    return true;
  },

  /**
   * Verify error boundary
   */
  async verifyErrorBoundary(page: Page, boundarySelector: string): Promise<boolean> {
    const boundary = await page
      .locator(boundarySelector)
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    return boundary;
  },

  /**
   * Verify fallback UI
   */
  async verifyFallback(page: Page, fallbackSelector: string): Promise<boolean> {
    const fallback = await page
      .locator(fallbackSelector)
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    return fallback;
  },

  /**
   * Try an action and handle expected errors
   */
  async tryWithError(
    action: () => Promise<void>,
    errorHandler: (error: Error) => void,
  ): Promise<{ success: boolean; error?: Error }> {
    try {
      await action();
      return { success: true };
    } catch (error) {
      errorHandler(error as Error);
      return { success: false, error: error as Error };
    }
  },
};

/**
 * Loading state patterns
 */
export const LoadingPattern = {
  /**
   * Wait for loading state to complete
   */
  async waitForLoad(page: Page, loadingSelector: string, contentSelector: string): Promise<void> {
    // Wait for loading indicator to appear (optional)
    await page
      .locator(loadingSelector)
      .isVisible({ timeout: 1000 })
      .catch(() => {});

    // Wait for loading to complete
    await expect(page.locator(loadingSelector)).toBeHidden({ timeout: 15000 });

    // Wait for content to appear
    await expect(page.locator(contentSelector)).toBeVisible({ timeout: 5000 });
  },

  /**
   * Verify loading state is active
   */
  async isLoading(page: Page, loadingSelector: string): Promise<boolean> {
    return await page
      .locator(loadingSelector)
      .isVisible({ timeout: 1000 })
      .catch(() => false);
  },

  /**
   * Verify skeleton loaders
   */
  async verifySkeleton(page: Page, skeletonSelector: string): Promise<boolean> {
    return await page
      .locator(skeletonSelector)
      .isVisible({ timeout: 1000 })
      .catch(() => false);
  },

  /**
   * Wait for content after loading
   */
  async waitForContent(
    page: Page,
    contentSelector: string,
    timeout: number = 10000,
  ): Promise<void> {
    await expect(page.locator(contentSelector)).toBeVisible({ timeout });
  },
};

/**
 * Assertion patterns
 */
export const AssertionPattern = {
  /**
   * Verify element is visible
   */
  async isVisible(page: Page, selector: string, timeout: number = 5000): Promise<boolean> {
    return await page
      .locator(selector)
      .isVisible({ timeout })
      .catch(() => false);
  },

  /**
   * Verify element has text
   */
  async hasText(
    page: Page,
    selector: string,
    expectedText: string,
    timeout: number = 5000,
  ): Promise<boolean> {
    const element = page.locator(selector);
    await element.waitFor({ state: 'visible', timeout }).catch(() => {});
    const text = await element.textContent();
    return text?.includes(expectedText) || false;
  },

  /**
   * Verify element has attribute
   */
  async hasAttribute(
    page: Page,
    selector: string,
    attribute: string,
    expectedValue?: string,
  ): Promise<boolean> {
    const element = page.locator(selector);
    const value = await element.getAttribute(attribute);
    return expectedValue ? value === expectedValue : value !== null;
  },

  /**
   * Verify element count
   */
  async countEquals(page: Page, selector: string, expectedCount: number): Promise<boolean> {
    const count = await page.locator(selector).count();
    return count === expectedCount;
  },
};

/**
 * Keyboard interaction patterns
 */
export const KeyboardPattern = {
  /**
   * Navigate using Tab key
   */
  async tabNavigate(
    page: Page,
    count: number,
    verifyFocus?: (index: number) => Promise<void>,
  ): Promise<void> {
    for (let i = 0; i < count; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(50);

      if (verifyFocus) {
        await verifyFocus(i + 1);
      }
    }
  },

  /**
   * Press Enter on focused element
   */
  async enter(page: Page): Promise<void> {
    await page.keyboard.press('Enter');
    await page.waitForLoadState('domcontentloaded');
  },

  /**
   * Press Escape
   */
  async escape(page: Page): Promise<void> {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  },

  /**
   * Type text with verification
   */
  async type(page: Page, selector: string, text: string): Promise<void> {
    const field = page.locator(selector);
    await field.fill(text);
    await expect(field).toHaveValue(text);
  },
};

/**
 * Test data helpers
 */
export const TestDataPattern = {
  /**
   * Generate test project data
   */
  generateProject(overrides?: Partial<{ title: string; idea: string }>) {
    return {
      title: 'Test Project',
      idea: 'A test project for E2E validation',
      ...overrides,
    };
  },

  /**
   * Generate test chapter data
   */
  generateChapter(overrides?: Partial<{ title: string; content: string }>) {
    return {
      title: 'Test Chapter',
      content: 'This is test chapter content.',
      ...overrides,
    };
  },

  /**
   * Generate test character data
   */
  generateCharacter(overrides?: Partial<{ name: string; role: string }>) {
    return {
      name: 'Test Character',
      role: 'Protagonist',
      ...overrides,
    };
  },
};

export default {
  ModalPattern,
  FormPattern,
  NavigationPattern,
  ErrorPattern,
  LoadingPattern,
  AssertionPattern,
  KeyboardPattern,
  TestDataPattern,
};
