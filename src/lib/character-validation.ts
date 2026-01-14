/**
 * Character Validation Service
 * Business logic validation and management for character entities
 */

import { type ProjectId } from '@/types/character-guards';
import {
  type Character,
  type CharacterRelationship,
  type CharacterGroup,
  type CharacterConflict,
  type UpdateCharacter,
  type CharacterRole,
  type PersonalityTrait,
} from '@/types/character-schemas';
import { type ValidationResult } from '@/types/schemas';

// Import modular validators
import {
  validateCreateCharacter,
  validateUpdateCharacter,
  validateCharacterIntegrity,
  validate,
} from './validators/character-validators';
import {
  validateCharacterGroup,
  validateCharacterConflict,
  validateProjectCharacters,
} from './validators/project-validators';
import { validateCharacterRelationship } from './validators/relationship-validators';
import {
  getImportanceRequirementMessage,
  findPersonalityConflicts,
  validateRelationshipAppropriateness,
  generateCharacterSuggestions,
} from './validators/validation-helpers';

// =============================================================================
// CHARACTER VALIDATION SERVICE
// =============================================================================

export class CharacterValidationService {
  private static instance: CharacterValidationService;

  private constructor() {}

  public static getInstance(): CharacterValidationService {
    CharacterValidationService.instance ??= new CharacterValidationService();
    return CharacterValidationService.instance;
  }

  // Wrapper methods that delegate to modular validators

  public validate(character: Character) {
    return validate(character);
  }

  public validateCreateCharacter(
    data: unknown,
    projectId: ProjectId,
    existingCharacters: Character[] = [],
  ): ValidationResult<Character> {
    return validateCreateCharacter(data, projectId, existingCharacters);
  }

  public validateUpdateCharacter(
    data: unknown,
    existingCharacters: Character[] = [],
  ): ValidationResult<UpdateCharacter> {
    return validateUpdateCharacter(data, existingCharacters);
  }

  public validateCharacterIntegrity(character: Character): ValidationResult<Character> {
    return validateCharacterIntegrity(character);
  }

  public validateCharacterRelationship(
    data: unknown,
    characters: Character[],
  ): ValidationResult<CharacterRelationship> {
    return validateCharacterRelationship(data, characters);
  }

  public validateCharacterGroup(
    data: unknown,
    characters: Character[],
  ): ValidationResult<CharacterGroup> {
    return validateCharacterGroup(data, characters);
  }

  public validateCharacterConflict(
    data: unknown,
    characters: Character[],
  ): ValidationResult<CharacterConflict> {
    return validateCharacterConflict(data, characters);
  }

  public validateProjectCharacters(
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
    return validateProjectCharacters(characters, relationships, groups, conflicts);
  }

  // Helper methods delegated to validation-helpers

  public getImportanceRequirementMessage(role: CharacterRole): string {
    return getImportanceRequirementMessage(role);
  }

  public findPersonalityConflicts(traits: PersonalityTrait[]): string[] {
    return findPersonalityConflicts(traits);
  }

  public validateRelationshipAppropriateness(
    charA: Character,
    charB: Character,
    relationship: CharacterRelationship,
  ): { path: (string | number)[]; message: string; code: string } | null {
    return validateRelationshipAppropriateness(charA, charB, relationship);
  }

  public generateCharacterSuggestions(
    existingCharacters: Character[],
    projectGenre: string[] = [],
  ): { role: CharacterRole; reason: string; importance: number }[] {
    return generateCharacterSuggestions(existingCharacters, projectGenre);
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const characterValidationService = CharacterValidationService.getInstance();

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

export const validateCharacter = {
  create: (data: unknown, projectId: ProjectId, existing: Character[] = []) =>
    characterValidationService.validateCreateCharacter(data, projectId, existing),
  update: (data: unknown, existing: Character[] = []) =>
    characterValidationService.validateUpdateCharacter(data, existing),
  integrity: (character: Character) =>
    characterValidationService.validateCharacterIntegrity(character),
  relationship: (data: unknown, characters: Character[]) =>
    characterValidationService.validateCharacterRelationship(data, characters),
  group: (data: unknown, characters: Character[]) =>
    characterValidationService.validateCharacterGroup(data, characters),
  conflict: (data: unknown, characters: Character[]) =>
    characterValidationService.validateCharacterConflict(data, characters),
};
