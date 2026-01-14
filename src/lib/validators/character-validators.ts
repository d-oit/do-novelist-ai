/**
 * Character Validation
 * Core logic for validating individual character entities
 */

import type { z } from 'zod';

import type { ProjectId } from '@/types/character-guards';
import {
  createCharacterId,
  validateCharacterImportance,
  validateCharacterArc,
} from '@/types/character-guards';
import type { Character, UpdateCharacter } from '@/types/character-schemas';
import {
  CreateCharacterSchema,
  UpdateCharacterSchema,
  CharacterSchema,
} from '@/types/character-schemas';
import type { ValidationResult } from '@/types/schemas';
import { validateData } from '@/types/schemas';

import { getImportanceRequirementMessage, findPersonalityConflicts } from './validation-helpers';

/**
 * Validates and creates a new character from form data
 */
export function validateCreateCharacter(
  data: unknown,
  projectId: ProjectId,
  existingCharacters: Character[] = [],
): ValidationResult<Character> {
  try {
    // Validate create schema
    const createValidation = validateData(CreateCharacterSchema, data, 'create character');
    if (!createValidation.success) {
      return createValidation;
    }

    const createData = createValidation.data;

    // Check for unique name
    const nameExists = existingCharacters.some(
      char => char.name.toLowerCase() === createData.name.toLowerCase(),
    );
    if (nameExists) {
      return {
        success: false,
        error: 'Character name already exists',
        issues: [
          {
            path: ['name'],
            message: 'A character with this name already exists',
            code: 'custom' as const,
          },
        ],
      };
    }

    // Validate role-importance relationship
    if (!validateCharacterImportance(createData.role, createData.importance)) {
      return {
        success: false,
        error: 'Invalid importance level for character role',
        issues: [
          {
            path: ['importance'],
            message: getImportanceRequirementMessage(createData.role),
            code: 'custom' as const,
          },
        ],
      };
    }

    // Generate character ID
    const characterId = createCharacterId(projectId, createData.name);
    const now = new Date();

    // Create full character
    const fullCharacter: Character = {
      id: characterId,
      projectId,
      name: createData.name,
      aliases: [],
      role: createData.role,
      importance: createData.importance,
      summary: createData.summary,
      physicalTraits: {
        distinctiveFeatures: [],
        disabilities: [],
        ...createData.physicalTraits,
      },
      background: {
        significantEvents: [],
        secrets: [],
        ...(('background' in createData && createData.background) ?? {}),
      },
      psychology: {
        coreBeliefs: [],
        values: [],
        fears: [],
        desires: [],
        flaws: [],
        strengths: [],
        personalityTraits: [],
        ...createData.psychology,
      },
      voice: {
        vocabulary: 'average',
        tone: 'casual',
        speechPatterns: [],
        catchphrases: [],
        languageProficiency: {
          native: '',
          fluent: '',
          conversational: '',
          basic: '',
        },
      },
      appearances: [],
      mood_board: [],
      tags: createData.tags,
      notes: '',
      inspirations: [],
      createdAt: now,
      updatedAt: now,
      version: 1,
      generatedBy: 'user',
    };

    // Validate the complete character
    return validateData(CharacterSchema, fullCharacter, 'complete character');
  } catch (error) {
    return {
      success: false,
      error: `Character creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      issues: [],
    };
  }
}

/**
 * Validates character updates
 */
export function validateUpdateCharacter(
  data: unknown,
  existingCharacters: Character[] = [],
): ValidationResult<UpdateCharacter> {
  try {
    const validation = validateData(UpdateCharacterSchema, data, 'update character');
    if (!validation.success) {
      return validation;
    }

    const updateData = validation.data;

    // Check for unique name if name is being updated
    if (updateData.name != null && updateData.name.length > 0) {
      const newName = updateData.name;
      const nameExists = existingCharacters.some(
        char => char.id !== updateData.id && char.name.toLowerCase() === newName.toLowerCase(),
      );
      if (nameExists) {
        return {
          success: false,
          error: 'Character name already exists',
          issues: [
            {
              path: ['name'],
              message: 'Another character already has this name',
              code: 'custom' as const,
            },
          ],
        };
      }
    }

    // Validate role-importance relationship if both are provided
    if (updateData.role && updateData.importance !== undefined) {
      if (!validateCharacterImportance(updateData.role, updateData.importance)) {
        return {
          success: false,
          error: 'Invalid importance level for character role',
          issues: [
            {
              path: ['importance'],
              message: getImportanceRequirementMessage(updateData.role),
              code: 'custom' as const,
            },
          ],
        };
      }
    }

    return validation;
  } catch (error) {
    return {
      success: false,
      error: `Character update validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      issues: [],
    };
  }
}

