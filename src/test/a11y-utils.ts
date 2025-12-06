/**
 * Accessibility Testing Utilities
 *
 * This module provides utilities for automated accessibility testing
 * using axe-core integration for React components.
 *
 * @see https://github.com/dequelabs/axe-core-npm
 */

import type { RenderResult } from '@testing-library/react';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import axe, { type AxeResults } from 'axe-core';

/**
 * Axe configuration for WCAG 2.1 AA compliance
 */
const axeConfig = {
  runOnly: {
    type: 'tag' as const,
    values: [
      'wcag2a', // WCAG 2.0 Level A
      'wcag2aa', // WCAG 2.0 Level AA
      'wcag21aa', // WCAG 2.1 Level AA
      'best-practice',
    ] as string[],
  },
};

/**
 * Accessibility violation severity levels
 */
export type ViolationSeverity = 'critical' | 'serious' | 'moderate' | 'minor';

/**
 * Accessibility violation interface
 */
export interface A11yViolation {
  id: string;
  impact: ViolationSeverity | null;
  description: string;
  help: string;
  helpUrl: string;
  nodes: Array<{
    html: string;
    target: string[];
    failureSummary?: string;
  }>;
}

/**
 * Accessibility test result
 */
export interface A11yTestResult {
  violations: A11yViolation[];
  passes: number;
  incomplete: number;
  inapplicable: number;
}

/**
 * Run accessibility tests on a rendered component
 *
 * @param container - The DOM container to test
 * @returns Promise with accessibility test results
 */
export async function runA11yTests(container: HTMLElement): Promise<A11yTestResult> {
  return new Promise((resolve, reject) => {
    axe.run(container, axeConfig, (error, results) => {
      if (error) {
        reject(error);
        return;
      }

      resolve({
        violations: results.violations as A11yViolation[],
        passes: results.passes.length,
        incomplete: results.incomplete.length,
        inapplicable: results.inapplicable.length,
      });
    });
  });
}

/**
 * Render a component and run accessibility tests
 *
 * @param ui - React element to render
 * @returns Promise with render result and accessibility test results
 */
export async function renderWithA11y(
  ui: ReactElement,
): Promise<{ renderResult: RenderResult; a11y: A11yTestResult }> {
  const renderResult = render(ui);
  const a11y = await runA11yTests(renderResult.container);

  return { renderResult, a11y };
}

/**
 * Assert that a component has no accessibility violations
 *
 * @param container - The DOM container to test
 * @returns Promise that rejects if violations are found
 */
export async function expectNoA11yViolations(container: HTMLElement): Promise<void> {
  return new Promise((resolve, reject) => {
    axe.run(container, axeConfig, (error, results) => {
      if (error) {
        reject(error);
        return;
      }

      if (results.violations && results.violations.length > 0) {
        const violationMessages = results.violations
          .map((v: axe.Result) => `[${v.id}] ${v.help}: ${v.description}`)
          .join('\n');

        reject(new Error(`Accessibility violations found:\n${violationMessages}`));
      } else {
        resolve();
      }
    });
  });
}

/**
 * Get violations grouped by severity
 *
 * @param violations - Array of accessibility violations
 * @returns Object with violations grouped by severity
 */
export function groupViolationsBySeverity(
  violations: A11yViolation[],
): Record<ViolationSeverity, A11yViolation[]> {
  return {
    critical: violations.filter(v => v.impact === 'critical'),
    serious: violations.filter(v => v.impact === 'serious'),
    moderate: violations.filter(v => v.impact === 'moderate'),
    minor: violations.filter(v => v.impact === 'minor'),
  };
}

/**
 * Format violations for console output
 *
 * @param violations - Array of accessibility violations
 * @returns Formatted string for logging
 */
export function formatViolations(violations: A11yViolation[]): string {
  if (violations.length === 0) {
    return 'No accessibility violations found.';
  }

  const grouped = groupViolationsBySeverity(violations);

  let output = `Found ${violations.length} accessibility violation(s):\n\n`;

  const severityOrder: ViolationSeverity[] = ['critical', 'serious', 'moderate', 'minor'];

  for (const severity of severityOrder) {
    const items = grouped[severity] || [];
    if (items.length > 0) {
      output += `=== ${severity.toUpperCase()} (${items.length}) ===\n`;
      for (const violation of items) {
        output += `\n[${violation.id}] ${violation.help}\n`;
        output += `  Description: ${violation.description}\n`;
        output += `  Help: ${violation.helpUrl}\n`;
        output += `  Affected elements:\n`;
        for (const node of violation.nodes) {
          output += `    - ${node.target.join(' > ')}\n`;
          if (node.failureSummary) {
            output += `      ${node.failureSummary}\n`;
          }
        }
      }
      output += '\n';
    }
  }

  return output;
}

