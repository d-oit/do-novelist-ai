/**
 * World-Building Database Service
 * Handles persistence and retrieval of world-building data
 */

import type {
  WorldBuildingProject,
  Location,
  Culture,
  Timeline,
  LoreEntry,
  ResearchSource,
  WorldMap,
} from '@/features/world-building/types';

class WorldBuildingDatabase {
  private readonly dbName = 'novelist-world-building';
  private readonly version = 1;
  private db: IDBDatabase | null = null;

  public async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = (): void => reject(new Error(`Failed to open database: ${request.error?.message ?? 'Unknown error'}`));
      request.onsuccess = (): void => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event): void => {
        const db = (event.target as IDBOpenDBRequest).result;

        // World-building projects store
        if (!db.objectStoreNames.contains('worldBuildingProjects')) {
          const projectsStore = db.createObjectStore('worldBuildingProjects', { keyPath: 'id' });
          projectsStore.createIndex('projectId', 'projectId', { unique: true });
        }

        // Locations store
        if (!db.objectStoreNames.contains('locations')) {
          const locationsStore = db.createObjectStore('locations', { keyPath: 'id' });
          locationsStore.createIndex('projectId', 'projectId', { unique: false });
          locationsStore.createIndex('type', 'type', { unique: false });
          locationsStore.createIndex('name', 'name', { unique: false });
        }

        // Cultures store
        if (!db.objectStoreNames.contains('cultures')) {
          const culturesStore = db.createObjectStore('cultures', { keyPath: 'id' });
          culturesStore.createIndex('projectId', 'projectId', { unique: false });
          culturesStore.createIndex('type', 'type', { unique: false });
          culturesStore.createIndex('name', 'name', { unique: false });
        }

        // Other stores...
        this.createRemainingStores(db);
      };
    });
  }

  private createRemainingStores(db: IDBDatabase): void {
    // Timelines store
    if (!db.objectStoreNames.contains('timelines')) {
      const timelinesStore = db.createObjectStore('timelines', { keyPath: 'id' });
      timelinesStore.createIndex('projectId', 'projectId', { unique: false });
      timelinesStore.createIndex('name', 'name', { unique: false });
    }

    // Lore entries store
    if (!db.objectStoreNames.contains('loreEntries')) {
      const loreStore = db.createObjectStore('loreEntries', { keyPath: 'id' });
      loreStore.createIndex('projectId', 'projectId', { unique: false });
      loreStore.createIndex('category', 'category', { unique: false });
      loreStore.createIndex('title', 'title', { unique: false });
    }

    // Research sources store
    if (!db.objectStoreNames.contains('researchSources')) {
      const researchStore = db.createObjectStore('researchSources', { keyPath: 'id' });
      researchStore.createIndex('projectId', 'projectId', { unique: false });
      researchStore.createIndex('type', 'type', { unique: false });
    }

    // World maps store
    if (!db.objectStoreNames.contains('worldMaps')) {
      const mapsStore = db.createObjectStore('worldMaps', { keyPath: 'id' });
      mapsStore.createIndex('projectId', 'projectId', { unique: false });
      mapsStore.createIndex('name', 'name', { unique: false });
    }
  }

  private getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): IDBObjectStore {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    const transaction = this.db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  // ============================================================================
  // World-Building Project Operations
  // ============================================================================

  public async saveWorldBuildingProject(project: WorldBuildingProject): Promise<void> {
    const store = this.getStore('worldBuildingProjects', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(project);
      request.onsuccess = (): void => resolve();
      request.onerror = (): void => reject(new Error(`Failed to save project: ${request.error?.message ?? 'Unknown error'}`));
    });
  }

  public async getWorldBuildingProject(projectId: string): Promise<WorldBuildingProject | null> {
    const store = this.getStore('worldBuildingProjects');
    const index = store.index('projectId');
    
    return new Promise((resolve, reject) => {
      const request = index.get(projectId);
      request.onsuccess = (): void => resolve((request.result as WorldBuildingProject) ?? null);
      request.onerror = (): void => reject(new Error(`Failed to get project: ${request.error?.message ?? 'Unknown error'}`));
    });
  }

  public async createWorldBuildingProject(projectId: string): Promise<WorldBuildingProject> {
    const newProject: WorldBuildingProject = {
      id: crypto.randomUUID(),
      projectId,
      locations: [],
      cultures: [],
      timelines: [],
      lore: [],
      researchSources: [],
      maps: [],
      settings: {
        consistencyCheckEnabled: true,
        autoLinkElements: true,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await this.saveWorldBuildingProject(newProject);
    return newProject;
  }

  // ============================================================================
  // Location Operations
  // ============================================================================

  public async saveLocation(location: Location): Promise<void> {
    const store = this.getStore('locations', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put({ ...location, updatedAt: Date.now() });
      request.onsuccess = (): void => resolve();
      request.onerror = (): void => reject(new Error(`Failed to save location: ${request.error?.message ?? 'Unknown error'}`));
    });
  }

  public async getLocation(id: string): Promise<Location | null> {
    const store = this.getStore('locations');
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = (): void => resolve((request.result as Location) ?? null);
      request.onerror = (): void => reject(new Error(`Failed to get location: ${request.error?.message ?? 'Unknown error'}`));
    });
  }

  public async getLocationsByProject(projectId: string): Promise<Location[]> {
    const store = this.getStore('locations');
    const index = store.index('projectId');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(projectId);
      request.onsuccess = (): void => resolve((request.result as Location[]) ?? []);
      request.onerror = (): void => reject(new Error(`Failed to get locations: ${request.error?.message ?? 'Unknown error'}`));
    });
  }

  public async deleteLocation(id: string): Promise<void> {
    const store = this.getStore('locations', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = (): void => resolve();
      request.onerror = (): void => reject(new Error(`Failed to delete location: ${request.error?.message ?? 'Unknown error'}`));
    });
  }

  // ============================================================================
  // Culture Operations
  // ============================================================================

  public async saveCulture(culture: Culture): Promise<void> {
    const store = this.getStore('cultures', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put({ ...culture, updatedAt: Date.now() });
      request.onsuccess = (): void => resolve();
      request.onerror = (): void => reject(new Error(`Failed to save culture: ${request.error?.message ?? 'Unknown error'}`));
    });
  }

  public async getCulture(id: string): Promise<Culture | null> {
    const store = this.getStore('cultures');
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = (): void => resolve((request.result as Culture) ?? null);
      request.onerror = (): void => reject(new Error(`Failed to get culture: ${request.error?.message ?? 'Unknown error'}`));
    });
  }

  public async getCulturesByProject(projectId: string): Promise<Culture[]> {
    const store = this.getStore('cultures');
    const index = store.index('projectId');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(projectId);
      request.onsuccess = (): void => resolve((request.result as Culture[]) ?? []);
      request.onerror = (): void => reject(new Error(`Failed to get cultures: ${request.error?.message ?? 'Unknown error'}`));
    });
  }

  public async deleteCulture(id: string): Promise<void> {
    const store = this.getStore('cultures', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = (): void => resolve();
      request.onerror = (): void => reject(new Error(`Failed to delete culture: ${request.error?.message ?? 'Unknown error'}`));
    });
  }

  // ============================================================================
  // Simplified stubs for other operations to reduce boilerplate
  // ============================================================================

  public async getTimelinesByProject(projectId: string): Promise<Timeline[]> {
    const store = this.getStore('timelines');
    const index = store.index('projectId');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(projectId);
      request.onsuccess = (): void => resolve((request.result as Timeline[]) ?? []);
      request.onerror = (): void => reject(new Error(`Failed to get timelines: ${request.error?.message ?? 'Unknown error'}`));
    });
  }

  public async getLoreByProject(projectId: string): Promise<LoreEntry[]> {
    const store = this.getStore('loreEntries');
    const index = store.index('projectId');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(projectId);
      request.onsuccess = (): void => resolve((request.result as LoreEntry[]) ?? []);
      request.onerror = (): void => reject(new Error(`Failed to get lore: ${request.error?.message ?? 'Unknown error'}`));
    });
  }

  public async getResearchSourcesByProject(projectId: string): Promise<ResearchSource[]> {
    const store = this.getStore('researchSources');
    const index = store.index('projectId');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(projectId);
      request.onsuccess = (): void => resolve((request.result as ResearchSource[]) ?? []);
      request.onerror = (): void => reject(new Error(`Failed to get research sources: ${request.error?.message ?? 'Unknown error'}`));
    });
  }

  public async getWorldMapsByProject(projectId: string): Promise<WorldMap[]> {
    const store = this.getStore('worldMaps');
    const index = store.index('projectId');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(projectId);
      request.onsuccess = (): void => resolve((request.result as WorldMap[]) ?? []);
      request.onerror = (): void => reject(new Error(`Failed to get world maps: ${request.error?.message ?? 'Unknown error'}`));
    });
  }
}

export const worldBuildingDb = new WorldBuildingDatabase();