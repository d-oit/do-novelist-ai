/**
 * Database Services Index
 * Central export point for all database operations
 */

// AI Preferences Database Service
export {
  initAIPreferencesDB,
  getUserAIPreference,
  saveUserAIPreference,
  getProviderCapabilities,
  saveProviderCapability,
  logUsageAnalytic,
  getUserUsageStats,
  getProviderHealth,
  updateProviderHealth,
  type UsageStats
} from './ai-preferences';

// AI Preferences Schema Types
export type {
  UserAIPreference,
  AIProviderCapability,
  AIUsageAnalytic,
  AIProviderHealth
} from './schemas/ai-preferences-schema';
