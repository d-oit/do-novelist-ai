/**
 * Validation Helper Functions
 * Shared utility functions for character validation
 */

import type {
  Character,
  CharacterRole,
  PersonalityTrait,
  CharacterRelationship,
} from '@/types/character-schemas';

/**
 * Get importance requirement message for a character role
 */
export function getImportanceRequirementMessage(role: CharacterRole): string {
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

/**
 * Find conflicting personality traits
 */
export function findPersonalityConflicts(traits: PersonalityTrait[]): string[] {
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

/**
 * Validate relationship appropriateness
 */
export function validateRelationshipAppropriateness(
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
export function generateCharacterSuggestions(
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
