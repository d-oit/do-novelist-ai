/**
 * AI Writing Assistant Service
 * Provides intelligent content analysis and writing suggestions
 * Uses Edge Functions for security - no API keys in client builds
 */

import { type Character } from '@/features/characters/types';
import {
  type ContentAnalysis,
  type WritingSuggestion,
  type WritingAssistantConfig,
  type PlotHoleDetection,
  type CharacterConsistencyIssue,
  type DialogueAnalysis,
  type StyleProfile,
  type WritingSuggestionCategory,
} from '@/features/writing-assistant/types';
import { logger } from '@/lib/logging/logger';

import {
  calculateReadabilityScore,
  analyzeSentiment,
  analyzePacing,
  calculateEngagementScore,
} from './writing-analyzers';
import {
  analyzeStyle,
  analyzeTone,
  analyzeWordUsage,
  analyzeParagraphs,
  analyzeSentenceVariety,
  analyzeTransitions,
} from './writing-style-analyzers';

class WritingAssistantService {
  private static instance: WritingAssistantService;

  private constructor() {
    // No API keys in client - using Edge Functions for security
    logger.debug('Writing Assistant Service initialized (using Edge Functions)', {
      component: 'WritingAssistantService',
    });
  }

  public static getInstance(): WritingAssistantService {
    WritingAssistantService.instance ??= new WritingAssistantService();
    return WritingAssistantService.instance;
  }

  public analyzeLocalMetrics(
    content: string,
    config: WritingAssistantConfig,
  ): Partial<ContentAnalysis> {
    const readabilityScore = calculateReadabilityScore(content);
    const sentimentScore = analyzeSentiment(content);
    const paceScore = analyzePacing(content);
    const engagementScore = calculateEngagementScore(content);
    const styleProfile = config.enableStyleAnalysis
      ? analyzeStyle(content)
      : this.getEmptyStyleProfile();
    const toneAnalysis = analyzeTone(content);
    const wordUsage = analyzeWordUsage(content);
    const paragraphAnalysis = analyzeParagraphs(content);
    const sentenceVariety = analyzeSentenceVariety(content);
    const transitionQuality = analyzeTransitions(content);

    return {
      readabilityScore,
      sentimentScore,
      paceScore,
      engagementScore,
      styleProfile,
      toneAnalysis,
      wordUsage,
      paragraphAnalysis,
      sentenceVariety,
      transitionQuality,
    };
  }

  public async analyzeContent(
    content: string,
    chapterId: string,
    config: WritingAssistantConfig,
    characterContext?: Character[],
    plotContext?: string,
  ): Promise<ContentAnalysis> {
    try {
      const suggestions = await this.generateWritingSuggestions(content, config);
      const localMetrics = this.analyzeLocalMetrics(content, config);

      const plotHoles = config.enablePlotHoleDetection
        ? this.detectPlotHoles(content, plotContext)
        : [];
      const characterIssues = config.enableCharacterTracking
        ? this.analyzeCharacterConsistency(characterContext)
        : [];
      const dialogueAnalysis = config.enableDialogueAnalysis
        ? this.analyzeDialogue(content)
        : this.getEmptyDialogueAnalysis();

      void import('@/lib/analytics').then(({ featureTracking }) => {
        featureTracking.trackFeatureUsage('writing-assistant', 'content_analysis', {
          length: content.length,
          readability: localMetrics.readabilityScore,
          sentiment: localMetrics.sentimentScore,
        });
      });

      return {
        chapterId,
        content,
        timestamp: new Date(),
        ...localMetrics,
        suggestions,
        plotHoles,
        characterIssues,
        dialogueAnalysis,
      } as ContentAnalysis;
    } catch (error) {
      logger.error('Content analysis failed', {
        component: 'WritingAssistantService',
        error: error instanceof Error ? error.message : String(error),
      });
      return this.getMockAnalysis(content, chapterId);
    }
  }

  private async generateWritingSuggestions(
    content: string,
    config: WritingAssistantConfig,
  ): Promise<WritingSuggestion[]> {
    void import('@/lib/analytics').then(({ featureTracking }) => {
      featureTracking.trackFeatureUsage('writing-assistant', 'ai_generation', {
        length: content.length,
        task: 'suggestions',
      });
    });

    try {
      const response = await fetch('/api/ai/writing-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          config: {
            targetAudience: config.targetAudience,
            preferredStyle: config.preferredStyle,
            genre: config.genre,
            enablePlotHoleDetection: config.enablePlotHoleDetection,
            enableCharacterTracking: config.enableCharacterTracking,
            enableDialogueAnalysis: config.enableDialogueAnalysis,
            enableStyleAnalysis: config.enableStyleAnalysis,
            minimumConfidence: config.minimumConfidence,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        logger.error('Writing Assistant API error', {
          status: response.status,
          error: error.error,
        });
        return this.getMockSuggestions(content);
      }

      const data = (await response.json()) as { suggestions: unknown[] };
      const rawSuggestions = data.suggestions as {
        id: string;
        type: string;
        severity: string;
        message: string;
        originalText: string;
        suggestedText: string;
        position: {
          start: number;
          end: number;
          line?: number;
          column?: number;
        };
        confidence: number;
        reasoning: string;
        category: string;
      }[];

      return rawSuggestions.map(
        (s): WritingSuggestion => ({
          id: s.id,
          type: s.type as WritingSuggestion['type'],
          severity: s.severity as WritingSuggestion['severity'],
          message: s.message,
          originalText: s.originalText ?? '',
          suggestedText: s.suggestedText,
          position: {
            start: s.position.start ?? 0,
            end: s.position.end ?? 0,
            line: s.position.line,
            column: s.position.column,
          },
          confidence: s.confidence ?? 0.7,
          reasoning: s.reasoning ?? '',
          category: s.category as WritingSuggestionCategory,
        }),
      );
    } catch (error) {
      logger.error('AI suggestion generation failed', {
        component: 'WritingAssistantService',
        error: error instanceof Error ? error.message : String(error),
      });
      return this.getMockSuggestions(content);
    }
  }

