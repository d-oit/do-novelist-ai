/**
 * Database module exports
 *
 * This module provides database functionality using Drizzle ORM with Turso.
 * Falls back to localStorage for offline/local development.
 */

// Drizzle client and configuration
export {
  getDrizzleClient,
  getDrizzleConfig,
  isCloudDbAvailable,
  resetDrizzleClient,
} from './drizzle';

// Configuration helpers
export { getStoredConfig, saveStoredConfig, testDbConnection, type DbConfig } from './config';

// Database schemas
export * as schema from './schemas';

// Database services
export { drizzleDbService } from './services';
