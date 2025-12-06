/**
 * Character Validation Service
 * Business logic validation and management for character entities
 */

import type { z } from 'zod';

import {
  type ProjectId,
  createCharacterId,
  validateCharacterImportance,
  validateCharacterArc,
  validateRelationship,
  validateUniqueCharacterNames,
  validateCharacterGroup,
  validateCharacterConflict,
  hasCharacterArc,
  isMainCharacter,
  isProtagonist,
} from '../types/character-guards';
import {
  CharacterSchema,
  CharacterRelationshipSchema,
  CharacterGroupSchema,
  CharacterConflictSchema,
  CreateCharacterSchema,
  UpdateCharacterSchema,
  type Character,
  type CharacterRelationship,
  type CharacterGroup,
  type CharacterConflict,
  type UpdateCharacter,
  type CharacterRole,
  type PersonalityTrait,
} from '../types/character-schemas';
import { type ValidationResult, validateData } from '../types/schemas';

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

  /**
   * Validates a character and returns a simple validation result
   * Used by UI components for display
   */
  public validate(character: Character): {
    isValid: boolean;
    score: number;
    issues: { path: (string | number)[]; message: string; code: 'custom' }[];
    strengths: string[];
  } {
    const result = this.validateCharacterIntegrity(character);

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

  // ==========================================================================
  // CHARACTER VALIDATION
  // ==========================================================================

  /**
   * Validates and creates a new character from form data
   */
  public validateCreateCharacter(
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
              message: this.getImportanceRequirementMessage(createData.role),
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
  public validateUpdateCharacter(
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
                message: this.getImportanceRequirementMessage(updateData.role),
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
  public validateCharacterIntegrity(character: Character): ValidationResult<Character> {
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
          message: this.getImportanceRequirementMessage(validatedCharacter.role),
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
      const conflicts = this.findPersonalityConflicts(traits);
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

  // ==========================================================================
  // RELATIONSHIP VALIDATION
  // ==========================================================================

  /**
   * Validates character relationships
   */
  public validateCharacterRelationship(
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
        const appropriatenessIssue = this.validateRelationshipAppropriateness(
          charA,
          charB,
          relationship,
        );
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

  // ==========================================================================
  // GROUP AND CONFLICT VALIDATION
  // ==========================================================================

  /**
   * Validates character groups
   */
  public validateCharacterGroup(
    data: unknown,
    characters: Character[],
  ): ValidationResult<CharacterGroup> {
    try {
      const validation = validateData(CharacterGroupSchema, data, 'character group');
      if (!validation.success) {
        return validation;
      }

      const group = validation.data;

      if (!validateCharacterGroup(group, characters)) {
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
  public validateCharacterConflict(
    data: unknown,
    characters: Character[],
  ): ValidationResult<CharacterConflict> {
    try {
      const validation = validateData(CharacterConflictSchema, data, 'character conflict');
      if (!validation.success) {
        return validation;
      }

      const conflict = validation.data;

      if (!validateCharacterConflict(conflict, characters)) {
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

  // ==========================================================================
  // PROJECT-LEVEL VALIDATION
  // ==========================================================================

  /**
   * Validates entire character collection for a project
   */
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

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  private getImportanceRequirementMessage(role: CharacterRole): string {
    switch (role) {
      case 'protagonist':
        return 'Protagonists must have importance level 8 or higher';
      case 'antagonist':
      case 'deuteragonist':
        return 'This role requires importance level 6 or higher';
      case 'tritagonist':
      case 'love_interest':
      case 'mentor':
        return 'This role requires importance level 4 or higher';
      case 'sidekick':
      case 'foil':
      case 'supporting':
        return 'This role requires importance level 2 or higher';
      default:
        return 'Invalid importance level for this role';
    }
  }

  private findPersonalityConflicts(traits: PersonalityTrait[]): string[] {
    const conflicts: Record<PersonalityTrait, PersonalityTrait[]> = {
      brave: ['cowardly'],
      cowardly: ['brave'],
      intelligent: ['foolish'],
      foolish: ['intelligent'],
      kind: ['cruel'],
      cruel: ['kind'],
      honest: ['deceptive'],
      deceptive: ['honest'],
      loyal: ['treacherous'],
      treacherous: ['loyal'],
      optimistic: ['pessimistic'],
      pessimistic: ['optimistic'],
      confident: ['insecure'],
      insecure: ['confident'],
      patient: ['impatient'],
      impatient: ['patient'],
      humble: ['arrogant'],
      arrogant: ['humble'],
      generous: ['selfish'],
      selfish: ['generous'],
      creative: ['conventional'],
      conventional: ['creative'],
      ambitious: ['content'],
      content: ['ambitious'],
      curious: ['indifferent'],
      indifferent: ['curious'],
      disciplined: ['impulsive'],
      impulsive: ['disciplined'],
      empathetic: ['callous'],
      callous: ['empathetic'],
    };

    const foundConflicts: string[] = [];
    traits.forEach(trait => {
      const conflictingTraits = conflicts[trait] ?? [];
      conflictingTraits.forEach(conflictTrait => {
        if (traits.includes(conflictTrait)) {
          foundConflicts.push(`${trait} vs ${conflictTrait}`);
        }
      });
    });

    return [...new Set(foundConflicts)]; // Remove duplicates
  }

  private validateRelationshipAppropriateness(
    charA: Character,
    charB: Character,
    relationship: CharacterRelationship,
  ): { path: (string | number)[]; message: string; code: string } | null {
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

  /**
   * Generate character suggestions based on existing characters
   */
  public generateCharacterSuggestions(
    existingCharacters: Character[],
    projectGenre: string[] = [],
  ): { role: CharacterRole; reason: string; importance: number }[] {
    const suggestions: { role: CharacterRole; reason: string; importance: number }[] = [];

    const roles = existingCharacters.map(c => c.role);
    const protagonistCount = roles.filter(r => r === 'protagonist').length;
    const antagonistCount = roles.filter(r => r === 'antagonist').length;
    const mentorCount = roles.filter(r => r === 'mentor').length;

    // Suggest protagonist if missing
    if (protagonistCount === 0) {
      suggestions.push({
        role: 'protagonist',
        reason: 'Every story needs a protagonist',
        importance: 9,
      });
    }

    // Suggest antagonist if missing
    if (antagonistCount === 0) {
      suggestions.push({
        role: 'antagonist',
        reason: 'A compelling antagonist creates conflict and tension',
        importance: 8,
      });
    }

    // Suggest mentor for genres that typically have them
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

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const characterValidationService = CharacterValidationService.getInstance();

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

export const validateCharacter = {
  create: (
    data: unknown,
    projectId: ProjectId,
    existing: Character[] = [],
  ): ValidationResult<Character> =>
    characterValidationService.validateCreateCharacter(data, projectId, existing),
  update: (data: unknown, existing: Character[] = []): ValidationResult<UpdateCharacter> =>
    characterValidationService.validateUpdateCharacter(data, existing),
  integrity: (character: Character): ValidationResult<Character> =>
    characterValidationService.validateCharacterIntegrity(character),
  relationship: (data: unknown, characters: Character[]): ValidationResult<CharacterRelationship> =>
    characterValidationService.validateCharacterRelationship(data, characters),
  group: (data: unknown, characters: Character[]): ValidationResult<CharacterGroup> =>
    characterValidationService.validateCharacterGroup(data, characters),
  conflict: (data: unknown, characters: Character[]): ValidationResult<CharacterConflict> =>
    characterValidationService.validateCharacterConflict(data, characters),
  project: (
    characters: Character[],
    relationships?: CharacterRelationship[],
    groups?: CharacterGroup[],
    conflicts?: CharacterConflict[],
  ): ValidationResult<{
    characters: Character[];
    relationships: CharacterRelationship[];
    groups: CharacterGroup[];
    conflicts: CharacterConflict[];
  }> =>
    characterValidationService.validateProjectCharacters(
      characters,
      relationships,
      groups,
      conflicts,
    ),
};