  private detectPlotHoles(content: string, plotContext?: string): PlotHoleDetection[] {
    const plotHoles: PlotHoleDetection[] = [];

    if (plotContext) {
      logger.info('Analyzing plot context:', {
        plotContext: plotContext.substring(0, 100) + '...',
      });
    }

    const timeReferences =
      content.match(
        /\b(yesterday|today|tomorrow|last week|next month|morning|evening|night)\b/gi,
      ) ?? [];
    if (timeReferences.length > 3) {
      plotHoles.push({
        id: `plot-hole-${Date.now()}`,
        type: 'timeline',
        severity: 'minor',
        description: 'Multiple time references detected. Ensure timeline consistency.',
        evidence: timeReferences,
        suggestedFix: 'Review temporal references for consistency',
        affectedChapters: [],
        confidence: 0.6,
      });
    }

    return plotHoles;
  }

  private analyzeCharacterConsistency(characterContext?: Character[]): CharacterConsistencyIssue[] {
    if (characterContext && characterContext.length > 0) {
      logger.info('Analyzing characters for consistency', {
        characterCount: characterContext.length,
      });
    }

    return [];
  }

  private analyzeDialogue(content: string): DialogueAnalysis {
    const dialogueMatches = content.match(/"[^"]*"/g) ?? [];
    const totalDialogue = dialogueMatches.length;
    const dialogueLength = dialogueMatches.join('').length;
    const dialoguePercentage = (dialogueLength / content.length) * 100;

    const tags =
      content.match(/\b(said|asked|replied|shouted|whispered|muttered|exclaimed)\b/gi) ?? [];
    const tagCounts = tags.reduce((acc: Record<string, number>, tag) => {
      const lower = tag.toLowerCase();
      acc[lower] = (acc[lower] ?? 0) + 1;
      return acc;
    }, {});

    const overusedTags = Object.entries(tagCounts)
      .filter(([, count]) => count > 3)
      .map(([tag, count]) => ({ tag, count }));

    return {
      totalDialogue,
      dialoguePercentage,
      speakerVariety: this.estimateSpeakerCount(content),
      averageDialogueLength: totalDialogue > 0 ? dialogueLength / totalDialogue : 0,
      issues: [],
      voiceConsistency: [],
      tagAnalysis: {
        totalTags: tags.length,
        varietyScore: Object.keys(tagCounts).length * 10,
        overusedTags,
        suggestions: overusedTags.length > 0 ? ['Vary dialogue tags for better flow'] : [],
      },
    };
  }

  private estimateSpeakerCount(content: string): number {
    const paragraphs = content.split('\n\n');
    const dialogueParagraphs = paragraphs.filter(p => p.includes('"'));
    return Math.min(dialogueParagraphs.length, 6);
  }

  private getEmptyDialogueAnalysis(): DialogueAnalysis {
    return {
      totalDialogue: 0,
      dialoguePercentage: 0,
      speakerVariety: 0,
      averageDialogueLength: 0,
      issues: [],
      voiceConsistency: [],
      tagAnalysis: { totalTags: 0, varietyScore: 0, overusedTags: [], suggestions: [] },
    };
  }

  private getEmptyStyleProfile(): StyleProfile {
    return {
      complexity: 'moderate',
      formality: 'neutral',
      voice: 'active',
      perspective: 'third_limited',
      tense: 'past',
      strengths: [],
      improvements: [],
      consistency: 0,
    };
  }

  private getMockSuggestions(content: string): WritingSuggestion[] {
    const suggestions: WritingSuggestion[] = [];

    if (content.length < 100) {
      suggestions.push({
        id: 'mock-1',
        type: 'structure',
        severity: 'suggestion',
        message: 'Consider expanding this section for better development',
        originalText: content.substring(0, 50),
        suggestedText: 'Add more descriptive details or dialogue',
        position: { start: 0, end: 50 },
        confidence: 0.8,
        reasoning: 'Short sections may need more development',
        category: 'engagement',
      });
    }

    if (!content.includes('"')) {
      suggestions.push({
        id: 'mock-2',
        type: 'style',
        severity: 'suggestion',
        message: 'Consider adding dialogue to make this scene more engaging',
        originalText: '',
        position: { start: Math.floor(content.length / 2), end: Math.floor(content.length / 2) },
        confidence: 0.7,
        reasoning: 'Dialogue can improve reader engagement',
        category: 'dialogue',
      });
    }

    return suggestions;
  }

  private getMockAnalysis(content: string, chapterId: string): ContentAnalysis {
    return {
      chapterId,
      content,
      timestamp: new Date(),
      readabilityScore: calculateReadabilityScore(content),
      sentimentScore: 0.1,
      paceScore: 65,
      engagementScore: 70,
      suggestions: this.getMockSuggestions(content),
      plotHoles: [],
      characterIssues: [],
      dialogueAnalysis: this.analyzeDialogue(content),
      styleProfile: analyzeStyle(content),
      toneAnalysis: analyzeTone(content),
      wordUsage: analyzeWordUsage(content),
      paragraphAnalysis: analyzeParagraphs(content),
      sentenceVariety: analyzeSentenceVariety(content),
      transitionQuality: analyzeTransitions(content),
    };
  }
}

export const writingAssistantService = WritingAssistantService.getInstance();
