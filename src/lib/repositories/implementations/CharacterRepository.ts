/**
 * Character Repository Implementation
 *
 * Implements ICharacterRepository interface using Drizzle ORM
 * Provides CRUD operations, queries, and relationship management for characters
 */

import { eq, and, or, sql, gte, lte } from 'drizzle-orm';

import { getDrizzleClient } from '@/lib/database/drizzle';
import { characters } from '@/lib/database/schemas/characters';
import { toAppError } from '@/lib/errors/error-types';
import { logger } from '@/lib/logging/logger';
import type {
  ICharacterRepository,
  CharacterQueryOptions,
  CharacterRelationshipQueryOptions,
} from '@/lib/repositories/interfaces/ICharacterRepository';
import { RepositoryError, type FindAllOptions } from '@/lib/repositories/interfaces/IRepository';
import type { Character } from '@/types';

/**
 * Character Repository Implementation
 * Manages character data access with type-safe operations
 */
export class CharacterRepository implements ICharacterRepository {
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

  async transaction<T>(operations: () => Promise<T>): Promise<T> {
    // Turso doesn't support explicit transactions in web client
    return operations();
  }

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

  async findByProjectId(projectId: string): Promise<Character[]> {
    try {
      const client = this.db;
      if (!client) {
        return [];
      }

      const result = await client
        .select()
        .from(characters)
        .where(eq(characters.projectId, projectId))
        .orderBy(characters.name);

      return result.map(row => this.mapRowToCharacter(row));
    } catch (error) {
      logger.error(
        'Failed to find characters by project',
        { component: 'CharacterRepository', projectId },
        error instanceof Error ? error : undefined,
      );
      return [];
    }
  }

  async findByRole(role: Character['role']): Promise<Character[]> {
    try {
      const client = this.db;
      if (!client) {
        return [];
      }

      const result = await client
        .select()
        .from(characters)
        .where(eq(characters.role, role))
        .orderBy(characters.name);

      return result.map(row => this.mapRowToCharacter(row));
    } catch (error) {
      logger.error(
        'Failed to find characters by role',
        { component: 'CharacterRepository', role },
        error instanceof Error ? error : undefined,
      );
      return [];
    }
  }

  async findByProjectIdAndRole(projectId: string, role: Character['role']): Promise<Character[]> {
    try {
      const client = this.db;
      if (!client) {
        return [];
      }

      const result = await client
        .select()
        .from(characters)
        .where(and(eq(characters.projectId, projectId), eq(characters.role, role)))
        .orderBy(characters.name);

      return result.map(row => this.mapRowToCharacter(row));
    } catch (error) {
      logger.error(
        'Failed to find characters by project and role',
        { component: 'CharacterRepository', projectId, role },
        error instanceof Error ? error : undefined,
      );
      return [];
    }
  }

  async findByOccupation(occupation: string): Promise<Character[]> {
    try {
      const client = this.db;
      if (!client) {
        return [];
      }

      const result = await client
        .select()
        .from(characters)
        .where(sql`lower(${characters.occupation}) LIKE ${`%${occupation.toLowerCase()}%`}`)
        .orderBy(characters.name);

      return result.map(row => this.mapRowToCharacter(row));
    } catch (error) {
      logger.error(
        'Failed to find characters by occupation',
        { component: 'CharacterRepository', occupation },
        error instanceof Error ? error : undefined,
      );
      return [];
    }
  }

  async findByAgeRange(minAge: number, maxAge: number): Promise<Character[]> {
    try {
      const client = this.db;
      if (!client) {
        return [];
      }

      const result = await client
        .select()
        .from(characters)
        .where(and(gte(characters.age, minAge), lte(characters.age, maxAge)))
        .orderBy(characters.name);

      return result.map(row => this.mapRowToCharacter(row));
    } catch (error) {
      logger.error(
        'Failed to find characters by age range',
        { component: 'CharacterRepository', minAge, maxAge },
        error instanceof Error ? error : undefined,
      );
      return [];
    }
  }

