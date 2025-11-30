/**
 * Type guards for Character Management System
 * Runtime type checking and validation for character entities
 */

import {
  CharacterConflictSchema,
  CharacterGroupSchema,
  CharacterRelationshipSchema,
  CharacterSchema,
  CharacterSearchSchema,
  CreateCharacterSchema,
  UpdateCharacterSchema,
  type Character,
  type CharacterArcType,
  type CharacterConflict,
  type CharacterGroup,
  type CharacterRelationship,
  type CharacterRole,
  type CharacterSearch,
  type CreateCharacter,
  type EmotionalState,
  type PersonalityTrait,
  type RelationshipType,
  type UpdateCharacter,
} from './character-schemas';
import { type ProjectId } from './schemas';

// =============================================================================
// BRANDED TYPE CREATION
// =============================================================================

// Export ProjectId from schemas for use in character-related functionality
export type { ProjectId } from './schemas';

export type CharacterId = string & { __brand: 'CharacterId' };

export function isCharacterId(value: unknown): value is CharacterId {
  return typeof value === 'string' && /^char_\w+_\d+$/.test(value);
}

export function createCharacterId(
  _projectId: ProjectId,
  name?: string,
  timestamp = Date.now()
): CharacterId {
  const safeName = name ? name.toLowerCase().replace(/[^a-z0-9]/g, '') : 'char';
  return `char_${safeName}_${timestamp}` as CharacterId;
}

// =============================================================================
// SCHEMA-BASED TYPE GUARDS
// =============================================================================

export function isCharacter(value: unknown): value is Character {
  return CharacterSchema.safeParse(value).success;
}

export function isCharacterRelationship(value: unknown): value is CharacterRelationship {
  return CharacterRelationshipSchema.safeParse(value).success;
}

export function isCharacterGroup(value: unknown): value is CharacterGroup {
  return CharacterGroupSchema.safeParse(value).success;
}

export function isCharacterConflict(value: unknown): value is CharacterConflict {
  return CharacterConflictSchema.safeParse(value).success;
}

export function isCreateCharacter(value: unknown): value is CreateCharacter {
  return CreateCharacterSchema.safeParse(value).success;
}

export function isUpdateCharacter(value: unknown): value is UpdateCharacter {
  return UpdateCharacterSchema.safeParse(value).success;
}

export function isCharacterSearch(value: unknown): value is CharacterSearch {
  return CharacterSearchSchema.safeParse(value).success;
}

// =============================================================================
// ENUM TYPE GUARDS
// =============================================================================

export function isCharacterRole(value: unknown): value is CharacterRole {
  return (
    typeof value === 'string' &&
    [
      'protagonist',
      'antagonist',
      'deuteragonist',
      'tritagonist',
      'love_interest',
      'mentor',
      'sidekick',
      'foil',
      'supporting',
      'minor',
      'background',
    ].includes(value)
  );
}

export function isCharacterArcType(value: unknown): value is CharacterArcType {
  return (
    typeof value === 'string' &&
    [
      'positive_change',
      'negative_change',
      'flat',
      'corruption',
      'redemption',
      'growth',
      'fall',
      'disillusion',
      'testing',
    ].includes(value)
  );
}

export function isPersonalityTrait(value: unknown): value is PersonalityTrait {
  return (
    typeof value === 'string' &&
    [
      'brave',
      'cowardly',
      'intelligent',
      'foolish',
      'kind',
      'cruel',
      'honest',
      'deceptive',
      'loyal',
      'treacherous',
      'optimistic',
      'pessimistic',
      'confident',
      'insecure',
      'patient',
      'impatient',
      'humble',
      'arrogant',
      'generous',
      'selfish',
      'creative',
      'conventional',
      'ambitious',
      'content',
      'curious',
      'indifferent',
      'disciplined',
      'impulsive',
      'empathetic',
      'callous',
    ].includes(value)
  );
}

export function isRelationshipType(value: unknown): value is RelationshipType {
  return (
    typeof value === 'string' &&
    [
      'family',
      'romantic',
      'friendship',
      'mentor_student',
      'rivalry',
      'enemy',
      'ally',
      'professional',
      'acquaintance',
      'stranger',
    ].includes(value)
  );
}

