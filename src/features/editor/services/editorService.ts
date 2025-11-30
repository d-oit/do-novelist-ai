/**
 * Editor Service
 *
 * Handles content persistence, auto-save, and draft management for the editor.
 * Uses IndexedDB for local storage with versioning support.
 */

import { type SavedDraft, type DraftMetadata } from '../types';

class EditorService {
  private readonly dbName = 'novelist-drafts';
  private readonly version = 1;
  private db: IDBDatabase | null = null;

  /**
   * Initialize the IndexedDB database
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Drafts store
        if (!db.objectStoreNames.contains('drafts')) {
          const store = db.createObjectStore('drafts', { keyPath: 'chapterId' });
          store.createIndex('projectId', 'projectId', { unique: false });
          store.createIndex('savedAt', 'savedAt', { unique: false });
        }
      };
    });
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