  async search(projectId: string, query: string): Promise<Character[]> {
    try {
      const client = this.db;
      if (!client) {
        return [];
      }

      const searchLower = `%${query.toLowerCase()}%`;

      const result = await client
        .select()
        .from(characters)
        .where(
          and(
            eq(characters.projectId, projectId),
            or(
              sql`lower(${characters.name}) LIKE ${searchLower}`,
              sql`lower(${characters.description}) LIKE ${searchLower}`,
              sql`lower(${characters.background}) LIKE ${searchLower}`,
            ),
          ),
        )
        .orderBy(characters.name);

      return result.map(row => this.mapRowToCharacter(row));
    } catch (error) {
      logger.error(
        'Failed to search characters',
        { component: 'CharacterRepository', projectId, query },
        error instanceof Error ? error : undefined,
      );
      return [];
    }
  }

  async findByQuery(options: CharacterQueryOptions): Promise<Character[]> {
    try {
      const client = this.db;
      if (!client) {
        return [];
      }

      const conditions: unknown[] = [];

      if (options.projectId) {
        conditions.push(eq(characters.projectId, options.projectId));
      }
      if (options.role) {
        conditions.push(eq(characters.role, options.role));
      }
      if (options.minAge) {
        conditions.push(gte(characters.age, options.minAge));
      }
      if (options.maxAge) {
        conditions.push(lte(characters.age, options.maxAge));
      }
      if (options.occupation) {
        const searchLower = `%${options.occupation.toLowerCase()}%`;
        conditions.push(sql`lower(${characters.occupation}) LIKE ${searchLower}`);
      }
      if (options.searchQuery) {
        const searchLower = `%${options.searchQuery.toLowerCase()}%`;
        conditions.push(
          or(
            sql`lower(${characters.name}) LIKE ${searchLower}`,
            sql`lower(${characters.description}) LIKE ${searchLower}`,
          ),
        );
      }

      const result = await client
        .select()
        .from(characters)
        .where(conditions.length > 0 ? and(...(conditions as [])) : undefined)
        .orderBy(characters.name);

      return result.map(row => this.mapRowToCharacter(row));
    } catch (error) {
      logger.error(
        'Failed to find characters by query',
        { component: 'CharacterRepository', options },
        error instanceof Error ? error : undefined,
      );
      return [];
    }
  }

  // ==================== Relationship Methods ====================

  async getRelationships(characterId: string): Promise<Character['relationships']> {
    try {
      const character = await this.findById(characterId);
      if (!character) {
        return [];
      }

      return character.relationships ?? [];
    } catch (error) {
      logger.error(
        'Failed to get character relationships',
        { component: 'CharacterRepository', characterId },
        error instanceof Error ? error : undefined,
      );
      return [];
    }
  }

  async findRelationshipBetween(
    characterAId: string,
    characterBId: string,
  ): Promise<Character['relationships'][number] | null> {
    try {
      const characterA = await this.findById(characterAId);
      if (!characterA) {
        return null;
      }

      const relationships = characterA.relationships ?? [];
      return (
        relationships.find(
          rel => rel.characterAId === characterBId || rel.characterBId === characterBId,
        ) ?? null
      );
    } catch (error) {
      logger.error(
        'Failed to find relationship between characters',
        { component: 'CharacterRepository', characterAId, characterBId },
        error instanceof Error ? error : undefined,
      );
      return null;
    }
  }

  async findRelationshipsByProject(
    projectId: string,
    options?: CharacterRelationshipQueryOptions,
  ): Promise<Character['relationships']> {
    try {
      const characters = await this.findByProjectId(projectId);
      const allRelationships: Character['relationships'] = [];

      for (const character of characters) {
        if (character.relationships) {
          allRelationships.push(...character.relationships);
        }
      }

      // Filter by options
      let filtered = allRelationships;

      if (options?.characterId) {
        filtered = filtered.filter(
          rel =>
            rel.characterAId === options.characterId || rel.characterBId === options.characterId,
        );
      }

      if (options?.type) {
        filtered = filtered.filter(rel => rel.type === options.type);
      }

      if (options?.minStrength) {
        filtered = filtered.filter(rel => rel.strength >= options.minStrength!);
      }

      if (options?.maxStrength) {
        filtered = filtered.filter(rel => rel.strength <= options.maxStrength!);
      }

      return filtered;
    } catch (error) {
      logger.error(
        'Failed to find relationships by project',
        { component: 'CharacterRepository', projectId, options },
        error instanceof Error ? error : undefined,
      );
      return [];
    }
  }