export function isEmotionalState(value: unknown): value is EmotionalState {
  return (
    typeof value === 'string' &&
    [
      'happy',
      'sad',
      'angry',
      'fearful',
      'disgusted',
      'surprised',
      'contempt',
      'pride',
      'shame',
      'guilt',
      'envy',
      'gratitude',
      'hope',
      'despair',
      'love',
      'hate',
      'confusion',
      'clarity',
      'anxiety',
      'calm',
      'excitement',
      'boredom',
    ].includes(value)
  );
}

// =============================================================================
// ARRAY TYPE GUARDS
// =============================================================================

export function isCharacterArray(value: unknown): value is Character[] {
  return Array.isArray(value) && value.every(isCharacter);
}

export function isCharacterRelationshipArray(value: unknown): value is CharacterRelationship[] {
  return Array.isArray(value) && value.every(isCharacterRelationship);
}

export function isCharacterGroupArray(value: unknown): value is CharacterGroup[] {
  return Array.isArray(value) && value.every(isCharacterGroup);
}

export function isCharacterConflictArray(value: unknown): value is CharacterConflict[] {
  return Array.isArray(value) && value.every(isCharacterConflict);
}

// =============================================================================
// BUSINESS LOGIC TYPE GUARDS
// =============================================================================

/**
 * Check if a character is a main character (importance >= 7)
 */
export function isMainCharacter(character: Character): boolean {
  return character.importance >= 7;
}

/**
 * Check if a character is a protagonist
 */
export function isProtagonist(character: Character): boolean {
  return character.role === 'protagonist';
}

/**
 * Check if a character is an antagonist
 */
export function isAntagonist(character: Character): boolean {
  return character.role === 'antagonist';
}

/**
 * Check if a character has a defined character arc
 */
export function hasCharacterArc(character: Character): boolean {
  return character.arc !== null && character.arc !== undefined;
}

/**
 * Check if a character has appeared in any chapters
 */
export function hasAppearances(character: Character): boolean {
  return character.appearances.length > 0;
}

/**
 * Check if a character has a portrait
 */
export function hasPortrait(character: Character): boolean {
  return !!character.portrait;
}

/**
 * Check if two characters are in a specific relationship
 */
export function hasRelationship(
  character1: Character,
  character2: Character,
  relationships: CharacterRelationship[],
  type?: RelationshipType
): boolean {
  return relationships.some(
    rel =>
      ((rel.characterAId === character1.id && rel.characterBId === character2.id) ||
        (rel.characterAId === character2.id && rel.characterBId === character1.id)) &&
      (type ? rel.type === type : true)
  );
}

/**
 * Check if a character appears in a specific chapter
 */
export function appearsInChapter(character: Character, chapterId: string): boolean {
  return character.appearances.some(appearance => appearance.chapterId === chapterId);
}

/**
 * Check if a character is involved in a conflict
 */
export function isInvolvedInConflict(
  character: Character,
  conflicts: CharacterConflict[]
): boolean {
  return conflicts.some(conflict => conflict.participants.includes(character.id as CharacterId));
}

/**
 * Check if a character is in a group
 */