/**
 * Check if element is keyboard focusable
 *
 * @param element - DOM element to check
 * @returns True if element can receive keyboard focus
 */
export function isKeyboardFocusable(element: HTMLElement): boolean {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ];

  return focusableSelectors.some(selector => element.matches(selector));
}

/**
 * Get all focusable elements within a container
 *
 * @param container - Container element to search within
 * @returns Array of focusable elements
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  return Array.from(container.querySelectorAll<HTMLElement>(selectors));
}

/**
 * Simulate keyboard navigation through focusable elements
 *
 * @param container - Container element
 * @param direction - Direction to navigate ('forward' or 'backward')
 * @returns The element that would receive focus
 */
export function simulateTabNavigation(
  container: HTMLElement,
  direction: 'forward' | 'backward' = 'forward',
): HTMLElement | null {
  const focusable = getFocusableElements(container);
  const activeElement = document.activeElement as HTMLElement;

  if (focusable.length === 0) return null;

  const currentIndex = focusable.indexOf(activeElement);

  if (direction === 'forward') {
    const nextIndex = currentIndex + 1 >= focusable.length ? 0 : currentIndex + 1;
    return focusable[nextIndex] ?? null;
  } else {
    const prevIndex = currentIndex <= 0 ? focusable.length - 1 : currentIndex - 1;
    return focusable[prevIndex] ?? null;
  }
}

/**
 * Check color contrast ratio
 * Note: This is a simplified check. For production, use axe-core's built-in contrast checker.
 *
 * @param foreground - Foreground color in hex format
 * @param background - Background color in hex format
 * @returns Contrast ratio
 */
export function getContrastRatio(foreground: string, background: string): number {
  const getLuminance = (color: string): number => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const toLinear = (c: number): number =>
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG AA requirements
 *
 * @param ratio - Contrast ratio
 * @param isLargeText - Whether the text is large (14pt bold or 18pt)
 * @returns True if meets WCAG AA requirements
 */
export function meetsWcagAA(ratio: number, isLargeText: boolean = false): boolean {
  return isLargeText ? ratio >= 3.0 : ratio >= 4.5;
}

/**
 * Common accessibility validation functions
 */
export const a11yValidators = {
  /**
   * Check if interactive elements have accessible names
   */
  hasAccessibleName: (element: HTMLElement): boolean => {
    const name =
      element.getAttribute('aria-label') ??
      element.getAttribute('aria-labelledby') ??
      element.textContent?.trim();
    return Boolean(name);
  },

  /**
   * Check if element has proper role
   */
  hasRole: (element: HTMLElement, role: string): boolean => {
    const actualRole = element.getAttribute('role') ?? element.tagName.toLowerCase();
    return actualRole === role;
  },

  /**
   * Check if element is keyboard accessible
   */
  isKeyboardAccessible: (element: HTMLElement): boolean => {
    return isKeyboardFocusable(element);
  },

  /**
   * Check if images have alt text
   */
  hasAltText: (img: HTMLImageElement): boolean => {
    const alt = img.getAttribute('alt');
    if (alt === null) return false;
    // Decorative images should have empty alt
    if (img.getAttribute('role') !== 'presentation') {
      return alt !== '';
    }
    return true;
  },

  /**
   * Check if button has accessible name
   */
  hasButtonAccessibleName: (button: HTMLButtonElement): boolean => {
    return a11yValidators.hasAccessibleName(button);
  },

  /**
   * Check if link has accessible name
   */
  hasLinkAccessibleName: (link: HTMLAnchorElement): boolean => {
    const name =
      link.getAttribute('aria-label') ??
      link.getAttribute('aria-labelledby') ??
      link.textContent?.trim();
    return Boolean(name);
  },

  /**
   * Check if form field has proper label association
   */
  hasProperLabel: (field: HTMLElement): boolean => {
    const id = field.getAttribute('id');
    if (!id) return false;

    const label = document.querySelector(`label[for="${id}"]`) as HTMLLabelElement;
    if (label) return true;

    // Check for aria-labelledby
    const labelledBy = field.getAttribute('aria-labelledby');
    if (labelledBy) return true;

    // Check for aria-label
    const ariaLabel = field.getAttribute('aria-label');
    if (ariaLabel) return true;

    return false;
  },
};

// Export types for consumers
export type { AxeResults };
