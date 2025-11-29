import { type Character, type CharacterRelationship } from '../types';

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
  async getAll(projectId: string): Promise<Character[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['characters'], 'readonly');
      const store = transaction.objectStore('characters');
      const index = store.index('projectId');
      const request = index.getAll(projectId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get a single character by ID
   */
  async getById(id: string): Promise<Character | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['characters'], 'readonly');
      const store = transaction.objectStore('characters');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Create a new character
   */
  async create(character: Character): Promise<Character> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['characters'], 'readwrite');
      const store = transaction.objectStore('characters');
      const request = store.add(character);

      request.onsuccess = () => resolve(character);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update an existing character
   */
  async update(id: string, data: Partial<Character>): Promise<Character> {
    if (!this.db) await this.init();

    const existing = await this.getById(id);
    if (!existing) throw new Error(`Character ${id} not found`);

    const updated: Character = {
      ...existing,
      ...data,
      updatedAt: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['characters'], 'readwrite');
      const store = transaction.objectStore('characters');
      const request = store.put(updated);

      request.onsuccess = () => resolve(updated);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete a character
   */
  async delete(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['characters'], 'readwrite');
      const store = transaction.objectStore('characters');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get relationships for a character
   */
  async getRelationships(characterId: string): Promise<CharacterRelationship[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['relationships'], 'readonly');
      const store = transaction.objectStore('relationships');
      const indexA = store.index('characterAId');
      const indexB = store.index('characterBId');

      const resultsA: CharacterRelationship[] = [];
      const resultsB: CharacterRelationship[] = [];

      const requestA = indexA.getAll(characterId);
      const requestB = indexB.getAll(characterId);

      requestA.onsuccess = () => {
        resultsA.push(...requestA.result);
        requestB.onsuccess = () => {
          resultsB.push(...requestB.result);
          // Combine and deduplicate
          const allRelationships = [...resultsA, ...resultsB];
          const unique = Array.from(new Map(allRelationships.map(r => [r.id, r])).values());
          resolve(unique);
        };
      };

      requestA.onerror = () => reject(requestA.error);
      requestB.onerror = () => reject(requestB.error);
    });
  }

  /**
   * Create a relationship between two characters
   */
  async createRelationship(relationship: CharacterRelationship): Promise<CharacterRelationship> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['relationships'], 'readwrite');
      const store = transaction.objectStore('relationships');
      const request = store.add(relationship);

      request.onsuccess = () => resolve(relationship);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete a relationship
   */
  async deleteRelationship(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['relationships'], 'readwrite');
      const store = transaction.objectStore('relationships');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Singleton export
export const characterService = new CharacterService();
