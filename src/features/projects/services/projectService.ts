/**
 * Project Service
 *
 * Handles IndexedDB persistence for projects
 */

import type { Project } from '../../../types';
import type { ProjectCreationData, ProjectUpdateData } from '../types';

class ProjectService {
  private dbName = 'novelist-projects';
  private version = 1;
  private storeName = 'projects';
  private db: IDBDatabase | null = null;

  /**
   * Initialize IndexedDB
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create projects store
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
          store.createIndex('status', 'status', { unique: false });
        }
      };
    });
  }

  /**
   * Get all projects
   */
  async getAll(): Promise<Project[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get project by ID
   */
  async getById(id: string): Promise<Project | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Create new project
   */
  async create(data: ProjectCreationData): Promise<Project> {
    if (!this.db) await this.init();

    const now = Date.now();
    const project: Project = {
      id: crypto.randomUUID(),
      title: data.title,
      idea: data.idea,
      style: data.style as any,
      status: 'Draft' as const,
      chapters: [],
      coverImage: '',
      createdAt: new Date(now),
      updatedAt: new Date(now),
      worldState: {
        hasTitle: true,
        hasOutline: false,
        chaptersCount: 0,
        chaptersCompleted: 0,
        styleDefined: true,
        isPublished: false,
        hasCharacters: false,
        hasWorldBuilding: false,
        hasThemes: false,
        plotStructureDefined: false,
        targetAudienceDefined: false
      },
      isGenerating: false,
      language: data.language || 'en',
      targetWordCount: data.targetWordCount || 50000,
      settings: {
        enableDropCaps: true
      },
      genre: data.genre || [],
      targetAudience: data.targetAudience || 'adult',
      contentWarnings: [],
      keywords: [],
      synopsis: '',
      authors: [],
      analytics: {
        totalWordCount: 0,
        averageChapterLength: 0,
        estimatedReadingTime: 0,
        generationCost: 0,
        editingRounds: 0
      },
      version: '1.0.0',
      changeLog: []
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.add(project);

      request.onsuccess = () => resolve(project);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update project
   */
  async update(id: string, data: ProjectUpdateData): Promise<void> {
    if (!this.db) await this.init();

    const project = await this.getById(id);
    if (!project) {
      throw new Error(`Project not found: ${id}`);
    }

    const updated: Project = {
      ...project,
      ...data,
      updatedAt: new Date(),
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(updated);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete project
   */
  async delete(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get projects by status
   */
  async getByStatus(status: string): Promise<Project[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('status');
      const request = index.getAll(status.toUpperCase());

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Save project (full update)
   */
  async save(project: Project): Promise<void> {
    if (!this.db) await this.init();

    const updated = {
      ...project,
      updatedAt: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(updated);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const projectService = new ProjectService();
