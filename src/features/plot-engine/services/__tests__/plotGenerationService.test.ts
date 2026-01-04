import { describe, it, expect, beforeEach } from 'vitest';

import { plotGenerationService, type PlotGenerationRequest } from '@/features/plot-engine';

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
  });

  describe('generatePlot', () => {
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
      const request: PlotGenerationRequest = {
        ...mockRequest,
        structure: '5-act',
      };

      const result = await plotGenerationService.generatePlot(request);

      expect(result.plotStructure.acts).toHaveLength(5);
    });

    it('should generate hero journey structure when requested', async () => {
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
      const request: PlotGenerationRequest = {
        ...mockRequest,
        genre: 'romance',
      };

      const result = await plotGenerationService.generatePlot(request);

      const hasRomanceSuggestion = result.suggestions.some(
        (s) => s.type === 'subplot' && s.title.toLowerCase().includes('romantic')
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

      const totalDuration = result.plotStructure.acts.reduce(
        (sum, act) => sum + (act.duration || 0),
        0
      );
      expect(totalDuration).toBe(mockRequest.targetLength);
    });

    it('should include character IDs in plot points', async () => {
      const result = await plotGenerationService.generatePlot(mockRequest);

      const allPlotPoints = result.plotStructure.acts.flatMap((act) => act.plotPoints);
      const hasCharacters = allPlotPoints.some((pp) => pp.characterIds.length > 0);
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
      const totalDuration = result.plotStructure.acts.reduce(
        (sum, act) => sum + (act.duration || 0),
        0
      );
      expect(totalDuration).toBeGreaterThan(0);
    });

    it('should create plot points with proper positioning', async () => {
      const result = await plotGenerationService.generatePlot(mockRequest);

      const allPlotPoints = result.plotStructure.acts.flatMap((act) => act.plotPoints);
      
      // Check that positions increase throughout story
      const positions = allPlotPoints
        .filter((pp) => pp.position !== undefined)
        .map((pp) => pp.position) as number[];
      
      for (let i = 1; i < positions.length; i++) {
        const prev = positions[i - 1] ?? 0;
        const curr = positions[i] ?? 0;
        expect(curr).toBeGreaterThanOrEqual(prev);
      }
    });
  });
});
