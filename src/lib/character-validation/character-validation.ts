import { createCharacterId, validateCharacterImportance } from '@/types/character-guards';
import {
  type Character,
  type CharacterRelationship,
  type CharacterGroup,
  type CharacterConflict,
  CharacterSchema,
  CreateCharacterSchema,
  UpdateCharacterSchema,
} from '@/types/character-schemas';
import { type ProjectId, validateData } from '@/types/schemas';

import { type ValidationResult, type ValidationSummary } from './types';
import { validateCharacterIntegrity } from './validators/character-validators';
import { validateProjectCharacters } from './validators/project-validators';
import { validateCharacterRelationship } from './validators/relationship-validators';
import { getImportanceRequirementMessage } from './validators/validation-helpers';

export class CharacterValidationService {
  private static instance: CharacterValidationService;

  private constructor() {}

  public static getInstance(): CharacterValidationService {
    if (!CharacterValidationService.instance) {
      CharacterValidationService.instance = new CharacterValidationService();
    }
    return CharacterValidationService.instance;
  }

  public validateCreateCharacter(
    data: unknown,
    projectId: ProjectId,
    existingCharacters: Character[] = [],
  ): ValidationResult<Character> {
    try {
      const createValidation = validateData(CreateCharacterSchema, data, 'create character');
      if (!createValidation.success) {
        return createValidation;
      }

      const createData = createValidation.data;

      if (existingCharacters.some(c => c.name.toLowerCase() === createData.name.toLowerCase())) {
        return {
          success: false,
          error: `Character with name "${createData.name}" already exists`,
          issues: [{ path: ['name'], message: 'Name must be unique', code: 'custom' }],
        };
      }

      // Restore manual check for importance to match original error message
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

      const characterId = createCharacterId(projectId, createData.name);
      const now = new Date();

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
        portrait: undefined,
        mood_board: [],
        appearances: [],
        tags: createData.tags,
        notes: '',
        inspirations: [],
        createdAt: now,
        updatedAt: now,
        version: 1,
        generatedBy: 'user',
      };

      return validateData(CharacterSchema, fullCharacter, 'complete character');
    } catch (error) {
      return {
        success: false,
        error: `Character creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        issues: [],
      };
    }
  }

  public validateUpdateCharacter(
    data: unknown,
    existingCharacters: Character[] = [],
  ): ValidationResult<Character> {
    try {
      const updateValidation = validateData(UpdateCharacterSchema, data, 'update character');
      if (!updateValidation.success) {
        return updateValidation;
      }

      const updateData = updateValidation.data;

      if (updateData.name && updateData.id) {
        const duplicate = existingCharacters.find(
          c => c.id !== updateData.id && c.name.toLowerCase() === updateData.name?.toLowerCase(),
        );
        if (duplicate) {
          return {
            success: false,
            error: `Character with name "${updateData.name}" already exists`,
            issues: [{ path: ['name'], message: 'Name must be unique', code: 'custom' }],
          };
        }
      }

      return { success: true, data: updateData as Character };
    } catch (error) {
      return {
        success: false,
        error: `Character update validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        issues: [],
      };
    }
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

  public validate(character: Character): ValidationSummary {
    const result = this.validateCharacterIntegrity(character);
    const issues = !result.success ? result.issues : [];

    let score = 50; // Base score from original logic
    const backgroundData = character.background as { backstory?: string } | undefined;
    if ((backgroundData?.backstory?.length ?? 0) > 100) score += 15;
    if ((character.psychology?.desires?.length ?? 0) > 0) score += 15;
    if (character.arc != null) score += 20;

    const strengths: string[] = [];
    if ((backgroundData?.backstory?.length ?? 0) > 100) strengths.push('Well-developed backstory');
    if ((character.psychology?.desires?.length ?? 0) > 2) strengths.push('Clear motivations');
    if ((character.appearances?.length ?? 0) > 2) strengths.push('Rich relationships');

    return {
      isValid: result.success,
      score: Math.min(100, score),
      issues,
      strengths,
    };
  }

  public generateCharacterSuggestions(
    existingCharacters: Character[],
    projectGenre: string[] = [],
  ): { role: string; reason: string; importance: number }[] {
    const suggestions: { role: string; reason: string; importance: number }[] = [];
    const roles = existingCharacters.map(c => c.role);
    const protagonistCount = roles.filter(r => r === 'protagonist').length;
    const antagonistCount = roles.filter(r => r === 'antagonist').length;
    const mentorCount = roles.filter(r => r === 'mentor').length;

    if (protagonistCount === 0) {
      suggestions.push({
        role: 'protagonist',
        reason: 'Every story needs a protagonist',
        importance: 9,
      });
    }

    if (antagonistCount === 0) {
      suggestions.push({
        role: 'antagonist',
        reason: 'A compelling antagonist creates conflict and tension',
        importance: 8,
      });
    }

    if (
      mentorCount === 0 &&
      (projectGenre.includes('fantasy') || projectGenre.includes('young_adult'))
    ) {
      suggestions.push({
        role: 'mentor',
        reason: 'Fantasy and YA stories often benefit from mentor characters',
        importance: 6,
      });
    }

    return suggestions;
  }
}

export const characterValidationService = CharacterValidationService.getInstance();
