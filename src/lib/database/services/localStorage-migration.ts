/**
 * localStorage to Turso Migration Service
 * Migrates existing localStorage data to Turso database
 */
import { logger } from '@/lib/logging/logger';

import { kvService, KV_NAMESPACES } from './key-value-service';

/**
 * localStorage keys that need to be migrated
 */
const LOCALSTORAGE_MAPPINGS = {
  // User-related
  novelist_user_id: { namespace: KV_NAMESPACES.USER, key: 'userId' },
  'novelist-theme': { namespace: KV_NAMESPACES.USER, key: 'theme' },

  // AI Configuration
  novelist_ai_preferences_capabilities: { namespace: KV_NAMESPACES.AI, key: 'capabilities' },
  novelist_ai_preferences_analytics: { namespace: KV_NAMESPACES.AI, key: 'analytics' },
  novelist_ai_preferences_health: { namespace: KV_NAMESPACES.AI, key: 'health' },

  // Writing Assistant
  novelist_writing_assistant_config: {
    namespace: KV_NAMESPACES.WRITING_ASSISTANT,
    key: 'config',
  },
  novelist_writing_assistant_active: {
    namespace: KV_NAMESPACES.WRITING_ASSISTANT,
    key: 'active',
  },
  novelist_writing_goals: { namespace: KV_NAMESPACES.WRITING_ASSISTANT, key: 'goals' },

  // Onboarding
  novelist_onboarding_complete: { namespace: KV_NAMESPACES.ONBOARDING, key: 'complete' },
  novelist_onboarding_step: { namespace: KV_NAMESPACES.ONBOARDING, key: 'step' },

  // Settings
  novelist_settings: { namespace: KV_NAMESPACES.SETTINGS, key: 'general' },

  // Database Config
  novelist_db_config: { namespace: KV_NAMESPACES.DB_CONFIG, key: 'config' },

  // Device
  novelist_device_id: { namespace: KV_NAMESPACES.USER, key: 'deviceId' },

  // Model Cache
  openrouter_models_cache: { namespace: KV_NAMESPACES.MODELS, key: 'openrouter' },

  // Plot Engine Feedback
  'plot-engine-feedback': { namespace: KV_NAMESPACES.PLOT_FEEDBACK, key: 'feedback' },

  // Projects (local fallback)
  novelist_local_projects: { namespace: KV_NAMESPACES.PROJECTS, key: 'local_projects' },
} as const;

/**
 * User-specific localStorage keys (require userId context)
 */
const USER_SPECIFIC_PREFIX = 'novelist_ai_preferences_';

/**
 * Migration Service
 */
export class LocalStorageMigrationService {
  /**
   * Check if migration has already been run
   */
  async isMigrated(): Promise<boolean> {
    try {
      const flag = await kvService.get<boolean>(KV_NAMESPACES.USER, 'migration_complete');
      return flag === true;
    } catch {
      return false;
    }
  }

  /**
   * Mark migration as complete
   */
  async markMigrated(): Promise<void> {
    await kvService.set(KV_NAMESPACES.USER, 'migration_complete', true);
  }

  /**
   * Migrate all localStorage data to Turso
   */
  async migrate(): Promise<{ success: boolean; migrated: number; errors: number }> {
    if (typeof window === 'undefined') {
      return { success: false, migrated: 0, errors: 0 };
    }

    // Check if already migrated
    if (await this.isMigrated()) {
      logger.info('Migration already completed, skipping', { component: 'migration' });
      return { success: true, migrated: 0, errors: 0 };
    }

    logger.info('Starting localStorage to Turso migration', { component: 'migration' });

    let migratedCount = 0;
    let errors = 0;

    try {
      // Get current user ID (if available)
      const userId = localStorage.getItem('novelist_user_id') || undefined;

      // Migrate standard keys
      for (const [localKey, mapping] of Object.entries(LOCALSTORAGE_MAPPINGS)) {
        try {
          const value = localStorage.getItem(localKey);
          if (value !== null) {
            // Try to parse as JSON, fall back to raw string
            let parsedValue: unknown;
            try {
              parsedValue = JSON.parse(value);
            } catch {
              parsedValue = value;
            }

            await kvService.set(mapping.namespace, mapping.key, parsedValue, userId);
            migratedCount++;
            logger.debug('Migrated localStorage key', {
              component: 'migration',
              key: localKey,
              namespace: mapping.namespace,
            });
          }
        } catch (error) {
          errors++;
          logger.error(
            'Failed to migrate localStorage key',
            { component: 'migration', key: localKey },
            error instanceof Error ? error : undefined,
          );
        }
      }

      // Migrate user-specific AI preferences (with userId suffix)
      if (userId) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(USER_SPECIFIC_PREFIX) && key !== USER_SPECIFIC_PREFIX) {
            try {
              const value = localStorage.getItem(key);
              if (value !== null) {
                let parsedValue: unknown;
                try {
                  parsedValue = JSON.parse(value);
                } catch {
                  parsedValue = value;
                }

                // Extract the suffix (e.g., 'user-123' from 'novelist_ai_preferences_user-123')
                const suffix = key.substring(USER_SPECIFIC_PREFIX.length);
                await kvService.set(KV_NAMESPACES.AI, `preferences_${suffix}`, parsedValue, userId);
                migratedCount++;
                logger.debug('Migrated user-specific AI preference', {
                  component: 'migration',
                  key,
                });
              }
            } catch (error) {
              errors++;
              logger.error(
                'Failed to migrate user-specific key',
                { component: 'migration', key },
                error instanceof Error ? error : undefined,
              );
            }
          }
        }
      }

      // Mark migration as complete
      await this.markMigrated();

      logger.info('Migration completed', {
        component: 'migration',
        migrated: migratedCount,
        errors,
      });

      return { success: errors === 0, migrated: migratedCount, errors };
    } catch (error) {
      logger.error(
        'Migration failed',
        { component: 'migration' },
        error instanceof Error ? error : undefined,
      );
      return { success: false, migrated: migratedCount, errors: errors + 1 };
    }
  }

  /**
   * Clear all localStorage data (call after successful migration)
   * WARNING: This will delete all localStorage data!
   */
  async clearLocalStorage(): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    logger.warn('Clearing localStorage after migration', { component: 'migration' });

    // Clear all novelist-related keys
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('novelist_') || key.startsWith('novelist-'))) {
        keysToRemove.push(key);
      }
    }

    // Also clear known keys
    keysToRemove.push('openrouter_models_cache', 'plot-engine-feedback');

    for (const key of keysToRemove) {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        logger.error(
          'Failed to remove localStorage key',
          { component: 'migration', key },
          error instanceof Error ? error : undefined,
        );
      }
    }

    logger.info('localStorage cleared', { component: 'migration', removed: keysToRemove.length });
  }
}

/**
 * Singleton instance
 */
export const migrationService = new LocalStorageMigrationService();
