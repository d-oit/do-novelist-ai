import { describe, it, expect, beforeEach } from 'vitest';

import { CharacterValidationService } from '@/lib/character-validation';
import { type Character, type CharacterRole } from '@/types/character-schemas';
import { type ProjectId } from '@/types/schemas';

describe('CharacterValidationService Baseline', () => {
  let service: CharacterValidationService;
  const mockProjectId = 'proj_123' as ProjectId;

  beforeEach(() => {
    service = CharacterValidationService.getInstance();
  });

  const createMockCharacter = (overrides: Partial<Character> = {}): Character => ({
    id: 'char_test_1705170000000' as any,
    projectId: mockProjectId,
    name: 'Test Character',
    aliases: [],
    role: 'supporting' as CharacterRole,
    importance: 5,
    summary: 'A test character summary',
    physicalTraits: {
      distinctiveFeatures: [],
      disabilities: [],
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
    },
    voice: {
      vocabulary: 'average',
      tone: 'casual',
      speechPatterns: [],
      catchphrases: [],
    },
    portrait:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    mood_board: [],
    appearances: [],
    tags: [],
    notes: '',
    inspirations: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
    generatedBy: 'user',
    ...overrides,
  });

  describe('validate', () => {
    it('should validate a basic character correctly', () => {
      const char = createMockCharacter();
      const result = service.validate(char);
      expect(result.isValid).toBe(true);
      expect(result.score).toBe(50);
      expect(result.issues).toHaveLength(0);
    });

    it('should calculate higher score for developed characters', () => {
      const char = createMockCharacter({
        background: {
          backstory:
            'A very long backstory that exceeds one hundred characters to test the scoring logic. It needs to be quite substantial to pass the check properly in the validation service.',
        } as any,
        psychology: { desires: ['To test things', 'To pass tests', 'To be valid'] } as any,
        arc: {
          type: 'growth',
          description: 'Grows up',
          startingState: 'Child',
          endingState: 'Adult',
          milestones: [],
          obstacles: [],
        } as any,
      });
      const result = service.validate(char);
      expect(result.score).toBe(100);
      expect(result.strengths).toContain('Well-developed backstory');
      expect(result.strengths).toContain('Clear motivations');
    });

    it('should return invalid if integrity check fails', () => {
      const char = createMockCharacter({ importance: 10, arc: undefined }); // Protagonist importance 10 needs arc
      const result = service.validate(char);
      expect(result.isValid).toBe(false);
      expect(result.issues).not.toHaveLength(0);
    });
  });

  describe('validateCreateCharacter', () => {
    it('should fail validation due to missing portrait in service implementation (KNOWN BUG)', () => {
      const data = {
        name: 'New Character',
        role: 'protagonist',
        importance: 9,
        summary: 'New summary',
        tags: ['test'],
        physicalTraits: {},
        psychology: {},
      };
      const result = service.validateCreateCharacter(data, mockProjectId);
      if (!result.success) {
        console.log('validateCreateCharacter Issues:', JSON.stringify(result.issues, null, 2));
      }
      expect(result.success).toBe(false);
    });

    it('should fail if name already exists', () => {
      const existing = [createMockCharacter({ name: 'Existing' })];
      const data = { name: 'Existing', role: 'supporting', importance: 5, physicalTraits: {}, psychology: {} };
      const result = service.validateCreateCharacter(data, mockProjectId, existing);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('already exists');
      }
    });

    it('should fail if role-importance is mismatched', () => {
      const data = { name: 'Bad Protagonist', role: 'protagonist', importance: 5, physicalTraits: {}, psychology: {} };
      const result = service.validateCreateCharacter(data, mockProjectId);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid importance level');
      }
    });
  });

  describe('validateUpdateCharacter', () => {
    it('should validate a valid update', () => {
      const data = { id: 'char_test_1705170000000', name: 'Updated Name' };
      const result = service.validateUpdateCharacter(data);
      expect(result.success).toBe(true);
    });

    it('should fail if updated name conflicts with another character', () => {
      const existing = [
        createMockCharacter({ id: 'char_one_1' as any, name: 'Char 1' }),
        createMockCharacter({ id: 'char_two_2' as any, name: 'Char 2' }),
      ];
      const data = { id: 'char_one_1', name: 'Char 2' };
      const result = service.validateUpdateCharacter(data, existing);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('already exists');
      }
    });
  });

  describe('validateCharacterRelationship', () => {
    it('should validate a healthy relationship', () => {
      const charA = createMockCharacter({ id: 'char_a_1' as any, name: 'Char A' });
      const charB = createMockCharacter({ id: 'char_b_2' as any, name: 'Char B' });
      const relationship = {
        id: 'rel_1',
        characterAId: 'char_a_1',
        characterBId: 'char_b_2',
        type: 'friendship',
        description: 'Best friends',
        intensity: 8,
      };
      const result = service.validateCharacterRelationship(relationship, [charA, charB]);
      expect(result.success).toBe(true);
    });

    it('should fail for self-relationship', () => {
      const charA = createMockCharacter({ id: 'char_a_1' as any });
      const relationship = {
        id: 'rel_1',
        characterAId: 'char_a_1',
        characterBId: 'char_a_1',
        type: 'friendship',
        description: 'Self-friendship',
        intensity: 5,
      };
      const result = service.validateCharacterRelationship(relationship, [charA]);
      expect(result.success).toBe(false);
    });

    it('should fail for romantic relationship with low intensity', () => {
      const charA = createMockCharacter({ id: 'char_a_1' as any, name: 'Char A' });
      const charB = createMockCharacter({ id: 'char_b_2' as any, name: 'Char B' });
      const relationship = {
        id: 'rel_1',
        characterAId: 'char_a_1',
        characterBId: 'char_b_2',
        type: 'romantic',
        description: 'Cold romance',
        intensity: 2,
      };
      const result = service.validateCharacterRelationship(relationship, [charA, charB]);
      expect(result.success).toBe(false);
    });
  });

  describe('validateProjectCharacters', () => {
    it('should validate a valid project character set', () => {
      const characters = [
        createMockCharacter({
          id: 'char_p1_1' as any,
          name: 'Protagonist',
          role: 'protagonist',
          importance: 9,
          arc: {
            type: 'growth',
            description: 'Grows',
            startingState: 'A',
            endingState: 'B',
            milestones: [],
            obstacles: [],
          } as any,
        }),
        createMockCharacter({ id: 'char_s1_2' as any, name: 'Supporting', role: 'supporting', importance: 5 }),
      ];
      const result = service.validateProjectCharacters(characters);
      expect(result.success).toBe(true);
    });

    it('should fail if no protagonist', () => {
      const characters = [
        createMockCharacter({ id: 'char_s1_1' as any, name: 'Supporting', role: 'supporting', importance: 5 }),
      ];
      const result = service.validateProjectCharacters(characters);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.issues[0]?.message).toContain('at least one protagonist');
      }
    });

    it('should fail for duplicate names', () => {
      const characters = [
        createMockCharacter({
          id: 'char_p1_1' as any,
          name: 'Double',
          role: 'protagonist',
          importance: 9,
          arc: {
            type: 'growth',
            description: 'Grows',
            startingState: 'A',
            endingState: 'B',
            milestones: [],
            obstacles: [],
          } as any,
        }),
        createMockCharacter({ id: 'char_p2_2' as any, name: 'Double', role: 'supporting', importance: 5 }),
      ];
      const result = service.validateProjectCharacters(characters);
      expect(result.success).toBe(false);
    });
  });

  describe('generateCharacterSuggestions', () => {
    it('should suggest protagonist if missing', () => {
      const result = service.generateCharacterSuggestions([]);
      expect(result).toContainEqual(expect.objectContaining({ role: 'protagonist' }));
    });

    it('should suggest antagonist if missing', () => {
      const result = service.generateCharacterSuggestions([createMockCharacter({ role: 'protagonist' })]);
      expect(result).toContainEqual(expect.objectContaining({ role: 'antagonist' }));
    });
  });
});
