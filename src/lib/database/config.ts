/**
 * Database configuration management
 */
import { resetDrizzleClient } from './drizzle';
import { drizzleDbService } from './services';

export interface DbConfig {
  url: string;
  authToken: string;
  useCloud: boolean;
}

const STORAGE_KEY = 'novelist_db_config';

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
 * Get database configuration
 */
export const getStoredConfig = (): DbConfig => {
  // In test environment, skip cloud
  if (isTestEnvironment()) {
    return { url: '', authToken: '', useCloud: false };
  }

  // Check localStorage first
  const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as DbConfig;
      return parsed;
    } catch {
      // Invalid JSON, fall through to env check
    }
  }

  // Check environment variables
  const envUrl = (import.meta.env.VITE_TURSO_DATABASE_URL as string | undefined) ?? '';
  const envToken = (import.meta.env.VITE_TURSO_AUTH_TOKEN as string | undefined) ?? '';

  const validUrl = isValidTursoUrl(envUrl);
  const hasToken = envToken.length > 0;

  return {
    url: validUrl ? envUrl : '',
    authToken: hasToken ? envToken : '',
    useCloud: validUrl && hasToken,
  };
};

/**
 * Save database configuration
 */
export const saveStoredConfig = (config: DbConfig): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    // Reset client to force reconnection with new config
    resetDrizzleClient();
  }
};

/**
 * Test database connection
 */
export const testDbConnection = async (): Promise<boolean> => {
  try {
    resetDrizzleClient();
    // Try to init (which checks connection)
    await drizzleDbService.init();
    // If we're still using cloud after init, it succeeded
    const currentConfig = getStoredConfig();
    return currentConfig.useCloud;
  } catch {
    return false;
  }
};
