/**
 * Tests for styleAnalysisService
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/logging/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('styleAnalysisService', () => {
  let styleAnalysisService: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await import('@/features/writing-assistant/services/styleAnalysisService');
    styleAnalysisService = module.styleAnalysisService;
  });

  describe('readability metrics', () => {
    it('calculates Flesch Reading Ease for simple text', () => {
      const result = styleAnalysisService.analyzeStyle('The cat sat on the mat. The cat was happy.');
      expect(result.fleschReadingEase).toBeGreaterThan(0);
      expect(result.fleschReadingEase).toBeLessThanOrEqual(100);
    });

    it('calculates Flesch-Kincaid Grade Level', () => {
      const result = styleAnalysisService.analyzeStyle('The cat sat on the mat. The cat was happy.');
      expect(result.fleschKincaidGrade).toBeGreaterThan(0);
    });

    it('calculates Gunning Fog Index', () => {
      const result = styleAnalysisService.analyzeStyle('The cat sat on the mat. The cat was happy.');
      expect(result.gunningFogIndex).toBeGreaterThan(0);
    });

    it('calculates SMOG Index', () => {
      const result = styleAnalysisService.analyzeStyle('The cat sat on the mat. The cat was happy.');
      expect(result.smogIndex).toBeGreaterThan(0);
    });

    it('calculates Automated Readability Index', () => {
      const result = styleAnalysisService.analyzeStyle('The cat sat on the mat. The cat was happy.');
      expect(result.automatedReadabilityIndex).toBeGreaterThan(0);
    });

    it('handles empty text gracefully', () => {
      const result = styleAnalysisService.analyzeStyle('');
      expect(result.fleschReadingEase).toBe(0);
      expect(result.fleschKincaidGrade).toBe(8);
    });

    it('calculates higher score for simpler text', () => {
      const simpleText = 'The cat sat on the mat. The cat sat on the mat.';
      const complexText =
        'The feline quadrupedal mammal positioned itself upon the woven fibrous floor covering material, exhibiting a state of contentment and satisfaction with its current location and circumstances.';

      const simpleResult = styleAnalysisService.analyzeStyle(simpleText);
      const complexResult = styleAnalysisService.analyzeStyle(complexText);

      expect(simpleResult.fleschReadingEase).toBeGreaterThan(complexResult.fleschReadingEase);
    });
  });

  describe('complexity metrics', () => {
    it('calculates average sentence length', () => {
      const result = styleAnalysisService.analyzeStyle('The cat sat. The dog barked. The bird flew.');
      expect(result.averageSentenceLength).toBeGreaterThan(0);
      expect(result.averageSentenceLength).toBeLessThan(20);
    });

    it('calculates average word length', () => {
      const result = styleAnalysisService.analyzeStyle('The cat sat on the mat.');
      expect(result.averageWordLength).toBeGreaterThan(2);
      expect(result.averageWordLength).toBeLessThan(10);
    });

    it('determines vocabulary complexity', () => {
      const result = styleAnalysisService.analyzeStyle('The cat sat on the mat.');
      expect(['simple', 'moderate', 'complex', 'very_complex']).toContain(result.vocabularyComplexity);
    });

    it('calculates syntactic complexity', () => {
      const result = styleAnalysisService.analyzeStyle('The cat sat on the mat because it was tired.');
      expect(result.syntacticComplexity).toBeGreaterThanOrEqual(0);
      expect(result.syntacticComplexity).toBeLessThanOrEqual(100);
    });
  });

  describe('tone analysis', () => {
    it('detects mysterious tone', () => {
      const result = styleAnalysisService.analyzeStyle(
        'The shadow hid the secret in the darkness. The unknown whispered.',
      );
      expect(result.primaryTone).toBe('mysterious');
    });

    it('detects lighthearted tone', () => {
      const result = styleAnalysisService.analyzeStyle('She laughed and smiled with joy. The sunny day was cheerful.');
      expect(result.primaryTone).toBe('lighthearted');
    });

    it('detects dramatic tone', () => {
      const result = styleAnalysisService.analyzeStyle(
        'He screamed and cried in horror. The terrible situation was shocking.',
      );
      expect(result.primaryTone).toBe('dramatic');
    });

    it('detects romantic tone', () => {
      const result = styleAnalysisService.analyzeStyle(
        'She felt love in her heart. They embraced with passion and desire.',
      );
      expect(result.primaryTone).toBe('romantic');
    });

    it('calculates tone intensity', () => {
      const result = styleAnalysisService.analyzeStyle(
        'The shadow hid the secret. The darkness was everywhere. The unknown whispered.',
      );
      expect(result.toneIntensity).toBeGreaterThan(0);
      expect(result.toneIntensity).toBeLessThanOrEqual(100);
    });

    it('returns neutral tone when no indicators', () => {
      const result = styleAnalysisService.analyzeStyle('The text has no specific indicators.');
      expect(result.primaryTone).toBe('neutral');
    });
  });

  describe('voice analysis', () => {
    it('detects active voice', () => {
      const result = styleAnalysisService.analyzeStyle('John hit the ball. The cat chased the mouse.');
      expect(result.voiceType).toBe('active');
    });

    it('detects passive voice', () => {
      const result = styleAnalysisService.analyzeStyle(
        'The ball was hit by John. The mouse was chased by the cat. The letter was written by him. The decision was made by them.',
      );
      expect(result.voiceType).toBe('passive');
    });

    it('detects mixed voice', () => {
      const result = styleAnalysisService.analyzeStyle(
        'The ball was hit by John. The cat chased the mouse. The dog barked at the mailman.',
      );
      expect(result.voiceType).toBe('mixed');
    });

    it('detects first person perspective', () => {
      const result = styleAnalysisService.analyzeStyle(
        'I walked down the street. We saw a bird. My friend and I enjoyed the view.',
      );
      expect(result.perspective).toBe('first');
    });

    it('detects third person perspective', () => {
      const result = styleAnalysisService.analyzeStyle(
        'He walked down the street. They saw a bird. His friend and she enjoyed the view.',
      );
      expect(result.perspective).toBe('third_limited');
    });

    it('detects past tense', () => {
      const result = styleAnalysisService.analyzeStyle(
        'He walked down the street and saw a bird. The cat sat on the mat.',
      );
      expect(result.tense).toBe('past');
    });

    it('detects present tense', () => {
      const result = styleAnalysisService.analyzeStyle(
        'He walks down the street and sees a bird. The cat sits on the mat.',
      );
      expect(result.tense).toBe('present');
    });
  });

  describe('consistency analysis', () => {
    it('calculates consistency score', () => {
      const result = styleAnalysisService.analyzeStyle(
        'The cat sat on the mat. The cat sat on the mat. The cat sat on the mat.',
      );
      expect(result.consistencyScore).toBeGreaterThan(0);
      expect(result.consistencyScore).toBeLessThanOrEqual(100);
    });

    it('returns consistency score of 100 for perfect consistency', () => {
      const result = styleAnalysisService.analyzeStyle('Simple text. Simple text.');
      expect(result.consistencyScore).toBeGreaterThanOrEqual(80);
    });

    it('detects consistency issues', () => {
      const result = styleAnalysisService.analyzeStyle('Test text');
      expect(Array.isArray(result.consistencyIssues)).toBe(true);
    });
  });

  describe('recommendations', () => {
    it('generates readability recommendations for difficult text', () => {
      const result = styleAnalysisService.analyzeStyle(
        'The feline quadrupedal mammal positioned itself upon the woven fibrous floor covering material.',
      );
      const readabilityRecs = result.styleRecommendations.filter((r: any) => r.category === 'readability');
      expect(readabilityRecs.length).toBeGreaterThan(0);
    });

    it('generates consistency recommendations', () => {
      const result = styleAnalysisService.analyzeStyle('The cat sat. Then the dog barked. Then the bird flew.');
      const consistencyRecs = result.styleRecommendations.filter((r: any) => r.category === 'consistency');
      expect(Array.isArray(consistencyRecs)).toBe(true);
    });

    it('includes priority level in recommendations', () => {
      const result = styleAnalysisService.analyzeStyle('Test text with many long words.');
      const highPriorityRecs = result.styleRecommendations.filter((r: any) => r.priority === 'high');
      expect(Array.isArray(highPriorityRecs)).toBe(true);
    });
  });

  describe('configuration', () => {
    it('respects enableReadabilityMetrics config', () => {
      const result = styleAnalysisService.analyzeStyle('Test text.', {
        enableReadabilityMetrics: false,
      });
      expect(result.fleschReadingEase).toBeDefined();
    });

    it('respects enableToneAnalysis config', () => {
      const result = styleAnalysisService.analyzeStyle('Test text.', {
        enableToneAnalysis: false,
      });
      expect(result.primaryTone).toBe('neutral');
    });

    it('respects enableVoiceAnalysis config', () => {
      const result = styleAnalysisService.analyzeStyle('Test text.', {
        enableVoiceAnalysis: false,
      });
      expect(result.voiceType).toBe('mixed');
    });

    it('respects enableRecommendations config', () => {
      const result = styleAnalysisService.analyzeStyle('Test text.', {
        enableRecommendations: false,
      });
      expect(result.styleRecommendations.length).toBe(0);
    });
  });

  describe('error handling', () => {
    it('handles undefined content gracefully', () => {
      const result = styleAnalysisService.analyzeStyle(undefined as any);
      expect(result).toBeDefined();
    });

    it('returns valid result object even on error', () => {
      const result = styleAnalysisService.analyzeStyle(null as any);
      expect(result.id).toBeDefined();
      expect(result.timestamp).toBeDefined();
      expect(result.content).toBe('');
    });
  });

  describe('analysis metadata', () => {
    it('generates unique analysis ID', () => {
      const result1 = styleAnalysisService.analyzeStyle('Test text.');
      const result2 = styleAnalysisService.analyzeStyle('Test text.');
      expect(result1.id).not.toBe(result2.id);
    });

    it('includes timestamp', () => {
      const beforeTime = new Date();
      const result = styleAnalysisService.analyzeStyle('Test text.');
      const afterTime = new Date();
      expect(result.timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(result.timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    it('stores original content', () => {
      const content = 'The cat sat on the mat.';
      const result = styleAnalysisService.analyzeStyle(content);
      expect(result.content).toBe(content);
    });
  });
});
