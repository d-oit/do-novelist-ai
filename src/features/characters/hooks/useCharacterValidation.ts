import { useMemo } from 'react';

import { characterValidationService } from '../../../lib/character-validation';
import { type Character } from '../../../types/character-schemas';
import { type CharacterValidationResult } from '../types';

export function useCharacterValidation(character: Character | null) {
  const validationResult = useMemo<CharacterValidationResult | null>(() => {
    if (!character) return null;

    const result = characterValidationService.validate(character);

    return {
      isValid: result.isValid,
      score: result.score,
      strengths: result.strengths,
      issues: result.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
        severity: 'warning', // Default to warning as service doesn't provide severity
        suggestion: undefined,
      })),
    };
  }, [character]);

  const isValid = validationResult?.isValid ?? false;
  const score = validationResult?.score ?? 0;
  const issues = validationResult?.issues ?? [];
  const strengths = validationResult?.strengths ?? [];

  return {
    isValid,
    score,
    issues,
    strengths,
    validate: characterValidationService.validate.bind(characterValidationService),
  };
}
