/**
 * Character Repository - Core CRUD Operations
 *
 * Implements basic CRUD operations for characters using Drizzle ORM
 * This file contains the core repository interface and data manipulation methods
 */

import { eq, sql } from 'drizzle-orm';

import { getDrizzleClient } from '@/lib/database/drizzle';
import { characters } from '@/lib/database/schemas/characters';
import { toAppError } from '@/lib/errors/error-types';
import { logger } from '@/lib/logging/logger';
import { RepositoryError, type FindAllOptions } from '@/lib/repositories/interfaces/IRepository';
import type { Character } from '@/types';
import {
  findByProjectIdQuery,
  findByRoleQuery,
  findByProjectIdAndRoleQuery,
  findByOccupationQuery as findByOccupation,
  findByAgeRangeQuery,
  searchQuery,
  findByQuery as findByQueryComplex,
  getRelationshipsQuery,
  findRelationshipBetweenQuery,
  findRelationshipsByProjectQuery,
  createRelationshipQuery,
  updateRelationshipQuery,
  deleteRelationshipQuery,
  countByProjectQuery,
  countByProjectAndRoleQuery,
} from './CharacterRepository.queries';

/**
 * Character Repository Implementation
 * Manages character data access with type-safe operations
 */
export class CharacterRepository {
  private db;

  constructor() {
    this.db = getDrizzleClient();
    if (!this.db) {
      logger.warn('CharacterRepository initialized without database connection', {
        component: 'CharacterRepository',
      });
    }
  }

  // ==================== CRUD Operations ====================

  /**
   * Find a character by ID
   * @param id - The character ID to search for
   * @returns The character or null if not found
   */
  async findById(id: string): Promise<Character | null> {
    try {
      const client = this.db;
      if (!client) {
        return null;
      }

      const result = await client.select().from(characters).where(eq(characters.id, id)).limit(1);

      if (result.length === 0) {
        return null;
      }

      return this.mapRowToCharacter(result[0]!);
    } catch (error) {
      logger.error(
        'Failed to find character by ID',
        { component: 'CharacterRepository', characterId: id },
        error instanceof Error ? error : undefined,
      );
      return null;
    }
  }

  /**
   * Find all characters with optional pagination
   * @param options - Find options including limit and offset
   * @returns Array of all characters
   */
  async findAll(options?: FindAllOptions): Promise<Character[]> {
    try {
      const client = this.db;
      if (!client) {
        return [];
      }

      let result = await client.select().from(characters).orderBy(characters.name);

      // Apply filtering after query for simplicity
      if (options?.limit || options?.offset) {
        let filtered = result;
        if (options.offset) {
          filtered = filtered.slice(options.offset);
        }
        if (options.limit) {
          filtered = filtered.slice(0, options.limit);
        }
        result = filtered;
      }

      return result.map(row => this.mapRowToCharacter(row));
    } catch (error) {
      logger.error(
        'Failed to find all characters',
        { component: 'CharacterRepository' },
        error instanceof Error ? error : undefined,
      );
      return [];
    }
  }

  /**
   * Find characters matching a predicate function
   * @param predicate - Function to test each character
   * @returns Array of characters matching the predicate
   */
  async findWhere(predicate: (entity: Character) => boolean): Promise<Character[]> {
    try {
      const all = await this.findAll();
      return all.filter(predicate);
    } catch (error) {
      logger.error(
        'Failed to find characters by predicate',
        { component: 'CharacterRepository' },
        error instanceof Error ? error : undefined,
      );
      return [];
    }
  }

  /**
   * Find multiple characters by their IDs
   * @param ids - Array of character IDs to search for
   * @returns Array of characters (null for IDs not found)
   */
  async findByIds(ids: string[]): Promise<Array<Character | null>> {
    try {
      const client = this.db;
      if (!client) {
        return ids.map(() => null);
      }

      const result = await client
        .select()
        .from(characters)
        .where(sql`${characters.id} IN ${sql.raw(ids.join(','))}`);

      const resultMap = new Map(
        result.map(row => [row.id, this.mapRowToCharacter(row)] as [string, Character]),
      );

      return ids.map(id => resultMap.get(id) ?? null);
    } catch (error) {
      logger.error(
        'Failed to find characters by IDs',
        { component: 'CharacterRepository', ids },
        error instanceof Error ? error : undefined,
      );
      return ids.map(() => null);
    }
  }

