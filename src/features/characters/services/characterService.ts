import { semanticSyncService } from '@/features/semantic-search';
import { characterService as tursoCharacterService } from '@/lib/database/services';
import { type Character, type CharacterRelationship } from '@/types';

/**
 * Character Service
 *
 * Handles all character data persistence using Turso database.
 * Delegates to Turso service layer.
 */
class CharacterService {
  // Legacy properties removed - now fully using Turso
  private db: IDBDatabase | null = null;

  /**
   * Initialize the database
   */
  public async init(): Promise<void> {
    // Delegate to Turso service
    await tursoCharacterService.init();
  }

  /**
   * Get all characters for a project
   */
  public async getAll(projectId: string): Promise<Character[]> {
    return tursoCharacterService.getCharactersByProjectId(projectId);
  }

  /**
   * Get a single character by ID
   */
  public async getById(id: string): Promise<Character | null> {
    return tursoCharacterService.getCharacterById(id);
  }

  /**
   * Create a new character
   */
  public async create(character: Character): Promise<Character> {
    const created = await tursoCharacterService.createCharacter(character);
    // Sync to semantic search
    await semanticSyncService.syncCharacter(character.projectId, created).catch(console.error);
    return created;
  }

  /**
   * Update an existing character
   */
  public async update(id: string, data: Partial<Character>): Promise<Character> {
    await tursoCharacterService.updateCharacter(id, data);
    const updated = await this.getById(id);
    if (!updated) throw new Error(`Character ${id} not found after update`);
    
    // Sync to semantic search
    await semanticSyncService.syncCharacter(updated.projectId, updated).catch(console.error);
    return updated;
  }

  /**
   * Delete a character
   */
  public async delete(id: string): Promise<void> {
    await tursoCharacterService.deleteCharacter(id);
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
