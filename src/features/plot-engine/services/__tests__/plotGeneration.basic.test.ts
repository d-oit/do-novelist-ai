/**
 * Basic Plot Generation Integration Tests
 *
 * Tests the fundamental functionality: happy path scenarios,
 * AI Gateway integration, and JSON parsing.
 */

import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';

import { plotGenerationService, type PlotGenerationRequest } from '@/features/plot-engine';
import { generateText } from '@/lib/api-gateway';

vi.mock('@/lib/api-gateway', () => ({
  generateText: vi.fn(),
}));

describe('Plot Generation - Basic Integration Tests', () => {
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
});
