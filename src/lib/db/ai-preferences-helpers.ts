/**
 * AI Preferences Database Helpers
 * Client creation and validation utilities
 */

import { createClient } from '@libsql/client/web';

import { logger } from '@/lib/logging/logger';

type Client = ReturnType<typeof createClient>;

const STORAGE_KEY = 'novelist_ai_preferences';

/**
 * Check if a URL is valid for Turso database connection
 */
export const isValidTursoUrl = (url: string): boolean => {
  if (!url || url.length < 10) return false;
  if (url === 'test-url' || url.startsWith('test-')) return false;
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === 'libsql:' || parsed.protocol === 'https:' || parsed.protocol === 'http:'
    );
  } catch {
    return false;
  }
};

/**
 * Check if running in test environment
 */
export const isTestEnvironment = (): boolean => {
  if (typeof window !== 'undefined') {
    const env = import.meta.env;
    return (
      env?.PLAYWRIGHT_TEST === 'true' ||
      env?.PLAYWRIGHT === 'true' ||
      env?.NODE_ENV === 'test' ||
      env?.CI === 'true'
    );
  }
  if (typeof process !== 'undefined' && process.env) {
    return (
      process.env.PLAYWRIGHT_TEST === 'true' ||
      process.env.PLAYWRIGHT === 'true' ||
      process.env.NODE_ENV === 'test' ||
      process.env.CI === 'true'
    );
  }
  return false;
};

/**
 * Get database client (reuses existing client from db.ts if available)
 */
export function getClient(): Client | null {
  if (isTestEnvironment()) {
    return null;
  }

  const url = import.meta.env.VITE_TURSO_DATABASE_URL as string | undefined;
  const authToken = import.meta.env.VITE_TURSO_AUTH_TOKEN as string | undefined;

  if (url == null || authToken == null || !isValidTursoUrl(url)) {
    return null;
  }

  try {
    return createClient({ url, authToken });
  } catch (e) {
    logger.error('Failed to create Turso client for AI preferences', {
      component: 'ai-preferences',
      error: e,
    });
    return null;
  }
}

/**
 * Get storage key for a user
 */
export const getStorageKey = (userId: string): string => `${STORAGE_KEY}_${userId}`;
