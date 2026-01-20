import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { logger } from '@/lib/logging/logger';
import { storageAdapter, KV_NAMESPACES } from '@/lib/storage-adapter';

/**
 * Utility function to merge Tailwind CSS classes with proper conflict resolution
 * Uses clsx for conditional classes and tailwind-merge for deduplication
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Get or create anonymous user ID from storage
 * Used for AI settings and other user-specific features
 */
export async function getUserId(): Promise<string> {
  try {
    const userId = await storageAdapter.get<string>(KV_NAMESPACES.USER, 'userId');
    if (userId == null || userId === '') {
      // Use crypto.getRandomValues for cryptographically secure random values
      const randomBytes = new Uint8Array(8);
      crypto.getRandomValues(randomBytes);
      const randomString = Array.from(randomBytes)
        .map(b => b.toString(36))
        .join('')
        .slice(0, 10);

      const newUserId = `user_${Date.now()}_${randomString}`;
      await storageAdapter.set(KV_NAMESPACES.USER, 'userId', newUserId);
      return newUserId;
    }
    return userId;
  } catch {
    // Fallback for when storage is not available (e.g. server-side or restricted)
    return `user_temp_${Date.now()}`;
  }
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: Array<unknown>) => unknown>(
  func: T,
  wait: number,
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
 * Safe storage access with fallbacks
 * @deprecated Use storageAdapter directly instead
 */
export const storage = {
  get: async (key: string, defaultValue?: unknown): Promise<unknown> => {
    if (!isClient) return defaultValue;
    try {
      const item = await storageAdapter.get<unknown>(KV_NAMESPACES.SETTINGS, key);
      return item !== null && item !== undefined ? item : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  set: async (key: string, value: unknown): Promise<void> => {
    if (!isClient) return;
    try {
      await storageAdapter.set(KV_NAMESPACES.SETTINGS, key, value);
    } catch (error) {
      logger.warn('Failed to save to storage', {
        component: 'storage',
        error,
        key,
      });
    }
  },

  remove: async (key: string): Promise<void> => {
    if (!isClient) return;
    try {
      await storageAdapter.delete(KV_NAMESPACES.SETTINGS, key);
    } catch (error) {
      logger.warn('Failed to remove from storage', {
        component: 'storage',
        error,
        key,
      });
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
    className,
  );
