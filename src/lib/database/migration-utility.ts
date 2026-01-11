/**
 * IndexedDB to Turso Migration Utility
 * Helps users migrate their data from IndexedDB to Turso cloud database
 */
import { type Character } from '@/features/characters/types';
import { type ChapterVersion, type Branch } from '@/features/versioning/types';
import {
  type Location,
  type Culture,
  type WorldBuildingProject,
} from '@/features/world-building/types';
import { characterService } from '@/lib/database/services/character-service';
import { versioningService } from '@/lib/database/services/versioning-service';
import { worldBuildingService } from '@/lib/database/services/world-building-service';
import { logger } from '@/lib/logging/logger';

export interface MigrationProgress {
  total: number;
  completed: number;
  errors: number;
  currentTask: string;
}

export type MigrationCallback = (progress: MigrationProgress) => void;

/**
 * Migrate characters from IndexedDB to Turso
 */
async function migrateCharacters(
  projectId: string,
  onProgress?: MigrationCallback,
): Promise<{ success: number; errors: number }> {
  const dbName = 'novelist-characters';
  let success = 0;
  let errors = 0;

  try {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(dbName);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Failed to open IndexedDB'));
    });

    const transaction = db.transaction(['characters'], 'readonly');
    const store = transaction.objectStore('characters');
    const index = store.index('projectId');
    const characters = await new Promise<Character[]>((resolve, reject) => {
      const request = index.getAll(projectId);
      request.onsuccess = () => resolve(request.result as Character[]);
      request.onerror = () => reject(new Error('Failed to get characters'));
    });

    const total = characters.length;
    onProgress?.({ total, completed: 0, errors: 0, currentTask: 'Migrating characters' });

    for (let i = 0; i < characters.length; i++) {
      const char = characters[i];
      if (!char) continue;
      try {
        await characterService.createCharacter(char);
        success++;
      } catch (error) {
        logger.error('Failed to migrate character', { component: 'Migration' }, error as Error);
        errors++;
      }
      onProgress?.({ total, completed: i + 1, errors, currentTask: 'Migrating characters' });
    }

    db.close();
  } catch (error) {
    logger.error('Failed to migrate characters', { component: 'Migration' }, error as Error);
  }

  return { success, errors };
}

/**
 * Migrate world-building data from IndexedDB to Turso
 */
async function migrateWorldBuilding(
  projectId: string,
  onProgress?: MigrationCallback,
): Promise<{ success: number; errors: number }> {
  const dbName = 'novelist-world-building';
  let success = 0;
  let errors = 0;

  try {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(dbName);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Failed to open IndexedDB'));
    });

    // Migrate world-building projects
    const wbProjects = await getAllFromStore<WorldBuildingProject>(db, 'projects');
    onProgress?.({
      total: wbProjects.length,
      completed: 0,
      errors: 0,
      currentTask: 'Migrating world-building data',
    });

    for (const project of wbProjects) {
      if (project.projectId === projectId) {
        try {
          await worldBuildingService.createProject('World Building', project.projectId, undefined);
          success++;
        } catch (error) {
          logger.error(
            'Failed to migrate world-building project',
            { component: 'Migration' },
            error as Error,
          );
          errors++;
        }
      }
    }

    // Migrate locations
    const locations = await getAllFromStore<Location>(db, 'locations');
    for (const location of locations) {
      try {
        await worldBuildingService.createLocation(location);
        success++;
      } catch {
        errors++;
      }
    }

    // Migrate cultures
    const cultures = await getAllFromStore<Culture>(db, 'cultures');
    for (const culture of cultures) {
      try {
        await worldBuildingService.createCulture(culture);
        success++;
      } catch {
        errors++;
      }
    }

    db.close();
  } catch (error) {
    logger.error('Failed to migrate world-building', { component: 'Migration' }, error as Error);
  }

  return { success, errors };
}

/**
 * Migrate versioning data from IndexedDB to Turso
 */