  /**
   * Create a new character
   * @param entity - Character data without ID
   * @returns The created character
   * @throws RepositoryError if creation fails
   */
  async create(entity: Omit<Character, 'id'>): Promise<Character> {
    try {
      const client = this.db;
      if (!client) {
        throw new RepositoryError('Database connection not available', 'DB_CONNECTION_ERROR');
      }

      const newId = `char_${Date.now()}`;
      const now = new Date().toISOString();

      const characterData = {
        id: newId,
        projectId: entity.projectId,
        name: entity.name,
        role: entity.role,
        description: entity.backstory ?? '',
        personality: [entity.motivation] as string[], // Database expects string[]
        background: entity.backstory ?? '',
        goals: [entity.goal] as string[], // Database expects string[]
        conflicts: [entity.conflict] as string[], // Database expects string[]
        arc: entity.arc,
        appearance: '',
        age: entity.age ?? 0,
        occupation: entity.occupation ?? '',
        skills: (entity.traits?.map(t => t.name) ?? []) as string[], // Database expects string[]
        weaknesses: [] as string[],
        relationships: entity.relationships ?? [],
        notes: entity.notes ?? '',
        imageUrl: entity.imageUrl ?? null,
        createdAt: now,
        updatedAt: now,
      };

      await client.insert(characters).values(characterData);

      const created = await this.findById(newId);
      if (!created) {
        throw new RepositoryError('Failed to retrieve created character', 'CREATE_FAILED');
      }

      logger.info('Character created', {
        component: 'CharacterRepository',
        characterId: newId,
        projectId: entity.projectId,
        name: entity.name,
      });

      return created;
    } catch (error) {
      const appError =
        error instanceof RepositoryError ? error : toAppError(error, 'Failed to create character');
      logger.error(
        'Failed to create character',
        { component: 'CharacterRepository', name: entity.name },
        appError,
      );
      throw appError;
    }
  }

  /**
   * Create multiple characters
   * @param entities - Array of character data without IDs
   * @returns Array of created characters
   * @throws RepositoryError if any creation fails
   */
  async createMany(entities: Array<Omit<Character, 'id'>>): Promise<Character[]> {
    try {
      const created: Character[] = [];

      for (const entity of entities) {
        const char = await this.create(entity);
        created.push(char);
      }

      return created;
    } catch (error) {
      const appError =
        error instanceof RepositoryError
          ? error
          : toAppError(error, 'Failed to create multiple characters');
      logger.error(
        'Failed to create multiple characters',
        { component: 'CharacterRepository', count: entities.length },
        appError,
      );
      throw appError;
    }
  }

  /**
   * Update a character by ID
   * @param id - Character ID to update
   * @param data - Partial character data to update
   * @returns The updated character or null if not found
   * @throws RepositoryError if update fails
   */
  async update(id: string, data: Partial<Character>): Promise<Character | null> {
    try {
      const client = this.db;
      if (!client) {
        throw new RepositoryError('Database connection not available', 'DB_CONNECTION_ERROR');
      }

      const existing = await this.findById(id);
      if (!existing) {
        return null;
      }

      const updateData: Record<string, unknown> = {
        updatedAt: new Date().toISOString(),
      };

      if (data.name !== undefined) updateData.name = data.name;
      if (data.role !== undefined) updateData.role = data.role;
      if (data.arc !== undefined) updateData.arc = data.arc;
      if (data.age !== undefined) updateData.age = data.age;
      if (data.gender !== undefined) updateData.gender = data.gender;
      if (data.occupation !== undefined) updateData.occupation = data.occupation;
      if (data.motivation !== undefined) updateData.personality = [data.motivation] as string[];
      if (data.goal !== undefined) updateData.goals = [data.goal] as string[];
      if (data.conflict !== undefined) updateData.conflicts = [data.conflict] as string[];
      if (data.backstory !== undefined) updateData.background = data.backstory;
      if (data.traits !== undefined) updateData.skills = data.traits.map(t => t.name) as string[];
      if (data.relationships !== undefined)
        updateData.relationships = JSON.stringify(data.relationships);
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;

      await client.update(characters).set(updateData).where(eq(characters.id, id));

      const updated = await this.findById(id);
      if (!updated) {
        throw new RepositoryError('Failed to retrieve updated character', 'UPDATE_FAILED');
      }

      logger.info('Character updated', {
        component: 'CharacterRepository',
        characterId: id,
      });

      return updated;
    } catch (error) {
      const appError =
        error instanceof RepositoryError ? error : toAppError(error, 'Failed to update character');
      logger.error(
        'Failed to update character',
        { component: 'CharacterRepository', characterId: id },
        appError,
      );
      throw appError;
    }
  }

