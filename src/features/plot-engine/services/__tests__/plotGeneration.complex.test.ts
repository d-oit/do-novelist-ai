/**
 * Complex Scenario Integration Tests
 *
 * Tests retry mechanisms, complete workflows, and end-to-end scenarios
 * with mixed success/failure states.
 */

import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';

import { plotGenerationService, type PlotGenerationRequest } from '@/features/plot-engine';
import { generateText } from '@/lib/api-gateway';

vi.mock('@/lib/api-gateway', () => ({
  generateText: vi.fn(),
}));

describe('Plot Generation - Complex Scenario Integration Tests', () => {
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

  describe('Retry Mechanism Integration', () => {
    it('should retry on network timeout and succeed on second attempt', async () => {
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
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValueOnce(mockSuccessResponse)
        .mockResolvedValueOnce({ success: true, data: { text: '[]' } })
        .mockResolvedValueOnce({ success: true, data: { text: '[]' } });

      const promise = plotGenerationService.generatePlot(mockRequest);
      await vi.advanceTimersByTimeAsync(100);
      await promise;

      expect(vi.mocked(generateText)).toHaveBeenCalledTimes(4);
    }, 15000);

    it('should retry with exponential backoff on rate limit (429)', async () => {
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

      let callCount = 0;
      vi.mocked(generateText).mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Rate limit exceeded (429)');
        }
        return mockSuccessResponse;
      });

      vi.mocked(generateText)
        .mockRejectedValueOnce(new Error('Rate limit exceeded (429)'))
        .mockResolvedValueOnce(mockSuccessResponse)
        .mockResolvedValueOnce({ success: true, data: { text: '[]' } })
        .mockResolvedValueOnce({ success: true, data: { text: '[]' } });

      const promise = plotGenerationService.generatePlot(mockRequest);
      await vi.advanceTimersByTimeAsync(100);

      const result = await promise;

      expect(result.plotStructure.acts).toHaveLength(1);
      expect(vi.mocked(generateText)).toHaveBeenCalledTimes(4);
    });

    it('should retry on server error (500) and succeed', async () => {
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
        .mockRejectedValueOnce(new Error('Internal server error (500)'))
        .mockResolvedValueOnce(mockSuccessResponse)
        .mockResolvedValueOnce({ success: true, data: { text: '[]' } })
        .mockResolvedValueOnce({ success: true, data: { text: '[]' } });

      const promise = plotGenerationService.generatePlot(mockRequest);
      await vi.advanceTimersByTimeAsync(100);
      await promise;

      expect(vi.mocked(generateText)).toHaveBeenCalledTimes(4);
    }, 15000);

    it('should exhaust all retries and fall back to template', async () => {
      vi.mocked(generateText).mockRejectedValue(new Error('Permanent failure'));

      const result = await plotGenerationService.generatePlot(mockRequest);

      expect(result).toBeDefined();
      expect(result.plotStructure).toBeDefined();
      expect(result.plotStructure.acts.length).toBeGreaterThan(0);
      expect(result.plotStructure.acts[0]?.plotPoints.length).toBeGreaterThan(0);
    });
  });

  describe('Complete Failure Scenario Integration', () => {
    it('should fall back to template when all AI Gateway calls fail', async () => {
      vi.mocked(generateText).mockRejectedValue(new Error('AI Gateway unavailable'));

      const result = await plotGenerationService.generatePlot(mockRequest);

      expect(result).toBeDefined();
      expect(result.plotStructure).toBeDefined();
      expect(result.plotStructure.acts).toHaveLength(3);
      expect(result.plotStructure.acts[0]?.name).toBe('Setup');
      expect(result.plotStructure.acts[1]?.name).toBe('Confrontation');
      expect(result.plotStructure.acts[2]?.name).toBe('Resolution');
      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.alternatives).toBeDefined();
    });

    it('should provide meaningful template plot with all required fields', async () => {
      vi.mocked(generateText).mockRejectedValue(new Error('AI Gateway unavailable'));

      const result = await plotGenerationService.generatePlot(mockRequest);

      expect(result.plotStructure.id).toBeDefined();
      expect(result.plotStructure.projectId).toBe(mockRequest.projectId);
      expect(result.plotStructure.climax).toBeDefined();
      expect(result.plotStructure.resolution).toBeDefined();
      expect(result.plotStructure.createdAt).toBeInstanceOf(Date);
      expect(result.plotStructure.updatedAt).toBeInstanceOf(Date);

      for (const act of result.plotStructure.acts) {
        expect(act.id).toBeDefined();
        expect(act.actNumber).toBeDefined();
        expect(act.name).toBeDefined();
        expect(act.plotPoints.length).toBeGreaterThan(0);
        expect(act.duration).toBeGreaterThan(0);
      }

      for (const act of result.plotStructure.acts) {
        for (const pp of act.plotPoints) {
          expect(pp.id).toBeDefined();
          expect(pp.type).toBeDefined();
          expect(pp.title).toBeDefined();
          expect(pp.description).toBeDefined();
          expect(pp.importance).toBeDefined();
        }
      }
    });

    it('should generate template with correct duration distribution', async () => {
      vi.mocked(generateText).mockRejectedValue(new Error('AI Gateway unavailable'));

      const result = await plotGenerationService.generatePlot(mockRequest);

      const totalDuration = result.plotStructure.acts.reduce((sum, act) => sum + (act.duration || 0), 0);
      expect(totalDuration).toBeCloseTo(mockRequest.targetLength || 20, 0);
    });
  });

  describe('End-to-End Integration Scenarios', () => {
    it('should handle complete workflow with mixed success and failure', async () => {
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
              {
                actNumber: 2,
                name: 'Confrontation',
                description: 'Rising action',
                plotPoints: [
                  {
                    type: 'climax',
                    title: 'Climax',
                    description: 'The big moment',
                    importance: 'major',
                    position: 50,
                  },
                ],
              },
              {
                actNumber: 3,
                name: 'Resolution',
                description: 'Ending',
                plotPoints: [
                  {
                    type: 'resolution',
                    title: 'Resolution',
                    description: 'Conclusion',
                    importance: 'major',
                    position: 90,
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

      const mockAlternativesResponse = {
        success: true,
        data: {
          text: JSON.stringify({
            acts: [
              {
                actNumber: 1,
                name: 'Act 1 Alt',
                plotPoints: [
                  {
                    type: 'inciting_incident',
                    title: 'Alt Call',
                    description: 'Alternative call',
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
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValueOnce(mockPlotResponse)
        .mockRejectedValueOnce(new Error('Rate limit'))
        .mockResolvedValueOnce(mockSuggestionsResponse)
        .mockResolvedValueOnce(mockAlternativesResponse);

      const promise = plotGenerationService.generatePlot(mockRequest);
      await vi.advanceTimersByTimeAsync(200);
      const result = await promise;

      expect(result).toBeDefined();
      expect(result.plotStructure.acts).toHaveLength(3);
      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.alternatives).toBeDefined();
    }, 15000);

    it('should handle concurrent requests independently', async () => {
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

      const request1: PlotGenerationRequest = {
        projectId: 'p1',
        premise: 'Story 1',
        genre: 'fantasy',
      };

      const request2: PlotGenerationRequest = {
        projectId: 'p2',
        premise: 'Story 2',
        genre: 'scifi',
      };

      const [result1, result2] = await Promise.all([
        plotGenerationService.generatePlot(request1),
        plotGenerationService.generatePlot(request2),
      ]);

      expect(result1.plotStructure.projectId).toBe('p1');
      expect(result2.plotStructure.projectId).toBe('p2');
    });
  });
});
