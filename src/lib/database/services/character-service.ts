/**
 * Character Service for Turso Database
 * Handles all character data persistence using Drizzle ORM
 */
import { eq } from 'drizzle-orm';

import { getDrizzleClient } from '@/lib/database/drizzle';
import { characters, type CharacterRow, type NewCharacterRow } from '@/lib/database/schemas';
import { logger } from '@/lib/logging/logger';
import { generateSecureId } from '@/lib/secure-random';
import type { Character, CharacterRelationship } from '@/types';


class CharacterService {
  /**
   * Initialize the service (no-op for Turso, connection is managed by getDrizzleClient)
   */
  public async init(): Promise<void> {
    // Connection is handled by getDrizzleClient
    logger.info('Character service initialized', { component: 'CharacterService' });
  }

  /**
   * Create a new character
   */
  /**
   * Map database row to Character type
   */
  private mapRowToCharacter(row: CharacterRow): Character {
    // Reconstruct traits from stored JSON columns
    const traits = [
      ...(row.personality?.map(name => ({ category: 'personality', name, description: '', intensity: 5 } as const)) || []),
      ...(row.skills?.map(name => ({ category: 'skill', name, description: '', intensity: 5 } as const)) || []),
      ...(row.weaknesses?.map(name => ({ category: 'flaw', name, description: '', intensity: 5 } as const)) || [])
    ];

    // Safe date conversion
    const created = row.createdAt ? new Date(row.createdAt).getTime() : Date.now();
    const updated = row.updatedAt ? new Date(row.updatedAt).getTime() : Date.now();

    return {
      id: row.id,
      projectId: row.projectId,
      name: row.name,
      aliases: [], // Missing in DB, default to empty
      role: row.role as Character['role'],
      // Map singular fields
      motivation: '', 
      goal: row.goals?.[0] ?? '',
      conflict: row.conflicts?.[0] ?? '', 
      
      // Mapped fields
      summary: row.description || undefined, // Map DB description -> Domain summary
      backstory: row.background || undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      arc: row.arc as any || undefined, 
      age: row.age || undefined,
      occupation: row.occupation || undefined,
      
      // Traits aggregated
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      traits: traits as any, 

      // Relationships 
      relationships: (row.relationships as CharacterRelationship[]) || [],

      // Metadata
      notes: row.notes || undefined,
      imageUrl: row.imageUrl || undefined,
      version: 1,
      tags: [],
      createdAt: created,
      updatedAt: updated,
      // Optional fields defaulting to empty/undefined
      aiModel: undefined
    };
  }

  /**
   * Create a new character
   */
  public async createCharacter(character: Omit<Character, 'id'>): Promise<Character> {
    const db = getDrizzleClient();
    if (!db) {
      throw new Error('Database not configured. Please configure Turso connection.');
    }

    try {
      const id = generateSecureId();
      const now = new Date().toISOString();

      // Extract traits to columns
      const personality = character.traits.filter(t => t.category === 'personality').map(t => t.name);
      const skills = character.traits.filter(t => t.category === 'skill').map(t => t.name);
      const weaknesses = character.traits.filter(t => t.category === 'flaw').map(t => t.name);

      const newCharacter: NewCharacterRow = {
        id,
        projectId: character.projectId,
        name: character.name,
        role: character.role,
        description: character.summary ?? null, // Map summary -> description
        personality: personality.length ? personality : null,
        background: character.backstory ?? null,
        goals: character.goal ? [character.goal] : null,
        conflicts: character.conflict ? [character.conflict] : null,
        arc: character.arc ?? null,
        appearance: null, // Mapped to traits in domain, but DB has col
        age: character.age ?? null,
        occupation: character.occupation ?? null,
        skills: skills.length ? skills : null,
        weaknesses: weaknesses.length ? weaknesses : null,
        relationships: character.relationships ?? null,
        notes: character.notes ?? null,
        imageUrl: character.imageUrl ?? null,
        createdAt: now,
        updatedAt: now,
      };

      await db.insert(characters).values(newCharacter as NonNullable<NewCharacterRow>);

      logger.info('Character created', { component: 'CharacterService', characterId: id });

      return this.mapRowToCharacter(newCharacter as CharacterRow);
    } catch (error) {
      logger.error('Failed to create character', { component: 'CharacterService' }, error as Error);
      throw error;
    }
  }

  /**
   * Get all characters for a project
   */
  public async getCharactersByProjectId(projectId: string): Promise<Character[]> {
    const db = getDrizzleClient();
    if (!db) {
      return [];
    }

    try {
      const rows = await db.select().from(characters).where(eq(characters.projectId, projectId));
      return rows.map((row) => this.mapRowToCharacter(row));
    } catch (error) {
      logger.error(
        'Failed to get characters',
        { component: 'CharacterService', projectId },
        error as Error,
      );
      return [];
    }
  }

