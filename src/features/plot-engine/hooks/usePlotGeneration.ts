/**
 * Plot Generation Hook
 *
 * Manages AI-powered plot generation and suggestions
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { plotGenerationService } from '@/features/plot-engine/services/plotGenerationService';
import type {
  PlotGenerationRequest,
  PlotStructure,
  PlotSuggestion,
} from '@/features/plot-engine/types';
import { logger } from '@/lib/logging/logger';

interface PlotGenerationState {
  generatedPlot: PlotStructure | null;
  suggestions: PlotSuggestion[];
  alternatives: PlotStructure[];
  confidence: number;
  lastGeneratedAt: Date | null;

  isLoading: boolean;
  isGeneratingAlternatives: boolean;
  isGeneratingSuggestions: boolean;
  error: string | null;

  generatePlot: (request: PlotGenerationRequest) => Promise<void>;
  generateAlternatives: (request: PlotGenerationRequest) => Promise<void>;
  getSuggestions: (request: PlotGenerationRequest) => Promise<void>;
  savePlot: (plotStructure: PlotStructure) => void;
  reset: () => void;
  clearError: () => void;
}

export const usePlotGeneration = create<PlotGenerationState>()(
  devtools(
    set => ({
      generatedPlot: null,
      suggestions: [],
      alternatives: [],
      confidence: 0,
      lastGeneratedAt: null,
      isLoading: false,
      isGeneratingAlternatives: false,
      isGeneratingSuggestions: false,
      error: null,

      generatePlot: async (request: PlotGenerationRequest): Promise<void> => {
        set({ isLoading: true, error: null });

        try {
          const result = await plotGenerationService.generatePlot(request);

          set({
            generatedPlot: result.plotStructure,
            suggestions: result.suggestions,
            alternatives: result.alternatives,
            confidence: result.confidence,
            lastGeneratedAt: result.generatedAt,
            isLoading: false,
          });

          logger.info('Plot generation complete', {
            projectId: request.projectId,
            actCount: result.plotStructure.acts.length,
            suggestionCount: result.suggestions.length,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to generate plot';
          logger.error('Plot generation failed', { projectId: request.projectId, error });
          set({ error: errorMessage, isLoading: false });
        }
      },

      generateAlternatives: async (request: PlotGenerationRequest): Promise<void> => {
        set({ isGeneratingAlternatives: true, error: null });

        try {
          const result = await plotGenerationService.generatePlot(request);

          set({
            alternatives: result.alternatives,
            isGeneratingAlternatives: false,
          });

          logger.info('Alternatives generation complete', {
            projectId: request.projectId,
            alternativeCount: result.alternatives.length,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to generate alternatives';
          logger.error('Alternatives generation failed', { projectId: request.projectId, error });
          set({ error: errorMessage, isGeneratingAlternatives: false });
        }
      },

      getSuggestions: async (request: PlotGenerationRequest): Promise<void> => {
        set({ isGeneratingSuggestions: true, error: null });

        try {
          const suggestions = await plotGenerationService.generatePlot(request);

          set({
            suggestions: suggestions.suggestions,
            isGeneratingSuggestions: false,
          });

          logger.info('Suggestions generation complete', {
            projectId: request.projectId,
            suggestionCount: suggestions.suggestions.length,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to generate suggestions';
          logger.error('Suggestions generation failed', { projectId: request.projectId, error });
          set({ error: errorMessage, isGeneratingSuggestions: false });
        }
      },

      savePlot: (plotStructure: PlotStructure): void => {
        set({
          generatedPlot: plotStructure,
        });

        logger.info('Plot saved', {
          projectId: plotStructure.projectId,
          actCount: plotStructure.acts.length,
        });
      },

      reset: (): void => {
        set({
          generatedPlot: null,
          suggestions: [],
          alternatives: [],
          confidence: 0,
          lastGeneratedAt: null,
          error: null,
        });
      },

      clearError: (): void => {
        set({ error: null });
      },
    }),
    { name: 'PlotGenerationStore' },
  ),
);
