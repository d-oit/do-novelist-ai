/**
 * AI Writing Assistant Service
 * Provides intelligent content analysis and writing suggestions
 */

import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText, type LanguageModel } from 'ai';
import {
  type ContentAnalysis,
  type WritingSuggestion,
  type WritingAssistantConfig,
  type PlotHoleDetection,
  type CharacterConsistencyIssue,
  type DialogueAnalysis,
  type StyleProfile,
  type ToneAnalysis,
  type WordUsageAnalysis,
  type ParagraphAnalysis,
  type SentenceVarietyAnalysis,
  type TransitionAnalysis,
  type WritingSuggestionCategory,
} from '../types';
import { type Character } from '../../characters/types';

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
    if (apiKey == null) {
      console.warn('Gemini API key not found. Writing assistant will use mock data.');
      this.genAI = null;
    } else {
      // Initialize with Vercel AI SDK
      const googleClient = createGoogleGenerativeAI({
        apiKey,
        baseURL: 'https://gateway.vercel.ai/v1/google',
      });
      this.genAI = googleClient('gemini-pro');
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
      const readabilityScore = this.calculateReadabilityScore(content);
      const sentimentScore = this.analyzeSentiment(content);
      const paceScore = this.analyzePacing(content);
      const engagementScore = this.calculateEngagementScore(content);
      const plotHoles = config.enablePlotHoleDetection
        ? this.detectPlotHoles(content, plotContext)
        : [];
      const characterIssues = config.enableCharacterTracking
        ? this.analyzeCharacterConsistency(content, characterContext)
        : [];
      const dialogueAnalysis = config.enableDialogueAnalysis
        ? this.analyzeDialogue(content)
        : this.getEmptyDialogueAnalysis();
      const styleProfile = config.enableStyleAnalysis
        ? this.analyzeStyle(content)
        : this.getEmptyStyleProfile();
      const toneAnalysis = this.analyzeTone(content);
      const wordUsage = this.analyzeWordUsage(content);
      const paragraphAnalysis = this.analyzeParagraphs(content);
      const sentenceVariety = this.analyzeSentenceVariety(content);
      const transitionQuality = this.analyzeTransitions(content);

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
      console.error(
        'Content analysis failed:',
        error instanceof Error ? error.message : String(error),
      );
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
      });

      return this.parseAISuggestions(result.text, config);
    } catch (error) {
      console.error(
        'AI suggestion generation failed:',
        error instanceof Error ? error.message : String(error),
      );
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
      console.error(
        'Failed to parse AI suggestions:',
        error instanceof Error ? error.message : String(error),
      );
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
   * Calculate Flesch Reading Ease score
   */
  private calculateReadabilityScore(content: string): number {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = content.split(/\s+/).filter(w => w.trim().length > 0);
    const syllables = words.reduce((count, word) => count + this.countSyllables(word), 0);

    if (sentences.length === 0 || words.length === 0) return 0;

    const avgSentenceLength = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;

    const score = 206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord;
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Count syllables in a word (approximate)
   */
  private countSyllables(word: string): number {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;

    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    const matches = word.match(/[aeiouy]{1,2}/g);
    return matches ? matches.length : 1;
  }

  /**
   * Analyze sentiment of the content
   */
  private analyzeSentiment(content: string): number {
    // Simple sentiment analysis based on word lists
    const positiveWords = [
      'happy',
      'joy',
      'love',
      'wonderful',
      'amazing',
      'brilliant',
      'fantastic',
    ];
    const negativeWords = ['sad', 'angry', 'hate', 'terrible', 'awful', 'horrible', 'dreadful'];

    const words = content.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;

    words.forEach(word => {
      if (positiveWords.some(pw => word.includes(pw))) positiveCount++;
      if (negativeWords.some(nw => word.includes(nw))) negativeCount++;
    });

    const total = positiveCount + negativeCount;
    if (total === 0) return 0;

    return (positiveCount - negativeCount) / total;
  }

  /**
   * Analyze pacing of the content
   */
  private analyzePacing(content: string): number {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength =
      sentences.reduce((acc, s) => acc + s.split(/\s+/).length, 0) / sentences.length;

    // Fast pacing: shorter sentences, more action words
    const actionWords = ['ran', 'jumped', 'shouted', 'grabbed', 'rushed', 'burst', 'slammed'];
    const actionCount = actionWords.reduce((count, word) => {
      return count + (content.toLowerCase().match(new RegExp(word, 'g')) ?? []).length;
    }, 0);

    // Score from 0-100 (0 = very slow, 100 = very fast)
    const lengthScore = Math.max(0, 100 - avgSentenceLength * 2);
    const actionScore = Math.min(100, actionCount * 10);

    return (lengthScore + actionScore) / 2;
  }

  /**
   * Calculate engagement score
   */
  private calculateEngagementScore(content: string): number {
    const factors = [
      this.analyzeDialogueRatio(content),
      this.analyzeQuestionUsage(content),
      this.analyzeSensoryDetails(content),
      this.analyzeVariety(content),
      this.analyzeConflictIndicators(content),
    ];

    return factors.reduce((acc, score) => acc + score, 0) / factors.length;
  }

  private analyzeDialogueRatio(content: string): number {
    const dialogueMatches = content.match(/"[^"]*"/g) ?? [];
    const dialogueLength = dialogueMatches.join('').length;
    const ratio = dialogueLength / content.length;

    // Ideal ratio is around 30-60%
    if (ratio >= 0.3 && ratio <= 0.6) return 100;
    if (ratio < 0.3) return ratio * 333; // Scale to 100 at 0.3
    return Math.max(0, 100 - (ratio - 0.6) * 250); // Decrease after 0.6
  }

  private analyzeQuestionUsage(content: string): number {
    const questions = (content.match(/\?/g) ?? []).length;
    const sentences = content.split(/[.!?]+/).length;
    const ratio = questions / sentences;

    return Math.min(100, ratio * 500); // Up to 20% questions is good
  }

  private analyzeSensoryDetails(content: string): number {
    const sensoryWords = [
      'saw',
      'heard',
      'felt',
      'tasted',
      'smelled',
      'touch',
      'sound',
      'sight',
      'scent',
    ];
    const words = content.toLowerCase().split(/\s+/);
    const sensoryCount = sensoryWords.reduce((count, word) => {
      return count + words.filter(w => w.includes(word)).length;
    }, 0);

    return Math.min(100, (sensoryCount / words.length) * 1000);
  }

  private analyzeVariety(content: string): number {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const lengths = sentences.map(s => s.split(/\s+/).length);

    if (lengths.length === 0) return 0;

    const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((acc, len) => acc + Math.pow(len - avg, 2), 0) / lengths.length;

    return Math.min(100, variance * 2); // Higher variance = more variety
  }

  private analyzeConflictIndicators(content: string): number {
    const conflictWords = [
      'but',
      'however',
      'although',
      'despite',
      'conflict',
      'problem',
      'struggle',
    ];
    const words = content.toLowerCase().split(/\s+/);
    const conflictCount = conflictWords.reduce((count, word) => {
      return count + words.filter(w => w.includes(word)).length;
    }, 0);

    return Math.min(100, (conflictCount / words.length) * 500);
  }

  /**
   * Detect potential plot holes
   */
  private detectPlotHoles(content: string, _plotContext?: string): PlotHoleDetection[] {
    // This would use AI to analyze plot consistency
    // For now, return basic detection
    const plotHoles: PlotHoleDetection[] = [];

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
  private analyzeCharacterConsistency(
    _content: string,
    _characterContext?: Character[],
  ): CharacterConsistencyIssue[] {
    // This would cross-reference character behavior, speech patterns, etc.
    // Basic implementation for now
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
      .filter(([_, count]) => count > 3)
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
    // Basic estimation - count paragraph breaks with dialogue
    const paragraphs = content.split('\n\n');
    const dialogueParagraphs = paragraphs.filter(p => p.includes('"'));
    return Math.min(dialogueParagraphs.length, 6); // Cap at reasonable number
  }

  /**
   * Analyze writing style
   */
  private analyzeStyle(content: string): StyleProfile {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = content.split(/\s+/).filter(w => w.trim().length > 0);

    const avgWordsPerSentence = words.length / sentences.length;
    const complexity =
      avgWordsPerSentence > 20
        ? 'very_complex'
        : avgWordsPerSentence > 15
          ? 'complex'
          : avgWordsPerSentence > 10
            ? 'moderate'
            : 'simple';

    // Analyze voice (active vs passive)
    const passiveIndicators = ['was', 'were', 'been', 'being'];
    const passiveCount = passiveIndicators.reduce((count, indicator) => {
      return (
        count + (content.toLowerCase().match(new RegExp(`\\b${indicator}\\b`, 'g')) ?? []).length
      );
    }, 0);
    const voice = passiveCount / sentences.length > 0.3 ? 'passive' : 'active';

    // Analyze perspective
    const firstPerson = (content.match(/\b[Ii]\b/g) ?? []).length;
    const secondPerson = (content.match(/\byou\b/gi) ?? []).length;
    const thirdPerson = (content.match(/\b(he|she|they)\b/gi) ?? []).length;

    const total = firstPerson + secondPerson + thirdPerson;
    let perspective: StyleProfile['perspective'] = 'third_limited';
    if (total > 0) {
      const firstRatio = firstPerson / total;
      const secondRatio = secondPerson / total;

      if (firstRatio > 0.6) perspective = 'first_person';
      else if (secondRatio > 0.3) perspective = 'second_person';
      else perspective = 'third_limited';
    }

    return {
      complexity,
      formality: 'neutral', // Would need more analysis
      voice,
      perspective,
      tense: 'past', // Would need more analysis
      strengths: [],
      improvements: [],
      consistency: 85, // Would calculate based on variations
    };
  }

  /**
   * Analyze tone
   */
  private analyzeTone(content: string): ToneAnalysis {
    // Basic tone analysis
    const moodWords = {
      mysterious: ['shadow', 'dark', 'hidden', 'secret', 'unknown'],
      lighthearted: ['laugh', 'smile', 'funny', 'joy', 'bright'],
      dramatic: ['intense', 'powerful', 'emotion', 'passion', 'conflict'],
      romantic: ['love', 'heart', 'tender', 'gentle', 'affection'],
      tense: ['danger', 'threat', 'fear', 'anxiety', 'worry'],
    };

    const words = content.toLowerCase().split(/\s+/);
    const moodScores: Record<string, number> = {};

    Object.entries(moodWords).forEach(([mood, keywords]) => {
      const score = keywords.reduce((count, keyword) => {
        return count + words.filter(word => word.includes(keyword)).length;
      }, 0);
      moodScores[mood] = score;
    });

    const dominantMood = Object.entries(moodScores).sort(([, a], [, b]) => b - a)[0];

    return {
      primary: dominantMood ? dominantMood[0] : 'neutral',
      intensity: dominantMood ? Math.min(100, dominantMood[1] * 20) : 50,
      consistency: 80,
      emotionalRange: {
        dominant: [dominantMood?.[0] ?? 'neutral'],
        absent: [],
        variety: Object.values(moodScores).filter(score => score > 0).length * 20,
      },
      moodProgression: [],
    };
  }

  /**
   * Analyze word usage patterns
   */
  private analyzeWordUsage(content: string): WordUsageAnalysis {
    const words = content
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.trim().length > 0);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);

    const wordCounts: Record<string, number> = {};
    words.forEach(word => {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (cleanWord.length > 3) {
        wordCounts[cleanWord] = (wordCounts[cleanWord] ?? 0) + 1;
      }
    });

    const overusedWords = Object.entries(wordCounts)
      .filter(([_, count]) => count > 3)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([word, count]) => ({
        word,
        count,
        suggestions: [`Try using synonyms for "${word}"`],
      }));

    const avgWordLength = words.reduce((acc, word) => acc + word.length, 0) / words.length;
    const avgSentenceLength = words.length / sentences.length;

    let vocabularyLevel: WordUsageAnalysis['vocabularyLevel'] = 'high_school';
    if (avgWordLength < 4) vocabularyLevel = 'elementary';
    else if (avgWordLength < 5) vocabularyLevel = 'middle_school';
    else if (avgWordLength > 6) vocabularyLevel = 'college';

    return {
      vocabularyLevel,
      averageWordLength: avgWordLength,
      averageSentenceLength: avgSentenceLength,
      overusedWords,
      weakWords: [],
      cliches: [],
      redundancies: [],
    };
  }

  /**
   * Analyze paragraph structure
   */
  private analyzeParagraphs(content: string): ParagraphAnalysis {
    const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
    const sentences = paragraphs.map(
      p => p.split(/[.!?]+/).filter(s => s.trim().length > 0).length,
    );

    const avgLength = sentences.reduce((acc, len) => acc + len, 0) / sentences.length;

    const distribution = {
      short: sentences.filter(len => len <= 2).length,
      medium: sentences.filter(len => len >= 3 && len <= 5).length,
      long: sentences.filter(len => len >= 6).length,
    };

    const varietyScore =
      (distribution.short > 0 ? 1 : 0) +
      (distribution.medium > 0 ? 1 : 0) +
      (distribution.long > 0 ? 1 : 0);

    return {
      averageLength: avgLength,
      varietyScore: (varietyScore / 3) * 100,
      lengthDistribution: distribution,
      recommendations: varietyScore < 2 ? ['Try varying paragraph lengths for better flow'] : [],
    };
  }

  /**
   * Analyze sentence variety
   */
  private analyzeSentenceVariety(content: string): SentenceVarietyAnalysis {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const lengths = sentences.map(s => s.split(/\s+/).length);
    const avgLength = lengths.reduce((acc, len) => acc + len, 0) / lengths.length;

    // Simple classification based on connectors and structure
    let simple = 0,
      compound = 0,
      complex = 0,
      compoundComplex = 0;

    sentences.forEach(sentence => {
      const coordinatingConjunctions = ['and', 'but', 'or', 'nor', 'for', 'so', 'yet'];
      const subordinatingConjunctions = [
        'because',
        'since',
        'although',
        'while',
        'if',
        'when',
        'where',
      ];

      const hasCoordinating = coordinatingConjunctions.some(conj =>
        sentence.toLowerCase().includes(` ${conj} `),
      );
      const hasSubordinating = subordinatingConjunctions.some(conj =>
        sentence.toLowerCase().includes(` ${conj} `),
      );

      if (hasCoordinating && hasSubordinating) compoundComplex++;
      else if (hasSubordinating) complex++;
      else if (hasCoordinating) compound++;
      else simple++;
    });

    const total = sentences.length;
    const varietyScore =
      total > 0
        ? (simple / total + compound / total + complex / total + compoundComplex / total) * 25
        : 0;

    return {
      averageLength: avgLength,
      varietyScore,
      typeDistribution: {
        simple: simple / total,
        compound: compound / total,
        complex: complex / total,
        compound_complex: compoundComplex / total,
      },
      recommendations: varietyScore < 50 ? ['Try using more varied sentence structures'] : [],
    };
  }

  /**
   * Analyze transitions between sentences/paragraphs
   */
  private analyzeTransitions(content: string): TransitionAnalysis {
    const transitions = [
      'however',
      'therefore',
      'meanwhile',
      'furthermore',
      'consequently',
      'additionally',
      'moreover',
      'nevertheless',
      'thus',
      'hence',
    ];

    const transitionCount = transitions.reduce((count, transition) => {
      return (
        count + (content.toLowerCase().match(new RegExp(`\\b${transition}\\b`, 'g')) ?? []).length
      );
    }, 0);

    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const transitionRatio = transitionCount / sentences.length;

    return {
      quality: Math.min(100, transitionRatio * 200), // Good ratio is around 0.1-0.2
      missingTransitions: [],
      weakTransitions: [],
    };
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
      readabilityScore: this.calculateReadabilityScore(content),
      sentimentScore: 0.1,
      paceScore: 65,
      engagementScore: 70,
      suggestions: this.getMockSuggestions(content),
      plotHoles: [],
      characterIssues: [],
      dialogueAnalysis: this.analyzeDialogue(content),
      styleProfile: this.analyzeStyle(content),
      toneAnalysis: this.analyzeTone(content),
      wordUsage: this.analyzeWordUsage(content),
      paragraphAnalysis: this.analyzeParagraphs(content),
      sentenceVariety: this.analyzeSentenceVariety(content),
      transitionQuality: this.analyzeTransitions(content),
    };
  }
}

export const writingAssistantService = WritingAssistantService.getInstance();
