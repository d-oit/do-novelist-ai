/**
 * World-Building Validation Hook
 * Handles validation and consistency checking
 */

import { useState, useCallback } from 'react';
import type { WorldBuildingValidationResult } from '../types';
import { worldBuildingService } from '../services/worldBuildingService';

interface UseWorldBuildingValidationReturn {
  validation: WorldBuildingValidationResult | null;
  isValidating: boolean;
  validateWorldBuilding: (projectId: string) => Promise<void>;
  clearValidation: () => void;
}

export function useWorldBuildingValidation(): UseWorldBuildingValidationReturn {
  const [validation, setValidation] = useState<WorldBuildingValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const validateWorldBuilding = useCallback(async (projectId: string): Promise<void> => {
    setIsValidating(true);
    try {
      const result = await worldBuildingService.validateWorldBuilding(projectId);
      setValidation(result);
    } catch (error) {
      console.error('Validation failed:', error);
      // Set a basic error state
      setValidation({
        isValid: false,
        score: 0,
        issues: [{
          id: crypto.randomUUID(),
          type: 'error',
          category: 'reference',
          message: 'Failed to validate world-building consistency',
          affectedElements: [],
        }],
        strengths: [],
        completeness: {
          locations: 0,
          cultures: 0,
          timeline: 0,
          lore: 0,
        },
      });
    } finally {
      setIsValidating(false);
    }
  }, []);

  const clearValidation = useCallback((): void => {
    setValidation(null);
  }, []);

  return {
    validation,
    isValidating,
    validateWorldBuilding,
    clearValidation,
  };
}