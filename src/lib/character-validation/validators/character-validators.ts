import { type ValidationIssue, type ValidationResult } from '@/lib/character-validation/types';
import { validateCharacterImportance, validateCharacterArc } from '@/types/character-guards';
import { type Character, CharacterSchema } from '@/types/character-schemas';
import { validateData } from '@/types/schemas';

import { getImportanceRequirementMessage, findPersonalityConflicts } from './validation-helpers';

export function validateCharacterIntegrity(character: Character): ValidationResult<Character> {
  try {
    const schemaValidation = validateData(CharacterSchema, character, 'character integrity');
    if (!schemaValidation.success) {
      return schemaValidation;
    }

    const validatedCharacter = schemaValidation.data;
    const issues: ValidationIssue[] = [];

    if (!validateCharacterImportance(validatedCharacter.role, validatedCharacter.importance)) {
      issues.push({
        path: ['importance'],
        message: getImportanceRequirementMessage(validatedCharacter.role),
        code: 'custom',
      });
    }

    if (!validateCharacterArc(validatedCharacter)) {
      issues.push({
        path: ['arc'],
        message: 'Characters with importance 7+ must have a character arc',
        code: 'custom',
      });
    }

    const uniqueChapters = new Set(validatedCharacter.appearances.map(app => app.chapterId));
    if (uniqueChapters.size !== validatedCharacter.appearances.length) {
      issues.push({
        path: ['appearances'],
        message: 'Character cannot appear multiple times in the same chapter',
        code: 'custom',
      });
    }

    if (
      validatedCharacter.physicalTraits?.age !== undefined &&
      validatedCharacter.physicalTraits.age < 0
    ) {
      issues.push({
        path: ['physicalTraits', 'age'],
        message: 'Age cannot be negative',
        code: 'custom',
      });
    }

    const traits = validatedCharacter.psychology?.personalityTraits ?? [];
    const conflicts = findPersonalityConflicts(traits);
    if (conflicts.length > 0) {
      issues.push({
        path: ['psychology', 'personalityTraits'],
        message: `Conflicting personality traits: ${conflicts.join(', ')}`,
        code: 'custom',
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
