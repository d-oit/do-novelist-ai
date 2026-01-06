import { describe, it, expect } from 'vitest';

import { plotGenerationService } from '@/features/plot-engine';
import type { PlotGenerationRequest } from '@/features/plot-engine';

describe('PlotGenerationService - Model Selection', () => {
  describe('calculateComplexity', () => {
    it('should select fast model for simple suggestions', () => {
      const simpleRequest: PlotGenerationRequest = {
        projectId: 'test-1',
        premise: 'Simple story',
        genre: 'fantasy',
        targetLength: 10,
        structure: '3-act',
      };

      const plot = plotGenerationService['calculateComplexity'](simpleRequest, 'suggestions');
      expect(plot).toBe('fast');
    });

    it('should select standard model for typical 3-act plot', () => {
      const typicalRequest: PlotGenerationRequest = {
        projectId: 'test-2',
        premise: 'Typical story',
        genre: 'romance',
        targetLength: 20,
        structure: '3-act',
        characters: ['char1', 'char2'],
      };

      const complexity = plotGenerationService['calculateComplexity'](typicalRequest, 'plot_structure');
      expect(complexity).toBe('standard');
    });

    it('should select advanced model for hero-journey structure', () => {
      const complexRequest: PlotGenerationRequest = {
        projectId: 'test-3',
        premise: 'Complex hero journey',
        genre: 'epic fantasy',
        targetLength: 40,
        structure: 'hero-journey',
        characters: ['char1', 'char2', 'char3', 'char4'],
        themes: ['redemption', 'sacrifice', 'fate'],
      };

      const complexity = plotGenerationService['calculateComplexity'](complexRequest, 'plot_structure');
      expect(complexity).toBe('advanced');
    });

    it('should select advanced model for 5-act structure with many characters', () => {
      const complexRequest: PlotGenerationRequest = {
        projectId: 'test-4',
        premise: 'Complex ensemble story',
        genre: 'drama',
        targetLength: 35,
        structure: '5-act',
        characters: ['char1', 'char2', 'char3', 'char4', 'char5', 'char6'],
      };

      const complexity = plotGenerationService['calculateComplexity'](complexRequest, 'plot_structure');
      expect(complexity).toBe('advanced');
    });

    it('should select standard model for alternatives', () => {
      const request: PlotGenerationRequest = {
        projectId: 'test-5',
        premise: 'Story',
        genre: 'mystery',
        structure: '3-act',
      };

      const complexity = plotGenerationService['calculateComplexity'](request, 'alternatives');
      expect(complexity).toBe('standard');
    });

    it('should select advanced model for custom structure', () => {
      const customRequest: PlotGenerationRequest = {
        projectId: 'test-6',
        premise: 'Custom structure story',
        genre: 'experimental',
        targetLength: 50,
        structure: 'custom',
        plotPoints: ['point1', 'point2', 'point3', 'point4', 'point5', 'point6'],
      };

      const complexity = plotGenerationService['calculateComplexity'](customRequest, 'plot_structure');
      expect(complexity).toBe('advanced');
    });

    it('should select advanced model for kishotenketsu structure', () => {
      const kishotenketsuRequest: PlotGenerationRequest = {
        projectId: 'test-7',
        premise: 'Japanese-style story',
        genre: 'literary',
        targetLength: 25,
        structure: 'kishotenketsu',
      };

      const complexity = plotGenerationService['calculateComplexity'](kishotenketsuRequest, 'plot_structure');
      expect(complexity).toBe('standard');
    });

    it('should select advanced model for long novels', () => {
      const longRequest: PlotGenerationRequest = {
        projectId: 'test-8',
        premise: 'Epic saga',
        genre: 'fantasy',
        targetLength: 45,
        structure: '3-act',
      };

      const complexity = plotGenerationService['calculateComplexity'](longRequest, 'plot_structure');
      expect(complexity).toBe('advanced');
    });

    it('should select standard model for moderate complexity 5-act', () => {
      const moderateRequest: PlotGenerationRequest = {
        projectId: 'test-9',
        premise: 'Moderate complexity',
        genre: 'thriller',
        targetLength: 25,
        structure: '5-act',
        characters: ['char1', 'char2'],
      };

      const complexity = plotGenerationService['calculateComplexity'](moderateRequest, 'plot_structure');
      expect(complexity).toBe('standard');
    });
  });

  describe('selectModel', () => {
    it('should return Anthropic Haiku for fast complexity', () => {
      const simpleRequest: PlotGenerationRequest = {
        projectId: 'test-10',
        premise: 'Simple',
        genre: 'fantasy',
        structure: '3-act',
      };

      const model = plotGenerationService['selectModel'](simpleRequest, 'suggestions');
      expect(model).toBe('claude-3-5-haiku-20241022');
    });

    it('should return Anthropic Sonnet for standard complexity', () => {
      const typicalRequest: PlotGenerationRequest = {
        projectId: 'test-11',
        premise: 'Typical',
        genre: 'fantasy',
        targetLength: 20,
        structure: '3-act',
        characters: ['char1'],
      };

      const model = plotGenerationService['selectModel'](typicalRequest, 'plot_structure');
      expect(model).toBe('claude-3-5-sonnet-20241022');
    });

    it('should return Anthropic Sonnet for advanced complexity', () => {
      const complexRequest: PlotGenerationRequest = {
        projectId: 'test-12',
        premise: 'Complex',
        genre: 'fantasy',
        targetLength: 40,
        structure: 'hero-journey',
        characters: ['char1', 'char2', 'char3', 'char4'],
        themes: ['theme1', 'theme2', 'theme3'],
      };

      const model = plotGenerationService['selectModel'](complexRequest, 'plot_structure');
      expect(model).toBe('claude-3-5-sonnet-20241022');
    });
  });
});
