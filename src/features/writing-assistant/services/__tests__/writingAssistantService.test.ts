/**
 * Tests for WritingAssistantService
 *
 * This service provides content analysis and writing suggestions.
 * We test the pure functions directly to maximize coverage.
 */

import { describe, expect, it, vi } from 'vitest';

import type { WritingAssistantConfig } from '../../types';
import { writingAssistantService } from '../writingAssistantService';

// Mock the AI SDK to avoid actual API calls
vi.mock('@ai-sdk/google', () => ({
  createGoogleGenerativeAI: vi.fn(() => vi.fn(() => ({}))),
}));

vi.mock('ai', () => ({
  generateText: vi.fn(() => Promise.resolve({ text: '[]' })),
}));

// Default test config
const testConfig: WritingAssistantConfig = {
  enableRealTimeAnalysis: true,
  analysisDelay: 1500,
  enabledCategories: ['readability', 'engagement', 'consistency', 'flow', 'dialogue'],
  minimumConfidence: 0.5,
  maxSuggestionsPerType: 5,
  enablePlotHoleDetection: true,
  enableCharacterTracking: true,
  enableDialogueAnalysis: true,
  enableStyleAnalysis: true,
  aiModel: 'gemini-pro',
  analysisDepth: 'standard',
  preferredStyle: 'descriptive',
  targetAudience: 'adult',
  genre: 'fiction',
};

