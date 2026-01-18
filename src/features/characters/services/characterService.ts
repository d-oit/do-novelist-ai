import { semanticSyncService } from '@/features/semantic-search';
import { logger } from '@/lib/logging/logger';
import { CharacterRepository } from '@/lib/repositories/implementations/CharacterRepository';
import type { ICharacterRepository } from '@/lib/repositories/interfaces/ICharacterRepository';
import type { Character, CharacterRelationship } from '@/types';

/**
 * Character Service
 *
 * Handles all character data persistence using CharacterRepository
 */
class CharacterService {
  private repository: ICharacterRepository;

  constructor(repository?: ICharacterRepository) {
    this.repository = repository ?? new CharacterRepository();
  }

  /**
   * Initialize the Character Service
   *
   * Initializes the service and its underlying repository.
   *
   * @returns Promise that resolves when initialization is complete
   * @example
   * await characterService.init();
   */
  public async init(): Promise<void> {
    logger.debug('Character Service initialized', { component: 'CharacterService' });
  }

  /**
   * Get all characters for a project
   *
   * Retrieves all characters belonging to a specific project.
   *
   * @param projectId - The unique project identifier
   * @returns Array of characters for the project
   * @throws {RepositoryError} When database query fails
   * @example
   * const characters = await characterService.getAll('project-uuid');
   * console.log(`Found ${characters.length} characters`);
   */
  public async getAll(projectId: string): Promise<Character[]> {
    return this.repository.findByProjectId(projectId);
  }

  /**
   * Get a single character by ID
   *
   * Retrieves a specific character by its unique identifier.
   *
   * @param id - The unique character identifier
   * @returns The character if found, or null if not found
   * @throws {RepositoryError} When database query fails
   * @example
   * const character = await characterService.getById('char-uuid');
   * if (character) {
   *   console.log(`Character: ${character.name}`);
   * }
   */
  public async getById(id: string): Promise<Character | null> {
    return this.repository.findById(id);
  }

  /**
   * Create a new character
   *
   * Creates a new character with the provided data. The character will be
   * automatically synchronized with the semantic search index.
   *
   * Side effects:
   * - Writes to database
   * - Triggers semantic search synchronization (async, non-blocking)
   *
   * @param character - The character data to create
   * @returns The newly created character with generated ID
   * @throws {RepositoryError} When database write fails
   * @example
   * const character = await characterService.create({
   *   projectId: 'project-uuid',
   *   name: 'Jane Doe',
   *   description: 'The protagonist of the story',
   *   type: 'protagonist'
   * });
   */
  public async create(character: Character): Promise<Character> {
    const created = await this.repository.create(character);
    // Sync to semantic search
    await semanticSyncService.syncCharacter(character.projectId, created).catch(error => {
      logger.error('Failed to sync character to semantic search', {
        service: 'CharacterService',
        characterId: created.id,
        projectId: character.projectId,
        error,
      });
    });
    return created;
  }

  /**
   * Update an existing character
   *
   * Updates a character with the provided partial data. Only the fields
   * specified in the update data will be modified.
   *
   * Side effects:
   * - Writes to database
   * - Triggers semantic search synchronization (async, non-blocking)
   *
   * @param id - The unique character identifier
   * @param data - Partial character data to update
   * @returns The updated character
   * @throws {Error} When character with given ID is not found
   * @throws {RepositoryError} When database update fails
   * @example
   * const updated = await characterService.update('char-uuid', {
   *   name: 'Jane Smith',
   *   description: 'Updated description'
   * });
   */
  public async update(id: string, data: Partial<Character>): Promise<Character> {
    const updated = await this.repository.update(id, data);
    if (!updated) throw new Error(`Character ${id} not found after update`);

    // Sync to semantic search
    await semanticSyncService.syncCharacter(updated.projectId, updated).catch(error => {
      logger.error('Failed to sync character update to semantic search', {
        service: 'CharacterService',
        characterId: id,
        projectId: updated.projectId,
        error,
      });
    });
    return updated;
  }

  /**
   * Delete a character
   *
   * Permanently deletes a character from the database. This operation
   * cannot be undone.
   *
   * Side effects:
   * - Deletes character from database
   *
   * @param id - The unique character identifier to delete
   * @returns Promise that resolves when deletion is complete
   * @throws {RepositoryError} When database deletion fails
   * @example
   * await characterService.delete('char-uuid');
   * console.log('Character deleted successfully');
   */
  public async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  /**
   * Get relationships for a character
   *
   * Retrieves all relationships for a specific character.
   *
   * @param characterId - The unique character identifier
   * @returns Array of character relationships
   * @throws {RepositoryError} When database query fails
   * @example
   * const relationships = await characterService.getRelationships('char-uuid');
   * console.log(`Found ${relationships.length} relationships`);
   */
  public async getRelationships(characterId: string): Promise<CharacterRelationship[]> {
    return this.repository.getRelationships(characterId);
  }

  /**
   * Create a relationship between two characters
   *
   * Creates a new relationship entry linking two characters together.
   *
   * Side effects:
   * - Writes to database
   *
   * @param relationship - The relationship data to create
   * @returns The newly created relationship
   * @throws {RepositoryError} When database write fails
   * @example
   * const relationship = await characterService.createRelationship({
   *   sourceId: 'char-1',
   *   targetId: 'char-2',
   *   type: 'ally',
   *   description: 'They became friends during the journey'
   * });
   */
  public async createRelationship(
    relationship: CharacterRelationship,
  ): Promise<CharacterRelationship> {
    return this.repository.createRelationship(relationship);
  }

  /**
   * Delete a relationship
   *
   * Permanently deletes a relationship from the database.
   *
   * Side effects:
   * - Deletes relationship from database
   *
   * @param id - The unique relationship identifier to delete
   * @returns Promise that resolves when deletion is complete
   * @throws {RepositoryError} When database deletion fails
   * @example
   * await characterService.deleteRelationship('rel-uuid');
   */
  public async deleteRelationship(id: string): Promise<void> {
    await this.repository.deleteRelationship(id);
  }
}

// Singleton export
export { CharacterService };
export const characterService = new CharacterService();
