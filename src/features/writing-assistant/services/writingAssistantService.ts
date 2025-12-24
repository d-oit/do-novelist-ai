/**
 * AI Writing Assistant Service
 * Provides intelligent content analysis and writing suggestions
 */

import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';
import type { LanguageModel } from 'ai';

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

// Raw AI response type for suggestions
interface RawAISuggestion {
  type?: string;
  severity?: string;
  message: string;
  originalText?: string;
  suggestedText?: string;
  position?: {
    start?: number;
    end?: number;
    line?: number;
    column?: number;
  };
  confidence?: number;
  reasoning?: string;
  category?: WritingSuggestionCategory;
}

class WritingAssistantService {
  private static instance: WritingAssistantService;
  private readonly genAI: LanguageModel | null;

  private constructor() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

    // Only log API key warning in non-test environments
    if (!apiKey && import.meta.env.PROD !== true && import.meta.env.NODE_ENV !== 'test') {
      logger.warn('Gemini API key not found. Writing assistant will use mock data.', {
        component: 'WritingAssistantService',
      });
    }

    if (apiKey == null) {
      this.genAI = null;
    } else {
      // Initialize with OpenRouter SDK
      const openrouter = createOpenRouter({
        apiKey,
      });
      this.genAI = openrouter('google/gemini-pro') as unknown as LanguageModel;
    }
  }

  public static getInstance(): WritingAssistantService {
    WritingAssistantService.instance ??= new WritingAssistantService();
    return WritingAssistantService.instance;
  }

  /**
   * Analyze chapter content and provide comprehensive feedback
   */
  public async analyzeContent(
    content: string,
    chapterId: string,
    config: WritingAssistantConfig,
    characterContext?: Character[],
    plotContext?: string,
  ): Promise<ContentAnalysis> {
    try {
      // Run parallel analyses
      const suggestions = await this.generateWritingSuggestions(content, config);
      const readabilityScore = calculateReadabilityScore(content);
      const sentimentScore = analyzeSentiment(content);
      const paceScore = analyzePacing(content);
      const engagementScore = calculateEngagementScore(content);
      const plotHoles = config.enablePlotHoleDetection
        ? this.detectPlotHoles(content, plotContext)
        : [];
      const characterIssues = config.enableCharacterTracking
        ? this.analyzeCharacterConsistency(characterContext)
        : [];
      const dialogueAnalysis = config.enableDialogueAnalysis
        ? this.analyzeDialogue(content)
        : this.getEmptyDialogueAnalysis();
      const styleProfile = config.enableStyleAnalysis
        ? analyzeStyle(content)
        : this.getEmptyStyleProfile();
      const toneAnalysis = analyzeTone(content);
      const wordUsage = analyzeWordUsage(content);
      const paragraphAnalysis = analyzeParagraphs(content);
      const sentenceVariety = analyzeSentenceVariety(content);
      const transitionQuality = analyzeTransitions(content);

      return {
        chapterId,
        content,
        timestamp: new Date(),
        readabilityScore,
        sentimentScore,
        paceScore,
        engagementScore,
        suggestions,
        plotHoles,
        characterIssues,
        dialogueAnalysis,
        styleProfile,
        toneAnalysis,
        wordUsage,
        paragraphAnalysis,
        sentenceVariety,
        transitionQuality,
      };
    } catch (error) {
      logger.error('Content analysis failed', {
        component: 'WritingAssistantService',
        error: error instanceof Error ? error.message : String(error),
      });
      return this.getMockAnalysis(content, chapterId);
    }
  }

  /**
   * Generate intelligent writing suggestions using AI
   */
  private async generateWritingSuggestions(
    content: string,
    config: WritingAssistantConfig,
  ): Promise<WritingSuggestion[]> {
    if (import.meta.env.VITE_GEMINI_API_KEY == null || this.genAI == null) {
      return this.getMockSuggestions(content);
    }

    try {
      // genAI is guaranteed to be non-null here due to the check above
      const prompt = `
        Analyze the following text and provide writing suggestions. Focus on:
        - Style improvements (clarity, flow, engagement)
        - Tone consistency
        - Pacing issues
        - Character voice consistency
        - Dialogue enhancement
        - Show vs. tell opportunities
        - Grammar and readability

        Target audience: ${config.targetAudience}
        Preferred style: ${config.preferredStyle}
        ${config.genre != null ? `Genre: ${config.genre}` : ''}

        Please provide suggestions in JSON format with:
        - type: category of suggestion
        - severity: info/suggestion/warning/error
        - message: clear description
        - originalText: problematic text (if applicable)
        - suggestedText: improved version (if applicable)
        - position: {start, end} character positions
        - confidence: 0-1 score
        - reasoning: explanation
        - category: specific category from readability/engagement/consistency/flow/dialogue/description/character_voice/plot_structure/show_vs_tell

        Text to analyze:
        "${content.substring(0, 2000)}${content.length > 2000 ? '...' : ''}"
      `;

      const result = await generateText({
        model: this.genAI,
        prompt,
        temperature: 0.7,
        // Disable AI SDK logging to prevent "m.log is not a function" error
        experimental_telemetry: { isEnabled: false },
      });

      return this.parseAISuggestions(result.text, config);
    } catch (error) {
      logger.error('AI suggestion generation failed', {
        component: 'WritingAssistantService',
        error: error instanceof Error ? error.message : String(error),
      });
      return this.getMockSuggestions(content);
    }
  }

  /**
   * Parse AI response into structured suggestions
   */
  private parseAISuggestions(
    aiResponse: string,
    config: WritingAssistantConfig,
  ): WritingSuggestion[] {
    try {
      // Try to extract JSON from response
      const jsonMatch = /\[[\s\S]*\]/.exec(aiResponse);
      if (!jsonMatch) {
        return this.extractSuggestionsFromText(aiResponse);
      }

      const suggestions: RawAISuggestion[] = JSON.parse(jsonMatch[0]) as RawAISuggestion[];
      return suggestions
        .filter((s: RawAISuggestion) => (s.confidence ?? 0.7) >= config.minimumConfidence)
        .map(
          (s: RawAISuggestion, index: number): WritingSuggestion => ({
            id: `ai-suggestion-${Date.now()}-${index}`,
            type: (s.type as WritingSuggestion['type']) ?? 'style',
            severity: (s.severity as WritingSuggestion['severity']) ?? 'suggestion',
            message: s.message,
            originalText: s.originalText ?? '',
            suggestedText: s.suggestedText,
            position: s.position
              ? {
                  start: s.position.start ?? 0,
                  end: s.position.end ?? 0,
                  line: s.position.line,
                  column: s.position.column,
                }
              : { start: 0, end: 0 },
            confidence: s.confidence ?? 0.7,
            reasoning: s.reasoning ?? '',
            category: s.category ?? 'readability',
          }),
        );
    } catch (error) {
      logger.error('Failed to parse AI suggestions', {
        component: 'WritingAssistantService',
        error: error instanceof Error ? error.message : String(error),
      });
      return this.extractSuggestionsFromText(aiResponse);
    }
  }

  /**
   * Extract suggestions from unstructured AI response
   */
  private extractSuggestionsFromText(text: string): WritingSuggestion[] {
    const suggestions: WritingSuggestion[] = [];
    const lines = text.split('\n').filter(line => line.trim());

    lines.forEach((line, index) => {
      if (line.includes('suggestion') || line.includes('improve') || line.includes('consider')) {
        suggestions.push({
          id: `parsed-suggestion-${index}`,
          type: 'style',
          severity: 'suggestion',
          message: line.trim(),
          originalText: '',
          position: { start: 0, end: 0 },
          confidence: 0.6,
          reasoning: 'Extracted from AI response',
          category: 'readability',
        });
      }
    });

    return suggestions.slice(0, 5);
  }

  /**
   * Detect potential plot holes
   */
  private detectPlotHoles(content: string, plotContext?: string): PlotHoleDetection[] {
    // This would use AI to analyze plot consistency
    // For now, return basic detection
    const plotHoles: PlotHoleDetection[] = [];

    // Use provided plot context if available
    if (plotContext) {
      // Could use AI to analyze plot context for consistency
      logger.info('Analyzing plot context:', {
        plotContext: plotContext.substring(0, 100) + '...',
      });
    }

    // Check for timeline inconsistencies
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

  /**
   * Analyze character consistency
   */
  private analyzeCharacterConsistency(characterContext?: Character[]): CharacterConsistencyIssue[] {
    // This would cross-reference character behavior, speech patterns, etc.
    // Basic implementation for now

    // Use provided character context if available
    if (characterContext && characterContext.length > 0) {
      // Could use AI to analyze character consistency with provided context
      logger.info('Analyzing characters for consistency', {
        characterCount: characterContext.length,
      });
    }

    return [];
  }

  /**
   * Analyze dialogue quality
   */
  private analyzeDialogue(content: string): DialogueAnalysis {
    const dialogueMatches = content.match(/"[^"]*"/g) ?? [];
    const totalDialogue = dialogueMatches.length;
    const dialogueLength = dialogueMatches.join('').length;
    const dialoguePercentage = (dialogueLength / content.length) * 100;

    // Basic dialogue tag analysis
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

  /**
   * Helper methods for empty states
   */
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

  /**
   * Generate mock suggestions for testing
   */
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

  /**
   * Generate mock analysis for testing
   */
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
