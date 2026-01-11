/**
 * Character Graph Hook Tests
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { useCharacterGraph, useCharacterGraphHelpers } from '@/features/plot-engine/hooks/useCharacterGraph';
import { characterGraphService } from '@/features/plot-engine/services/characterGraphService';
import type { CharacterGraph } from '@/features/plot-engine/types';
import { ChapterStatus } from '@/shared/types';
import type { Chapter, Character } from '@/shared/types';

vi.mock('@/features/plot-engine/services/characterGraphService');
const mockCharacterGraphService = vi.mocked(characterGraphService);

describe('useCharacterGraph', () => {
  const mockChapters: Chapter[] = [
    {
      id: 'chap-1',
      projectId: 'test-project',
      orderIndex: 1,
      title: 'Chapter 1',
      summary: 'Summary',
      content: 'John met Mary in the forest...',
      status: ChapterStatus.COMPLETE,
      wordCount: 1000,
      characterCount: 2,
      estimatedReadingTime: 5,
      tags: [],
      notes: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockCharacters: Character[] = [
    {
      id: 'char-1',
      projectId: 'test-project',
      name: 'John',
      aliases: [],
      role: 'protagonist',
      importance: 8,
      summary: 'Main character',
      tags: [],
      notes: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      generatedBy: 'user',
      mood_board: [],
      appearances: [],
      inspirations: [],
    },
    {
      id: 'char-2',
      projectId: 'test-project',
      name: 'Mary',
      aliases: [],
      role: 'supporting',
      importance: 6,
      summary: 'Supporting character',
      tags: [],
      notes: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      generatedBy: 'user',
      mood_board: [],
      appearances: [],
      inspirations: [],
    },
  ];

  const mockGraph: CharacterGraph = {
    projectId: 'test-project',
    relationships: [
      {
        id: 'rel-1',
        projectId: 'test-project',
        character1Id: 'char-1',
        character2Id: 'char-2',
        type: 'friend',
        strength: 8,
        evolution: [],
        isReciprocal: true,
      },
    ],
    nodes: [],
    analyzedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    act(() => {
      useCharacterGraph.setState({
        graph: null,
        projectId: null,
        isLoading: false,
        error: null,
      });
    });

    mockCharacterGraphService.buildCharacterGraph.mockResolvedValue(mockGraph);
    mockCharacterGraphService.getCharacterRelationships.mockReturnValue([
      {
        id: 'rel-1',
        projectId: 'test-project',
        character1Id: 'char-1',
        character2Id: 'char-2',
        type: 'friend',
        strength: 8,
        evolution: [],
        isReciprocal: true,
      },
    ]);
    mockCharacterGraphService.getStrongestRelationships.mockReturnValue([
      {
        id: 'rel-1',
        projectId: 'test-project',
        character1Id: 'char-1',
        character2Id: 'char-2',
        type: 'friend',
        strength: 8,
        evolution: [],
        isReciprocal: true,
      },
    ]);
    mockCharacterGraphService.detectRelationshipChanges.mockReturnValue({
      hasChanged: false,
      pattern: 'stable',
    });
  });

  describe('buildGraph', () => {
    it('builds character graph successfully', async () => {
      const { result } = renderHook(() => useCharacterGraph());

      await act(async () => {
        await result.current.buildGraph('test-project', mockChapters, mockCharacters);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.graph).toEqual(mockGraph);
        expect(result.current.projectId).toBe('test-project');
        expect(mockCharacterGraphService.buildCharacterGraph).toHaveBeenCalledWith(
          'test-project',
          mockChapters,
          mockCharacters,
        );
      });
    });

    it('sets project ID during build', async () => {
      const { result } = renderHook(() => useCharacterGraph());

      let resolveBuild: ((value: any) => void) | undefined;
      mockCharacterGraphService.buildCharacterGraph.mockImplementation(
        () =>
          new Promise(resolve => {
            resolveBuild = resolve;
          }),
      );

      act(() => {
        result.current.buildGraph('test-project', mockChapters, mockCharacters);
      });

      expect(result.current.projectId).toBe('test-project');

      // Resolve the promise inside act to prevent state update warnings
      await act(async () => {
        if (resolveBuild) {
          resolveBuild(mockGraph);
        }
      });
    });

    it('sets loading state during build', async () => {
      const { result } = renderHook(() => useCharacterGraph());

      let resolveBuild: ((value: any) => void) | undefined;
      mockCharacterGraphService.buildCharacterGraph.mockImplementation(
        () =>
          new Promise(resolve => {
            resolveBuild = resolve;
          }),
      );

      act(() => {
        result.current.buildGraph('test-project', mockChapters, mockCharacters);
      });

      expect(result.current.isLoading).toBe(true);

      // Resolve the promise inside act to prevent state update warnings
      await act(async () => {
        if (resolveBuild) {
          resolveBuild(mockGraph);
        }
      });
    });

    it('handles graph building errors', async () => {
      const errorMessage = 'Graph building failed';
      mockCharacterGraphService.buildCharacterGraph.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useCharacterGraph());

      await act(async () => {
        await result.current.buildGraph('test-project', mockChapters, mockCharacters);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe(errorMessage);
      });
    });
  });

  describe('resetGraph', () => {
    it('resets graph', () => {
      const { result } = renderHook(() => useCharacterGraph());

      act(() => {
        useCharacterGraph.setState({
          graph: mockGraph,
          projectId: 'test-project',
        });
      });

      act(() => {
        result.current.resetGraph();
      });

      expect(result.current.graph).toBeNull();
      expect(result.current.projectId).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  describe('clearError', () => {
    it('clears error', () => {
      const { result } = renderHook(() => useCharacterGraph());

      act(() => {
        useCharacterGraph.setState({
          error: 'Some error',
        });
      });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('state management', () => {
    it('initializes with default state', () => {
      const { result } = renderHook(() => useCharacterGraph());

      expect(result.current.graph).toBeNull();
      expect(result.current.projectId).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });
});

describe('useCharacterGraphHelpers', () => {
  const mockGraph: CharacterGraph = {
    projectId: 'test-project',
    relationships: [
      {
        id: 'rel-1',
        projectId: 'test-project',
        character1Id: 'char-1',
        character2Id: 'char-2',
        type: 'friend',
        strength: 8,
        evolution: [],
        isReciprocal: true,
      },
      {
        id: 'rel-2',
        projectId: 'test-project',
        character1Id: 'char-1',
        character2Id: 'char-3',
        type: 'enemy',
        strength: 9,
        evolution: [],
        isReciprocal: true,
      },
    ],
    nodes: [],
    analyzedAt: new Date(),
  };

  const mockRelationship: CharacterGraph['relationships'][number] = {
    id: 'rel-1',
    projectId: 'test-project',
    character1Id: 'char-1',
    character2Id: 'char-2',
    type: 'friend',
    strength: 8,
    evolution: [
      {
        chapterId: 'chap-1',
        chapterNumber: 1,
        type: 'neutral',
        strength: 5,
        event: 'First meeting',
      },
      {
        chapterId: 'chap-5',
        chapterNumber: 5,
        type: 'friend',
        strength: 8,
        event: 'Became friends',
      },
    ],
    isReciprocal: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    act(() => {
      useCharacterGraph.setState({
        graph: mockGraph,
        projectId: 'test-project',
        isLoading: false,
        error: null,
      });
    });

    mockCharacterGraphService.getCharacterRelationships.mockReturnValue([
      {
        id: 'rel-1',
        projectId: 'test-project',
        character1Id: 'char-1',
        character2Id: 'char-2',
        type: 'friend',
        strength: 8,
        evolution: [],
        isReciprocal: true,
      },
    ]);
    mockCharacterGraphService.getStrongestRelationships.mockReturnValue([
      {
        id: 'rel-2',
        projectId: 'test-project',
        character1Id: 'char-1',
        character2Id: 'char-3',
        type: 'enemy',
        strength: 9,
        evolution: [],
        isReciprocal: true,
      },
    ]);
    mockCharacterGraphService.detectRelationshipChanges.mockReturnValue({
      hasChanged: true,
      pattern: 'improving',
    });
  });

  describe('getCharacterRelationships', () => {
    it('gets relationships for character', () => {
      const { result } = renderHook(() => useCharacterGraphHelpers());

      const relationships = result.current.getCharacterRelationships('char-1');

      expect(mockCharacterGraphService.getCharacterRelationships).toHaveBeenCalledWith('char-1', mockGraph);
      expect(relationships).toBeDefined();
    });

    it('returns empty array when graph is null', () => {
      act(() => {
        useCharacterGraph.setState({
          graph: null,
          projectId: null,
        });
      });

      const { result } = renderHook(() => useCharacterGraphHelpers());

      const relationships = result.current.getCharacterRelationships('char-1');

      expect(relationships).toEqual([]);
      expect(mockCharacterGraphService.getCharacterRelationships).not.toHaveBeenCalled();
    });
  });

  describe('getStrongestRelationships', () => {
    it('gets strongest relationships', () => {
      const { result } = renderHook(() => useCharacterGraphHelpers());

      const relationships = result.current.getStrongestRelationships(3);

      expect(mockCharacterGraphService.getStrongestRelationships).toHaveBeenCalledWith(mockGraph, 3);
      expect(relationships).toBeDefined();
    });

    it('uses default limit', () => {
      const { result } = renderHook(() => useCharacterGraphHelpers());

      result.current.getStrongestRelationships();

      expect(mockCharacterGraphService.getStrongestRelationships).toHaveBeenCalledWith(mockGraph, 5);
    });

    it('returns empty array when graph is null', () => {
      act(() => {
        useCharacterGraph.setState({
          graph: null,
          projectId: null,
        });
      });

      const { result } = renderHook(() => useCharacterGraphHelpers());

      const relationships = result.current.getStrongestRelationships(3);

      expect(relationships).toEqual([]);
      expect(mockCharacterGraphService.getStrongestRelationships).not.toHaveBeenCalled();
    });
  });

  describe('detectRelationshipChanges', () => {
    it('detects relationship changes', () => {
      const { result } = renderHook(() => useCharacterGraphHelpers());

      const changes = result.current.detectRelationshipChanges(mockRelationship);

      expect(mockCharacterGraphService.detectRelationshipChanges).toHaveBeenCalledWith(mockRelationship);
      expect(changes).toBeDefined();
    });
  });
});
