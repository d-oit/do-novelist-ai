/**
 * Database initialization and migration entry point
 * Handles automatic migration from localStorage to Turso on app startup
 */
import { logger } from '@/lib/logging/logger';

import { getDrizzleClient } from './drizzle';
import { migrationService } from './services/localStorage-migration';

/**
 * Initialize database and run migrations if needed
 */
export async function initDatabaseAndMigrate(): Promise<void> {
  try {
    const client = getDrizzleClient();
    
    if (!client) {
      logger.info('No Turso client available, using local file database', {
        component: 'db-init',
      });
      return;
    }

    logger.info('Turso client available, checking for migration', {
      component: 'db-init',
    });

    // Check if migration has already run
    const isMigrated = await migrationService.isMigrated();
    
    if (!isMigrated) {
      logger.info('Starting localStorage to Turso migration', {
        component: 'db-init',
      });

      const result = await migrationService.migrate();

      if (result.success) {
        logger.info('Migration completed successfully', {
          component: 'db-init',
          migrated: result.migrated,
        });

        // Optionally clear localStorage after successful migration
        // Uncomment the line below to clear localStorage after migration
        // await migrationService.clearLocalStorage();
      } else {
        logger.error('Migration completed with errors', {
          component: 'db-init',
          migrated: result.migrated,
          errors: result.errors,
        });
      }
    } else {
      logger.info('Migration already completed, skipping', {
        component: 'db-init',
      });
    }
  } catch (error) {
    logger.error(
      'Failed to initialize database and migrate',
      { component: 'db-init' },
      error instanceof Error ? error : undefined,
    );
  }
}

/**
 * Hook to trigger migration on app load
 * Call this from your main app entry point
 */
export function useDatabaseMigration(): void {
  if (typeof window !== 'undefined') {
    // Run once on mount
    void initDatabaseAndMigrate();
  }
}
