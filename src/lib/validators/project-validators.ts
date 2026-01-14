/**
 * Project and Group Validation
 * Logic for validating project-level character collections and groups
 */

import {
  validateCharacterGroup as guardValidateGroup,
  validateCharacterConflict as guardValidateConflict,
  validateUniqueCharacterNames,
  isProtagonist,
  isMainCharacter,
  hasCharacterArc,
} from '@/types/character-guards';
import type {
  Character,
  CharacterRelationship,
  CharacterGroup,
  CharacterConflict,
} from '@/types/character-schemas';
import { CharacterGroupSchema, CharacterConflictSchema } from '@/types/character-schemas';
import type { ValidationResult } from '@/types/schemas';
import { validateData } from '@/types/schemas';

/**
 * Validates character groups
 */
export function validateCharacterGroup(
  data: unknown,
  characters: Character[],
): ValidationResult<CharacterGroup> {
  try {
    const validation = validateData(CharacterGroupSchema, data, 'character group');
    if (!validation.success) {
      return validation;
    }

    const group = validation.data;

    if (!guardValidateGroup(group, characters)) {
      return {
        success: false,
        error: 'Invalid character group configuration',
        issues: [
          {
            path: ['characterIds'],
            message: 'Group must contain at least 2 existing characters',
            code: 'custom' as const,
          },
        ],
      };
    }

    return { success: true, data: group };
  } catch (error) {
    return {
      success: false,
      error: `Group validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      issues: [],
    };
  }
}

/**
 * Validates character conflicts
 */
export function validateCharacterConflict(
  data: unknown,
  characters: Character[],
): ValidationResult<CharacterConflict> {
  try {
    const validation = validateData(CharacterConflictSchema, data, 'character conflict');
    if (!validation.success) {
      return validation;
    }

    const conflict = validation.data;

    if (!guardValidateConflict(conflict, characters)) {
      return {
        success: false,
        error: 'Invalid character conflict configuration',
        issues: [
          {
            path: ['participants'],
            message: 'Conflict must involve at least 2 existing characters',
            code: 'custom' as const,
          },
        ],
      };
    }

    return { success: true, data: conflict };
  } catch (error) {
    return {
      success: false,
      error: `Conflict validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      issues: [],
    };
  }
}

/**
 * Validates entire character collection for a project
 */
export function validateProjectCharacters(
  characters: Character[],
  relationships: CharacterRelationship[] = [],
  groups: CharacterGroup[] = [],
  conflicts: CharacterConflict[] = [],
): ValidationResult<{
  characters: Character[];
  relationships: CharacterRelationship[];
  groups: CharacterGroup[];
  conflicts: CharacterConflict[];
}> {
  try {
    const issues: { path: (string | number)[]; message: string; code: 'custom' }[] = [];

    // Validate unique character names
    if (!validateUniqueCharacterNames(characters)) {
      issues.push({
        path: ['characters'],
        message: 'Character names must be unique within the project',
        code: 'custom',
      });
    }

    // Validate protagonist count
    const protagonists = characters.filter(isProtagonist);
    if (protagonists.length === 0) {
      issues.push({
        path: ['characters'],
        message: 'Project must have at least one protagonist',
        code: 'custom',
      });
    } else if (protagonists.length > 3) {
      issues.push({
        path: ['characters'],
        message: 'Project should not have more than 3 protagonists',
        code: 'custom',
      });
    }

    // Validate main characters have arcs
    const mainCharacters = characters.filter(isMainCharacter);
    const mainWithoutArcs = mainCharacters.filter(char => !hasCharacterArc(char));
    if (mainWithoutArcs.length > 0) {
      issues.push({
        path: ['characters'],
        message: `Main characters missing character arcs: ${mainWithoutArcs.map(c => c.name).join(', ')}`,
        code: 'custom',
      });
    }

    // Validate relationship references
    const characterIds = new Set(characters.map(c => c.id));
    relationships.forEach((rel, index) => {
      if (!characterIds.has(rel.characterAId) || !characterIds.has(rel.characterBId)) {
        issues.push({
          path: ['relationships', index],
          message: `Relationship references non-existent character(s)`,
          code: 'custom',
        });
      }
    });

    // Validate group references
    groups.forEach((group, index) => {
      const invalidRefs = group.characterIds.filter(id => !characterIds.has(id));
      if (invalidRefs.length > 0) {
        issues.push({
          path: ['groups', index],
          message: `Group references non-existent character(s): ${invalidRefs.join(', ')}`,
          code: 'custom',
        });
      }
    });

    // Validate conflict references
    conflicts.forEach((conflict, index) => {
      const invalidRefs = conflict.participants.filter(id => !characterIds.has(id));
      if (invalidRefs.length > 0) {
        issues.push({
          path: ['conflicts', index],
          message: `Conflict references non-existent character(s): ${invalidRefs.join(', ')}`,
          code: 'custom',
        });
      }
    });

    if (issues.length > 0) {
      return {
        success: false,
        error: `Project character validation failed: ${issues.length} issue(s) found`,
        issues,
      };
    }

    return {
      success: true,
      data: { characters, relationships, groups, conflicts },
    };
  } catch (error) {
    return {
      success: false,
      error: `Project validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      issues: [],
    };
  }
}
