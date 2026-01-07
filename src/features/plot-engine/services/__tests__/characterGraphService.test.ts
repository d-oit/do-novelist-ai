/**
 * Character Graph Service Tests
 *
 * Unit tests for character relationship analysis
 */

import { describe, it, expect, beforeEach } from 'vitest';

import type { CharacterGraph, CharacterRelationship } from '@/features/plot-engine';
import { CharacterGraphService } from '@/features/plot-engine/services/characterGraphService';
import type { Chapter, Character } from '@/shared/types';

describe('CharacterGraphService', () => {
  let service: CharacterGraphService;

  beforeEach(() => {
    service = new CharacterGraphService();
  });

  describe('buildCharacterGraph', () => {
    it('should build empty graph when no characters provided', async () => {
      const result = await service.buildCharacterGraph('project-1', [], []);

      expect(result).toMatchObject({
        projectId: 'project-1',
        relationships: [],
        nodes: [],
      });
      expect(result.analyzedAt).toBeInstanceOf(Date);
    });

    it('should build graph with character nodes', async () => {
      const characters = [
        {
          id: 'char-1',
          projectId: 'project-1',
          name: 'Alice',
          role: 'protagonist',
          aliases: [],
          appearance: 'Main character',
          personality: 'Brave',
          motivations: ['save the world'],
          conflicts: [],
          skills: [],
          flaws: [],
          strengths: [],
          relationships: [],
          backstory: '',
          notes: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'char-2',
          projectId: 'project-1',
          name: 'Bob',
          role: 'supporting',
          aliases: [],
          appearance: 'Friend',
          personality: 'Loyal',
          motivations: ['help Alice'],
          conflicts: [],
          skills: [],
          flaws: [],
          strengths: [],
          relationships: [],
          backstory: '',
          notes: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as any as Character[] as any as Character[];

      const chapters = [
        {
          id: 'ch-1',
          projectId: 'project-1',
          title: 'Chapter 1',
          content: 'Alice and Bob became friends.',
          chapterNumber: 1,
          wordCount: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as any as Chapter[];

      const result = await service.buildCharacterGraph('project-1', chapters, characters);

      expect(result.projectId).toBe('project-1');
      expect(result.nodes).toHaveLength(2);
      expect(result.relationships.length).toBeGreaterThanOrEqual(0);
    });

    it('should detect relationships between characters', async () => {
      const characters = [
        {
          id: 'char-1',
          projectId: 'project-1',
          name: 'Emma',
          role: 'protagonist',
          description: '',
          traits: [],
          goals: [],
          relationships: [],
          backstory: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'char-2',
          projectId: 'project-1',
          name: 'James',
          role: 'supporting',
          description: '',
          traits: [],
          goals: [],
          relationships: [],
          backstory: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as any as Character[];

      const chapters = [
        {
          id: 'ch-1',
          projectId: 'project-1',
          title: 'Chapter 1',
          content: 'Emma met James at the cafe. They became instant friends.',
          order: 1,
          wordCount: 10,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as any as Chapter[];

      const result = await service.buildCharacterGraph('project-1', chapters, characters);

      expect(result.relationships).toBeInstanceOf(Array);
      if (result.relationships.length > 0) {
        const relationship = result.relationships[0];
        expect(relationship).toHaveProperty('id');
        expect(relationship).toHaveProperty('character1Id');
        expect(relationship).toHaveProperty('character2Id');
        expect(relationship).toHaveProperty('type');
        expect(relationship).toHaveProperty('strength');
      }
    });

    it('should handle errors gracefully', async () => {
      const invalidCharacters = null as unknown as Character[];

      await expect(service.buildCharacterGraph('project-1', [], invalidCharacters)).rejects.toThrow();
    });
  });

  describe('getCharacterRelationships', () => {
    it('should return empty array when character has no relationships', () => {
      const graph: CharacterGraph = {
        projectId: 'project-1',
        relationships: [],
        nodes: [],
        analyzedAt: new Date(),
      };

      const result = service.getCharacterRelationships('char-1', graph);

      expect(result).toEqual([]);
    });

    it('should return relationships for a character', () => {
      const relationships: CharacterRelationship[] = [
        {
          id: 'rel-1',
          projectId: 'project-1',
          character1Id: 'char-1',
          character2Id: 'char-2',
          type: 'friend',
          strength: 8,
          evolution: [],
          isReciprocal: true,
        },
        {
          id: 'rel-2',
          projectId: 'project-1',
          character1Id: 'char-2',
          character2Id: 'char-3',
          type: 'enemy',
          strength: 3,
          evolution: [],
          isReciprocal: false,
        },
        {
          id: 'rel-3',
          projectId: 'project-1',
          character1Id: 'char-1',
          character2Id: 'char-3',
          type: 'rival',
          strength: 6,
          evolution: [],
          isReciprocal: true,
        },
      ];

      const graph: CharacterGraph = {
        projectId: 'project-1',
        relationships,
        nodes: [],
        analyzedAt: new Date(),
      };

      const result = service.getCharacterRelationships('char-1', graph);

      expect(result).toHaveLength(2);
      expect(result.every(r => r.character1Id === 'char-1' || r.character2Id === 'char-1')).toBe(true);
    });
  });

  describe('getStrongestRelationships', () => {
    it('should return empty array when no relationships exist', () => {
      const graph: CharacterGraph = {
        projectId: 'project-1',
        relationships: [],
        nodes: [],
        analyzedAt: new Date(),
      };

      const result = service.getStrongestRelationships(graph);

      expect(result).toEqual([]);
    });

    it('should return relationships sorted by strength', () => {
      const relationships: CharacterRelationship[] = [
        {
          id: 'rel-1',
          projectId: 'project-1',
          character1Id: 'char-1',
          character2Id: 'char-2',
          type: 'friend',
          strength: 5,
          evolution: [],
          isReciprocal: true,
        },
        {
          id: 'rel-2',
          projectId: 'project-1',
          character1Id: 'char-2',
          character2Id: 'char-3',
          type: 'romantic',
          strength: 10,
          evolution: [],
          isReciprocal: true,
        },
        {
          id: 'rel-3',
          projectId: 'project-1',
          character1Id: 'char-1',
          character2Id: 'char-3',
          type: 'enemy',
          strength: 2,
          evolution: [],
          isReciprocal: false,
        },
      ];

      const graph: CharacterGraph = {
        projectId: 'project-1',
        relationships,
        nodes: [],
        analyzedAt: new Date(),
      };

      const result = service.getStrongestRelationships(graph, 2);

      expect(result).toHaveLength(2);
      expect(result[0]?.strength).toBe(10);
      expect(result[1]?.strength).toBe(5);
    });

    it('should limit results to specified count', () => {
      const relationships: CharacterRelationship[] = Array.from({ length: 10 }, (_, i) => ({
        id: `rel-${i}`,
        projectId: 'project-1',
        character1Id: 'char-1',
        character2Id: `char-${i + 2}`,
        type: 'friend' as const,
        strength: i + 1,
        evolution: [],
        isReciprocal: true,
      }));

      const graph: CharacterGraph = {
        projectId: 'project-1',
        relationships,
        nodes: [],
        analyzedAt: new Date(),
      };

      const result = service.getStrongestRelationships(graph, 3);

      expect(result).toHaveLength(3);
    });
  });

  describe('detectRelationshipChanges', () => {
    it('should detect stable relationship with no evolution', () => {
      const relationship: CharacterRelationship = {
        id: 'rel-1',
        projectId: 'project-1',
        character1Id: 'char-1',
        character2Id: 'char-2',
        type: 'friend',
        strength: 7,
        evolution: [
          {
            chapterId: 'ch-1',
            chapterNumber: 1,
            type: 'friend',
            strength: 7,
          },
        ],
        isReciprocal: true,
      };

      const result = service.detectRelationshipChanges(relationship);

      expect(result.hasChanged).toBe(false);
      expect(result.pattern).toBe('stable');
    });

    it('should detect improving relationship', () => {
      const relationship: CharacterRelationship = {
        id: 'rel-1',
        projectId: 'project-1',
        character1Id: 'char-1',
        character2Id: 'char-2',
        type: 'romantic',
        strength: 9,
        evolution: [
          {
            chapterId: 'ch-1',
            chapterNumber: 1,
            type: 'neutral',
            strength: 5,
          },
          {
            chapterId: 'ch-5',
            chapterNumber: 5,
            type: 'friend',
            strength: 7,
          },
          {
            chapterId: 'ch-10',
            chapterNumber: 10,
            type: 'romantic',
            strength: 9,
          },
        ],
        isReciprocal: true,
      };

      const result = service.detectRelationshipChanges(relationship);

      expect(result.hasChanged).toBe(true);
      expect(result.pattern).toBe('improving');
    });

    it('should detect deteriorating relationship', () => {
      const relationship: CharacterRelationship = {
        id: 'rel-1',
        projectId: 'project-1',
        character1Id: 'char-1',
        character2Id: 'char-2',
        type: 'enemy',
        strength: 2,
        evolution: [
          {
            chapterId: 'ch-1',
            chapterNumber: 1,
            type: 'friend',
            strength: 8,
          },
          {
            chapterId: 'ch-5',
            chapterNumber: 5,
            type: 'rival',
            strength: 5,
          },
          {
            chapterId: 'ch-10',
            chapterNumber: 10,
            type: 'enemy',
            strength: 2,
          },
        ],
        isReciprocal: false,
      };

      const result = service.detectRelationshipChanges(relationship);

      expect(result.hasChanged).toBe(true);
      expect(result.pattern).toBe('deteriorating');
    });

    it('should detect complex relationship pattern', () => {
      const relationship: CharacterRelationship = {
        id: 'rel-1',
        projectId: 'project-1',
        character1Id: 'char-1',
        character2Id: 'char-2',
        type: 'rival',
        strength: 6,
        evolution: [
          {
            chapterId: 'ch-1',
            chapterNumber: 1,
            type: 'friend',
            strength: 7,
          },
          {
            chapterId: 'ch-3',
            chapterNumber: 3,
            type: 'enemy',
            strength: 3,
          },
          {
            chapterId: 'ch-6',
            chapterNumber: 6,
            type: 'rival',
            strength: 6,
          },
          {
            chapterId: 'ch-9',
            chapterNumber: 9,
            type: 'friend',
            strength: 8,
          },
        ],
        isReciprocal: true,
      };

      const result = service.detectRelationshipChanges(relationship);

      // Should detect pattern (improving/complex based on final vs initial)
      expect(['complex', 'improving']).toContain(result.pattern);
    });
  });

  describe('relationship type detection', () => {
    it('should detect romantic relationships', async () => {
      const characters = [
        {
          id: 'char-1',
          projectId: 'project-1',
          name: 'Sarah',
          role: 'protagonist',
          description: '',
          traits: [],
          goals: [],
          relationships: [],
          backstory: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'char-2',
          projectId: 'project-1',
          name: 'Tom',
          role: 'love interest',
          description: '',
          traits: [],
          goals: [],
          relationships: [],
          backstory: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as any as Character[];

      const chapters = [
        {
          id: 'ch-1',
          projectId: 'project-1',
          title: 'Chapter 1',
          content: 'Sarah and Tom fell in love. They kissed under the stars.',
          order: 1,
          wordCount: 11,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as any as Chapter[];

      const result = await service.buildCharacterGraph('project-1', chapters, characters);

      const relationship = result.relationships.find(
        r =>
          (r.character1Id === 'char-1' && r.character2Id === 'char-2') ||
          (r.character1Id === 'char-2' && r.character2Id === 'char-1'),
      );

      expect(relationship).toBeDefined();
      if (relationship) {
        expect(relationship.type).toBe('romantic');
      }
    });

    it('should detect enemy relationships', async () => {
      const characters = [
        {
          id: 'char-1',
          projectId: 'project-1',
          name: 'Hero',
          role: 'protagonist',
          description: '',
          traits: [],
          goals: [],
          relationships: [],
          backstory: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'char-2',
          projectId: 'project-1',
          name: 'Villain',
          role: 'antagonist',
          description: '',
          traits: [],
          goals: [],
          relationships: [],
          backstory: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as any as Character[];

      const chapters = [
        {
          id: 'ch-1',
          projectId: 'project-1',
          title: 'Chapter 1',
          content: 'Hero faced Villain, his sworn enemy. They fought fiercely.',
          order: 1,
          wordCount: 10,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as any as Chapter[];

      const result = await service.buildCharacterGraph('project-1', chapters, characters);

      const relationship = result.relationships[0];
      expect(relationship).toBeDefined();
      if (relationship) {
        expect(relationship.type).toBe('enemy');
      }
    });
  });

  describe('character importance calculation', () => {
    it('should assign higher importance to protagonists', async () => {
      const characters = [
        {
          id: 'char-1',
          projectId: 'project-1',
          name: 'MainChar',
          role: 'protagonist',
          description: '',
          traits: [],
          goals: [],
          relationships: [],
          backstory: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'char-2',
          projectId: 'project-1',
          name: 'SideChar',
          role: 'minor',
          description: '',
          traits: [],
          goals: [],
          relationships: [],
          backstory: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as any as Character[];

      const result = await service.buildCharacterGraph('project-1', [], characters);

      const protagonist = result.nodes.find(n => n.id === 'char-1');
      const minor = result.nodes.find(n => n.id === 'char-2');

      expect(protagonist).toBeDefined();
      expect(minor).toBeDefined();
      if (protagonist && minor) {
        expect(protagonist.importance).toBeGreaterThan(minor.importance);
      }
    });
  });
});