async function migrateVersioning(
  projectId: string,
  onProgress?: MigrationCallback,
): Promise<{ success: number; errors: number }> {
  const dbName = 'novelist-versioning';
  let success = 0;
  let errors = 0;

  try {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(dbName);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Failed to open IndexedDB'));
    });

    // Migrate branches
    const branches = await getAllFromStore<Branch>(db, 'branches');
    onProgress?.({
      total: branches.length,
      completed: 0,
      errors: 0,
      currentTask: 'Migrating version history',
    });

    for (const branch of branches) {
      if (branch.chapterId) {
        // Basic check for relevant branches
        try {
          await versioningService.createBranch(
            projectId,
            branch.name,
            branch.chapterId,
            branch.description,
            branch.parentVersionId,
            branch.color,
          );
          success++;
        } catch {
          errors++;
        }
      }
    }

    // Migrate chapter versions
    const versions = await getAllFromStore<ChapterVersion>(db, 'versions');
    for (const version of versions) {
      try {
        await versioningService.saveVersion(
          version.chapterId,
          version.content,
          version.title,
          version.message,
          undefined, // branchId not directly stored in feature layer version
          version.type,
          version.summary,
          version.status,
        );
        success++;
      } catch {
        errors++;
      }
    }

    db.close();
  } catch (error) {
    logger.error('Failed to migrate versioning', { component: 'Migration' }, error as Error);
  }

  return { success, errors };
}

/**
 * Helper function to get all records from a store
 */
async function getAllFromStore<T>(db: IDBDatabase, storeName: string): Promise<T[]> {
  try {
    if (!db.objectStoreNames.contains(storeName)) {
      return [];
    }

    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(new Error(`Failed to get all from ${storeName}`));
    });
  } catch {
    return [];
  }
}

/**
 * Main migration function - migrates all data for a project
 */
export async function migrateProjectToTurso(
  projectId: string,
  onProgress?: MigrationCallback,
): Promise<{
  characters: { success: number; errors: number };
  worldBuilding: { success: number; errors: number };
  versioning: { success: number; errors: number };
  total: { success: number; errors: number };
}> {
  logger.info('Starting migration to Turso', { component: 'Migration', projectId });

  const results = {
    characters: { success: 0, errors: 0 },
    worldBuilding: { success: 0, errors: 0 },
    versioning: { success: 0, errors: 0 },
    total: { success: 0, errors: 0 },
  };

  try {
    // Migrate characters
    results.characters = await migrateCharacters(projectId, onProgress);

    // Migrate world-building
    results.worldBuilding = await migrateWorldBuilding(projectId, onProgress);

    // Migrate versioning
    results.versioning = await migrateVersioning(projectId, onProgress);

    // Calculate totals
    results.total.success =
      results.characters.success + results.worldBuilding.success + results.versioning.success;
    results.total.errors =
      results.characters.errors + results.worldBuilding.errors + results.versioning.errors;

    logger.info('Migration completed', { component: 'Migration', results });
  } catch (error) {
    logger.error('Migration failed', { component: 'Migration' }, error as Error);
  }

  return results;
}

/**
 * Check if IndexedDB databases exist (to determine if migration is needed)
 */
export async function checkIndexedDBExists(): Promise<{
  characters: boolean;
  worldBuilding: boolean;
  versioning: boolean;
  publishing: boolean;
  writingAssistant: boolean;
}> {
  const databases = await indexedDB.databases();
  const dbNames = databases.map(db => db.name);

  return {
    characters: dbNames.includes('novelist-characters'),
    worldBuilding: dbNames.includes('novelist-world-building'),
    versioning: dbNames.includes('novelist-versioning'),
    publishing: dbNames.includes('novelist-publishing-analytics'),
    writingAssistant: dbNames.includes('novelist-writing-assistant'),
  };
}

/**
 * Clear IndexedDB data after successful migration
 */
export async function clearIndexedDBData(): Promise<void> {
  const dbNames = [
    'novelist-characters',
    'novelist-world-building',
    'novelist-versioning',
    'novelist-publishing-analytics',
    'novelist-writing-assistant',
  ];

  for (const dbName of dbNames) {
    try {
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(dbName);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error(`Failed to delete ${dbName}`));
      });
      logger.info('Deleted IndexedDB database', { component: 'Migration', dbName });
    } catch (error) {
      logger.error(
        'Failed to delete IndexedDB',
        { component: 'Migration', dbName },
        error as Error,
      );
    }
  }
}
