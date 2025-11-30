import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes with proper conflict resolution
 * Uses clsx for conditional classes and tailwind-merge for deduplication
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: Array<unknown>) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Format number with proper locale support
 */
export function formatNumber(num: number, locale: string = 'en-US'): string {
  return new Intl.NumberFormat(locale).format(num);
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * Check if code is running on client side
 */
export const isClient = typeof window !== 'undefined';

/**
 * Safe localStorage access with fallbacks
 */
export const storage = {
  get: (key: string, defaultValue?: unknown): unknown => {
    if (!isClient) return defaultValue;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  set: (key: string, value: unknown): void => {
    if (!isClient) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  },

  remove: (key: string): void => {
    if (!isClient) return;
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
    }
  },
};

/**
 * Touch target classes for mobile accessibility
 * Ensures 44x44px minimum per WCAG 2.1 guidelines
 * Automatically resets to normal size on desktop (md: breakpoint)
 */
export const touchTarget = (className?: string): string =>
  cn('min-h-[44px] min-w-[44px]', 'md:min-h-auto md:min-w-auto', className ?? '');

/**
 * Icon button touch target (maintains square aspect ratio)
 * Perfect for icon-only buttons that need to meet WCAG 44x44px minimum
 * Centers content within the touch target
 */
export const iconButtonTarget = (className?: string): string =>
  cn(
    'min-h-[44px] min-w-[44px]',
    'flex items-center justify-center',
    'md:min-h-auto md:min-w-auto',
    className
  );
