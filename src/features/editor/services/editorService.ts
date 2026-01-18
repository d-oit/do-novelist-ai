/**
 * Editor Service
 *
 * Handles content persistence, auto-save, and draft management for the editor.
 * Uses IndexedDB for local storage with versioning support.
 * Enhanced with comprehensive error handling (2024-2025 best practices)
 */
import { semanticSyncService } from '@/features/semantic-search';
import { createStorageError } from '@/lib/errors/error-types';
import { logger } from '@/lib/errors/logging';
import { type SavedDraft, type DraftMetadata } from '@/types';

// Import error handling system

class EditorService {
  private readonly dbName = 'novelist-drafts';
  private readonly version = 1;
  private db: IDBDatabase | null = null;

  // Create logger for EditorService
  private readonly logger = logger.child({ service: 'EditorService' });

  /**
   * Initialize the IndexedDB database
   */
  public async init(): Promise<IDBDatabase> {
    this.logger.debug('Initializing IndexedDB', {
      dbName: this.dbName,
      version: this.version,
    });

    if (this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = (): void => {
        const error = createStorageError(
          `Failed to open IndexedDB: ${request.error?.message ?? 'Unknown error'}`,
          {
            store: this.dbName,
            operation: 'write',
            cause: request.error ?? undefined,
            context: {
              dbName: this.dbName,
              version: this.version,
            },
          },
        );

        this.logger.error('Failed to open IndexedDB', {
          error: request.error?.message,
          dbName: this.dbName,
          version: this.version,
        });

        reject(error);
      };

      request.onsuccess = (): void => {
        this.db = request.result;

        // Log successful connection
        this.logger.info('IndexedDB initialized successfully', {
          dbName: this.dbName,
          version: this.version,
        });

        // Log connection information
        this.logger.debug('Database connection established', {
          databaseName: this.db.name,
          databaseVersion: this.db.version,
          objectStores: Array.from(this.db.objectStoreNames),
        });

        resolve(this.db);
      };

      request.onupgradeneeded = (event: IDBVersionChangeEvent): void => {
        const db = (event.target as IDBOpenDBRequest).result;

        this.logger.info('Upgrading database schema', {
          oldVersion: event.oldVersion,
          newVersion: event.newVersion,
          dbName: this.dbName,
        });

        // Drafts store
        if (!db.objectStoreNames.contains('drafts')) {
          const store = db.createObjectStore('drafts', { keyPath: 'chapterId' });
          store.createIndex('projectId', 'projectId', { unique: false });
          store.createIndex('savedAt', 'savedAt', { unique: false });

          this.logger.info('Created drafts object store', {
            dbName: this.dbName,
            version: this.version,
            indexes: ['projectId', 'savedAt'],
          });
        }
      };
    });
  }

  /**
   * Check if database is initialized and healthy
   *
   * Verifies IndexedDB connection is functional by performing a test operation.
   *
   * @returns true if database is healthy and initialized, false otherwise
   * @example
   * const healthy = await editorService.isHealthy();
   * if (!healthy) console.error('Database not accessible');
   */
  public async isHealthy(): Promise<boolean> {
    if (!this.db) {
      return false;
    }

    try {
      // Try a simple operation to verify connection
      await this.getDraftsByProject('_health_check_');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Save a draft to IndexedDB
   *
   * Saves or updates a chapter draft with content and summary.
   * Automatically increments version number on updates.
   *
   * Side effects:
   * - Writes to IndexedDB
   * - Triggers semantic search synchronization (async, non-blocking)
   *
   * @param chapterId - The unique chapter identifier
   * @param projectId - The unique project identifier
   * @param content - The chapter content text
   * @param summary - Summary of the chapter content
   * @returns The saved draft with metadata
   * @example
   * const draft = await editorService.saveDraft(
   *   'chapter-id',
   *   'project-id',
   *   'Chapter content text...',
   *   'Chapter summary...'
   * );
   */
  public async saveDraft(
    chapterId: string,
    projectId: string,
    content: string,
    summary: string,
  ): Promise<SavedDraft> {
    const db = await this.init();

    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
    const existingDraft = await this.loadDraft(chapterId);
    const version = existingDraft ? existingDraft.version + 1 : 1;

    const draft: SavedDraft = {
      chapterId,
      projectId,
      content,
      summary,
      savedAt: Date.now(),
      wordCount,
      version,
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['drafts'], 'readwrite');
      const store = transaction.objectStore('drafts');
      const request = store.put(draft);

      request.onsuccess = (): void => {
        // Trigger semantic search update (non-blocking)
        semanticSyncService
          .syncChapter(
            projectId,
            chapterId,
            content,
            undefined, // Title not available in saveDraft
            summary,
          )
          .catch(error => {
            this.logger.warn('Failed to sync chapter embedding', { error });
          });

        resolve(draft);
      };
      request.onerror = (): void =>
        reject(new Error(request.error?.message ?? 'Database operation failed'));
    });
  }

  /**
   * Load a draft from IndexedDB
   *
   * Retrieves a specific chapter draft including content and metadata.
   *
   * @param chapterId - The unique chapter identifier
   * @returns The draft if found, null otherwise
   * @example
   * const draft = await editorService.loadDraft('chapter-id');
   * if (draft) {
   *   console.log(`Loaded draft v${draft.version}`);
   * }
   */
  public async loadDraft(chapterId: string): Promise<SavedDraft | null> {
    const db = await this.init();

    return new Promise<SavedDraft | null>((resolve, reject) => {
      const transaction = db.transaction(['drafts'], 'readonly');
      const store = transaction.objectStore('drafts');
      const request = store.get(chapterId);

      request.onsuccess = (): void => resolve((request.result as SavedDraft) ?? null);
      request.onerror = (): void =>
        reject(new Error(request.error?.message ?? 'Database operation failed'));
    });
  }

  /**
   * Get all drafts for a project
   *
   * Retrieves all saved drafts for a specific project.
   *
   * @param projectId - The unique project identifier
   * @returns Array of all drafts for the project
   * @example
   * const drafts = await editorService.getDraftsByProject('project-id');
   * console.log(`Found ${drafts.length} saved drafts`);
   */
  public async getDraftsByProject(projectId: string): Promise<SavedDraft[]> {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['drafts'], 'readonly');
      const store = transaction.objectStore('drafts');
      const index = store.index('projectId');
      const request = index.getAll(projectId);

      request.onsuccess = (): void => resolve(request.result);
      request.onerror = (): void =>
        reject(new Error(request.error?.message ?? 'Database operation failed'));
    });
  }

  /**
   * Get draft metadata without loading full content
   *
   * Retrieves lightweight metadata for a draft (word count, version, timestamp)
   * without loading the full content.
   *
   * @param chapterId - The unique chapter identifier
   * @returns Draft metadata if found, null otherwise
   * @example
   * const meta = await editorService.getDraftMetadata('chapter-id');
   * if (meta) console.log(`Draft v${meta.version}, ${meta.wordCount} words`);
   */
  public async getDraftMetadata(chapterId: string): Promise<DraftMetadata | null> {
    if (!this.db) await this.init();

    const draft = await this.loadDraft(chapterId);
    if (!draft) return null;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { content, summary, ...metadata } = draft;
    return metadata;
  }

  /**
   * Delete a draft
   *
   * Permanently removes a draft from IndexedDB.
   *
   * @param chapterId - The unique chapter identifier
   * @returns Promise that resolves when deletion is complete
   * @example
   * await editorService.deleteDraft('chapter-id');
   */
  public async deleteDraft(chapterId: string): Promise<void> {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['drafts'], 'readwrite');
      const store = transaction.objectStore('drafts');
      const request = store.delete(chapterId);

      request.onsuccess = (): void => resolve();
      request.onerror = (): void =>
        reject(new Error(request.error?.message ?? 'Database operation failed'));
    });
  }

  /**
   * Delete all drafts for a project
   *
   * Permanently removes all drafts associated with a project.
   *
   * @param projectId - The unique project identifier
   * @returns Promise that resolves when all drafts are deleted
   * @example
   * await editorService.deleteDraftsByProject('project-id');
   */
  public async deleteDraftsByProject(projectId: string): Promise<void> {
    const db = await this.init();
    const drafts = await this.getDraftsByProject(projectId);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['drafts'], 'readwrite');
      const store = transaction.objectStore('drafts');

      let deletedCount = 0;
      drafts.forEach(draft => {
        const request = store.delete(draft.chapterId);
        request.onsuccess = (): void => {
          deletedCount++;
          if (deletedCount === drafts.length) {
            resolve();
          }
        };
        request.onerror = (): void =>
          reject(new Error(request.error?.message ?? 'Database operation failed'));
      });

      // Handle edge case of no drafts
      if (drafts.length === 0) {
        resolve();
      }
    });
  }

  /**
   * Check if a draft exists
   *
   * Checks whether a saved draft exists for a chapter.
   *
   * @param chapterId - The unique chapter identifier
   * @returns true if draft exists, false otherwise
   * @example
   * const exists = await editorService.hasDraft('chapter-id');
   * if (!exists) console.log('No draft saved');
   */
  public async hasDraft(chapterId: string): Promise<boolean> {
    const draft = await this.loadDraft(chapterId);
    return draft !== null;
  }

  /**
   * Get all draft metadata for a project (lightweight operation)
   *
   * Retrieves metadata for all drafts in a project without loading content.
   *
   * @param projectId - The unique project identifier
   * @returns Array of draft metadata
   * @example
   * const metaList = await editorService.getAllDraftMetadata('project-id');
   * metaList.forEach(meta => console.log(`Draft v${meta.version}`));
   */
  public async getAllDraftMetadata(projectId: string): Promise<DraftMetadata[]> {
    const drafts = await this.getDraftsByProject(projectId);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return drafts.map(({ content, summary, ...metadata }) => metadata);
  }

  /**
   * Clear all drafts (use with caution!)
   *
   * Permanently removes ALL drafts from IndexedDB. This operation cannot be undone.
   * Use only for testing or data cleanup scenarios.
   *
   * @returns Promise that resolves when all drafts are cleared
   * @example
   * await editorService.clearAllDrafts();
   * console.log('All drafts cleared');
   */
  public async clearAllDrafts(): Promise<void> {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['drafts'], 'readwrite');
      const store = transaction.objectStore('drafts');
      const request = store.clear();

      request.onsuccess = (): void => resolve();
      request.onerror = (): void =>
        reject(new Error(request.error?.message ?? 'Database operation failed'));
    });
  }
}

// Singleton export
export const editorService = new EditorService();
