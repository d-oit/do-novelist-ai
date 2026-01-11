/**
 * Plot Analysis Hook Tests
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { usePlotAnalysis } from '@/features/plot-engine/hooks/usePlotAnalysis';
import { plotAnalysisService } from '@/features/plot-engine/services/plotAnalysisService';
import { ChapterStatus } from '@/shared/types';
import type { Chapter } from '@/shared/types';

vi.mock('@/features/plot-engine/services/plotAnalysisService');
const mockPlotAnalysisService = vi.mocked(plotAnalysisService);

const createMockChapter = (id: string, orderIndex: number): Chapter => ({
  id,
  projectId: 'test-project',
  orderIndex,
  title: `Chapter ${orderIndex}`,
  summary: 'Summary',
  content: 'Content',
  status: ChapterStatus.COMPLETE,
  wordCount: 1000,
  characterCount: 2,
  estimatedReadingTime: 5,
  tags: [],
  notes: '',
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('usePlotAnalysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    act(() => {
      usePlotAnalysis.setState({
        analysisResult: null,
        lastAnalyzedProjectId: null,
        isLoading: false,
        isAnalyzing: false,
        error: null,
        includeStoryArc: true,
        includePlotHoles: true,
        includeCharacterGraph: false,
        includePacing: true,
      });
    });

    mockPlotAnalysisService.analyzeProject.mockResolvedValue({
      projectId: 'test-project',
      analyzedAt: new Date(),
      storyArc: {
        structure: '3-act',
        pacing: {
          overall: 'moderate',
          score: 50,
          byChapter: [],
          recommendations: [],
        },
        tension: [],
        coherence: 0.8,
        recommendations: [],
      },
    });
  });

  describe('analyze', () => {
    it('analyzes project successfully', async () => {
      const { result } = renderHook(() => usePlotAnalysis());

      const chapters = [createMockChapter('chap-1', 1)];

      await act(async () => {
        await result.current.analyze('test-project', chapters);
      });

      await waitFor(() => {
        expect(result.current.isAnalyzing).toBe(false);
        expect(result.current.analysisResult).not.toBeNull();
        expect(mockPlotAnalysisService.analyzeProject).toHaveBeenCalledWith(
          'test-project',
          chapters,
          expect.objectContaining({
            includeStoryArc: true,
            includePacing: true,
          }),
        );
      });
    });

    it('analyzes project with custom options', async () => {
      const { result } = renderHook(() => usePlotAnalysis());

      const chapters = [createMockChapter('chap-1', 1)];

      await act(async () => {
        await result.current.analyze('test-project', chapters, {
          includeStoryArc: false,
          includeCharacterGraph: true,
          includePacing: false,
        });
      });

      await waitFor(() => {
        expect(mockPlotAnalysisService.analyzeProject).toHaveBeenCalledWith(
          'test-project',
          chapters,
          expect.objectContaining({
            includeStoryArc: false,
            includePlotHoles: true,
            includeCharacterGraph: true,
            includePacing: false,
          }),
        );
      });
    });

    it('handles analysis errors', async () => {
      const errorMessage = 'Analysis failed';
      mockPlotAnalysisService.analyzeProject.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => usePlotAnalysis());

      await act(async () => {
        await result.current.analyze('test-project', [createMockChapter('chap-1', 1)]);
      });

      await waitFor(() => {
        expect(result.current.isAnalyzing).toBe(false);
        expect(result.current.error).toBe(errorMessage);
      });
    });

    it('sets last analyzed project ID on success', async () => {
      const { result } = renderHook(() => usePlotAnalysis());

      await act(async () => {
        await result.current.analyze('test-project', [createMockChapter('chap-1', 1)]);
      });

      await waitFor(() => {
        expect(result.current.lastAnalyzedProjectId).toBe('test-project');
      });
    });

    it('sets isAnalyzing during analysis', async () => {
      const { result } = renderHook(() => usePlotAnalysis());

      let resolveAnalysis: ((value: any) => void) | undefined;
      mockPlotAnalysisService.analyzeProject.mockImplementation(
        () =>
          new Promise(resolve => {
            resolveAnalysis = resolve;
          }),
      );

      act(() => {
        result.current.analyze('test-project', [createMockChapter('chap-1', 1)]);
      });

      expect(result.current.isAnalyzing).toBe(true);

      // Resolve the promise inside act to prevent state update warnings
      await act(async () => {
        if (resolveAnalysis) {
          resolveAnalysis({
            projectId: 'test-project',
            analyzedAt: new Date(),
          });
        }
      });
    });
  });

  describe('analyzeStoryArc', () => {
    it('analyzes story arc successfully', async () => {
      const { result } = renderHook(() => usePlotAnalysis());

      await act(async () => {
        await result.current.analyzeStoryArc('test-project', [createMockChapter('chap-1', 1)]);
      });

      await waitFor(() => {
        expect(result.current.isAnalyzing).toBe(false);
        expect(result.current.analysisResult).not.toBeNull();
        expect(result.current.analysisResult?.storyArc).toBeDefined();
      });

      expect(mockPlotAnalysisService.analyzeProject).toHaveBeenCalledWith(
        'test-project',
        expect.arrayContaining([
          expect.objectContaining({
            id: 'chap-1',
            projectId: 'test-project',
          }),
        ]),
        expect.objectContaining({
          projectId: 'test-project',
          includeStoryArc: true,
          includePlotHoles: false,
          includeCharacterGraph: false,
          includePacing: true,
        }),
      );
    });

    it('handles story arc analysis errors', async () => {
      const errorMessage = 'Story arc analysis failed';
      mockPlotAnalysisService.analyzeProject.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => usePlotAnalysis());

      await act(async () => {
        await result.current.analyzeStoryArc('test-project', [createMockChapter('chap-1', 1)]);
      });

      await waitFor(() => {
        expect(result.current.isAnalyzing).toBe(false);
        expect(result.current.error).toBe(errorMessage);
      });
    });
  });

  describe('analyzePlotHoles', () => {
    it('analyzes plot holes successfully', async () => {
      const { result } = renderHook(() => usePlotAnalysis());

      mockPlotAnalysisService.analyzeProject.mockResolvedValue({
        projectId: 'test-project',
        analyzedAt: new Date(),
        plotHoleAnalysis: {
          projectId: 'test-project',
          analyzedAt: new Date(),
          plotHoles: [],
          overallScore: 90,
          summary: 'No major plot holes detected',
        },
      });

      await act(async () => {
        await result.current.analyzePlotHoles('test-project', [createMockChapter('chap-1', 1)]);
      });

      await waitFor(() => {
        expect(result.current.isAnalyzing).toBe(false);
        expect(result.current.analysisResult).not.toBeNull();
        expect(result.current.analysisResult?.plotHoleAnalysis).toBeDefined();
      });

      expect(mockPlotAnalysisService.analyzeProject).toHaveBeenCalledWith(
        'test-project',
        expect.arrayContaining([
          expect.objectContaining({
            id: 'chap-1',
            projectId: 'test-project',
          }),
        ]),
        expect.objectContaining({
          projectId: 'test-project',
          includeStoryArc: false,
          includePlotHoles: true,
          includeCharacterGraph: false,
          includePacing: false,
        }),
      );
    });

    it('handles plot hole analysis errors', async () => {
      const errorMessage = 'Plot hole analysis failed';
      mockPlotAnalysisService.analyzeProject.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => usePlotAnalysis());

      await act(async () => {
        await result.current.analyzePlotHoles('test-project', [createMockChapter('chap-1', 1)]);
      });

      await waitFor(() => {
        expect(result.current.isAnalyzing).toBe(false);
        expect(result.current.error).toBe(errorMessage);
      });
    });
  });

  describe('analyzeAll', () => {
    it('analyzes all aspects successfully', async () => {
      const { result } = renderHook(() => usePlotAnalysis());

      await act(async () => {
        await result.current.analyzeAll('test-project', [createMockChapter('chap-1', 1)]);
      });

      await waitFor(() => {
        expect(result.current.isAnalyzing).toBe(false);
        expect(result.current.analysisResult).not.toBeNull();
      });

      expect(mockPlotAnalysisService.analyzeProject).toHaveBeenCalledWith(
        'test-project',
        expect.arrayContaining([
          expect.objectContaining({
            id: 'chap-1',
            projectId: 'test-project',
          }),
        ]),
        expect.objectContaining({
          projectId: 'test-project',
          includeStoryArc: true,
          includePlotHoles: true,
          includeCharacterGraph: true,
          includePacing: true,
        }),
      );
    });

    it('analyzes all with custom options', async () => {
      const { result } = renderHook(() => usePlotAnalysis());

      await act(async () => {
        await result.current.analyzeAll('test-project', [createMockChapter('chap-1', 1)], {
          includeStoryArc: false,
          includePacing: false,
        });
      });

      await waitFor(() => {
        expect(result.current.analysisResult).not.toBeNull();
      });

      expect(mockPlotAnalysisService.analyzeProject).toHaveBeenCalledWith(
        'test-project',
        expect.arrayContaining([
          expect.objectContaining({
            id: 'chap-1',
            projectId: 'test-project',
          }),
        ]),
        expect.objectContaining({
          projectId: 'test-project',
          includeStoryArc: false,
          includePlotHoles: true,
          includeCharacterGraph: true,
          includePacing: false,
        }),
      );
    });

    it('handles full analysis errors', async () => {
      const errorMessage = 'Full analysis failed';
      mockPlotAnalysisService.analyzeProject.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => usePlotAnalysis());

      await act(async () => {
        await result.current.analyzeAll('test-project', [createMockChapter('chap-1', 1)]);
      });

      await waitFor(() => {
        expect(result.current.isAnalyzing).toBe(false);
        expect(result.current.error).toBe(errorMessage);
      });
    });
  });

  describe('clearAnalysis', () => {
    it('clears analysis result', () => {
      const { result } = renderHook(() => usePlotAnalysis());

      act(() => {
        usePlotAnalysis.setState({
          analysisResult: {
            projectId: 'test',
            analyzedAt: new Date(),
          },
        });
      });

      act(() => {
        result.current.clearAnalysis();
      });

      expect(result.current.analysisResult).toBeNull();
      expect(result.current.lastAnalyzedProjectId).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('clears error on clearAnalysis', () => {
      const { result } = renderHook(() => usePlotAnalysis());

      act(() => {
        usePlotAnalysis.setState({
          error: 'Some error',
        });
      });

      act(() => {
        result.current.clearAnalysis();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('setError', () => {
    it('sets error message', () => {
      const { result } = renderHook(() => usePlotAnalysis());

      act(() => {
        result.current.setError('Custom error');
      });

      expect(result.current.error).toBe('Custom error');
    });

    it('clears error with null', () => {
      const { result } = renderHook(() => usePlotAnalysis());

      act(() => {
        usePlotAnalysis.setState({
          error: 'Previous error',
        });
      });

      act(() => {
        result.current.setError(null);
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('setOptions', () => {
    it('sets analysis options', () => {
      const { result } = renderHook(() => usePlotAnalysis());

      act(() => {
        result.current.setOptions({
          includeStoryArc: false,
          includeCharacterGraph: true,
        });
      });

      expect(result.current.includeStoryArc).toBe(false);
      expect(result.current.includeCharacterGraph).toBe(true);
      expect(result.current.includePlotHoles).toBe(true);
      expect(result.current.includePacing).toBe(true);
    });

    it('sets all analysis options', () => {
      const { result } = renderHook(() => usePlotAnalysis());

      act(() => {
        result.current.setOptions({
          includeStoryArc: false,
          includePlotHoles: false,
          includeCharacterGraph: true,
          includePacing: false,
        });
      });

      expect(result.current.includeStoryArc).toBe(false);
      expect(result.current.includePlotHoles).toBe(false);
      expect(result.current.includeCharacterGraph).toBe(true);
      expect(result.current.includePacing).toBe(false);
    });

    it('keeps existing options when partial update', () => {
      const { result } = renderHook(() => usePlotAnalysis());

      act(() => {
        usePlotAnalysis.setState({
          includeStoryArc: false,
          includePlotHoles: false,
        });
      });

      act(() => {
        result.current.setOptions({
          includeCharacterGraph: true,
        });
      });

      expect(result.current.includeStoryArc).toBe(false);
      expect(result.current.includePlotHoles).toBe(false);
      expect(result.current.includeCharacterGraph).toBe(true);
    });
  });

  describe('state management', () => {
    it('initializes with default state', () => {
      const { result } = renderHook(() => usePlotAnalysis());

      expect(result.current.analysisResult).toBeNull();
      expect(result.current.lastAnalyzedProjectId).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAnalyzing).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.includeStoryArc).toBe(true);
      expect(result.current.includePlotHoles).toBe(true);
      expect(result.current.includeCharacterGraph).toBe(false);
      expect(result.current.includePacing).toBe(true);
    });
  });
});
