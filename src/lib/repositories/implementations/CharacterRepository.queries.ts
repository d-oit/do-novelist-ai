/**
 * Character Repository - Query Functions
 *
 * Contains complex query methods, relationship management, and count operations
 * These functions are used by CharacterRepository.core.ts
 */

import { eq, and, or, sql, gte, lte } from 'drizzle-orm';

import { characters } from '@/lib/database/schemas/characters';
import { toAppError } from '@/lib/errors/error-types';
import { logger } from '@/lib/logging/logger';
import type {
  CharacterQueryOptions,
  CharacterRelationshipQueryOptions,
} from '@/lib/repositories/interfaces/ICharacterRepository';
import { RepositoryError } from '@/lib/repositories/interfaces/IRepository';
import type { Character } from '@/types';

/**
 * Database client type
 */
type DbClient = ReturnType<typeof import('@/lib/database/drizzle').getDrizzleClient>;

/**
 * Mapper function type
 */
type RowMapper = (row: unknown) => Character;

/**
 * Repository instance type
 */
type RepositoryInstance = {
  findByProjectId: (projectId: string) => Promise<Character[]>;
  findById: (id: string) => Promise<Character | null>;
  update: (id: string, data: Partial<Character>) => Promise<Character | null>;
  findAll: () => Promise<Character[]>;
  findByProjectIdAndRole: (projectId: string, role: Character['role']) => Promise<Character[]>;
};

// ==================== Query Methods ====================

/**
 * Find characters by project ID
 * @param db - Database client
 * @param projectId - Project ID to search for
 * @param mapRow - Function to map database row to Character
 * @returns Array of characters in the project
 */
export function findByProjectIdQuery(
  db: DbClient,
  projectId: string,
  mapRow: RowMapper,
): Promise<Character[]> {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        const client = db;
        if (!client) {
          resolve([]);
          return;
        }

        const result = await client
          .select()
          .from(characters)
          .where(eq(characters.projectId, projectId))
          .orderBy(characters.name);

        resolve(result.map(mapRow));
      } catch (error) {
        logger.error(
          'Failed to find characters by project',
          { component: 'CharacterRepository', projectId },
          error instanceof Error ? error : undefined,
        );
        resolve([]);
      }
    })().catch(reject);
  });
}

/**
 * Find characters by role
 * @param db - Database client
 * @param role - Character role to search for
 * @param mapRow - Function to map database row to Character
 * @returns Array of characters with the specified role
 */
export function findByRoleQuery(
  db: DbClient,
  role: Character['role'],
  mapRow: RowMapper,
): Promise<Character[]> {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        const client = db;
        if (!client) {
          resolve([]);
          return;
        }

        const result = await client
          .select()
          .from(characters)
          .where(eq(characters.role, role))
          .orderBy(characters.name);

        resolve(result.map(mapRow));
      } catch (error) {
        logger.error(
          'Failed to find characters by role',
          { component: 'CharacterRepository', role },
          error instanceof Error ? error : undefined,
        );
        resolve([]);
      }
    })().catch(reject);
  });
}

/**
 * Find characters by project ID and role
 * @param db - Database client
 * @param projectId - Project ID to search for
 * @param role - Character role to search for
 * @param mapRow - Function to map database row to Character
 * @returns Array of characters matching both criteria
 */
export function findByProjectIdAndRoleQuery(
  db: DbClient,
  projectId: string,
  role: Character['role'],
  mapRow: RowMapper,
): Promise<Character[]> {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        const client = db;
        if (!client) {
          resolve([]);
          return;
        }

        const result = await client
          .select()
          .from(characters)
          .where(and(eq(characters.projectId, projectId), eq(characters.role, role)))
          .orderBy(characters.name);

        resolve(result.map(mapRow));
      } catch (error) {
        logger.error(
          'Failed to find characters by project and role',
          { component: 'CharacterRepository', projectId, role },
          error instanceof Error ? error : undefined,
        );
        resolve([]);
      }
    })().catch(reject);
  });
}

/**
 * Find characters by occupation (case-insensitive partial match)
 * @param db - Database client
 * @param occupation - Occupation string to search for
 * @param mapRow - Function to map database row to Character
 * @returns Array of characters with matching occupation
 */
