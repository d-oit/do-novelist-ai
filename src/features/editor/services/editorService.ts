/**
 * Editor Service
 *
 * Handles content persistence, auto-save, and draft management for the editor.
 * Uses IndexedDB for local storage with versioning support.
 * Enhanced with comprehensive error handling (2024-2025 best practices)
 */

import { type SavedDraft, type DraftMetadata } from '../types';

// Import error handling system
import { logger } from '../../../lib/errors/logging';
import { createStorageError } from '../../../lib/errors/error-types';

class EditorService {
  private readonly dbName = 'novelist-drafts';
  private readonly version = 1;
  private db: IDBDatabase | null = null;

  // Create logger for EditorService
  private readonly logger = logger.child({ service: 'EditorService' });

  /**
   * Initialize the IndexedDB database
   */
  async init(): Promise<void> {
    this.logger.debug('Initializing IndexedDB', {
      dbName: this.dbName,
      version: this.version,
    });

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        const error = createStorageError(
          `Failed to open IndexedDB: ${request.error?.message || 'Unknown error'}`,
          {
            store: this.dbName,
            operation: 'write',
            cause: request.error || undefined,
            context: {
              dbName: this.dbName,
              version: this.version,
            },
          }
        );

        this.logger.error('Failed to open IndexedDB', {
          error: request.error?.message,
          dbName: this.dbName,
          version: this.version,
        });

        reject(error);
      };

      request.onsuccess = () => {
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

        resolve();
      };

      request.onupgradeneeded = event => {
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
   */
  async isHealthy(): Promise<boolean> {
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
   */
  async saveDraft(
    chapterId: string,
    projectId: string,
    content: string,
    summary: string
  ): Promise<SavedDraft> {
    if (!this.db) await this.init();

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
      const transaction = this.db!.transaction(['drafts'], 'readwrite');
      const store = transaction.objectStore('drafts');
      const request = store.put(draft);

      request.onsuccess = () => resolve(draft);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Load a draft from IndexedDB
   */
  async loadDraft(chapterId: string): Promise<SavedDraft | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['drafts'], 'readonly');
      const store = transaction.objectStore('drafts');
      const request = store.get(chapterId);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all drafts for a project
   */
  async getDraftsByProject(projectId: string): Promise<SavedDraft[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['drafts'], 'readonly');
      const store = transaction.objectStore('drafts');
      const index = store.index('projectId');
      const request = index.getAll(projectId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get draft metadata without loading full content
   */
  async getDraftMetadata(chapterId: string): Promise<DraftMetadata | null> {
    if (!this.db) await this.init();

    const draft = await this.loadDraft(chapterId);
    if (!draft) return null;

    const { content: _content, summary: _summary, ...metadata } = draft;
    return metadata;
  }

  /**
   * Delete a draft
   */
  async deleteDraft(chapterId: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['drafts'], 'readwrite');
      const store = transaction.objectStore('drafts');
      const request = store.delete(chapterId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete all drafts for a project
   */
  async deleteDraftsByProject(projectId: string): Promise<void> {
    if (!this.db) await this.init();

    const drafts = await this.getDraftsByProject(projectId);

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['drafts'], 'readwrite');
      const store = transaction.objectStore('drafts');

      let deletedCount = 0;
      drafts.forEach(draft => {
        const request = store.delete(draft.chapterId);
        request.onsuccess = () => {
          deletedCount++;
          if (deletedCount === drafts.length) {
            resolve();
          }
        };
        request.onerror = () => reject(request.error);
      });

      // Handle edge case of no drafts
      if (drafts.length === 0) {
        resolve();
      }
    });
  }

  /**
   * Check if a draft exists
   */
  async hasDraft(chapterId: string): Promise<boolean> {
    const draft = await this.loadDraft(chapterId);
    return draft !== null;
  }

  /**
   * Get all draft metadata for a project (lightweight operation)
   */
  async getAllDraftMetadata(projectId: string): Promise<DraftMetadata[]> {
    const drafts = await this.getDraftsByProject(projectId);
    return drafts.map(({ content: _content, summary: _summary, ...metadata }) => metadata);
  }

  /**
   * Clear all drafts (use with caution!)
   */
  async clearAllDrafts(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['drafts'], 'readwrite');
      const store = transaction.objectStore('drafts');
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Singleton export
export const editorService = new EditorService();
