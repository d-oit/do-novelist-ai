/**
 * Character Graph Hook
 *
 * Manages character relationship graph state
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { characterGraphService } from '@/features/plot-engine/services/characterGraphService';
import type { CharacterGraph, CharacterRelationship } from '@/features/plot-engine/types';
import { logger } from '@/lib/logging/logger';
import type { Chapter, Character } from '@/shared/types';

interface CharacterGraphState {
  graph: CharacterGraph | null;
  projectId: string | null;

  isLoading: boolean;
  error: string | null;

  buildGraph: (projectId: string, chapters: Chapter[], characters: Character[]) => Promise<void>;
  resetGraph: () => void;
  clearError: () => void;
}

export const useCharacterGraph = create<CharacterGraphState>()(
  devtools(
    set => ({
      graph: null,
      projectId: null,
      isLoading: false,
      error: null,

      buildGraph: async (
        projectId: string,
        chapters: Chapter[],
        characters: Character[],
      ): Promise<void> => {
        set({ isLoading: true, error: null, projectId });

        try {
          const graph = await characterGraphService.buildCharacterGraph(
            projectId,
            chapters,
            characters,
          );

          set({
            graph,
            isLoading: false,
          });

          logger.info('Character graph built', {
            projectId,
            relationshipCount: graph.relationships.length,
            nodeCount: graph.nodes.length,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to build character graph';
          logger.error('Character graph building failed', { projectId, error });
          set({ error: errorMessage, isLoading: false });
        }
      },

      resetGraph: (): void => {
        set({
          graph: null,
          projectId: null,
          error: null,
        });
      },

      clearError: (): void => {
        set({ error: null });
      },
    }),
    { name: 'CharacterGraphStore' },
  ),
);

export const useCharacterGraphHelpers = () => {
  const graph = useCharacterGraph(state => state.graph);

  const getCharacterRelationships = (characterId: string): CharacterRelationship[] => {
    if (!graph) return [];
    return characterGraphService.getCharacterRelationships(characterId, graph);
  };

  const getStrongestRelationships = (limit: number = 5): CharacterRelationship[] => {
    if (!graph) return [];
    return characterGraphService.getStrongestRelationships(graph, limit);
  };

  const detectRelationshipChanges = (relationship: CharacterRelationship) => {
    return characterGraphService.detectRelationshipChanges(relationship);
  };

  return {
    getCharacterRelationships,
    getStrongestRelationships,
    detectRelationshipChanges,
  };
};
