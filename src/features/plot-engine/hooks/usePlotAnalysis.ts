/**
 * Plot Analysis Hook
 *
 * React hook for managing plot analysis state and operations
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { plotAnalysisService } from '@/features/plot-engine';
import type { AnalysisRequest, AnalysisResult } from '@/features/plot-engine';
import { logger } from '@/lib/logging/logger';
import { type Chapter } from '@/shared/types';

interface PlotAnalysisState {
  // Data
  analysisResult: AnalysisResult | null;
  lastAnalyzedProjectId: string | null;

  // UI State
  isLoading: boolean;
  isAnalyzing: boolean;
  error: string | null;

  // Analysis Configuration
  includeStoryArc: boolean;
  includePlotHoles: boolean;
  includeCharacterGraph: boolean;
  includePacing: boolean;

  // Actions
  analyze: (
    projectId: string,
    chapters: Chapter[],
    options?: Partial<AnalysisRequest>,
  ) => Promise<AnalysisResult | null>;
  analyzeStoryArc: (projectId: string, chapters: Chapter[]) => Promise<void>;
  analyzePlotHoles: (projectId: string, chapters: Chapter[]) => Promise<void>;
  analyzeAll: (
    projectId: string,
    chapters: Chapter[],
    options?: Partial<AnalysisRequest>,
  ) => Promise<void>;
  clearAnalysis: () => void;
  setError: (error: string | null) => void;
  setOptions: (options: Partial<AnalysisRequest>) => void;
}

export const usePlotAnalysis = create<PlotAnalysisState>()(
  devtools(
    set => ({
      // Initial State
      analysisResult: null,
      lastAnalyzedProjectId: null,
      isLoading: false,
      isAnalyzing: false,
      error: null,
      includeStoryArc: true,
      includePlotHoles: true,
      includeCharacterGraph: false,
      includePacing: true,

      // Analyze plot with specified options
      analyze: async (
        projectId: string,
        chapters: Chapter[],
        options?: Partial<AnalysisRequest>,
      ): Promise<AnalysisResult | null> => {
        try {
          set({ isAnalyzing: true, error: null });

          const request: AnalysisRequest = {
            projectId,
            includeStoryArc: options?.includeStoryArc ?? true,
            includePlotHoles: options?.includePlotHoles ?? true,
            includeCharacterGraph: options?.includeCharacterGraph ?? false,
            includePacing: options?.includePacing ?? true,
          };

          logger.info('Starting plot analysis', {
            projectId,
            chaptersCount: chapters.length,
            request,
          });

          const result = await plotAnalysisService.analyzeProject(projectId, chapters, request);

          set({
            analysisResult: result,
            lastAnalyzedProjectId: projectId,
            isAnalyzing: false,
          });

          logger.info('Plot analysis complete', { projectId });

          return result;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to analyze plot';
          logger.error('Plot analysis failed', { projectId, error });

          set({
            error: errorMessage,
            isAnalyzing: false,
          });

          return null;
        }
      },

      // Analyze story arc only
      analyzeStoryArc: async (projectId: string, chapters: Chapter[]): Promise<void> => {
        try {
          set({ isAnalyzing: true, error: null });

          const request: AnalysisRequest = {
            projectId,
            includeStoryArc: true,
            includePlotHoles: false,
            includeCharacterGraph: false,
            includePacing: true,
          };

          logger.info('Starting story arc analysis', { projectId, chaptersCount: chapters.length });

          const result = await plotAnalysisService.analyzeProject(projectId, chapters, request);

          set({
            analysisResult: {
              projectId,
              storyArc: result.storyArc,
              analyzedAt: result.analyzedAt,
            },
            lastAnalyzedProjectId: projectId,
            isAnalyzing: false,
          });

          logger.info('Story arc analysis complete', { projectId });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to analyze story arc';
          logger.error('Story arc analysis failed', { projectId, error });

          set({
            error: errorMessage,
            isAnalyzing: false,
          });
        }
      },

      // Analyze plot holes only
      analyzePlotHoles: async (projectId: string, chapters: Chapter[]): Promise<void> => {
        try {
          set({ isAnalyzing: true, error: null });

          const request: AnalysisRequest = {
            projectId,
            includeStoryArc: false,
            includePlotHoles: true,
            includeCharacterGraph: false,
            includePacing: false,
          };

          logger.info('Starting plot hole analysis', { projectId, chaptersCount: chapters.length });

          const result = await plotAnalysisService.analyzeProject(projectId, chapters, request);

          set({
            analysisResult: {
              projectId,
              plotHoleAnalysis: result.plotHoleAnalysis,
              analyzedAt: result.analyzedAt,
            },
            lastAnalyzedProjectId: projectId,
            isAnalyzing: false,
          });

          logger.info('Plot hole analysis complete', { projectId });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to analyze plot holes';
          logger.error('Plot hole analysis failed', { projectId, error });

          set({
            error: errorMessage,
            isAnalyzing: false,
          });
        }
      },

      // Analyze all aspects of plot
      analyzeAll: async (
        projectId: string,
        chapters: Chapter[],
        options?: Partial<AnalysisRequest>,
      ): Promise<void> => {
        try {
          set({ isAnalyzing: true, error: null });

          const request: AnalysisRequest = {
            projectId,
            includeStoryArc: options?.includeStoryArc ?? true,
            includePlotHoles: options?.includePlotHoles ?? true,
            includeCharacterGraph: options?.includeCharacterGraph ?? true,
            includePacing: options?.includePacing ?? true,
          };

          logger.info('Starting full plot analysis', {
            projectId,
            chaptersCount: chapters.length,
            request,
          });

          const result = await plotAnalysisService.analyzeProject(projectId, chapters, request);

          set({
            analysisResult: result,
            lastAnalyzedProjectId: projectId,
            isAnalyzing: false,
          });

          logger.info('Full plot analysis complete', { projectId });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to analyze plot';
          logger.error('Full plot analysis failed', { projectId, error });

          set({
            error: errorMessage,
            isAnalyzing: false,
          });
        }
      },

      // Clear analysis result
      clearAnalysis: (): void => {
        set({
          analysisResult: null,
          lastAnalyzedProjectId: null,
          error: null,
        });
      },

      // Set error message
      setError: (error: string | null): void => {
        set({ error });
      },

      // Set analysis options
      setOptions: (options: Partial<AnalysisRequest>): void => {
        set(state => ({
          includeStoryArc: options.includeStoryArc ?? state.includeStoryArc,
          includePlotHoles: options.includePlotHoles ?? state.includePlotHoles,
          includeCharacterGraph: options.includeCharacterGraph ?? state.includeCharacterGraph,
          includePacing: options.includePacing ?? state.includePacing,
        }));
      },
    }),
    { name: 'PlotAnalysisStore' },
  ),
);
