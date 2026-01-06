import { describe, it, expect, beforeEach, vi } from 'vitest';

import { plotGenerationService, type PlotGenerationRequest } from '@/features/plot-engine';
import { generateText } from '@/lib/api-gateway';

vi.mock('@/lib/api-gateway', () => ({
  generateText: vi.fn(),
}));

const defaultMockResponse = {
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

describe('PlotGenerationService', () => {
  let mockRequest: PlotGenerationRequest;

  beforeEach(() => {
    mockRequest = {
      projectId: 'p1',
      premise: 'A young hero must save their village from an ancient evil',
      genre: 'fantasy',
      targetLength: 20,
      characters: ['char-1', 'char-2'],
    };

    vi.mocked(generateText).mockReset();
  });

  describe('generatePlot', () => {
    beforeEach(() => {
      vi.mocked(generateText).mockResolvedValue(defaultMockResponse);
    });

    it('should generate plot structure successfully', async () => {
      const result = await plotGenerationService.generatePlot(mockRequest);

      expect(result).toBeDefined();
      expect(result.plotStructure).toBeDefined();
      expect(result.suggestions).toBeDefined();
      expect(result.alternatives).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.generatedAt).toBeInstanceOf(Date);
    });

    it('should generate 3-act structure by default', async () => {
      const result = await plotGenerationService.generatePlot(mockRequest);

      expect(result.plotStructure.acts).toHaveLength(3);
      expect(result.plotStructure.acts[0]?.actNumber).toBe(1);
      expect(result.plotStructure.acts[1]?.actNumber).toBe(2);
      expect(result.plotStructure.acts[2]?.actNumber).toBe(3);
    });

    it('should generate 5-act structure when requested', async () => {
      const fiveActResponse = {
        success: true,
        data: {
          text: JSON.stringify({
            acts: [
              {
                actNumber: 1,
                name: 'Act 1',
                description: 'D1',
                plotPoints: [
                  { type: 'inciting_incident', title: 'P1', description: 'D', importance: 'major', position: 10 },
                ],
              },
              {
                actNumber: 2,
                name: 'Act 2',
                description: 'D2',
                plotPoints: [
                  { type: 'rising_action', title: 'P2', description: 'D', importance: 'major', position: 25 },
                ],
              },
              {
                actNumber: 3,
                name: 'Act 3',
                description: 'D3',
                plotPoints: [{ type: 'climax', title: 'P3', description: 'D', importance: 'major', position: 50 }],
              },
              {
                actNumber: 4,
                name: 'Act 4',
                description: 'D4',
                plotPoints: [
                  { type: 'falling_action', title: 'P4', description: 'D', importance: 'major', position: 75 },
                ],
              },
              {
                actNumber: 5,
                name: 'Act 5',
                description: 'D5',
                plotPoints: [{ type: 'resolution', title: 'P5', description: 'D', importance: 'major', position: 90 }],
              },
            ],
          }),
        },
      };

      vi.mocked(generateText).mockResolvedValue(fiveActResponse);

      const request: PlotGenerationRequest = {
        ...mockRequest,
        structure: '5-act',
      };

      const result = await plotGenerationService.generatePlot(request);

      expect(result.plotStructure.acts).toHaveLength(5);
    });

    it('should generate hero journey structure when requested', async () => {
      const heroJourneyResponse = {
        success: true,
        data: {
          text: JSON.stringify({
            acts: [
              {
                actNumber: 1,
                name: 'Departure',
                description: 'The journey begins',
                plotPoints: [
                  { type: 'inciting_incident', title: 'Call', description: 'D', importance: 'major', position: 10 },
                ],
              },
              {
                actNumber: 2,
                name: 'Initiation',
                description: 'Tests and trials',
                plotPoints: [{ type: 'climax', title: 'Ordeal', description: 'D', importance: 'major', position: 50 }],
              },
              {
                actNumber: 3,
                name: 'Return',
                description: 'Home transformed',
                plotPoints: [
                  { type: 'resolution', title: 'Elixir', description: 'D', importance: 'major', position: 90 },
                ],
              },
            ],
          }),
        },
      };

      vi.mocked(generateText).mockResolvedValue(heroJourneyResponse);

      const request: PlotGenerationRequest = {
        ...mockRequest,
        structure: 'hero-journey',
      };

      const result = await plotGenerationService.generatePlot(request);

      expect(result.plotStructure.acts).toHaveLength(3);
      expect(result.plotStructure.acts[0]?.name).toBe('Departure');
      expect(result.plotStructure.acts[1]?.name).toBe('Initiation');
      expect(result.plotStructure.acts[2]?.name).toBe('Return');
    });

    it('should include plot points in each act', async () => {
      const result = await plotGenerationService.generatePlot(mockRequest);

      for (const act of result.plotStructure.acts) {
        expect(act.plotPoints.length).toBeGreaterThan(0);
      }
    });

    it('should identify climax in plot structure', async () => {
      const result = await plotGenerationService.generatePlot(mockRequest);

      expect(result.plotStructure.climax).toBeDefined();
      expect(result.plotStructure.climax?.type).toBe('climax');
    });

    it('should identify resolution in plot structure', async () => {
      const result = await plotGenerationService.generatePlot(mockRequest);

      expect(result.plotStructure.resolution).toBeDefined();
      expect(result.plotStructure.resolution?.type).toBe('resolution');
    });

    it('should generate plot suggestions', async () => {
      const result = await plotGenerationService.generatePlot(mockRequest);

      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions[0]).toHaveProperty('id');
      expect(result.suggestions[0]).toHaveProperty('type');
      expect(result.suggestions[0]).toHaveProperty('title');
      expect(result.suggestions[0]).toHaveProperty('description');
    });

    it('should generate genre-specific suggestions for romance', async () => {
      const romanceSuggestionsResponse = {
        success: true,
        data: {
          text: JSON.stringify([
            { type: 'subplot', title: 'Romantic Subplot', description: 'D', placement: 'early', impact: 'medium' },
          ]),
        },
      };

      vi.mocked(generateText)
        .mockResolvedValueOnce(defaultMockResponse)
        .mockResolvedValueOnce(romanceSuggestionsResponse)
        .mockResolvedValueOnce({ success: true, data: { text: '[]' } });

      const request: PlotGenerationRequest = {
        ...mockRequest,
        genre: 'romance',
      };

      const result = await plotGenerationService.generatePlot(request);

      const hasRomanceSuggestion = result.suggestions.some(
        s => s.type === 'subplot' && s.title.toLowerCase().includes('romantic'),
      );
      expect(hasRomanceSuggestion).toBe(true);
    });

    it('should generate alternative plot structures', async () => {
      const result = await plotGenerationService.generatePlot(mockRequest);

      expect(result.alternatives.length).toBeGreaterThan(0);
      expect(result.alternatives[0]?.acts).toBeDefined();
    });

    it('should distribute chapters across acts appropriately', async () => {
      const result = await plotGenerationService.generatePlot(mockRequest);

      const totalDuration = result.plotStructure.acts.reduce((sum, act) => sum + (act.duration || 0), 0);
      expect(totalDuration).toBeCloseTo(mockRequest.targetLength || 20, 0);
    });

    it('should include character IDs in plot points', async () => {
      const result = await plotGenerationService.generatePlot(mockRequest);

      const allPlotPoints = result.plotStructure.acts.flatMap(act => act.plotPoints);
      const hasCharacters = allPlotPoints.some(pp => pp.characterIds.length > 0);
      expect(hasCharacters).toBe(true);
    });

    it('should handle missing target length with default', async () => {
      const request: PlotGenerationRequest = {
        projectId: 'p1',
        premise: 'Test premise',
        genre: 'fantasy',
      };

      const result = await plotGenerationService.generatePlot(request);

      expect(result.plotStructure.acts).toBeDefined();
      const totalDuration = result.plotStructure.acts.reduce((sum, act) => sum + (act.duration || 0), 0);
      expect(totalDuration).toBeGreaterThan(0);
    });

    it('should create plot points with proper positioning', async () => {
      const result = await plotGenerationService.generatePlot(mockRequest);

      const allPlotPoints = result.plotStructure.acts.flatMap(act => act.plotPoints);

      const positions = allPlotPoints.filter(pp => pp.position !== undefined).map(pp => pp.position) as number[];

      for (let i = 1; i < positions.length; i++) {
        const prev = positions[i - 1] ?? 0;
        const curr = positions[i] ?? 0;
        expect(curr).toBeGreaterThanOrEqual(prev);
      }
    });
  });

  describe('AI Integration', () => {
    it('should call AI Gateway for plot generation', async () => {
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

      vi.mocked(generateText).mockResolvedValueOnce(mockResponse);
      vi.mocked(generateText).mockResolvedValueOnce({
        success: true,
        data: { text: '[]' },
      });

      await plotGenerationService.generatePlot(mockRequest);

      expect(vi.mocked(generateText)).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'anthropic',
          model: 'claude-3-5-sonnet-20241022',
          temperature: 0.8,
        }),
      );
    });

    it('should parse AI response correctly', async () => {
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

      vi.mocked(generateText).mockResolvedValueOnce(mockResponse);
      vi.mocked(generateText).mockResolvedValueOnce({
        success: true,
        data: { text: '[]' },
      });
      vi.mocked(generateText).mockResolvedValueOnce({
        success: true,
        data: {
          text: JSON.stringify({
            acts: [
              {
                actNumber: 1,
                name: 'Act One Alt',
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
      });

      const result = await plotGenerationService.generatePlot(mockRequest);

      expect(result.plotStructure.acts).toHaveLength(3);
      expect(result.plotStructure.acts[0]?.actNumber).toBe(1);
      expect(result.plotStructure.acts[0]?.name).toBe('Act One');
      expect(result.plotStructure.acts[0]?.plotPoints).toHaveLength(2);
      expect(result.plotStructure.acts[0]?.plotPoints[0]?.title).toBe('The Call');
    });

    it('should handle AI Gateway errors gracefully', async () => {
      const mockResponse = {
        success: false,
        error: 'Rate limit exceeded',
        details: 'Too many requests',
      };

      vi.mocked(generateText).mockResolvedValueOnce(mockResponse);

      const result = await plotGenerationService.generatePlot(mockRequest);

      expect(result).toBeDefined();
      expect(result.plotStructure).toBeDefined();
      expect(result.plotStructure.acts.length).toBeGreaterThan(0);
    });

    it('should handle malformed AI response with template fallback', async () => {
      const mockResponse = {
        success: true,
        data: {
          text: 'This is not valid JSON',
        },
      };

      vi.mocked(generateText).mockResolvedValueOnce(mockResponse);

      const result = await plotGenerationService.generatePlot(mockRequest);

      expect(result).toBeDefined();
      expect(result.plotStructure).toBeDefined();
      expect(result.plotStructure.acts.length).toBeGreaterThan(0);
      expect(result.plotStructure.acts[0]?.plotPoints.length).toBeGreaterThan(0);
    });

    it('should call AI Gateway for suggestions', async () => {
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

      vi.mocked(generateText).mockResolvedValueOnce(mockPlotResponse);
      vi.mocked(generateText).mockResolvedValueOnce(mockSuggestionsResponse);
      vi.mocked(generateText).mockResolvedValueOnce({
        success: true,
        data: { text: '[]' },
      });

      const result = await plotGenerationService.generatePlot(mockRequest);

      expect(vi.mocked(generateText)).toHaveBeenCalledTimes(3);
      expect(result.suggestions).toHaveLength(1);
      expect(result.suggestions[0]?.title).toBe('Betrayal');
    });

    it('should use default suggestions when AI fails', async () => {
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
          text: 'Invalid JSON {{{',
        },
      };

      vi.mocked(generateText).mockResolvedValueOnce(mockPlotResponse);
      vi.mocked(generateText).mockResolvedValueOnce(mockSuggestionsResponse);
      vi.mocked(generateText).mockResolvedValueOnce({
        success: true,
        data: { text: '[]' },
      });

      const result = await plotGenerationService.generatePlot(mockRequest);

      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions[0]).toHaveProperty('id');
      expect(result.suggestions[0]).toHaveProperty('type');
    });
  });

  describe('Context-Aware Suggestions', () => {
    beforeEach(() => {
      vi.mocked(generateText).mockReset();
      vi.mocked(generateText).mockResolvedValue({
        success: true,
        data: {
          text: JSON.stringify([
            {
              type: 'character_arc',
              title: 'Heroic Journey',
              description: 'Protagonist learns courage',
              placement: 'middle',
              impact: 'high',
              relatedCharacters: ['Aria'],
            },
          ]),
        },
      });
    });

    it('should retrieve context when generating suggestions', async () => {
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

      vi.mocked(generateText).mockResolvedValueOnce(mockPlotResponse);

      const result = await plotGenerationService.generatePlot(mockRequest);

      expect(result).toBeDefined();
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should generate context-aware suggestions for projects with existing characters', async () => {
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

      const contextAwareResponse = {
        success: true,
        data: {
          text: JSON.stringify([
            {
              type: 'character_arc',
              title: "Develop Aria's inner strength",
              description:
                'Show Aria discovering her hidden power during a moment of crisis, building on her established fear of failure',
              placement: 'middle',
              impact: 'high',
              relatedCharacters: ['Aria'],
              prerequisites: ["Establish Aria's fear of failure in early chapters"],
            },
            {
              type: 'subplot',
              title: "Aria and Kael's growing bond",
              description:
                'Deepen the relationship between Aria and Kael through shared adversity, revealing their complementary strengths',
              placement: 'early',
              impact: 'medium',
              relatedCharacters: ['Aria', 'Kael'],
            },
          ]),
        },
      };

      vi.mocked(generateText).mockResolvedValueOnce(mockPlotResponse);
      vi.mocked(generateText).mockResolvedValueOnce(contextAwareResponse);

      const result = await plotGenerationService.generatePlot(mockRequest);

      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions[0]?.relatedCharacters).toBeDefined();
      expect(result.suggestions[0]?.relatedCharacters?.length).toBeGreaterThan(0);
    });

    it('should handle new projects with no existing context', async () => {
      const newProjectRequest: PlotGenerationRequest = {
        projectId: 'new-project',
        premise: 'A young hero discovers magic',
        genre: 'fantasy',
        targetLength: 20,
      };

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

      const newProjectResponse = {
        success: true,
        data: {
          text: JSON.stringify([
            {
              type: 'plot_twist',
              title: 'Magical Revelation',
              description: 'The hero discovers their magic has a darker origin than expected',
              placement: 'middle',
              impact: 'high',
            },
            {
              type: 'character_arc',
              title: 'Coming of Age',
              description: 'Hero matures from naive apprentice to confident wielder',
              placement: 'anywhere',
              impact: 'high',
            },
          ]),
        },
      };

      vi.mocked(generateText).mockResolvedValueOnce(mockPlotResponse);
      vi.mocked(generateText).mockResolvedValueOnce(newProjectResponse);

      const result = await plotGenerationService.generatePlot(newProjectRequest);

      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(
        result.suggestions.every(s => s.relatedCharacters === undefined || s.relatedCharacters?.length === 0),
      ).toBe(true);
    });

    it('should include relatedCharacters when context is available', async () => {
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

      const characterSpecificResponse = {
        success: true,
        data: {
          text: JSON.stringify([
            {
              type: 'character_arc',
              title: "Kael's Redemption",
              description: 'Kael confronts his past mistakes and seeks redemption',
              placement: 'middle',
              impact: 'high',
              relatedCharacters: ['Kael'],
            },
          ]),
        },
      };

      vi.mocked(generateText).mockResolvedValueOnce(mockPlotResponse);
      vi.mocked(generateText).mockResolvedValueOnce(characterSpecificResponse);

      const result = await plotGenerationService.generatePlot(mockRequest);

      expect(result.suggestions[0]?.relatedCharacters).toEqual(['Kael']);
    });

    it('should use context-aware default suggestions when AI fails', async () => {
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

      const failResponse = {
        success: false,
        error: 'AI service unavailable',
      };

      vi.mocked(generateText).mockResolvedValueOnce(mockPlotResponse);
      vi.mocked(generateText).mockResolvedValueOnce(failResponse);

      const result = await plotGenerationService.generatePlot(mockRequest);

      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions[0]).toHaveProperty('id');
      expect(result.suggestions[0]).toHaveProperty('type');
      expect(result.suggestions[0]).toHaveProperty('description');
    });
  });
});