  /**
   * Get a character by ID
   */
  public async getCharacterById(characterId: string): Promise<Character | null> {
    const db = getDrizzleClient();
    if (!db) {
      return null;
    }

    try {
      const rows = await db.select().from(characters).where(eq(characters.id, characterId));
      const row = rows[0];
      return row ? this.mapRowToCharacter(row) : null;
    } catch (error) {
      logger.error(
        'Failed to get character',
        { component: 'CharacterService', characterId },
        error as Error,
      );
      return null;
    }
  }

  /**
   * Update a character
   */
  public async updateCharacter(characterId: string, updates: Partial<Character>): Promise<void> {
    const db = getDrizzleClient();
    if (!db) {
      throw new Error('Database not configured');
    }

    try {
      // Map Partial<Character> to Partial<NonNullable<NewCharacterRow>> to ensure compatibility with set()
      const updateData: Partial<NonNullable<NewCharacterRow>> = {
        updatedAt: new Date().toISOString(),
      };

      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.role !== undefined) updateData.role = updates.role;
      if (updates.summary !== undefined) updateData.description = updates.summary ?? null;
      if (updates.backstory !== undefined) updateData.background = updates.backstory ?? null;
      if (updates.goal !== undefined) updateData.goals = updates.goal ? [updates.goal] : null;
      if (updates.conflict !== undefined) updateData.conflicts = updates.conflict ? [updates.conflict] : null;
      if (updates.imageUrl !== undefined) updateData.imageUrl = updates.imageUrl ?? null;
      if (updates.relationships !== undefined) updateData.relationships = updates.relationships;
      if (updates.age !== undefined) updateData.age = updates.age ?? null;
      if (updates.occupation !== undefined) updateData.occupation = updates.occupation ?? null;
      if (updates.notes !== undefined) updateData.notes = updates.notes ?? null;
      if (updates.arc !== undefined) updateData.arc = updates.arc ?? null;
      
      if (updates.traits) {
        updateData.personality = updates.traits.filter(t => t.category === 'personality').map(t => t.name);
        updateData.skills = updates.traits.filter(t => t.category === 'skill').map(t => t.name);
        updateData.weaknesses = updates.traits.filter(t => t.category === 'flaw').map(t => t.name);
      }

      await db.update(characters).set(updateData).where(eq(characters.id, characterId));

      logger.info('Character updated', { component: 'CharacterService', characterId });
    } catch (error) {
      logger.error(
        'Failed to update character',
        { component: 'CharacterService', characterId },
        error as Error,
      );
      throw error;
    }
  }

  /**
   * Delete a character
   */
  public async deleteCharacter(characterId: string): Promise<void> {
    const db = getDrizzleClient();
    if (!db) {
      throw new Error('Database not configured');
    }

    try {
      await db.delete(characters).where(eq(characters.id, characterId));
      logger.info('Character deleted', { component: 'CharacterService', characterId });
    } catch (error) {
      logger.error(
        'Failed to delete character',
        { component: 'CharacterService', characterId },
        error as Error,
      );
      throw error;
    }
  }

  /**
   * Search characters by name
   */
  public async searchCharacters(projectId: string, searchTerm: string): Promise<Character[]> {
    const db = getDrizzleClient();
    if (!db) {
      return [];
    }

    try {
      // Get all characters for the project and filter in memory
      // SQLite doesn't have full-text search out of the box
      const allCharacters = await this.getCharactersByProjectId(projectId);
      const lowerSearch = searchTerm.toLowerCase();

      return allCharacters.filter(
        (char) =>
          char.name.toLowerCase().includes(lowerSearch) ||
          (char.summary && char.summary.toLowerCase().includes(lowerSearch)) ||
          char.role.toLowerCase().includes(lowerSearch),
      );
    } catch (error) {
      logger.error(
        'Failed to search characters',
        { component: 'CharacterService', projectId, searchTerm },
        error as Error,
      );
      return [];
    }
  }

  /**
   * Delete all characters for a project
   */
  public async deleteCharactersByProjectId(projectId: string): Promise<void> {
    const db = getDrizzleClient();
    if (!db) {
      throw new Error('Database not configured');
    }

    try {
      await db.delete(characters).where(eq(characters.projectId, projectId));
      logger.info('Characters deleted for project', { component: 'CharacterService', projectId });
    } catch (error) {
      logger.error(
        'Failed to delete characters',
        { component: 'CharacterService', projectId },
        error as Error,
      );
      throw error;
    }
  }
}

// Export singleton instance
export const characterService = new CharacterService();
