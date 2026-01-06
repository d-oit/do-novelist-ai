/**
 * Plot Generation Hook Tests
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { usePlotGeneration } from '@/features/plot-engine/hooks/usePlotGeneration';
import { plotGenerationService } from '@/features/plot-engine/services/plotGenerationService';
import type { PlotGenerationRequest } from '@/features/plot-engine/types';

vi.mock('@/features/plot-engine/services/plotGenerationService');
const mockPlotGenerationService = vi.mocked(plotGenerationService);

describe('usePlotGeneration', () => {
  const mockRequest: PlotGenerationRequest = {
    projectId: 'test-project',
    premise: 'A hero saves the world',
    genre: 'Fantasy',
    targetLength: 20,
    structure: '3-act',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    usePlotGeneration.setState({
      generatedPlot: null,
      suggestions: [],
      alternatives: [],
      confidence: 0,
      lastGeneratedAt: null,
      isLoading: false,
      isGeneratingAlternatives: false,
      isGeneratingSuggestions: false,
      error: null,
    });

    mockPlotGenerationService.generatePlot.mockResolvedValue({
      plotStructure: {
        id: 'plot-1',
        projectId: 'test-project',
        acts: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      suggestions: [],
      alternatives: [],
      confidence: 0.85,
      generatedAt: new Date(),
    });
  });

  describe('generatePlot', () => {
    it('generates plot successfully', async () => {
      const { result } = renderHook(() => usePlotGeneration());

      await act(async () => {
        await result.current.generatePlot(mockRequest);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.generatedPlot).not.toBeNull();
        expect(mockPlotGenerationService.generatePlot).toHaveBeenCalledWith(mockRequest);
      });
    });

    it('sets loading state during generation', async () => {
      const { result } = renderHook(() => usePlotGeneration());

      let resolveGeneration: ((value: any) => void) | undefined;
      mockPlotGenerationService.generatePlot.mockImplementation(
        () =>
          new Promise(resolve => {
            resolveGeneration = resolve;
          }),
      );

      act(() => {
        result.current.generatePlot(mockRequest);
      });

      expect(result.current.isLoading).toBe(true);

      if (resolveGeneration) {
        resolveGeneration(mockPlotGenerationService.generatePlot.mock.results[0]);
      }
    });

    it('handles plot generation errors', async () => {
      const errorMessage = 'Generation failed';
      mockPlotGenerationService.generatePlot.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => usePlotGeneration());

      await act(async () => {
        await result.current.generatePlot(mockRequest);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe(errorMessage);
      });
    });

    it('sets confidence on successful generation', async () => {
      const { result } = renderHook(() => usePlotGeneration());

      mockPlotGenerationService.generatePlot.mockResolvedValue({
        plotStructure: {
          id: 'plot-1',
          projectId: 'test-project',
          acts: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        suggestions: [],
        alternatives: [],
        confidence: 0.92,
        generatedAt: new Date(),
      });

      await act(async () => {
        await result.current.generatePlot(mockRequest);
      });

      await waitFor(() => {
        expect(result.current.confidence).toBe(0.92);
      });
    });

    it('sets last generated timestamp', async () => {
      const { result } = renderHook(() => usePlotGeneration());

      const generatedAt = new Date();
      mockPlotGenerationService.generatePlot.mockResolvedValue({
        plotStructure: {
          id: 'plot-1',
          projectId: 'test-project',
          acts: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        suggestions: [],
        alternatives: [],
        confidence: 0.85,
        generatedAt,
      });

      await act(async () => {
        await result.current.generatePlot(mockRequest);
      });

      await waitFor(() => {
        expect(result.current.lastGeneratedAt).toEqual(generatedAt);
      });
    });
  });

  describe('generateAlternatives', () => {
    it('generates alternatives successfully', async () => {
      const { result } = renderHook(() => usePlotGeneration());

      const mockAlternatives = [
        {
          id: 'alt-1',
          projectId: 'test-project',
          acts: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPlotGenerationService.generatePlot.mockResolvedValue({
        plotStructure: {
          id: 'plot-1',
          projectId: 'test-project',
          acts: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        suggestions: [],
        alternatives: mockAlternatives,
        confidence: 0.85,
        generatedAt: new Date(),
      });

      await act(async () => {
        await result.current.generateAlternatives(mockRequest);
      });

      await waitFor(() => {
        expect(result.current.isGeneratingAlternatives).toBe(false);
        expect(result.current.alternatives).toEqual(mockAlternatives);
        expect(mockPlotGenerationService.generatePlot).toHaveBeenCalledWith(mockRequest);
      });
    });

    it('sets correct loading state', async () => {
      const { result } = renderHook(() => usePlotGeneration());

      let resolveGeneration: ((value: any) => void) | undefined;
      mockPlotGenerationService.generatePlot.mockImplementation(
        () =>
          new Promise(resolve => {
            resolveGeneration = resolve;
          }),
      );

      act(() => {
        result.current.generateAlternatives(mockRequest);
      });

      expect(result.current.isGeneratingAlternatives).toBe(true);
      expect(result.current.isLoading).toBe(false);

      if (resolveGeneration) {
        resolveGeneration(mockPlotGenerationService.generatePlot.mock.results[0]);
      }
    });

    it('handles alternatives generation errors', async () => {
      const errorMessage = 'Alternatives generation failed';
      mockPlotGenerationService.generatePlot.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => usePlotGeneration());

      await act(async () => {
        await result.current.generateAlternatives(mockRequest);
      });

      await waitFor(() => {
        expect(result.current.isGeneratingAlternatives).toBe(false);
        expect(result.current.error).toBe(errorMessage);
      });
    });
  });

  describe('getSuggestions', () => {
    it('generates suggestions successfully', async () => {
      const { result } = renderHook(() => usePlotGeneration());

      const mockSuggestions = [
        {
          id: 'sug-1',
          type: 'plot_twist' as const,
          title: 'Twist',
          description: 'A twist',
          placement: 'middle' as const,
          impact: 'high' as const,
        },
      ];

      mockPlotGenerationService.generatePlot.mockResolvedValue({
        plotStructure: {
          id: 'plot-1',
          projectId: 'test-project',
          acts: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        suggestions: mockSuggestions,
        alternatives: [],
        confidence: 0.85,
        generatedAt: new Date(),
      });

      await act(async () => {
        await result.current.getSuggestions(mockRequest);
      });

      await waitFor(() => {
        expect(result.current.isGeneratingSuggestions).toBe(false);
        expect(result.current.suggestions).toEqual(mockSuggestions);
        expect(mockPlotGenerationService.generatePlot).toHaveBeenCalledWith(mockRequest);
      });
    });

    it('sets correct loading state', async () => {
      const { result } = renderHook(() => usePlotGeneration());

      let resolveGeneration: ((value: any) => void) | undefined;
      mockPlotGenerationService.generatePlot.mockImplementation(
        () =>
          new Promise(resolve => {
            resolveGeneration = resolve;
          }),
      );

      act(() => {
        result.current.getSuggestions(mockRequest);
      });

      expect(result.current.isGeneratingSuggestions).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isGeneratingAlternatives).toBe(false);

      if (resolveGeneration) {
        resolveGeneration(mockPlotGenerationService.generatePlot.mock.results[0]);
      }
    });

    it('handles suggestions generation errors', async () => {
      const errorMessage = 'Suggestions generation failed';
      mockPlotGenerationService.generatePlot.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => usePlotGeneration());

      await act(async () => {
        await result.current.getSuggestions(mockRequest);
      });

      await waitFor(() => {
        expect(result.current.isGeneratingSuggestions).toBe(false);
        expect(result.current.error).toBe(errorMessage);
      });
    });
  });

  describe('savePlot', () => {
    it('saves plot', () => {
      const { result } = renderHook(() => usePlotGeneration());

      const mockPlot = {
        id: 'plot-1',
        projectId: 'test-project',
        acts: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      act(() => {
        result.current.savePlot(mockPlot);
      });

      expect(result.current.generatedPlot).toEqual(mockPlot);
    });
  });

  describe('reset', () => {
    it('resets state', () => {
      const { result } = renderHook(() => usePlotGeneration());

      usePlotGeneration.setState({
        generatedPlot: { id: 'plot-1', projectId: 'test', acts: [], createdAt: new Date(), updatedAt: new Date() },
        suggestions: [
          { id: 'sug-1', type: 'plot_twist', title: 'Twist', description: 'desc', placement: 'early', impact: 'high' },
        ],
        alternatives: [],
        confidence: 0.5,
        lastGeneratedAt: new Date(),
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.generatedPlot).toBeNull();
      expect(result.current.suggestions).toEqual([]);
      expect(result.current.alternatives).toEqual([]);
      expect(result.current.confidence).toBe(0);
      expect(result.current.lastGeneratedAt).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  describe('clearError', () => {
    it('clears error', () => {
      const { result } = renderHook(() => usePlotGeneration());

      usePlotGeneration.setState({
        error: 'Some error',
      });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('state management', () => {
    it('initializes with default state', () => {
      const { result } = renderHook(() => usePlotGeneration());

      expect(result.current.generatedPlot).toBeNull();
      expect(result.current.suggestions).toEqual([]);
      expect(result.current.alternatives).toEqual([]);
      expect(result.current.confidence).toBe(0);
      expect(result.current.lastGeneratedAt).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isGeneratingAlternatives).toBe(false);
      expect(result.current.isGeneratingSuggestions).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });
});
