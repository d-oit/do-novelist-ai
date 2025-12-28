/**
 * Drizzle ORM client for Turso database
 * Provides type-safe database operations with automatic schema inference
 */
import { createClient, type Client as LibSQLClient } from '@libsql/client/web';
import { drizzle } from 'drizzle-orm/libsql';

import { logger } from '@/lib/logging/logger';

import * as schema from './schemas';

// Re-export schema for convenience
export { schema };

// Drizzle client type
type DrizzleClient = ReturnType<typeof drizzle<typeof schema>>;

// Singleton instances
let libsqlClient: LibSQLClient | null = null;
let drizzleClient: DrizzleClient | null = null;

/**
 * Database configuration interface
 */
export interface DrizzleConfig {
  url: string;
  authToken: string;
}

/**
 * Check if a URL is valid for Turso database connection
 */
const isValidTursoUrl = (url: string): boolean => {
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
const isTestEnvironment = (): boolean => {
  if (typeof window !== 'undefined') {
    const env = import.meta.env;
    return (
      env?.PLAYWRIGHT_TEST === 'true' ||
      env?.PLAYWRIGHT === 'true' ||
      env?.NODE_ENV === 'test' ||
      env?.CI === 'true'
    );
  }
  return false;
};

/**
 * Get database configuration from storage or environment
 */
export const getDrizzleConfig = (): DrizzleConfig | null => {
  // In test environment, skip cloud
  if (isTestEnvironment()) {
    return null;
  }

  // Check localStorage first
  const stored = typeof window !== 'undefined' ? localStorage.getItem('novelist_db_config') : null;
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as { url: string; authToken: string; useCloud: boolean };
      if (parsed.useCloud && isValidTursoUrl(parsed.url)) {
        return { url: parsed.url, authToken: parsed.authToken };
      }
    } catch {
      // Invalid JSON, fall through to env check
    }
  }

  // Check environment variables
  const envUrl = (import.meta.env.VITE_TURSO_DATABASE_URL as string | undefined) ?? '';
  const envToken = (import.meta.env.VITE_TURSO_AUTH_TOKEN as string | undefined) ?? '';

  if (isValidTursoUrl(envUrl) && envToken.length > 0) {
    return { url: envUrl, authToken: envToken };
  }

  return null;
};

/**
 * Get or create the Drizzle client instance
 * Returns null if cloud database is not configured
 */
export const getDrizzleClient = (): DrizzleClient | null => {
  if (drizzleClient) return drizzleClient;

  const config = getDrizzleConfig();
  if (!config) return null;

  try {
    libsqlClient = createClient({
      url: config.url,
      authToken: config.authToken,
    });

    drizzleClient = drizzle(libsqlClient, { schema });
    logger.info('Drizzle ORM client initialized', { component: 'drizzle' });
    return drizzleClient;
  } catch (e) {
    logger.error(
      'Failed to create Drizzle client',
      { component: 'drizzle' },
      e instanceof Error ? e : undefined,
    );
    return null;
  }
};

/**
 * Reset the client (useful for testing or config changes)
 */
export const resetDrizzleClient = (): void => {
  drizzleClient = null;
  libsqlClient = null;
};

/**
 * Check if cloud database is available
 */
export const isCloudDbAvailable = (): boolean => {
  return getDrizzleClient() !== null;
};