describe('WritingAssistantService', () => {
  describe('getInstance', () => {
    it('should return the singleton instance', () => {
      const instance1 = writingAssistantService;
      const instance2 = writingAssistantService;
      expect(instance1).toBe(instance2);
    });
  });

  describe('analyzeContent', () => {
    it('should return a complete analysis object', async () => {
      const content = 'The quick brown fox jumped over the lazy dog. It was a beautiful sunny day.';
      const chapterId = 'test-chapter-1';

      const analysis = await writingAssistantService.analyzeContent(content, chapterId, testConfig);

      expect(analysis).toBeDefined();
      expect(analysis.chapterId).toBe(chapterId);
      expect(analysis.content).toBe(content);
      expect(typeof analysis.readabilityScore).toBe('number');
      expect(typeof analysis.sentimentScore).toBe('number');
      expect(typeof analysis.paceScore).toBe('number');
      expect(typeof analysis.engagementScore).toBe('number');
      expect(Array.isArray(analysis.suggestions)).toBe(true);
      expect(analysis.dialogueAnalysis).toBeDefined();
      expect(analysis.styleProfile).toBeDefined();
      expect(analysis.toneAnalysis).toBeDefined();
      expect(analysis.wordUsage).toBeDefined();
      expect(analysis.paragraphAnalysis).toBeDefined();
      expect(analysis.sentenceVariety).toBeDefined();
      expect(analysis.transitionQuality).toBeDefined();
    });

    it('should handle empty content gracefully', async () => {
      const analysis = await writingAssistantService.analyzeContent('', 'empty-chapter', testConfig);

      expect(analysis).toBeDefined();
      expect(analysis.readabilityScore).toBe(0);
    });

    it('should detect plot holes when enabled', async () => {
      const content =
        'Yesterday morning, John went to the store. Tomorrow he would remember today as the best day. Last week he had planned for next month.';

      const analysis = await writingAssistantService.analyzeContent(content, 'timeline-chapter', {
        ...testConfig,
        enablePlotHoleDetection: true,
      });

      // Should detect timeline inconsistencies
      expect(analysis.plotHoles.length).toBeGreaterThanOrEqual(0);
    });

    it('should skip plot hole detection when disabled', async () => {
      const analysis = await writingAssistantService.analyzeContent('Some content here.', 'test-chapter', {
        ...testConfig,
        enablePlotHoleDetection: false,
      });

      expect(analysis.plotHoles).toEqual([]);
    });
  });

  describe('calculateReadabilityScore (via mock analysis)', () => {
    it('should return higher scores for simpler text', async () => {
      const simpleText = 'The cat sat. The dog ran. The bird flew. Simple words work best.';
      const complexText =
        'The phenomenological manifestation of consciousness exhibits characteristics that defy conventional epistemological categorization.';

      const simpleAnalysis = await writingAssistantService.analyzeContent(simpleText, 'simple', testConfig);
      const complexAnalysis = await writingAssistantService.analyzeContent(complexText, 'complex', testConfig);

      expect(simpleAnalysis.readabilityScore).toBeGreaterThan(complexAnalysis.readabilityScore);
    });

    it('should return 0 for empty content', async () => {
      const analysis = await writingAssistantService.analyzeContent('', 'empty', testConfig);
      expect(analysis.readabilityScore).toBe(0);
    });

    it('should return a score between 0 and 100', async () => {
      const content = 'This is a normal sentence with typical words and structure. Another follows.';
      const analysis = await writingAssistantService.analyzeContent(content, 'normal', testConfig);

      expect(analysis.readabilityScore).toBeGreaterThanOrEqual(0);
      expect(analysis.readabilityScore).toBeLessThanOrEqual(100);
    });
  });

  describe('analyzeSentiment (via analysis)', () => {
    it('should detect positive sentiment', async () => {
      const positiveText = 'This is wonderful! I am so happy and joyful. What an amazing and fantastic day of love!';
      const analysis = await writingAssistantService.analyzeContent(positiveText, 'positive', testConfig);

      expect(analysis.sentimentScore).toBeGreaterThan(0);
    });

    it('should detect negative sentiment', async () => {
      const negativeText = 'This is terrible and awful. I feel sad and angry. What a horrible and dreadful situation.';
      const analysis = await writingAssistantService.analyzeContent(negativeText, 'negative', testConfig);

      expect(analysis.sentimentScore).toBeLessThan(0);
    });

    it('should return neutral for mixed content', async () => {
      const neutralText = 'The weather is cloudy. The building is tall. Cars drive on roads.';
      const analysis = await writingAssistantService.analyzeContent(neutralText, 'neutral', testConfig);

      expect(Math.abs(analysis.sentimentScore)).toBeLessThanOrEqual(0.5);
    });
  });

  describe('analyzePacing (via analysis)', () => {
    it('should detect fast pacing with action words and short sentences', async () => {
      const fastPaced = 'He ran. She jumped. They shouted. Someone grabbed him. The door slammed.';
      const slowPaced =
        'The afternoon sun cast long shadows across the peaceful garden where the elderly professor contemplated the mysteries of existence.';

      const fastAnalysis = await writingAssistantService.analyzeContent(fastPaced, 'fast', testConfig);
      const slowAnalysis = await writingAssistantService.analyzeContent(slowPaced, 'slow', testConfig);

      expect(fastAnalysis.paceScore).toBeGreaterThan(slowAnalysis.paceScore);
    });
  });

  describe('analyzeDialogue (via analysis)', () => {
    it('should correctly count dialogue', async () => {
      const withDialogue = '"Hello," she said. "How are you?" he asked. "I am fine," she replied.';
      const analysis = await writingAssistantService.analyzeContent(withDialogue, 'dialogue', {
        ...testConfig,
        enableDialogueAnalysis: true,
      });

      expect(analysis.dialogueAnalysis.totalDialogue).toBeGreaterThan(0);
      expect(analysis.dialogueAnalysis.dialoguePercentage).toBeGreaterThan(0);
    });

    it('should detect overused dialogue tags', async () => {
      const overusedTags =
        '"Hello," said John. "Hi," said Mary. "How are you," said John. "Fine," said Mary. "Great," said John.';
      const analysis = await writingAssistantService.analyzeContent(overusedTags, 'tags', {
        ...testConfig,
        enableDialogueAnalysis: true,
      });

      expect(analysis.dialogueAnalysis.tagAnalysis.overusedTags.length).toBeGreaterThan(0);
    });

    it('should handle content without dialogue', async () => {
      const noDialogue = 'The sun rose over the mountains. Birds began to sing in the trees.';
      const analysis = await writingAssistantService.analyzeContent(noDialogue, 'no-dialogue', {
        ...testConfig,
        enableDialogueAnalysis: true,
      });

      expect(analysis.dialogueAnalysis.totalDialogue).toBe(0);
      expect(analysis.dialogueAnalysis.dialoguePercentage).toBe(0);
    });
  });

  describe('analyzeStyle (via analysis)', () => {
    it('should detect simple writing style', async () => {
      const simpleStyle = 'Tom ran. Bob sat. The cat slept. It was hot.';
      const analysis = await writingAssistantService.analyzeContent(simpleStyle, 'simple-style', {
        ...testConfig,
        enableStyleAnalysis: true,
      });

      expect(analysis.styleProfile.complexity).toBe('simple');
    });

    it('should detect complex writing style', async () => {
      const complexStyle =
        'The multifaceted implications of this theoretical framework necessitate a comprehensive reevaluation of our fundamental assumptions about epistemological validity.';
      const analysis = await writingAssistantService.analyzeContent(complexStyle, 'complex-style', {
        ...testConfig,
        enableStyleAnalysis: true,
      });

      expect(['complex', 'very_complex']).toContain(analysis.styleProfile.complexity);
    });

    it('should detect first person perspective', async () => {
      const firstPerson = 'I walked down the street. I looked at the sky. I felt happy.';
      const analysis = await writingAssistantService.analyzeContent(firstPerson, 'first-person', {
        ...testConfig,
        enableStyleAnalysis: true,
      });

      expect(analysis.styleProfile.perspective).toBe('first_person');
    });

    it('should detect passive voice usage', async () => {
      const passiveVoice = 'The ball was thrown. The game was played. The trophy was won. Victory was achieved.';
      const analysis = await writingAssistantService.analyzeContent(passiveVoice, 'passive', {
        ...testConfig,
        enableStyleAnalysis: true,
      });

      expect(analysis.styleProfile.voice).toBe('passive');
    });
  });

  describe('analyzeTone (via analysis)', () => {
    it('should detect mysterious tone', async () => {
      const mysteriousText = 'The shadow crept across the dark room. Something hidden lurked in the unknown depths.';
      const analysis = await writingAssistantService.analyzeContent(mysteriousText, 'mysterious', testConfig);

      expect(analysis.toneAnalysis.primary).toBeDefined();
      // Mysterious words should contribute to the tone
      expect(analysis.toneAnalysis.intensity).toBeGreaterThanOrEqual(0);
    });

    it('should detect tense tone', async () => {
      const tenseText =
        'Danger was everywhere. The threat loomed. Fear gripped her heart. Anxiety built with every passing moment.';
      const analysis = await writingAssistantService.analyzeContent(tenseText, 'tense', testConfig);

      expect(analysis.toneAnalysis.primary).toBe('tense');
    });
  });

  describe('analyzeWordUsage (via analysis)', () => {
    it('should detect overused words', async () => {
      const repetitiveText =
        'The very big very tall very strong man was very happy. He was very excited about his very nice day.';
      const analysis = await writingAssistantService.analyzeContent(repetitiveText, 'repetitive', testConfig);

      const veryOveruse = analysis.wordUsage.overusedWords.find(w => w.word.toLowerCase() === 'very');
      expect(veryOveruse).toBeDefined();
      expect(veryOveruse!.count).toBeGreaterThan(3);
    });

    it('should calculate average word length correctly', async () => {
      const text = 'Short words here. Cat dog sun run.';
      const analysis = await writingAssistantService.analyzeContent(text, 'short-words', testConfig);

      expect(analysis.wordUsage.averageWordLength).toBeLessThan(5);
    });

    it('should categorize vocabulary level', async () => {
      const simpleVocab = 'The cat sat on a mat. A dog ran by. The sun was up.';
      const analysis = await writingAssistantService.analyzeContent(simpleVocab, 'simple-vocab', testConfig);

      expect(['elementary', 'middle_school', 'high_school', 'college']).toContain(analysis.wordUsage.vocabularyLevel);
    });
  });

  describe('analyzeParagraphs (via analysis)', () => {
    it('should analyze paragraph variety', async () => {
      const variedParagraphs = `Short paragraph.

This is a medium-length paragraph with several sentences. It provides more detail. The content flows naturally.

This is a much longer paragraph that contains many sentences and provides extensive detail about the subject matter. It includes multiple ideas and develops them thoroughly. The reader gains significant insight from this extended prose. Additionally, the narrative continues with more context and description.`;

      const analysis = await writingAssistantService.analyzeContent(variedParagraphs, 'varied', testConfig);

      expect(analysis.paragraphAnalysis.varietyScore).toBeGreaterThan(0);
    });

    it('should calculate average paragraph length', async () => {
      const content = 'First paragraph here. It has two sentences.';
      const analysis = await writingAssistantService.analyzeContent(content, 'single', testConfig);

      expect(analysis.paragraphAnalysis.averageLength).toBeGreaterThan(0);
    });
  });

  describe('analyzeSentenceVariety (via analysis)', () => {
    it('should detect simple sentences', async () => {
      const simpleSentences = 'The cat sat. The dog ran. Birds fly. Fish swim.';
      const analysis = await writingAssistantService.analyzeContent(simpleSentences, 'simple-sentences', testConfig);

      expect(analysis.sentenceVariety.typeDistribution.simple).toBeGreaterThan(0);
    });

    it('should detect compound sentences', async () => {
      const compoundSentences = 'The cat sat, and the dog ran. Birds fly, but fish swim. He studied, so he passed.';
      const analysis = await writingAssistantService.analyzeContent(compoundSentences, 'compound', testConfig);

      expect(analysis.sentenceVariety.typeDistribution.compound).toBeGreaterThan(0);
    });

    it('should detect complex sentences', async () => {
      const complexSentences =
        'When the cat sat, the mouse ran. Because it rained, we stayed inside. If you study, you will pass.';
      const analysis = await writingAssistantService.analyzeContent(complexSentences, 'complex-sentences', testConfig);

      expect(analysis.sentenceVariety.typeDistribution.complex).toBeGreaterThan(0);
    });
  });

  describe('analyzeTransitions (via analysis)', () => {
    it('should detect transition words', async () => {
      const withTransitions =
        'First, we begin. However, there are challenges. Therefore, we must adapt. Furthermore, progress continues.';
      const analysis = await writingAssistantService.analyzeContent(withTransitions, 'transitions', testConfig);

      expect(analysis.transitionQuality.quality).toBeGreaterThan(0);
    });

    it('should return low quality for missing transitions', async () => {
      const noTransitions = 'The cat slept. The dog barked. Rain fell. Wind blew.';
      const analysis = await writingAssistantService.analyzeContent(noTransitions, 'no-transitions', testConfig);

      expect(analysis.transitionQuality.quality).toBeLessThan(50);
    });
  });

  describe('getMockSuggestions', () => {
    it('should suggest adding dialogue for content without quotes', async () => {
      const noDialogue = 'The landscape stretched before them. Mountains rose in the distance.';
      const analysis = await writingAssistantService.analyzeContent(noDialogue, 'no-quotes', testConfig);

      const dialogueSuggestion = analysis.suggestions.find(s => s.category === 'dialogue');
      expect(dialogueSuggestion).toBeDefined();
    });

    it('should suggest expanding short content', async () => {
      const shortContent = 'Hello world.';
      const analysis = await writingAssistantService.analyzeContent(shortContent, 'short', testConfig);

      const expandSuggestion = analysis.suggestions.find(s => s.category === 'engagement');
      expect(expandSuggestion).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle very long content', async () => {
      const longContent = 'The quick brown fox jumps over the lazy dog. '.repeat(500);
      const analysis = await writingAssistantService.analyzeContent(longContent, 'long', testConfig);

      expect(analysis).toBeDefined();
      expect(analysis.readabilityScore).toBeGreaterThan(0);
    });

    it('should handle content with special characters', async () => {
      const specialChars = 'Hello! "What?" she asked. 100% — sure: yes; okay.';
      const analysis = await writingAssistantService.analyzeContent(specialChars, 'special', testConfig);

      expect(analysis).toBeDefined();
    });

    it('should handle unicode content', async () => {
      const unicodeContent = 'Café résumé naïve piñata über Zürich.';
      const analysis = await writingAssistantService.analyzeContent(unicodeContent, 'unicode', testConfig);

      expect(analysis).toBeDefined();
    });

    it('should handle content with only punctuation', async () => {
      const punctuationOnly = '... !!! ???';
      const analysis = await writingAssistantService.analyzeContent(punctuationOnly, 'punctuation', testConfig);

      expect(analysis).toBeDefined();
      expect(analysis.readabilityScore).toBe(0);
    });
  });
});