/**
 * Validates complete character integrity
 */
export function validateCharacterIntegrity(character: Character): ValidationResult<Character> {
  try {
    // Basic schema validation
    const schemaValidation = validateData(CharacterSchema, character, 'character integrity');
    if (!schemaValidation.success) {
      return schemaValidation;
    }

    const validatedCharacter = schemaValidation.data;
    const issues: { path: (string | number)[]; message: string; code: 'custom' }[] = [];

    // Business logic validation
    if (!validateCharacterImportance(validatedCharacter.role, validatedCharacter.importance)) {
      issues.push({
        path: ['importance'],
        message: getImportanceRequirementMessage(validatedCharacter.role),
        code: 'custom' as const,
      });
    }

    // Character arc validation for important characters
    if (!validateCharacterArc(validatedCharacter)) {
      issues.push({
        path: ['arc'],
        message: 'Characters with importance 7+ must have a character arc',
        code: 'custom' as const,
      });
    }

    // Validate appearance consistency
    const uniqueChapters = new Set(validatedCharacter.appearances.map(app => app.chapterId));
    if (uniqueChapters.size !== validatedCharacter.appearances.length) {
      issues.push({
        path: ['appearances'],
        message: 'Character cannot appear multiple times in the same chapter',
        code: 'custom' as const,
      });
    }

    // Validate physical trait consistency
    if (
      validatedCharacter.physicalTraits?.age !== undefined &&
      validatedCharacter.physicalTraits.age < 0
    ) {
      issues.push({
        path: ['physicalTraits', 'age'],
        message: 'Age cannot be negative',
        code: 'custom' as const,
      });
    }

    // Validate personality trait conflicts
    const traits = validatedCharacter.psychology?.personalityTraits ?? [];
    const conflicts = findPersonalityConflicts(traits);
    if (conflicts.length > 0) {
      issues.push({
        path: ['psychology', 'personalityTraits'],
        message: `Conflicting personality traits: ${conflicts.join(', ')}`,
        code: 'custom' as const,
      });
    }

    if (issues.length > 0) {
      return {
        success: false,
        error: `Character integrity validation failed: ${issues.length} issue(s) found`,
        issues,
      };
    }

    return { success: true, data: validatedCharacter };
  } catch (error) {
    return {
      success: false,
      error: `Character integrity validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      issues: [],
    };
  }
}

/**
 * Validates a character and returns a simple validation result
 * Used by UI components for display
 */
export function validate(character: Character): {
  isValid: boolean;
  score: number;
  issues: { path: (string | number)[]; message: string; code: 'custom' }[];
  strengths: string[];
} {
  const result = validateCharacterIntegrity(character);

  if (!result.success) {
    return {
      isValid: false,
      score: 0,
      issues: result.issues.map((err: z.ZodIssue) => ({
        path: err.path as (string | number)[],
        message: err.message,
        code: 'custom' as const,
      })),
      strengths: [],
    };
  }

  // Calculate a simple score based on character completeness
  let score = 50; // Base score
  const backgroundData = character.background as { backstory?: string } | undefined;
  if ((backgroundData?.backstory?.length ?? 0) > 100) score += 15;
  if ((character.psychology?.desires?.length ?? 0) > 0) score += 15;
  if (character.arc != null) score += 20;

  const strengths: string[] = [];
  if ((backgroundData?.backstory?.length ?? 0) > 100) strengths.push('Well-developed backstory');
  if ((character.psychology?.desires?.length ?? 0) > 2) strengths.push('Clear motivations');
  if ((character.appearances?.length ?? 0) > 2) strengths.push('Rich relationships');

  return {
    isValid: true,
    score: Math.min(100, score),
    issues: [],
    strengths,
  };
}
