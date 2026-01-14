import { type ValidationIssue, type ValidationResult } from '@/lib/character-validation/types';
import { validateRelationship } from '@/types/character-guards';
import {
  type Character,
  type CharacterRelationship,
  CharacterRelationshipSchema,
} from '@/types/character-schemas';
import { validateData } from '@/types/schemas';

export function validateRelationshipAppropriateness(
  charA: Character,
  charB: Character,
  relationship: CharacterRelationship,
): ValidationIssue | null {
  // Age-appropriate relationships
  if (relationship.type === 'romantic') {
    const ageA = charA.physicalTraits?.age;
    const ageB = charB.physicalTraits?.age;

    if (ageA !== undefined && ageB !== undefined) {
      if (Math.abs(ageA - ageB) > 15 && (ageA < 25 || ageB < 25)) {
        return {
          path: ['type'],
          message: 'Large age gap in romantic relationship with young character',
          code: 'custom',
        };
      }
    }
  }

  // Family relationships should have appropriate intensity
  if (relationship.type === 'family' && relationship.intensity < 3) {
    return {
      path: ['intensity'],
      message: 'Family relationships should have higher intensity (3+)',
      code: 'custom',
    };
  }

  // Enemy relationships should have description
  if (relationship.type === 'enemy' && !relationship.description) {
    return {
      path: ['description'],
      message: 'Enemy relationships must have a description',
      code: 'custom',
    };
  }

  return null;
}

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
    const issues: ValidationIssue[] = [];

    // Validate relationship logic
    if (!validateRelationship(relationship)) {
      issues.push({
        path: ['characterAId', 'characterBId'],
        message: 'Invalid relationship configuration',
        code: 'custom',
      });
    }

    const charA = characters.find(c => c.id === relationship.characterAId);
    const charB = characters.find(c => c.id === relationship.characterBId);

    if (!charA) {
      issues.push({
        path: ['characterAId'],
        message: 'Character A does not exist',
        code: 'custom',
      });
    }

    if (!charB) {
      issues.push({
        path: ['characterBId'],
        message: 'Character B does not exist',
        code: 'custom',
      });
    }

    if (charA && charB) {
      const appropriatenessIssue = validateRelationshipAppropriateness(charA, charB, relationship);
      if (appropriatenessIssue) {
        issues.push(appropriatenessIssue);
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