  /**
   * Update multiple characters
   * @param updates - Array of updates with character ID and data
   * @returns Array of updated characters
   * @throws RepositoryError if any update fails
   */
  async updateMany(updates: Array<{ id: string; data: Partial<Character> }>): Promise<Character[]> {
    try {
      const updated: Character[] = [];

      for (const { id, data } of updates) {
        const char = await this.update(id, data);
        if (char) {
          updated.push(char);
        }
      }

      return updated;
    } catch (error) {
      const appError =
        error instanceof RepositoryError
          ? error
          : toAppError(error, 'Failed to update multiple characters');
      logger.error(
        'Failed to update multiple characters',
        { component: 'CharacterRepository', count: updates.length },
        appError,
      );
      throw appError;
    }
  }

  /**
   * Delete a character by ID
   * @param id - Character ID to delete
   * @returns True if deletion was successful
   */
  async delete(id: string): Promise<boolean> {
    try {
      const client = this.db;
      if (!client) {
        return false;
      }

      await client.delete(characters).where(eq(characters.id, id));

      logger.info('Character deleted', {
        component: 'CharacterRepository',
        characterId: id,
      });

      return true;
    } catch (error) {
      logger.error(
        'Failed to delete character',
        { component: 'CharacterRepository', characterId: id },
        error instanceof Error ? error : undefined,
      );
      return false;
    }
  }

  /**
   * Delete multiple characters by their IDs
   * @param ids - Array of character IDs to delete
   * @returns Number of characters deleted
   */
  async deleteMany(ids: string[]): Promise<number> {
    try {
      const client = this.db;
      if (!client) {
        return 0;
      }

      const result = await client
        .delete(characters)
        .where(sql`${characters.id} IN ${sql.raw(ids.join(','))}`);

      logger.info('Multiple characters deleted', {
        component: 'CharacterRepository',
        count: ids.length,
      });

      return result.rowsAffected;
    } catch (error) {
      logger.error(
        'Failed to delete multiple characters',
        { component: 'CharacterRepository', ids },
        error instanceof Error ? error : undefined,
      );
      return 0;
    }
  }

  /**
   * Delete all characters
   * @returns Number of characters deleted
   */
  async deleteAll(): Promise<number> {
    try {
      const client = this.db;
      if (!client) {
        return 0;
      }

      const result = await client.delete(characters);

      logger.info('All characters deleted', {
        component: 'CharacterRepository',
      });

      return result.rowsAffected;
    } catch (error) {
      logger.error(
        'Failed to delete all characters',
        { component: 'CharacterRepository' },
        error instanceof Error ? error : undefined,
      );
      return 0;
    }
  }

  /**
   * Check if a character exists by ID
   * @param id - Character ID to check
   * @returns True if character exists
   */
  async exists(id: string): Promise<boolean> {
    try {
      const character = await this.findById(id);
      return character !== null;
    } catch (error) {
      logger.error(
        'Failed to check character existence',
        { component: 'CharacterRepository', characterId: id },
        error instanceof Error ? error : undefined,
      );
      return false;
    }
  }

  /**
   * Count total number of characters
   * @returns Total character count
   */
  async count(): Promise<number> {
    try {
      const client = this.db;
      if (!client) {
        return 0;
      }

      const result = await client.select({ count: sql<number>`count(*)` }).from(characters);

      return result[0]?.count ?? 0;
    } catch (error) {
      logger.error(
        'Failed to count characters',
        { component: 'CharacterRepository' },
        error instanceof Error ? error : undefined,
      );
      return 0;
    }
  }

  /**
   * Execute a transaction (not supported by Turso web client)
   * @param operations - Function containing operations to execute
   * @returns Result of the operations
   */
  async transaction<T>(operations: () => Promise<T>): Promise<T> {
    // Turso doesn't support explicit transactions in web client
    return operations();
  }

