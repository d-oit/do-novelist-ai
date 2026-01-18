/**
 * Character Repository Interface
 *
 * Extends the generic repository with character-specific query methods
 */
import type { Character, CharacterRelationship } from '@/types';

import { type IRepository } from './IRepository';

/**
 * Character query options
 */
export interface CharacterQueryOptions {
  projectId?: string;
  role?: Character['role'];
  minAge?: number;
  maxAge?: number;
  occupation?: string;
  searchQuery?: string;
}

/**
 * Character relationship query options
 */
export interface CharacterRelationshipQueryOptions {
  projectId?: string;
  characterId?: string;
  type?: CharacterRelationship['type'];
  minStrength?: number;
  maxStrength?: number;
}

/**
 * Character repository interface with character-specific methods
 */
export interface ICharacterRepository extends IRepository<Character> {
  /**
   * Find all characters for a project
   * @param projectId - The project ID
   * @returns Array of characters ordered by name
   */
  findByProjectId(projectId: string): Promise<Character[]>;

  /**
   * Find characters by role
   * @param role - The character role
   * @returns Array of characters with matching role
   */
  findByRole(role: Character['role']): Promise<Character[]>;

  /**
   * Find characters for a project with specific role
   * @param projectId - The project ID
   * @param role - The character role
   * @returns Array of matching characters
   */
  findByProjectIdAndRole(projectId: string, role: Character['role']): Promise<Character[]>;

  /**
   * Find characters by occupation
   * @param occupation - The character occupation
   * @returns Array of characters with matching occupation
   */
  findByOccupation(occupation: string): Promise<Character[]>;

  /**
   * Find characters by age range
   * @param minAge - Minimum age
   * @param maxAge - Maximum age
   * @returns Array of characters within age range
   */
  findByAgeRange(minAge: number, maxAge: number): Promise<Character[]>;

  /**
   * Search characters by name or description
   * @param projectId - The project ID
   * @param query - Search query
   * @returns Array of matching characters
   */
  search(projectId: string, query: string): Promise<Character[]>;

  /**
   * Find characters with complex query options
   * @param options - Query options
   * @returns Array of matching characters
   */
  findByQuery(options: CharacterQueryOptions): Promise<Character[]>;

  /**
   * Get relationships for a character
   * @param characterId - The character ID
   * @returns Array of relationships
   */
  getRelationships(characterId: string): Promise<CharacterRelationship[]>;

  /**
   * Find relationships between two characters
   * @param characterAId - First character ID
   * @param characterBId - Second character ID
   * @returns The relationship if found, null otherwise
   */
  findRelationshipBetween(
    characterAId: string,
    characterBId: string,
  ): Promise<CharacterRelationship | null>;

  /**
   * Find relationships for a project
   * @param projectId - The project ID
   * @param options - Query options
   * @returns Array of relationships
   */
  findRelationshipsByProject(
    projectId: string,
    options?: CharacterRelationshipQueryOptions,
  ): Promise<CharacterRelationship[]>;

  /**
   * Create a relationship between two characters
   * @param relationship - The relationship to create
   * @returns The created relationship
   */
  createRelationship(relationship: CharacterRelationship): Promise<CharacterRelationship>;

  /**
   * Update a relationship
   * @param id - The relationship ID
   * @param data - Partial relationship data to update
   * @returns The updated relationship if found, null otherwise
   */
  updateRelationship(
    id: string,
    data: Partial<CharacterRelationship>,
  ): Promise<CharacterRelationship | null>;

  /**
   * Delete a relationship
   * @param id - The relationship ID
   * @returns true if deleted, false if not found
   */
  deleteRelationship(id: string): Promise<boolean>;

  /**
   * Get character count for a project
   * @param projectId - The project ID
   * @returns The number of characters
   */
  countByProject(projectId: string): Promise<number>;

  /**
   * Get character count by role for a project
   * @param projectId - The project ID
   * @param role - The character role
   * @returns The number of characters with the role
   */
  countByProjectAndRole(projectId: string, role: Character['role']): Promise<number>;
}
