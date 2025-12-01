/**
 * Project Service
 *
 * Handles IndexedDB persistence for projects
 */

import { PublishStatus } from '../../../types';
import { type Project, type Language } from '../../../types';
import { type ProjectCreationData, type ProjectUpdateData } from '../types';
import { ProjectSchema } from '../../../types/schemas';

class ProjectService {
  private readonly dbName = 'novelist-projects';
  private readonly version = 1;
  private readonly storeName = 'projects';
  private db: IDBDatabase | null = null;

  /**
   * Initialize IndexedDB
   */
  public async init(): Promise<void> {
    if (this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = (): void =>
        reject(new Error(request.error?.message ?? 'Database operation failed'));
      request.onsuccess = (): void => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event: IDBVersionChangeEvent): void => {
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
  public async getAll(): Promise<Project[]> {
    await this.init();
    const db = this.db!;

    return new Promise<Project[]>((resolve, reject) => {
      const transaction: IDBTransaction = db.transaction([this.storeName], 'readonly');
      const store: IDBObjectStore = transaction.objectStore(this.storeName);
      const request: IDBRequest = store.getAll();

      request.onsuccess = (): void => {
        const rawData = (request.result as Project[]) ?? [];
        // Validate and parse the data to ensure type safety
        const validatedProjects = rawData
          .map(item => {
            const result = ProjectSchema.safeParse(item);
            return result.success ? result.data : null;
          })
          .filter((project): project is Project => project !== null);
        resolve(validatedProjects);
      };
      request.onerror = (): void =>
        reject(new Error(request.error?.message ?? 'Database operation failed'));
    });
  }

  /**
   * Get project by ID
   */
  public async getById(id: string): Promise<Project | null> {
    await this.init();
    const db = this.db!;

    return new Promise<Project | null>((resolve, reject) => {
      const transaction: IDBTransaction = db.transaction([this.storeName], 'readonly');
      const store: IDBObjectStore = transaction.objectStore(this.storeName);
      const request: IDBRequest = store.get(id);

      request.onsuccess = (): void => {
        const rawData = request.result as Project | undefined;
        if (!rawData) {
          resolve(null);
          return;
        }
        const result = ProjectSchema.safeParse(rawData);
        resolve(result.success ? result.data : null);
      };
      request.onerror = (): void =>
        reject(new Error(request.error?.message ?? 'Database operation failed'));
    });
  }

  /**
   * Create new project
   */
  public async create(data: ProjectCreationData): Promise<Project> {
    await this.init();
    const db = this.db!;

    const now = Date.now();
    const project: Project = {
      id: crypto.randomUUID(),
      title: data.title,
      idea: data.idea,
      style: data.style,
      status: PublishStatus.DRAFT,
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
        targetAudienceDefined: false,
      },
      isGenerating: false,
      language: (data.language ?? 'en') as Language,
      targetWordCount: data.targetWordCount ?? 50000,
      settings: {
        enableDropCaps: true,
      },
      genre: data.genre ?? [],
      targetAudience: (data.targetAudience ?? 'adult') as
        | 'children'
        | 'young_adult'
        | 'adult'
        | 'all_ages',
      contentWarnings: [],
      keywords: [],
      synopsis: '',
      authors: [],
      analytics: {
        totalWordCount: 0,
        averageChapterLength: 0,
        estimatedReadingTime: 0,
        generationCost: 0,
        editingRounds: 0,
      },
      version: '1.0.0',
      changeLog: [],
    };

    return new Promise((resolve, reject) => {
      const transaction: IDBTransaction = db.transaction([this.storeName], 'readwrite');
      const store: IDBObjectStore = transaction.objectStore(this.storeName);
      const request: IDBRequest = store.put(updated);

      request.onsuccess = (): void => resolve();
      request.onerror = (): void =>
        reject(new Error(request.error?.message ?? 'Database operation failed'));
    });
  }

  /**
   * Update project
   */
  public async update(id: string, data: ProjectUpdateData): Promise<void> {
    await this.init();
    const db = this.db!;

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
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(updated);

      request.onsuccess = (): void => resolve();
      request.onerror = (): void =>
        reject(new Error(request.error?.message ?? 'Database operation failed'));
    });
  }

  /**
   * Delete project
   */
  public async delete(id: string): Promise<void> {
    await this.init();
    const db = this.db!;

    return new Promise((resolve, reject) => {
      const transaction: IDBTransaction = db.transaction([this.storeName], 'readwrite');
      const store: IDBObjectStore = transaction.objectStore(this.storeName);
      const request: IDBRequest = store.delete(id);

      request.onsuccess = (): void => resolve();
      request.onerror = (): void =>
        reject(new Error(request.error?.message ?? 'Database operation failed'));
    });
  }

  /**
   * Get projects by status
   */
  public async getByStatus(status: string): Promise<Project[]> {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('status');
      const request = index.getAll(status);

      request.onsuccess = (): void => resolve(request.result ?? []);
      request.onerror = (): void =>
        reject(new Error(request.error?.message ?? 'Database operation failed'));
    });
  }

  /**
   * Save project (full update)
   */
  public async save(project: Project): Promise<void> {
    await this.init();
    const db = this.db!;

    const updated = {
      ...project,
      updatedAt: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(updated);

      request.onsuccess = (): void => resolve();
      request.onerror = (): void =>
        reject(new Error(request.error?.message ?? 'Database operation failed'));
    });
  }
}

export const projectService = new ProjectService();
