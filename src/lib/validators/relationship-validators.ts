/**
 * Relationship Validation
 * Logic for validating character relationships
 */

import { validateRelationship } from '@/types/character-guards';
import type {
  Character,
  CharacterRelationship,
  CharacterRelationshipSchema,
} from '@/types/character-schemas';
import type { ValidationResult } from '@/types/schemas';
import { validateData } from '@/types/schemas';

import { validateRelationshipAppropriateness } from './validation-helpers';

/**
 * Validates character relationships
 */
export function validateCharacterRelationship(
  data: unknown,
  characters: Character[],
): ValidationResult<CharacterRelationship> {
  try {
    const validation = validateData(CharacterRelationshipSchema, data, 'character relationship');
    if (!validation.success) {
      return validation;
    }

    const relationship = validation.data;
    const issues: { path: (string | number)[]; message: string; code: 'custom' }[] = [];

    // Validate relationship logic
    if (!validateRelationship(relationship)) {
      issues.push({
        path: ['characterAId', 'characterBId'],
        message: 'Invalid relationship configuration',
        code: 'custom',
      });
    }

    // Validate character existence
    const characterIds = characters.map(c => c.id);
    if (!characterIds.includes(relationship.characterAId)) {
      issues.push({
        path: ['characterAId'],
        message: 'Character A does not exist',
        code: 'custom',
      });
    }
    if (!characterIds.includes(relationship.characterBId)) {
      issues.push({
        path: ['characterBId'],
        message: 'Character B does not exist',
        code: 'custom',
      });
    }

    // Validate relationship type appropriateness
    const charA = characters.find(c => c.id === relationship.characterAId);
    const charB = characters.find(c => c.id === relationship.characterBId);

    if (charA && charB) {
      const appropriatenessIssue = validateRelationshipAppropriateness(charA, charB, relationship);
      if (appropriatenessIssue) {
        issues.push({
          ...appropriatenessIssue,
          code: 'custom' as const,
        });
      }
    }

    if (issues.length > 0) {
      return {
        success: false,
        error: `Relationship validation failed: ${issues.length} issue(s) found`,
        issues,
      };
    }

    return { success: true, data: relationship };
  } catch (error) {
    return {
      success: false,
      error: `Relationship validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      issues: [],
    };
  }
}
