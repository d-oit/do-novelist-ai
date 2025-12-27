/**
 * Tests for grammarSuggestionService
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/logging/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('grammarSuggestionService', () => {
  let grammarSuggestionService: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await import('@/features/writing-assistant/services/grammarSuggestionService');
    grammarSuggestionService = module.grammarSuggestionService;
  });

  describe('spelling checks', () => {
    it('detects misspelled words', () => {
      const result = grammarSuggestionService.analyzeGrammar('Teh quick brown fox jumps over the lazy dog.');
      const spellErrors = result.suggestions.filter((s: any) => s.type === 'spelling');
      expect(spellErrors.length).toBeGreaterThan(0);
      expect(spellErrors.some((s: any) => s.originalText.toLowerCase() === 'teh')).toBe(true);
    });

    it('detects "definately" misspelling', () => {
      const result = grammarSuggestionService.analyzeGrammar('I definately agree with this.');
      const spellErrors = result.suggestions.filter((s: any) => s.type === 'spelling');
      expect(spellErrors.some((s: any) => s.originalText === 'definately')).toBe(true);
    });

    it('detects "seperate" misspelling', () => {
      const result = grammarSuggestionService.analyzeGrammar('Please seperate the items.');
      const spellErrors = result.suggestions.filter((s: any) => s.type === 'spelling');
      expect(spellErrors.some((s: any) => s.originalText === 'seperate')).toBe(true);
    });

    it('provides correct spelling suggestions', () => {
      const result = grammarSuggestionService.analyzeGrammar('Teh quick brown fox.');
      const spellErrors = result.suggestions.filter((s: any) => s.type === 'spelling');
      expect(spellErrors.some((s: any) => s.suggestedText === 'the')).toBe(true);
    });
  });

  describe('grammar checks', () => {
    it('detects subject-verb agreement issues', () => {
      const result = grammarSuggestionService.analyzeGrammar('Every student have a book.');
      const grammarErrors = result.suggestions.filter((s: any) => s.type === 'subject_verb_agreement');
      expect(grammarErrors.length).toBeGreaterThan(0);
    });

    it('detects pronoun reference issues', () => {
      const result = grammarSuggestionService.analyzeGrammar('The teacher told the student that they should study.');
      const grammarErrors = result.suggestions.filter((s: any) => s.type === 'pronoun_reference');
      expect(grammarErrors.length).toBeGreaterThan(0);
    });
  });

  describe('punctuation checks', () => {
    it('detects multiple spaces', () => {
      const result = grammarSuggestionService.analyzeGrammar('The cat  sat on  the mat.');
      const punctErrors = result.suggestions.filter((s: any) => s.type === 'punctuation');
      expect(punctErrors.length).toBeGreaterThan(0);
    });

    it('detects missing space after punctuation', () => {
      const result = grammarSuggestionService.analyzeGrammar('The cat sat.Then the dog barked.');
      const punctErrors = result.suggestions.filter((s: any) => s.type === 'punctuation');
      expect(punctErrors.length).toBeGreaterThan(0);
    });
  });

  describe('clarity checks', () => {
    it('detects long sentences', () => {
      const longSentence =
        'The cat sat on the mat and then it looked around and saw a bird and then it chased the bird and then it caught the bird and then it ate the bird and then it went back to the mat and then it sat down again.';
      const result = grammarSuggestionService.analyzeGrammar(longSentence);
      const clarityErrors = result.suggestions.filter((s: any) => s.type === 'clarity');
      expect(clarityErrors.length).toBeGreaterThan(0);
    });

    it('detects vague language', () => {
      const result = grammarSuggestionService.analyzeGrammar('Some people think that it is kind of good.');
      const clarityErrors = result.suggestions.filter((s: any) => s.type === 'clarity');
      expect(clarityErrors.length).toBeGreaterThan(0);
    });

    it('detects "a lot" usage', () => {
      const result = grammarSuggestionService.analyzeGrammar('I have a lot of work to do.');
      const clarityErrors = result.suggestions.filter((s: any) => s.type === 'clarity');
      expect(
        clarityErrors.some(
          (s: any) => s.message.toLowerCase().includes('a lot') || s.originalText?.toLowerCase().includes('a lot'),
        ),
      ).toBe(true);
    });
  });

  describe('style checks', () => {
    it('detects weak words', () => {
      const result = grammarSuggestionService.analyzeGrammar('It was really very good stuff.');
      const styleErrors = result.suggestions.filter((s: any) => s.type === 'word_choice');
      expect(styleErrors.length).toBeGreaterThan(0);
    });

    it('detects "very" usage', () => {
      const result = grammarSuggestionService.analyzeGrammar('It was very good.');
      const styleErrors = result.suggestions.filter((s: any) => s.type === 'word_choice');
      expect(styleErrors.some((s: any) => s.originalText.toLowerCase() === 'very')).toBe(true);
    });

    it('detects "really" usage', () => {
      const result = grammarSuggestionService.analyzeGrammar('It really good.');
      const styleErrors = result.suggestions.filter((s: any) => s.type === 'word_choice');
      expect(styleErrors.some((s: any) => s.originalText.toLowerCase() === 'really')).toBe(true);
    });
  });

  describe('redundancy checks', () => {
    it('detects "advance planning"', () => {
      const result = grammarSuggestionService.analyzeGrammar('We need advance planning for the project.');
      const redundancyErrors = result.suggestions.filter((s: any) => s.type === 'redundancy');
      expect(redundancyErrors.some((s: any) => s.originalText?.toLowerCase().includes('advance planning'))).toBe(true);
    });

    it('detects "end result"', () => {
      const result = grammarSuggestionService.analyzeGrammar('The end result was satisfactory.');
      const redundancyErrors = result.suggestions.filter((s: any) => s.type === 'redundancy');
      expect(redundancyErrors.some((s: any) => s.originalText?.toLowerCase().includes('end result'))).toBe(true);
    });

    it('detects "each and every"', () => {
      const result = grammarSuggestionService.analyzeGrammar('Each and every student participated.');
      const redundancyErrors = result.suggestions.filter((s: any) => s.type === 'redundancy');
      expect(redundancyErrors.length).toBeGreaterThan(0);
    });
  });

  describe('passive voice checks', () => {
    it('detects passive voice', () => {
      const result = grammarSuggestionService.analyzeGrammar(
        'The ball was hit by John. The cat was chased by the dog.',
      );
      const passiveErrors = result.suggestions.filter((s: any) => s.type === 'passive_voice');
      expect(passiveErrors.length).toBeGreaterThan(0);
    });

    it('provides active voice suggestions', () => {
      const result = grammarSuggestionService.analyzeGrammar('The ball was kicked by John.');
      const passiveErrors = result.suggestions.filter((s: any) => s.type === 'passive_voice');
      expect(passiveErrors.length).toBeGreaterThan(0);
      expect(passiveErrors[0]?.explanation.toLowerCase()).toContain('active');
    });
  });

  describe('clarity metrics', () => {
    it('calculates clarity score', () => {
      const metrics = grammarSuggestionService.calculateClarityMetrics('The cat sat on the mat.');
      expect(metrics.clarityScore).toBeGreaterThanOrEqual(0);
      expect(metrics.clarityScore).toBeLessThanOrEqual(100);
    });

    it('calculates sentence complexity', () => {
      const metrics = grammarSuggestionService.calculateClarityMetrics('The cat sat on the mat.');
      expect(metrics.sentenceComplexity).toBeGreaterThanOrEqual(0);
      expect(metrics.sentenceComplexity).toBeLessThanOrEqual(100);
    });

    it('calculates wordiness score', () => {
      const metrics = grammarSuggestionService.calculateClarityMetrics(
        'In order to achieve this goal, we need to have a meeting in order to discuss the plan in order to move forward.',
      );
      expect(metrics.wordinessScore).toBeLessThan(100);
    });

    it('calculates passive voice ratio', () => {
      const metrics = grammarSuggestionService.calculateClarityMetrics(
        'The ball was hit by John. The cat sat on the mat.',
      );
      expect(metrics.passiveVoiceRatio).toBeGreaterThanOrEqual(0);
      expect(metrics.passiveVoiceRatio).toBeLessThanOrEqual(100);
    });

    it('calculates complex word ratio', () => {
      const metrics = grammarSuggestionService.calculateClarityMetrics('The cat sat on the mat.');
      expect(metrics.complexWordRatio).toBeGreaterThanOrEqual(0);
      expect(metrics.complexWordRatio).toBeLessThanOrEqual(100);
    });
  });

  describe('configuration', () => {
    it('respects checkGrammar config', () => {
      const result = grammarSuggestionService.analyzeGrammar('Test text.', {
        checkGrammar: false,
      });
      const grammarErrors = result.suggestions.filter((s: any) => s.type === 'grammar');
      expect(grammarErrors.length).toBe(0);
    });

    it('respects checkSpelling config', () => {
      const result = grammarSuggestionService.analyzeGrammar('Teh test text.', {
        checkSpelling: false,
      });
      const spellErrors = result.suggestions.filter((s: any) => s.type === 'spelling');
      expect(spellErrors.length).toBe(0);
    });

    it('respects checkPunctuation config', () => {
      const result = grammarSuggestionService.analyzeGrammar('Test  text.', {
        checkPunctuation: false,
      });
      const punctErrors = result.suggestions.filter((s: any) => s.type === 'punctuation');
      expect(punctErrors.length).toBe(0);
    });

    it('respects minimumConfidence config', () => {
      const result = grammarSuggestionService.analyzeGrammar('Teh test text.', {
        minimumConfidence: 0.9,
      });
      const lowConfidenceErrors = result.suggestions.filter((s: any) => s.confidence < 0.9);
      expect(lowConfidenceErrors.length).toBe(0);
    });

    it('respects maxSuggestions config', () => {
      const result = grammarSuggestionService.analyzeGrammar('Teh cat sat on teh mat and teh dog barked.', {
        maxSuggestions: 5,
      });
      expect(result.suggestions.length).toBeLessThanOrEqual(5);
    });
  });

  describe('analysis stats', () => {
    it('calculates total issues', () => {
      const result = grammarSuggestionService.analyzeGrammar('Teh cat  sat on the mat.');
      expect(result.stats.totalIssues).toBeGreaterThan(0);
    });

    it('calculates error count', () => {
      const result = grammarSuggestionService.analyzeGrammar('Teh cat sat.');
      const errors = result.suggestions.filter((s: any) => s.severity === 'error');
      expect(result.stats.errorCount).toBe(errors.length);
    });

    it('calculates warning count', () => {
      const result = grammarSuggestionService.analyzeGrammar('Test text.');
      const warnings = result.suggestions.filter((s: any) => s.severity === 'warning');
      expect(result.stats.warningCount).toBe(warnings.length);
    });

    it('calculates suggestion count', () => {
      const result = grammarSuggestionService.analyzeGrammar('Test text.');
      const suggestions = result.suggestions.filter((s: any) => s.severity === 'suggestion');
      expect(result.stats.suggestionCount).toBe(suggestions.length);
    });

    it('calculates readability impact', () => {
      const result = grammarSuggestionService.analyzeGrammar('Test text.');
      expect(result.readabilityImpact).toBeGreaterThanOrEqual(0);
      expect(result.readabilityImpact).toBeLessThanOrEqual(100);
    });
  });

  describe('suggestion properties', () => {
    it('includes suggestion ID', () => {
      const result = grammarSuggestionService.analyzeGrammar('Teh cat sat.');
      expect(result.suggestions[0]?.id).toBeDefined();
      expect(typeof result.suggestions[0]?.id).toBe('string');
    });

    it('includes suggestion severity', () => {
      const result = grammarSuggestionService.analyzeGrammar('Teh cat sat.');
      expect(['error', 'warning', 'suggestion', 'info']).toContain(result.suggestions[0]?.severity);
    });

    it('includes suggestion category', () => {
      const result = grammarSuggestionService.analyzeGrammar('Teh test text.');
      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(['mechanical', 'clarity', 'style', 'convention', 'usage']).toContain(result.suggestions[0]?.category);
    });

    it('includes position information', () => {
      const result = grammarSuggestionService.analyzeGrammar('Teh cat sat.');
      expect(result.suggestions[0]?.position).toBeDefined();
      expect(result.suggestions[0]?.position.start).toBeGreaterThanOrEqual(0);
      expect(result.suggestions[0]?.position.end).toBeGreaterThanOrEqual(0);
    });

    it('includes confidence score', () => {
      const result = grammarSuggestionService.analyzeGrammar('Teh cat sat.');
      expect(result.suggestions[0]?.confidence).toBeGreaterThanOrEqual(0);
      expect(result.suggestions[0]?.confidence).toBeLessThanOrEqual(1);
    });

    it('includes explanation', () => {
      const result = grammarSuggestionService.analyzeGrammar('Teh cat sat.');
      expect(result.suggestions[0]?.explanation).toBeDefined();
      expect(result.suggestions[0]?.explanation.length).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('handles empty text gracefully', () => {
      const result = grammarSuggestionService.analyzeGrammar('');
      expect(result).toBeDefined();
      expect(result.suggestions).toBeDefined();
    });

    it('handles undefined content gracefully', () => {
      const result = grammarSuggestionService.analyzeGrammar(undefined as any);
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
    });

    it('handles null content gracefully', () => {
      const result = grammarSuggestionService.analyzeGrammar(null as any);
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
    });
  });

  describe('wordy phrases', () => {
    it('detects "at this point in time"', () => {
      const result = grammarSuggestionService.analyzeGrammar('We need to start at this point in time.');
      expect(result.suggestions.some((s: any) => s.originalText?.toLowerCase().includes('at this point in time'))).toBe(
        true,
      );
    });

    it('detects "in order to"', () => {
      const result = grammarSuggestionService.analyzeGrammar('In order to complete the task.');
      expect(result.suggestions.some((s: any) => s.originalText?.toLowerCase().includes('in order to'))).toBe(true);
    });

    it('detects "due to the fact that"', () => {
      const result = grammarSuggestionService.analyzeGrammar('Due to the fact that it is raining.');
      expect(result.suggestions.some((s: any) => s.originalText?.toLowerCase().includes('due to the fact that'))).toBe(
        true,
      );
    });
  });

  describe('integration with style analysis', () => {
    it('works alongside style metrics', () => {
      const text = 'The cat sat on the mat.';
      const grammarResult = grammarSuggestionService.analyzeGrammar(text);
      expect(grammarResult.suggestions).toBeDefined();
      expect(grammarResult.stats).toBeDefined();
    });
  });
});