  /**
   * Simple query builder for filtering and sorting
   * @returns Query builder object
   */
  query() {
    // Simple query builder implementation
    const conditions: ((entity: Character) => boolean)[] = [];
    let orderBy: { key: keyof Character; direction: 'asc' | 'desc' } | undefined;
    let limitValue: number | undefined;
    let skipValue: number | undefined;

    return {
      where: (condition: (entity: Character) => boolean) => {
        conditions.push(condition);
        return this;
      },
      orderBy: (key: keyof Character, direction: 'asc' | 'desc' = 'asc') => {
        orderBy = { key, direction };
        return this;
      },
      limit: (limit: number) => {
        limitValue = limit;
        return this;
      },
      skip: (skip: number) => {
        skipValue = skip;
        return this;
      },
      execute: async () => {
        let results = await this.findAll();
        for (const condition of conditions) {
          results = results.filter(condition);
        }
        if (orderBy) {
          const { key, direction } = orderBy;
          results.sort((a, b) => {
            const aVal = a[key];
            const bVal = b[key];
            if (typeof aVal === 'number' && typeof bVal === 'number') {
              return direction === 'asc' ? aVal - bVal : bVal - aVal;
            }
            if (typeof aVal === 'string' && typeof bVal === 'string') {
              return direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            }
            return 0;
          });
        }
        if (limitValue !== undefined) {
          results = results.slice(0, limitValue);
        }
        if (skipValue !== undefined) {
          results = results.slice(skipValue);
        }
        return results;
      },
    };
  }

  // ==================== Query Methods ====================

  /**
   * Find characters by project ID
   * @param projectId - Project ID to search for
   * @returns Array of characters in the project
   */
  async findByProjectId(projectId: string): Promise<Character[]> {
    return findByProjectIdQuery(this.db, projectId, this.mapRowToCharacter.bind(this));
  }

  /**
   * Find characters by role
   * @param role - Character role to search for
   * @returns Array of characters with the specified role
   */
  async findByRole(role: Character['role']): Promise<Character[]> {
    return findByRoleQuery(this.db, role, this.mapRowToCharacter.bind(this));
  }

  /**
   * Find characters by project ID and role
   * @param projectId - Project ID to search for
   * @param role - Character role to search for
   * @returns Array of characters matching both criteria
   */
  async findByProjectIdAndRole(projectId: string, role: Character['role']): Promise<Character[]> {
    return findByProjectIdAndRoleQuery(this.db, projectId, role, this.mapRowToCharacter.bind(this));
  }

  /**
   * Find characters by occupation (case-insensitive partial match)
   * @param occupation - Occupation string to search for
   * @returns Array of characters with matching occupation
   */
  async findByOccupation(occupation: string): Promise<Character[]> {
    return findByOccupationQuery(this.db, occupation, this.mapRowToCharacter.bind(this));
  }

  /**
   * Find characters within an age range
   * @param minAge - Minimum age (inclusive)
   * @param maxAge - Maximum age (inclusive)
   * @returns Array of characters within the age range
   */
  async findByAgeRange(minAge: number, maxAge: number): Promise<Character[]> {
    return findByAgeRangeQuery(this.db, minAge, maxAge, this.mapRowToCharacter.bind(this));
  }

  /**
   * Search characters by name, description, or background
   * @param projectId - Project ID to search within
   * @param query - Search query string
   * @returns Array of matching characters
   */
  async search(projectId: string, query: string): Promise<Character[]> {
    return searchQuery(this.db, projectId, query, this.mapRowToCharacter.bind(this));
  }

  /**
   * Find characters by complex query options
   * @param options - Query options including filters
   * @returns Array of characters matching the query options
   */
  async findByQuery(options: CharacterQueryOptions): Promise<Character[]> {
    return findByQueryComplex(this.db, options, this.mapRowToCharacter.bind(this));
  }

  // ==================== Relationship Methods ====================

  /**
   * Get relationships for a character
   * @param characterId - Character ID to get relationships for
   * @returns Array of character relationships
   */
  async getRelationships(characterId: string): Promise<Character['relationships']> {
    return getRelationshipsQuery(this, characterId);
  }