export function isInGroup(character: Character, groups: CharacterGroup[]): boolean {
  return groups.some(group => group.characterIds.includes(character.id as CharacterId));
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Validate character importance based on role
 */
export function validateCharacterImportance(role: CharacterRole, importance: number): boolean {
  switch (role) {
    case 'protagonist':
      return importance >= 8;
    case 'antagonist':
    case 'deuteragonist':
      return importance >= 6;
    case 'tritagonist':
    case 'love_interest':
    case 'mentor':
      return importance >= 4;
    case 'sidekick':
    case 'foil':
    case 'supporting':
      return importance >= 2;
    case 'minor':
    case 'background':
      return importance >= 0;
    default:
      return false;
  }
}

/**
 * Validate that a character arc is appropriate for the character's importance
 */
export function validateCharacterArc(character: Character): boolean {
  if (character.importance >= 7) {
    return character.arc !== null && character.arc !== undefined;
  }
  return true; // Arc is optional for less important characters
}

/**
 * Validate relationship consistency
 */
export function validateRelationship(relationship: CharacterRelationship): boolean {
  // Characters can't have relationships with themselves
  if (relationship.characterAId === relationship.characterBId) {
    return false;
  }

  // Romantic relationships should have higher intensity
  if (relationship.type === 'romantic' && relationship.intensity < 6) {
    return false;
  }

  // Enemy relationships should be documented
  if (relationship.type === 'enemy' && !relationship.description) {
    return false;
  }

  return true;
}

/**
 * Check if character names are unique within a project
 */
export function validateUniqueCharacterNames(characters: Character[]): boolean {
  const names = characters.map(c => c.name.toLowerCase());
  return names.length === new Set(names).size;
}

/**
 * Validate character group composition
 */
export function validateCharacterGroup(group: CharacterGroup, characters: Character[]): boolean {
  // Group must have at least 2 characters
  if (group.characterIds.length < 2) {
    return false;
  }

  // All character IDs must exist
  const characterIds = characters.map(c => c.id);
  return group.characterIds.every(id => characterIds.includes(id));
}

/**
 * Validate character conflict
 */
export function validateCharacterConflict(
  conflict: CharacterConflict,
  characters: Character[]
): boolean {
  // Conflict must have at least 2 participants
  if (conflict.participants.length < 2) {
    return false;
  }

  // All participant IDs must exist
  const characterIds = characters.map(c => c.id);
  return conflict.participants.every(id => characterIds.includes(id));
}

// =============================================================================
// CHARACTER ANALYSIS HELPERS
// =============================================================================

/**
 * Get character importance tier
 */
export function getCharacterTier(
  importance: number
): 'main' | 'supporting' | 'minor' | 'background' {
  if (importance >= 7) return 'main';
  if (importance >= 4) return 'supporting';
  if (importance >= 2) return 'minor';
  return 'background';
}

/**
 * Calculate relationship strength between two characters
 */
export function calculateRelationshipStrength(
  relationship: CharacterRelationship
): 'weak' | 'moderate' | 'strong' | 'very_strong' {
  if (relationship.intensity >= 8) return 'very_strong';
  if (relationship.intensity >= 6) return 'strong';
  if (relationship.intensity >= 4) return 'moderate';
  return 'weak';
}

/**
 * Analyze character development potential
 */
export function analyzeCharacterDevelopment(character: Character): {
  hasArc: boolean;
  appearanceCount: number;
  developmentPotential: 'high' | 'medium' | 'low';
} {
  const hasArc = !!character.arc;
  const appearanceCount = character.appearances.length;

  let developmentPotential: 'high' | 'medium' | 'low';
  if (character.importance >= 7 && hasArc && appearanceCount >= 3) {
    developmentPotential = 'high';
  } else if (character.importance >= 4 && (hasArc || appearanceCount >= 2)) {
    developmentPotential = 'medium';
  } else {
    developmentPotential = 'low';
  }

  return {
    hasArc,
    appearanceCount,
    developmentPotential,
  };
}

/**
 * Find characters with potential relationship opportunities
 */
export function findPotentialRelationships(
  character: Character,
  allCharacters: Character[],
  existingRelationships: CharacterRelationship[]
): Character[] {
  const existingRelatedIds = existingRelationships
    .filter(rel => rel.characterAId === character.id || rel.characterBId === character.id)
    .map(rel => (rel.characterAId === character.id ? rel.characterBId : rel.characterAId));

  return allCharacters.filter(
    otherChar =>
      otherChar.id !== character.id &&
      !existingRelatedIds.includes(otherChar.id as CharacterId) &&
      otherChar.importance >= 3 // Only suggest relationships with somewhat important characters
  );
}

/**
 * Safe character casting with validation
 */
export function safeCastToCharacter(data: unknown): Character | null {
  return isCharacter(data) ? data : null;
}

/**
 * Type assertion for character with validation
 */
export function assertCharacter(data: unknown, context?: string): asserts data is Character {
  if (!isCharacter(data)) {
    throw new Error(context ? `Invalid character data in ${context}` : 'Invalid character data');
  }
}