  async createRelationship(
    relationship: Character['relationships'][number],
  ): Promise<Character['relationships'][number]> {
    try {
      const characterA = await this.findById(relationship.characterAId);
      if (!characterA) {
        throw new RepositoryError(`Character ${relationship.characterAId} not found`, 'NOT_FOUND');
      }

      const existingRelationships = characterA.relationships ?? [];
      const relationshipId = `rel_${Date.now()}`;
      const newRelationship: Character['relationships'][number] = {
        id: relationshipId,
        characterAId: relationship.characterAId,
        characterBId: relationship.characterBId,
        type: relationship.type,
        description: relationship.description,
        strength: relationship.strength,
      };

      await this.update(relationship.characterAId, {
        relationships: [...existingRelationships, newRelationship],
      });

      return newRelationship;
    } catch (error) {
      const appError =
        error instanceof RepositoryError
          ? error
          : toAppError(error, 'Failed to create relationship');
      logger.error(
        'Failed to create relationship',
        { component: 'CharacterRepository', relationship },
        appError,
      );
      throw appError;
    }
  }

  async updateRelationship(
    id: string,
    data: Partial<Character['relationships'][number]>,
  ): Promise<Character['relationships'][number] | null> {
    try {
      const allCharacters = await this.findAll();

      for (const character of allCharacters) {
        if (character.relationships) {
          const relationshipIndex = character.relationships.findIndex(rel => rel.id === id);

          if (relationshipIndex >= 0) {
            const updatedRelationships = [...character.relationships];
            updatedRelationships[relationshipIndex] = {
              ...updatedRelationships[relationshipIndex],
              ...data,
            } as Character['relationships'][number];

            await this.update(character.id, {
              relationships: updatedRelationships,
            });

            return updatedRelationships[relationshipIndex];
          }
        }
      }

      return null;
    } catch (error) {
      const appError =
        error instanceof RepositoryError
          ? error
          : toAppError(error, 'Failed to update relationship');
      logger.error(
        'Failed to update relationship',
        { component: 'CharacterRepository', relationshipId: id },
        appError,
      );
      throw appError;
    }
  }

  async deleteRelationship(id: string): Promise<boolean> {
    try {
      const allCharacters = await this.findAll();

      for (const character of allCharacters) {
        if (character.relationships) {
          const relationshipIndex = character.relationships.findIndex(rel => rel.id === id);

          if (relationshipIndex >= 0) {
            const updatedRelationships = character.relationships.filter(rel => rel.id !== id);

            await this.update(character.id, {
              relationships: updatedRelationships,
            });

            return true;
          }
        }
      }

      return false;
    } catch (error) {
      logger.error(
        'Failed to delete relationship',
        { component: 'CharacterRepository', relationshipId: id },
        error instanceof Error ? error : undefined,
      );
      return false;
    }
  }

  // ==================== Count Methods ====================

  async countByProject(projectId: string): Promise<number> {
    try {
      const characters = await this.findByProjectId(projectId);
      return characters.length;
    } catch (error) {
      logger.error(
        'Failed to count characters by project',
        { component: 'CharacterRepository', projectId },
        error instanceof Error ? error : undefined,
      );
      return 0;
    }
  }

  async countByProjectAndRole(projectId: string, role: Character['role']): Promise<number> {
    try {
      const characters = await this.findByProjectIdAndRole(projectId, role);
      return characters.length;
    } catch (error) {
      logger.error(
        'Failed to count characters by project and role',
        { component: 'CharacterRepository', projectId, role },
        error instanceof Error ? error : undefined,
      );
      return 0;
    }
  }

  // ==================== Private Helper Methods ====================

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
