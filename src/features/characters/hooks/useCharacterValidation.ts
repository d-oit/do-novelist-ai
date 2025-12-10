import { useMemo } from 'react';

import { type Character } from '@/types/character-schemas';

import { characterValidationService } from '../../../lib/character-validation';
import { type CharacterValidationResult } from '../types';

export function useCharacterValidation(character: Character | null): CharacterValidationResult & {
  validate: (character: Character) => CharacterValidationResult;
} {
  const validationResult = useMemo<CharacterValidationResult>(() => {
    if (!character) {
      return {
        isValid: false,
        score: 0,
        issues: [],
        strengths: [],
      };
    }

    const result = characterValidationService.validate(character);

    return {
      isValid: result.isValid,
      score: result.score,
      strengths: result.strengths,
      issues: result.issues.map(issue => ({
        field: Array.isArray(issue.path) ? issue.path.join('.') : String(issue.path || ''),
        message: issue.message,
        severity: 'error' as const, // Zod validation errors are typically errors
        suggestion: undefined,
      })),
    };
  }, [character]);

  return {
    ...validationResult,
    validate: (character: Character): CharacterValidationResult => {
      const result = characterValidationService.validate(character);
      return {
        isValid: result.isValid,
        score: result.score,
        strengths: result.strengths,
        issues: result.issues.map(issue => ({
          field: Array.isArray(issue.path) ? issue.path.join('.') : String(issue.path || ''),
          message: issue.message,
          severity: 'error' as const,
          suggestion: undefined,
        })),
      };
    },
  };
}