export function findByOccupationQuery(
  db: DbClient,
  occupation: string,
  mapRow: RowMapper,
): Promise<Character[]> {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        const client = db;
        if (!client) {
          resolve([]);
          return;
        }

        const result = await client
          .select()
          .from(characters)
          .where(sql`lower(${characters.occupation}) LIKE ${`%${occupation.toLowerCase()}%`}`)
          .orderBy(characters.name);

        resolve(result.map(mapRow));
      } catch (error) {
        logger.error(
          'Failed to find characters by occupation',
          { component: 'CharacterRepository', occupation },
          error instanceof Error ? error : undefined,
        );
        resolve([]);
      }
    })().catch(reject);
  });
}

/**
 * Find characters within an age range
 * @param db - Database client
 * @param minAge - Minimum age (inclusive)
 * @param maxAge - Maximum age (inclusive)
 * @param mapRow - Function to map database row to Character
 * @returns Array of characters within the age range
 */
export function findByAgeRangeQuery(
  db: DbClient,
  minAge: number,
  maxAge: number,
  mapRow: RowMapper,
): Promise<Character[]> {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        const client = db;
        if (!client) {
          resolve([]);
          return;
        }

        const result = await client
          .select()
          .from(characters)
          .where(and(gte(characters.age, minAge), lte(characters.age, maxAge)))
          .orderBy(characters.name);

        resolve(result.map(mapRow));
      } catch (error) {
        logger.error(
          'Failed to find characters by age range',
          { component: 'CharacterRepository', minAge, maxAge },
          error instanceof Error ? error : undefined,
        );
        resolve([]);
      }
    })().catch(reject);
  });
}

/**
 * Search characters by name, description, or background
 * @param db - Database client
 * @param projectId - Project ID to search within
 * @param query - Search query string
 * @param mapRow - Function to map database row to Character
 * @returns Array of matching characters
 */
export function searchQuery(
  db: DbClient,
  projectId: string,
  query: string,
  mapRow: RowMapper,
): Promise<Character[]> {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        const client = db;
        if (!client) {
          resolve([]);
          return;
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

        resolve(result.map(mapRow));
      } catch (error) {
        logger.error(
          'Failed to search characters',
          { component: 'CharacterRepository', projectId, query },
          error instanceof Error ? error : undefined,
        );
        resolve([]);
      }
    })().catch(reject);
  });
}

/**
 * Find characters by complex query options
 * @param db - Database client
 * @param options - Query options including filters
 * @param mapRow - Function to map database row to Character
 * @returns Array of characters matching the query options
 */
export function findByQuery(
  db: DbClient,
  options: CharacterQueryOptions,
  mapRow: RowMapper,
): Promise<Character[]> {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        const client = db;
        if (!client) {
          resolve([]);
          return;
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

        resolve(result.map(mapRow));
      } catch (error) {
        logger.error(
          'Failed to find characters by query',
          { component: 'CharacterRepository', options },
          error instanceof Error ? error : undefined,
        );
        resolve([]);
      }
    })().catch(reject);
  });
}

// ==================== Relationship Methods ====================

/**
 * Get relationships for a character
 * @param repo - Repository instance
 * @param characterId - Character ID to get relationships for
 * @returns Array of character relationships
 */
export function getRelationshipsQuery(
  repo: RepositoryInstance,
  characterId: string,
): Promise<Character['relationships']> {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        const character = await repo.findById(characterId);
        if (!character) {
          resolve([]);
          return;
        }

        resolve(character.relationships ?? []);
      } catch (error) {
        logger.error(
          'Failed to get character relationships',
          { component: 'CharacterRepository', characterId },
          error instanceof Error ? error : undefined,
        );
        resolve([]);
      }
    })().catch(reject);
  });
}

/**
 * Find relationship between two characters
 * @param repo - Repository instance
 * @param characterAId - First character ID
 * @param characterBId - Second character ID
 * @returns Relationship between the characters or null if not found
 */
export function findRelationshipBetweenQuery(
  repo: RepositoryInstance,
  characterAId: string,
  characterBId: string,
): Promise<Character['relationships'][number] | null> {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        const characterA = await repo.findById(characterAId);
        if (!characterA) {
          resolve(null);
          return;
        }

        const relationships = characterA.relationships ?? [];
        resolve(
          relationships.find(
            rel => rel.characterAId === characterBId || rel.characterBId === characterBId,
          ) ?? null,
        );
      } catch (error) {
        logger.error(
          'Failed to find relationship between characters',
          { component: 'CharacterRepository', characterAId, characterBId },
          error instanceof Error ? error : undefined,
        );
        resolve(null);
      }
    })().catch(reject);
  });
}

/**
 * Find relationships within a project with optional filters
 * @param repo - Repository instance
 * @param projectId - Project ID to search within
 * @param options - Optional query filters
 * @returns Array of relationships matching the criteria
 */