  /**
   * Find relationship between two characters
   * @param characterAId - First character ID
   * @param characterBId - Second character ID
   * @returns Relationship between the characters or null if not found
   */
  async findRelationshipBetween(
    characterAId: string,
    characterBId: string,
  ): Promise<Character['relationships'][number] | null> {
    return findRelationshipBetweenQuery(this, characterAId, characterBId);
  }

  /**
   * Find relationships within a project with optional filters
   * @param projectId - Project ID to search within
   * @param options - Optional query filters
   * @returns Array of relationships matching the criteria
   */
  async findRelationshipsByProject(
    projectId: string,
    options?: CharacterRelationshipQueryOptions,
  ): Promise<Character['relationships']> {
    return findRelationshipsByProjectQuery(this, projectId, options);
  }

  /**
   * Create a new relationship between characters
   * @param relationship - Relationship data
   * @returns The created relationship
   * @throws RepositoryError if creation fails
   */
  async createRelationship(
    relationship: Character['relationships'][number],
  ): Promise<Character['relationships'][number]> {
    return createRelationshipQuery(this, relationship);
  }

  /**
   * Update an existing relationship
   * @param id - Relationship ID to update
   * @param data - Partial relationship data to update
   * @returns The updated relationship or null if not found
   * @throws RepositoryError if update fails
   */
  async updateRelationship(
    id: string,
    data: Partial<Character['relationships'][number]>,
  ): Promise<Character['relationships'][number] | null> {
    return updateRelationshipQuery(this, id, data);
  }

  /**
   * Delete a relationship by ID
   * @param id - Relationship ID to delete
   * @returns True if deletion was successful
   */
  async deleteRelationship(id: string): Promise<boolean> {
    return deleteRelationshipQuery(this, id);
  }

  // ==================== Count Methods ====================

  /**
   * Count characters in a project
   * @param projectId - Project ID to count characters for
   * @returns Number of characters in the project
   */
  async countByProject(projectId: string): Promise<number> {
    return countByProjectQuery(this, projectId);
  }

  /**
   * Count characters in a project with a specific role
   * @param projectId - Project ID to search within
   * @param role - Character role to count
   * @returns Number of characters with the specified role
   */
  async countByProjectAndRole(projectId: string, role: Character['role']): Promise<number> {
    return countByProjectAndRoleQuery(this, projectId, role);
  }

  // ==================== Private Helper Methods ====================

  /**
   * Map database row to Character type
   * @param row - Database row data
   * @returns Character object
   * @private
   */
  private mapRowToCharacter(row: unknown): Character {
    const r = row as {
      id: string;
      project_id: string;
      name: string;
      role: Character['role'];
      description: string | null;
      personality: string[] | null;
      background: string | null;
      goals: string[] | null;
      conflicts: string[] | null;
      arc: Character['arc'];
      appearance: string | null;
      age: number | null;
      occupation: string | null;
      skills: string[] | null;
      weaknesses: string[] | null;
      relationships: Character['relationships'] | null;
      notes: string | null;
      image_url: string | null;
      created_at: string;
      updated_at: string;
    };

    // Convert string[] skills to CharacterTrait[]
    const traitNames = r.skills ?? [];
    const traits: Character['traits'] = traitNames.map(name => ({
      category: 'personality' as const,
      name,
      description: '',
      intensity: 5,
    }));

    return {
      id: r.id,
      projectId: r.project_id,
      name: r.name,
      aliases: [],
      role: r.role,
      arc: r.arc,
      age: r.age ?? undefined,
      gender: undefined,
      occupation: r.occupation ?? undefined,
      motivation: (r.personality && r.personality.length > 0 ? r.personality[0] : '') as string,
      goal: (r.goals && r.goals.length > 0 ? r.goals[0] : '') as string,
      conflict: (r.conflicts && r.conflicts.length > 0 ? r.conflicts[0] : '') as string,
      backstory: r.background ?? '',
      traits,
      relationships: r.relationships ?? [],
      version: 1,
      summary: undefined,
      tags: [],
      notes: r.notes ?? undefined,
      createdAt: new Date(r.created_at).getTime(),
      updatedAt: new Date(r.updated_at).getTime(),
      imageUrl: r.image_url ?? undefined,
      aiModel: undefined,
    };
  }
}
