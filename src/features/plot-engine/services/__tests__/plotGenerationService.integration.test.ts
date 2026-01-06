/**
 * Integration Tests for PlotGenerationService + AI Gateway
 *
 * Tests the actual integration between PlotGenerationService and AI Gateway,
 * including retry logic, error handling, model selection, and fallback mechanisms.
 */

import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';

import { plotGenerationService, type PlotGenerationRequest } from '@/features/plot-engine';
import { generateText } from '@/lib/api-gateway';

vi.mock('@/lib/api-gateway', () => ({
  generateText: vi.fn(),
}));

describe('PlotGenerationService Integration Tests', () => {
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

  describe('Happy Path Integration', () => {
    it('should successfully generate plot structure with AI Gateway', async () => {
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

      vi.mocked(generateText).mockResolvedValue(mockResponse);

      const result = await plotGenerationService.generatePlot(mockRequest);

      expect(result).toBeDefined();
      expect(result.plotStructure).toBeDefined();
      expect(result.plotStructure.acts).toHaveLength(3);
      expect(result.suggestions).toBeDefined();
      expect(result.alternatives).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.generatedAt).toBeInstanceOf(Date);

      expect(vi.mocked(generateText)).toHaveBeenCalledTimes(3);
    });

    it('should call AI Gateway with correct parameters for plot generation', async () => {
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

      await plotGenerationService.generatePlot(mockRequest);

      expect(vi.mocked(generateText)).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'anthropic',
          model: 'claude-3-5-sonnet-20241022',
          temperature: 0.8,
          prompt: expect.stringContaining(mockRequest.premise),
          system: expect.stringContaining('3-act structure'),
        }),
      );
    });

    it('should parse AI Gateway response correctly and return structured plot', async () => {
      const mockResponse = {
        success: true,
        data: {
          text: JSON.stringify({
            acts: [
              {
                actNumber: 1,
                name: 'Act One',
                description: 'First act',
                plotPoints: [
                  {
                    type: 'inciting_incident',
                    title: 'The Call',
                    description: 'Hero receives a call',
                    importance: 'major',
                    position: 15,
                  },
                  {
                    type: 'turning_point',
                    title: 'Crossing',
                    description: 'Hero commits',
                    importance: 'major',
                    position: 25,
                  },
                ],
              },
              {
                actNumber: 2,
                name: 'Act Two',
                description: 'Second act',
                plotPoints: [
                  {
                    type: 'climax',
                    title: 'Climax',
                    description: 'The peak',
                    importance: 'major',
                    position: 50,
                  },
                ],
              },
              {
                actNumber: 3,
                name: 'Act Three',
                description: 'Third act',
                plotPoints: [
                  {
                    type: 'resolution',
                    title: 'Resolution',
                    description: 'The end',
                    importance: 'major',
                    position: 90,
                  },
                ],
              },
            ],
          }),
        },
      };

      vi.mocked(generateText)
        .mockResolvedValueOnce(mockResponse)
        .mockResolvedValueOnce({ success: true, data: { text: '[]' } })
        .mockResolvedValueOnce({ success: true, data: { text: '[]' } });

      const result = await plotGenerationService.generatePlot(mockRequest);

      expect(result.plotStructure.acts).toHaveLength(3);
      expect(result.plotStructure.acts[0]?.actNumber).toBe(1);
      expect(result.plotStructure.acts[0]?.name).toBe('Act One');
      expect(result.plotStructure.acts[0]?.plotPoints).toHaveLength(2);
      expect(result.plotStructure.acts[0]?.plotPoints[0]?.title).toBe('The Call');
      expect(result.plotStructure.climax?.type).toBe('climax');
      expect(result.plotStructure.resolution?.type).toBe('resolution');
    });
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

  describe('JSON Parsing Integration', () => {
    it('should parse valid JSON response with markdown code blocks', async () => {
      const mockResponse = {
        success: true,
        data: {
          text: `Here's the plot structure:

\`\`\`json
{
  "acts": [
    {
      "actNumber": 1,
      "name": "Setup",
      "description": "Introduction",
      "plotPoints": [
        {
          "type": "inciting_incident",
          "title": "Inciting Incident",
          "description": "Something happens",
          "importance": "major",
          "position": 10
        }
      ]
    }
  ]
}
\`\`\``,
        },
      };

      vi.mocked(generateText).mockResolvedValue(mockResponse);

      const result = await plotGenerationService.generatePlot(mockRequest);

      expect(result.plotStructure.acts).toHaveLength(1);
      expect(result.plotStructure.acts[0]?.name).toBe('Setup');
      expect(result.plotStructure.acts[0]?.plotPoints).toHaveLength(1);
    });

    it('should parse valid JSON response without code blocks', async () => {
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

      const result = await plotGenerationService.generatePlot(mockRequest);

      expect(result.plotStructure.acts).toHaveLength(1);
    });

    it('should handle incomplete JSON with partial structure', async () => {
      const mockResponse = {
        success: true,
        data: {
          text: JSON.stringify({
            acts: [
              {
                actNumber: 1,
                plotPoints: [
                  {
                    type: 'inciting_incident',
                    title: 'Inciting Incident',
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

      const result = await plotGenerationService.generatePlot(mockRequest);

      expect(result.plotStructure.acts).toHaveLength(1);
      expect(result.plotStructure.acts[0]?.name).toBe('Act 1');
      expect(result.plotStructure.acts[0]?.description).toBeUndefined();
    });

    it('should handle JSON with missing optional fields', async () => {
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
                  },
                ],
              },
            ],
          }),
        },
      };

      vi.mocked(generateText).mockResolvedValue(mockResponse);

      const result = await plotGenerationService.generatePlot(mockRequest);

      expect(result.plotStructure.acts).toHaveLength(1);
      expect(result.plotStructure.acts[0]?.plotPoints[0]?.importance).toBe('major');
      expect(result.plotStructure.acts[0]?.plotPoints[0]?.position).toBeDefined();
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