export function findRelationshipsByProjectQuery(
  repo: RepositoryInstance,
  projectId: string,
  options?: CharacterRelationshipQueryOptions,
): Promise<Character['relationships']> {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        const characters = await repo.findByProjectId(projectId);
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

        resolve(filtered);
      } catch (error) {
        logger.error(
          'Failed to find relationships by project',
          { component: 'CharacterRepository', projectId, options },
          error instanceof Error ? error : undefined,
        );
        resolve([]);
      }
    })().catch(reject);
  });
}

/**
 * Create a new relationship between characters
 * @param repo - Repository instance
 * @param relationship - Relationship data
 * @returns The created relationship
 * @throws RepositoryError if creation fails
 */
export function createRelationshipQuery(
  repo: RepositoryInstance,
  relationship: Character['relationships'][number],
): Promise<Character['relationships'][number]> {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        const characterA = await repo.findById(relationship.characterAId);
        if (!characterA) {
          throw new RepositoryError(
            `Character ${relationship.characterAId} not found`,
            'NOT_FOUND',
          );
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

        await repo.update(relationship.characterAId, {
          relationships: [...existingRelationships, newRelationship],
        });

        resolve(newRelationship);
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
        reject(appError);
      }
    })().catch(reject);
  });
}

/**
 * Update an existing relationship
 * @param repo - Repository instance
 * @param id - Relationship ID to update
 * @param data - Partial relationship data to update
 * @returns The updated relationship or null if not found
 * @throws RepositoryError if update fails
 */
export function updateRelationshipQuery(
  repo: RepositoryInstance,
  id: string,
  data: Partial<Character['relationships'][number]>,
): Promise<Character['relationships'][number] | null> {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        const allCharacters = await repo.findAll();

        for (const character of allCharacters) {
          if (character.relationships) {
            const relationshipIndex = character.relationships.findIndex(rel => rel.id === id);

            if (relationshipIndex >= 0) {
              const updatedRelationships = [...character.relationships];
              updatedRelationships[relationshipIndex] = {
                ...updatedRelationships[relationshipIndex],
                ...data,
              } as Character['relationships'][number];

              await repo.update(character.id, {
                relationships: updatedRelationships,
              });

              resolve(updatedRelationships[relationshipIndex]);
              return;
            }
          }
        }

        resolve(null);
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
        reject(appError);
      }
    })().catch(reject);
  });
}

/**
 * Delete a relationship by ID
 * @param repo - Repository instance
 * @param id - Relationship ID to delete
 * @returns True if deletion was successful
 */
export function deleteRelationshipQuery(repo: RepositoryInstance, id: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        const allCharacters = await repo.findAll();

        for (const character of allCharacters) {
          if (character.relationships) {
            const relationshipIndex = character.relationships.findIndex(rel => rel.id === id);

            if (relationshipIndex >= 0) {
              const updatedRelationships = character.relationships.filter(rel => rel.id !== id);

              await repo.update(character.id, {
                relationships: updatedRelationships,
              });

              resolve(true);
              return;
            }
          }
        }

        resolve(false);
      } catch (error) {
        logger.error(
          'Failed to delete relationship',
          { component: 'CharacterRepository', relationshipId: id },
          error instanceof Error ? error : undefined,
        );
        resolve(false);
      }
    })().catch(reject);
  });
}

// ==================== Count Methods ====================

/**
 * Count characters in a project
 * @param repo - Repository instance
 * @param projectId - Project ID to count characters for
 * @returns Number of characters in the project
 */
export function countByProjectQuery(repo: RepositoryInstance, projectId: string): Promise<number> {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        const characters = await repo.findByProjectId(projectId);
        resolve(characters.length);
      } catch (error) {
        logger.error(
          'Failed to count characters by project',
          { component: 'CharacterRepository', projectId },
          error instanceof Error ? error : undefined,
        );
        resolve(0);
      }
    })().catch(reject);
  });
}

/**
 * Count characters in a project with a specific role
 * @param repo - Repository instance
 * @param projectId - Project ID to search within
 * @param role - Character role to count
 * @returns Number of characters with the specified role
 */
export function countByProjectAndRoleQuery(
  repo: RepositoryInstance,
  projectId: string,
  role: Character['role'],
): Promise<number> {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        const characters = await repo.findByProjectIdAndRole(projectId, role);
        resolve(characters.length);
      } catch (error) {
        logger.error(
          'Failed to count characters by project and role',
          { component: 'CharacterRepository', projectId, role },
          error instanceof Error ? error : undefined,
        );
        resolve(0);
      }
    })().catch(reject);
  });
}
