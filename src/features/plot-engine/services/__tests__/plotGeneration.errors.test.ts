/**
 * Error Handling and Model Selection Integration Tests
 *
 * Tests error scenarios, fallback mechanisms, model selection logic,
 * and malformed response handling.
 */

import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';

import { plotGenerationService, type PlotGenerationRequest } from '@/features/plot-engine';
import { generateText } from '@/lib/api-gateway';

vi.mock('@/lib/api-gateway', () => ({
  generateText: vi.fn(),
}));

describe('Plot Generation - Error Handling Integration Tests', () => {
  let mockRequest: PlotGenerationRequest;

  beforeEach(() => {
    mockRequest = {
      projectId: 'test-project-123',
      premise: 'A young hero must save their village from an ancient evil',
      genre: 'fantasy',
      targetLength: 20,
      characters: ['char-1', 'char-2'],
    };

    vi.mocked(generateText).mockReset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Error Scenario Integration', () => {
    it('should handle AI Gateway success=false responses with fallback', async () => {
      const mockErrorResponse = {
        success: false,
        error: 'Rate limit exceeded',
        details: 'Too many requests',
      };

      vi.mocked(generateText).mockResolvedValue(mockErrorResponse);

      const result = await plotGenerationService.generatePlot(mockRequest);

      expect(result).toBeDefined();
      expect(result.plotStructure).toBeDefined();
      expect(result.plotStructure.acts.length).toBeGreaterThan(0);
      expect(result.plotStructure.acts[0]?.name).toBe('Setup');
    });

    it('should handle malformed AI response with template fallback', async () => {
      const mockMalformedResponse = {
        success: true,
        data: {
          text: 'This is not valid JSON {{{',
        },
      };

      vi.mocked(generateText).mockResolvedValue(mockMalformedResponse);

      const result = await plotGenerationService.generatePlot(mockRequest);

      expect(result).toBeDefined();
      expect(result.plotStructure).toBeDefined();
      expect(result.plotStructure.acts.length).toBeGreaterThan(0);
      expect(result.plotStructure.acts[0]?.plotPoints.length).toBeGreaterThan(0);
    });

    it('should handle empty or partial JSON responses', async () => {
      const mockPartialResponse = {
        success: true,
        data: {
          text: '{}',
        },
      };

      vi.mocked(generateText).mockResolvedValue(mockPartialResponse);

      const result = await plotGenerationService.generatePlot(mockRequest);

      expect(result).toBeDefined();
      expect(result.plotStructure).toBeDefined();
      expect(result.plotStructure.acts.length).toBeGreaterThan(0);
    });

    it('should handle timeout errors with retry', async () => {
      const mockSuccessResponse = {
        success: true,
        data: {
          text: JSON.stringify({
            acts: [
              {
                actNumber: 1,
                name: 'Setup',
                description: 'Introduction',
                plotPoints: [
                  {
                    type: 'inciting_incident',
                    title: 'Inciting Incident',
                    description: 'Something happens',
                    importance: 'major',
                    position: 10,
                  },
                ],
              },
            ],
          }),
        },
      };

      vi.mocked(generateText)
        .mockRejectedValueOnce(new Error('Request timeout'))
        .mockResolvedValueOnce(mockSuccessResponse)
        .mockResolvedValueOnce({ success: true, data: { text: '[]' } })
        .mockResolvedValueOnce({ success: true, data: { text: '[]' } });

      const promise = plotGenerationService.generatePlot(mockRequest);
      await vi.advanceTimersByTimeAsync(100);

      const result = await promise;

      expect(result.plotStructure.acts).toHaveLength(1);
    });
  });

  describe('Model Selection Integration', () => {
    it('should select fast model for simple requests', async () => {
      const mockResponse = {
        success: true,
        data: {
          text: JSON.stringify({
            acts: [
              {
                actNumber: 1,
                name: 'Setup',
                description: 'Introduction',
                plotPoints: [
                  {
                    type: 'inciting_incident',
                    title: 'Inciting Incident',
                    description: 'Something happens',
                    importance: 'major',
                    position: 10,
                  },
                ],
              },
            ],
          }),
        },
      };

      vi.mocked(generateText).mockResolvedValue(mockResponse);

      const simpleRequest: PlotGenerationRequest = {
        projectId: 'p1',
        premise: 'Simple story',
        genre: 'fantasy',
        structure: '3-act',
      };

      await plotGenerationService.generatePlot(simpleRequest);

      expect(vi.mocked(generateText)).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-3-5-sonnet-20241022',
        }),
      );
    });

    it('should select advanced model for complex requests', async () => {
      const mockResponse = {
        success: true,
        data: {
          text: JSON.stringify({
            acts: [
              {
                actNumber: 1,
                name: 'Setup',
                description: 'Introduction',
                plotPoints: [
                  {
                    type: 'inciting_incident',
                    title: 'Inciting Incident',
                    description: 'Something happens',
                    importance: 'major',
                    position: 10,
                  },
                ],
              },
            ],
          }),
        },
      };

      vi.mocked(generateText).mockResolvedValue(mockResponse);

      const complexRequest: PlotGenerationRequest = {
        projectId: 'p1',
        premise: 'Complex epic story',
        genre: 'fantasy',
        structure: 'hero-journey',
        targetLength: 50,
        characters: ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'],
        themes: ['redemption', 'sacrifice', 'love'],
        plotPoints: ['plot1', 'plot2', 'plot3', 'plot4', 'plot5'],
      };

      await plotGenerationService.generatePlot(complexRequest);

      expect(vi.mocked(generateText)).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-3-5-sonnet-20241022',
        }),
      );
    });

    it('should use appropriate model for suggestions', async () => {
      const mockPlotResponse = {
        success: true,
        data: {
          text: JSON.stringify({
            acts: [
              {
                actNumber: 1,
                name: 'Setup',
                description: 'Introduction',
                plotPoints: [
                  {
                    type: 'inciting_incident',
                    title: 'Inciting Incident',
                    description: 'Something happens',
                    importance: 'major',
                    position: 10,
                  },
                ],
              },
            ],
          }),
        },
      };

      const mockSuggestionsResponse = {
        success: true,
        data: {
          text: JSON.stringify([
            {
              type: 'plot_twist',
              title: 'Betrayal',
              description: 'A trusted ally betrays hero',
              placement: 'middle',
              impact: 'high',
            },
          ]),
        },
      };

      vi.mocked(generateText)
        .mockResolvedValueOnce(mockPlotResponse)
        .mockResolvedValueOnce(mockSuggestionsResponse)
        .mockResolvedValueOnce({ success: true, data: { text: '[]' } });

      await plotGenerationService.generatePlot(mockRequest);

      expect(vi.mocked(generateText)).toHaveBeenCalledTimes(3);
      expect(vi.mocked(generateText)).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          provider: 'anthropic',
          model: 'claude-3-5-haiku-20241022',
          temperature: 0.9,
        }),
      );
    });
  });
});
