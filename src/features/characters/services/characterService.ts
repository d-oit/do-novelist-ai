import { type Character, type CharacterRelationship } from '@/types';

/**
 * Character Service
 *
 * Handles all character data persistence using IndexedDB.
 * Singleton pattern ensures single database connection.
 */
class CharacterService {
  private readonly dbName = 'novelist-characters';
  private readonly version = 1;
  private db: IDBDatabase | null = null;

  /**
   * Initialize the database
   */
  public async init(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = (): void =>
        reject(new Error(request.error?.message ?? 'Failed to open database'));
      request.onsuccess = (): void => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event: IDBVersionChangeEvent): void => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Characters store
        if (!db.objectStoreNames.contains('characters')) {
          const store = db.createObjectStore('characters', { keyPath: 'id' });
          store.createIndex('projectId', 'projectId', { unique: false });
          store.createIndex('role', 'role', { unique: false });
        }

        // Relationships store
        if (!db.objectStoreNames.contains('relationships')) {
          const relStore = db.createObjectStore('relationships', { keyPath: 'id' });
          relStore.createIndex('characterAId', 'characterAId', { unique: false });
          relStore.createIndex('characterBId', 'characterBId', { unique: false });
        }
      };
    });
  }

  /**
   * Get all characters for a project
   */
  public async getAll(projectId: string): Promise<Character[]> {
    if (!this.db) await this.init();

    return new Promise<Character[]>((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }
      const transaction = this.db.transaction(['characters'], 'readonly');
      const store = transaction.objectStore('characters');
      const index = store.index('projectId');
      const request = index.getAll(projectId);

      request.onsuccess = (): void => {
        resolve(request.result);
      };
      request.onerror = (): void =>
        reject(new Error(request.error?.message ?? 'Failed to get characters'));
    });
  }

  /**
   * Get a single character by ID
   */
  public async getById(id: string): Promise<Character | null> {
    if (!this.db) await this.init();

    return new Promise<Character | null>((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }
      const transaction = this.db.transaction(['characters'], 'readonly');
      const store = transaction.objectStore('characters');
      const request = store.get(id);

      request.onsuccess = (): void => {
        resolve(request.result as Character | null);
      };
      request.onerror = (): void =>
        reject(new Error(request.error?.message ?? 'Failed to get character'));
    });
  }

  /**
   * Create a new character
   */
  public async create(character: Character): Promise<Character> {
    if (!this.db) await this.init();

    return new Promise<Character>((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }
      const transaction = this.db.transaction(['characters'], 'readwrite');
      const store = transaction.objectStore('characters');
      const request = store.add(character);

      request.onsuccess = (): void => {
        resolve(character);
      };
      request.onerror = (): void =>
        reject(new Error(request.error?.message ?? 'Failed to create character'));
    });
  }

  /**
   * Update an existing character
   */
  public async update(id: string, data: Partial<Character>): Promise<Character> {
    if (!this.db) await this.init();

    const existing = await this.getById(id);
    if (!existing) throw new Error(`Character ${id} not found`);

    const updated: Character = {
      ...existing,
      ...data,
      updatedAt: Date.now(),
    };

    return new Promise<Character>((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }
      const transaction = this.db.transaction(['characters'], 'readwrite');
      const store = transaction.objectStore('characters');
      const request = store.put(updated);

      request.onsuccess = (): void => {
        resolve(updated);
      };
      request.onerror = (): void =>
        reject(new Error(request.error?.message ?? 'Failed to update character'));
    });
  }

  /**
   * Delete a character
   */
  public async delete(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise<void>((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }
      const transaction = this.db.transaction(['characters'], 'readwrite');
      const store = transaction.objectStore('characters');
      const request = store.delete(id);

      request.onsuccess = (): void => {
        resolve();
      };
      request.onerror = (): void =>
        reject(new Error(request.error?.message ?? 'Failed to delete character'));
    });
  }

  /**
   * Get relationships for a character
   */
  public async getRelationships(characterId: string): Promise<CharacterRelationship[]> {
    if (!this.db) await this.init();

    return new Promise<CharacterRelationship[]>((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }
      const transaction = this.db.transaction(['relationships'], 'readonly');
      const store = transaction.objectStore('relationships');
      const indexA = store.index('characterAId');
      const indexB = store.index('characterBId');

      const resultsA: CharacterRelationship[] = [];
      const resultsB: CharacterRelationship[] = [];

      const requestA = indexA.getAll(characterId);
      const requestB = indexB.getAll(characterId);

      requestA.onsuccess = (): void => {
        resultsA.push(...(requestA.result as CharacterRelationship[]));
        requestB.onsuccess = (): void => {
          resultsB.push(...(requestB.result as CharacterRelationship[]));
          // Combine and deduplicate
          const allRelationships = [...resultsA, ...resultsB];
          const unique = Array.from(new Map(allRelationships.map(r => [r.id, r])).values());
          resolve(unique);
        };
      };

      requestA.onerror = (): void =>
        reject(new Error(requestA.error?.message ?? 'Failed to get relationships'));
      requestB.onerror = (): void =>
        reject(new Error(requestB.error?.message ?? 'Failed to get relationships'));
    });
  }

  /**
   * Create a relationship between two characters
   */
  public async createRelationship(
    relationship: CharacterRelationship,
  ): Promise<CharacterRelationship> {
    if (!this.db) await this.init();

    return new Promise<CharacterRelationship>((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }
      const transaction = this.db.transaction(['relationships'], 'readwrite');
      const store = transaction.objectStore('relationships');
      const request = store.add(relationship);

      request.onsuccess = (): void => {
        resolve(relationship);
      };
      request.onerror = (): void =>
        reject(new Error(request.error?.message ?? 'Failed to create relationship'));
    });
  }

  /**
   * Delete a relationship
   */
  public async deleteRelationship(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise<void>((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }
      const transaction = this.db.transaction(['relationships'], 'readwrite');
      const store = transaction.objectStore('relationships');
      const request = store.delete(id);

      request.onsuccess = (): void => {
        resolve();
      };
      request.onerror = (): void =>
        reject(new Error(request.error?.message ?? 'Failed to delete relationship'));
    });
  }
}

// Singleton export
export const characterService = new CharacterService();
