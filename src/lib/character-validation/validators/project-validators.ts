import { type ValidationIssue, type ValidationResult } from '@/lib/character-validation/types';
import {
  isProtagonist,
  isMainCharacter,
  hasCharacterArc,
  validateUniqueCharacterNames,
} from '@/types/character-guards';
import {
  type Character,
  type CharacterRelationship,
  type CharacterGroup,
  type CharacterConflict,
} from '@/types/character-schemas';

export function validateProjectCharacters(
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
  const issues: ValidationIssue[] = [];

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
  if (protagonists.length === 0 && characters.length > 0) {
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
}
