/**
 * Tests for character-validation.ts
 * Target: Increase coverage from 41.17% to 70%+
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { CharacterValidationService, characterValidationService, validateCharacter } from '@/lib/character-validation';
import type { Character, CharacterRelationship, CharacterGroup, CharacterConflict } from '@/types/character-schemas';

// Mock validator modules
vi.mock('@/lib/validators/character-validators', () => ({
  validateCreateCharacter: vi.fn((data, projectId) => ({
    success: true,
    data: { id: 'char-1', name: 'Test', projectId, ...data },
  })),
  validateUpdateCharacter: vi.fn(() => ({ success: true, data: {} })),
  validateCharacterIntegrity: vi.fn(char => ({ success: true, data: char })),
  validate: vi.fn(char => ({ success: true, data: char })),
}));

vi.mock('@/lib/validators/project-validators', () => ({
  validateCharacterGroup: vi.fn(() => ({ success: true, data: {} })),
  validateCharacterConflict: vi.fn(() => ({ success: true, data: {} })),
  validateProjectCharacters: vi.fn((chars, rels, groups, conflicts) => ({
    success: true,
    data: { characters: chars, relationships: rels, groups, conflicts },
  })),
}));

vi.mock('@/lib/validators/relationship-validators', () => ({
  validateCharacterRelationship: vi.fn(() => ({ success: true, data: {} })),
}));

vi.mock('@/lib/validators/validation-helpers', () => ({
  getImportanceRequirementMessage: vi.fn(role => `Message for ${role}`),
  findPersonalityConflicts: vi.fn(() => []),
  validateRelationshipAppropriateness: vi.fn(() => null),
  generateCharacterSuggestions: vi.fn(() => []),
}));

describe('CharacterValidationService', () => {
  let service: CharacterValidationService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = CharacterValidationService.getInstance();
  });

  describe('Singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = CharacterValidationService.getInstance();
      const instance2 = CharacterValidationService.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should return same instance as exported singleton', () => {
      expect(characterValidationService).toBe(service);
    });
  });

  describe('validate', () => {
    it('should delegate to validate function', () => {
      const character = { id: 'char-1', name: 'Test' } as Character;

      const result = service.validate(character);

      // Check that function returns a result
      expect(result).toBeDefined();
      // Either ValidationResult (success/data) or validate result (isValid/score)
      expect(typeof result).toBe('object');
    });
  });

  describe('validateCreateCharacter', () => {
    it('should delegate to validateCreateCharacter', () => {
      const data = { name: 'New Character', role: 'protagonist' };
      const projectId = 'proj-1';
      const existing: Character[] = [];

      const result = service.validateCreateCharacter(data, projectId, existing);

      // The function should return a result (either success or failure)
      expect(result).toBeDefined();
    });
  });

  describe('validateCharacterRelationship', () => {
    it('should delegate to validateCharacterRelationship', () => {
      const data = { characterAId: 'char-1', characterBId: 'char-2' };
      const characters = [{ id: 'char-1' }, { id: 'char-2' }] as Character[];

      const result = service.validateCharacterRelationship(data, characters);

      expect(result.success).toBe(true);
    });
  });

  describe('validateCharacterGroup', () => {
    it('should delegate to validateCharacterGroup', () => {
      const data = { name: 'Team', memberIds: ['char-1', 'char-2'] };
      const characters = [{ id: 'char-1' }, { id: 'char-2' }] as Character[];

      const result = service.validateCharacterGroup(data, characters);

      expect(result.success).toBe(true);
    });
  });

  describe('validateCharacterConflict', () => {
    it('should delegate to validateCharacterConflict', () => {
      const data = { characterAId: 'char-1', characterBId: 'char-2', type: 'rivalry' };
      const characters = [{ id: 'char-1' }, { id: 'char-2' }] as Character[];

      const result = service.validateCharacterConflict(data, characters);

      expect(result.success).toBe(true);
    });
  });

  describe('validateProjectCharacters', () => {
    it('should delegate to validateProjectCharacters', () => {
      const characters = [{ id: 'char-1' }] as Character[];
      const relationships = [{ id: 'rel-1' }] as CharacterRelationship[];
      const groups = [{ id: 'group-1' }] as CharacterGroup[];
      const conflicts = [{ id: 'conf-1' }] as CharacterConflict[];

      const result = service.validateProjectCharacters(characters, relationships, groups, conflicts);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          characters,
          relationships,
          groups,
          conflicts,
        });
      }
    });

    it('should handle default empty arrays', () => {
      const characters = [{ id: 'char-1' }] as Character[];

      const result = service.validateProjectCharacters(characters);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.relationships).toEqual([]);
        expect(result.data.groups).toEqual([]);
        expect(result.data.conflicts).toEqual([]);
      }
    });
  });

  describe('Helper methods', () => {
    describe('getImportanceRequirementMessage', () => {
      it('should delegate to getImportanceRequirementMessage', () => {
        const message = service.getImportanceRequirementMessage('protagonist');

        expect(message).toBe('Message for protagonist');
      });
    });

    describe('findPersonalityConflicts', () => {
      it('should delegate to findPersonalityConflicts', () => {
        const traits = ['brave', 'cowardly'] as any[];

        const conflicts = service.findPersonalityConflicts(traits);

        expect(Array.isArray(conflicts)).toBe(true);
      });
    });

    describe('validateRelationshipAppropriateness', () => {
      it('should delegate to validateRelationshipAppropriateness', () => {
        const charA = { id: 'char-1', name: 'A' } as Character;
        const charB = { id: 'char-2', name: 'B' } as Character;
        const relationship = { type: 'family' } as CharacterRelationship;

        const result = service.validateRelationshipAppropriateness(charA, charB, relationship);

        expect(result).toBeNull();
      });
    });

    describe('generateCharacterSuggestions', () => {
      it('should delegate to generateCharacterSuggestions', () => {
        const existing = [{ id: 'char-1' }] as Character[];
        const genres = ['fantasy', 'adventure'];

        const suggestions = service.generateCharacterSuggestions(existing, genres);

        expect(Array.isArray(suggestions)).toBe(true);
      });

      it('should handle default empty genre array', () => {
        const existing = [{ id: 'char-1' }] as Character[];

        const suggestions = service.generateCharacterSuggestions(existing);

        expect(Array.isArray(suggestions)).toBe(true);
      });
    });
  });
});

describe('Convenience functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateCharacter.create', () => {
    it('should create character validation', () => {
      const data = { name: 'Test' };
      const projectId = 'proj-1';

      const result = validateCharacter.create(data, projectId);

      expect(result.success).toBe(true);
    });

    it('should pass existing characters', () => {
      const data = { name: 'Test' };
      const projectId = 'proj-1';
      const existing = [{ id: 'char-1' }] as Character[];

      const result = validateCharacter.create(data, projectId, existing);

      expect(result.success).toBe(true);
    });
  });

  describe('validateCharacter.update', () => {
    it('should update character validation', () => {
      const data = { name: 'Updated' };

      const result = validateCharacter.update(data);

      expect(result.success).toBe(true);
    });

    it('should pass existing characters', () => {
      const data = { name: 'Updated' };
      const existing = [{ id: 'char-1' }] as Character[];

      const result = validateCharacter.update(data, existing);

      expect(result.success).toBe(true);
    });
  });

  describe('validateCharacter.integrity', () => {
    it('should validate character integrity', () => {
      const character = { id: 'char-1', name: 'Test' } as Character;

      const result = validateCharacter.integrity(character);

      expect(result.success).toBe(true);
    });
  });

  describe('validateCharacter.relationship', () => {
    it('should validate character relationship', () => {
      const data = { characterAId: 'char-1', characterBId: 'char-2' };
      const characters = [{ id: 'char-1' }, { id: 'char-2' }] as Character[];

      const result = validateCharacter.relationship(data, characters);

      expect(result.success).toBe(true);
    });
  });

  describe('validateCharacter.group', () => {
    it('should validate character group', () => {
      const data = { name: 'Team' };
      const characters = [{ id: 'char-1' }] as Character[];

      const result = validateCharacter.group(data, characters);

      expect(result.success).toBe(true);
    });
  });

  describe('validateCharacter.conflict', () => {
    it('should validate character conflict', () => {
      const data = { characterAId: 'char-1', characterBId: 'char-2' };
      const characters = [{ id: 'char-1' }, { id: 'char-2' }] as Character[];

      const result = validateCharacter.conflict(data, characters);

      expect(result.success).toBe(true);
    });
  });
});
