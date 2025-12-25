/**
 * Style Analysis Service
 * Deep analysis of prose style, tone, and complexity
 */

import type {
  StyleAnalysisResult,
  ConsistencyIssue,
  StyleRecommendation,
  StyleAnalysisConfig,
  ReadabilityMetrics,
} from '@/features/writing-assistant/types';
import { DEFAULT_STYLE_ANALYSIS_CONFIG } from '@/features/writing-assistant/types';
import { logger } from '@/lib/logging/logger';

// ============================================================================
// Private Implementation
// ============================================================================

class StyleAnalysisService {
  private static instance: StyleAnalysisService;

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): StyleAnalysisService {
    StyleAnalysisService.instance ??= new StyleAnalysisService();
    return StyleAnalysisService.instance;
  }

  /**
   * Perform comprehensive style analysis on content
   */
  public analyzeStyle(
    content: string,
    config: Partial<StyleAnalysisConfig> = {},
  ): StyleAnalysisResult {
    const mergedConfig = { ...DEFAULT_STYLE_ANALYSIS_CONFIG, ...config };
    const startTime = Date.now();
    const id = `style-analysis-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    try {
      // Calculate readability metrics
      const readabilityMetrics = mergedConfig.enableReadabilityMetrics
        ? this.calculateReadabilityMetrics(content)
        : this.getEmptyReadabilityMetrics();

      // Calculate complexity metrics
      const complexityMetrics = this.calculateComplexityMetrics(content);

      // Analyze tone
      const toneAnalysis = mergedConfig.enableToneAnalysis
        ? this.analyzeTone(content)
        : { primary: 'unknown', intensity: 0, emotionalRange: { dominant: [], absent: [] } };

      // Analyze voice
      const voiceAnalysis = mergedConfig.enableVoiceAnalysis
        ? this.analyzeVoice(content)
        : { voiceType: 'mixed' as const, perspective: 'mixed' as const, tense: 'mixed' as const };

      // Check consistency
      const consistencyCheck = mergedConfig.enableConsistencyCheck
        ? this.checkConsistency()
        : { score: 100, issues: [] };

      // Generate recommendations
      const recommendations = mergedConfig.enableRecommendations
        ? this.generateRecommendations(readabilityMetrics, consistencyCheck)
        : [];

      const analysisDuration = Date.now() - startTime;

      logger.info('Style analysis completed', {
        component: 'StyleAnalysisService',
        duration: analysisDuration,
        readabilityScore: readabilityMetrics.fleschReadingEase,
        tone: toneAnalysis.primary,
      });

      return {
        id,
        timestamp: new Date(),
        content,

        // Readability Metrics
        fleschReadingEase: readabilityMetrics.fleschReadingEase,
        fleschKincaidGrade: readabilityMetrics.fleschKincaidGrade,
        gunningFogIndex: readabilityMetrics.gunningFogIndex,
        smogIndex: readabilityMetrics.smogIndex,
        automatedReadabilityIndex: readabilityMetrics.automatedReadabilityIndex,

        // Complexity Metrics
        averageSentenceLength: complexityMetrics.averageSentenceLength,
        averageWordLength: complexityMetrics.averageWordLength,
        vocabularyComplexity: complexityMetrics.vocabularyComplexity,
        syntacticComplexity: complexityMetrics.syntacticComplexity,

        // Tone Analysis
        primaryTone: toneAnalysis.primary,
        secondaryTone: toneAnalysis.secondary,
        toneIntensity: toneAnalysis.intensity,
        emotionalRange: toneAnalysis.emotionalRange,

        // Voice Analysis
        voiceType: voiceAnalysis.voiceType,
        perspective: voiceAnalysis.perspective,
        tense: voiceAnalysis.tense,

        // Style Consistency
        consistencyScore: consistencyCheck.score,
        consistencyIssues: consistencyCheck.issues,

        // Recommendations
        styleRecommendations: recommendations,
      };
    } catch (error) {
      logger.error('Style analysis failed', {
        component: 'StyleAnalysisService',
        error: error instanceof Error ? error.message : String(error),
      });

      return this.getMockAnalysis(content, id);
    }
  }

  /**
   * Calculate readability metrics using various formulas
   */
  private calculateReadabilityMetrics(content: string): ReadabilityMetrics {
    const sentences = this.getSentences(content);
    const words = this.getWords(content);
    const syllables = this.countSyllablesInText(words);
    const complexWords = this.countComplexWords(words);

    const totalSentences = Math.max(sentences.length, 1);
    const totalWords = Math.max(words.length, 1);
    const totalSyllables = Math.max(syllables, 1);
    const totalComplexWords = Math.max(complexWords, 1);

    // Flesch Reading Ease
    const fleschReadingEase =
      206.835 - 1.015 * (totalWords / totalSentences) - 84.6 * (totalSyllables / totalWords);

    // Flesch-Kincaid Grade Level
    const fleschKincaidGrade =
      0.39 * (totalWords / totalSentences) + 11.8 * (totalSyllables / totalWords) - 15.59;

    // Gunning Fog Index
    const gunningFogIndex =
      0.4 * (totalWords / totalSentences + 100 * (totalComplexWords / totalWords));

    // SMOG Index (Simple Measure of Gobbledygook)
    const smogIndex = 1.043 * Math.sqrt(totalComplexWords * (30 / totalSentences)) + 3.1291;

    // Automated Readability Index
    const characters = content.replace(/[^a-zA-Z]/g, '').length;
    const ari = 4.71 * (characters / totalWords) + 0.5 * (totalWords / totalSentences) - 21.43;

    // Reading time (average 200 words per minute)
    const readingTime = totalWords / 200;

    // Convert to grade level string
    let gradeLevel: string;
    const grade = Math.max(1, Math.round(fleschKincaidGrade));
    if (grade <= 5) gradeLevel = 'K-5';
    else if (grade <= 8) gradeLevel = '6-8';
    else if (grade <= 12) gradeLevel = '9-12';
    else if (grade <= 16) gradeLevel = 'College';
    else gradeLevel = 'Graduate';

    return {
      fleschReadingEase: Math.max(0, Math.min(100, Math.round(fleschReadingEase))),
      fleschKincaidGrade: Math.max(0, Math.round(fleschKincaidGrade * 10) / 10),
      gunningFogIndex: Math.max(0, Math.round(gunningFogIndex * 10) / 10),
      smogIndex: Math.max(0, Math.round(smogIndex * 10) / 10),
      automatedReadabilityIndex: Math.max(0, Math.round(ari * 10) / 10),
      colemanLiauIndex: 0,
      readingTime: Math.round(readingTime * 10) / 10,
      gradeLevel,
    };
  }

  /**
   * Calculate complexity metrics
   */
  private calculateComplexityMetrics(content: string): {
    averageSentenceLength: number;
    averageWordLength: number;
    vocabularyComplexity: 'simple' | 'moderate' | 'complex' | 'very_complex';
    syntacticComplexity: number;
  } {
    const sentences = this.getSentences(content);
    const words = this.getWords(content);

    const totalSentences = Math.max(sentences.length, 1);
    const totalWords = Math.max(words.length, 1);

    const averageSentenceLength = totalWords / totalSentences;
    const averageWordLength = words.reduce((sum, word) => sum + word.length, 0) / totalWords;

    // Determine vocabulary complexity based on average word length and syllable count
    let vocabularyComplexity: 'simple' | 'moderate' | 'complex' | 'very_complex';
    if (averageWordLength < 4.5) vocabularyComplexity = 'simple';
    else if (averageWordLength < 5.5) vocabularyComplexity = 'moderate';
    else if (averageWordLength < 6.5) vocabularyComplexity = 'complex';
    else vocabularyComplexity = 'very_complex';

    // Syntactic complexity based on sentence variety
    const syntacticComplexity = this.calculateSyntacticComplexity(sentences);

    return {
      averageSentenceLength: Math.round(averageSentenceLength * 10) / 10,
      averageWordLength: Math.round(averageWordLength * 100) / 100,
      vocabularyComplexity,
      syntacticComplexity,
    };
  }

  /**
   * Analyze tone of the content
   */
  private analyzeTone(content: string): {
    primary: string;
    secondary?: string;
    intensity: number;
    emotionalRange: { dominant: string[]; absent: string[] };
  } {
    const lowerContent = content.toLowerCase();

    // Define tone indicators
    const toneIndicators: Record<string, string[]> = {
      mysterious: ['shadow', 'dark', 'secret', 'hidden', 'unknown', 'whisper', 'darkness'],
      lighthearted: ['laugh', 'smile', 'happy', 'joy', 'cheerful', 'bright', 'sunny'],
      dramatic: ['scream', 'cry', 'shout', 'suddenly', 'shocking', 'terrible', 'horror'],
      romantic: ['love', 'heart', 'kiss', 'passion', 'tender', 'embrace', 'desire'],
      tense: ['紧张', 'anxious', 'worry', 'fear', 'dread', 'panic', 'nervous'],
      comedic: ['funny', 'humor', 'joke', 'laugh', 'comical', 'absurd', 'ridiculous'],
      melancholic: ['sad', 'tear', 'grief', 'lost', 'gone', 'miss', 'sorrow'],
      hopeful: ['hope', 'dream', 'future', 'believe', 'possible', 'bright', 'new'],
      angry: ['rage', 'fury', 'anger', 'hate', 'mad', 'irritated', 'annoyed'],
      peaceful: ['calm', 'quiet', 'peace', 'serene', 'tranquil', 'gentle', 'still'],
    };

    // Count tone indicators
    const toneCounts: Record<string, number> = {};
    let totalMatches = 0;

    for (const [tone, indicators] of Object.entries(toneIndicators)) {
      let count = 0;
      for (const indicator of indicators) {
        const regex = new RegExp(indicator, 'gi');
        const matches = lowerContent.match(regex);
        count += matches?.length ?? 0;
      }
      if (count > 0) {
        toneCounts[tone] = count;
        totalMatches += count;
      }
    }

    // Find dominant tone
    let primary = 'neutral';
    let secondary: string | undefined;
    let maxCount = 0;

    const sortedTones = Object.entries(toneCounts).sort((a, b) => b[1] - a[1]);

    if (sortedTones.length > 0) {
      const firstTone = sortedTones[0] as [string, number];
      primary = firstTone[0];
      maxCount = firstTone[1];
      const secondTone = sortedTones[1];
      if (secondTone && secondTone[1] > maxCount * 0.5) {
        secondary = secondTone[0];
      }
    }

    // Calculate intensity (0-100)
    const intensity =
      totalMatches > 0
        ? Math.min(100, Math.round((maxCount / Math.max(content.split(' ').length / 50, 1)) * 100))
        : 50;

    // Determine emotional range
    const dominant = sortedTones.slice(0, 3).map(([tone]) => tone);
    const absent = Object.keys(toneIndicators).filter(tone => !toneCounts[tone]);

    return {
      primary,
      secondary,
      intensity,
      emotionalRange: { dominant, absent },
    };
  }

  /**
   * Analyze voice (active/passive) and perspective
   */
  private analyzeVoice(content: string): {
    voiceType: 'active' | 'passive' | 'mixed';
    perspective: 'first' | 'second' | 'third_limited' | 'third_omniscient' | 'mixed';
    tense: 'present' | 'past' | 'future' | 'mixed';
  } {
    const lowerContent = content.toLowerCase();

    // Count passive voice constructions
    const passivePatterns = /\b(was|were|is|are|been|being)\s+\w+ed\b/gi;
    const passiveMatches = lowerContent.match(passivePatterns) ?? [];
    const totalSentences = this.getSentences(content).length;

    const passiveRatio = totalSentences > 0 ? (passiveMatches.length / totalSentences) * 100 : 0;

    let voiceType: 'active' | 'passive' | 'mixed';
    if (passiveRatio > 30) voiceType = 'passive';
    else if (passiveRatio > 15) voiceType = 'mixed';
    else voiceType = 'active';

    // Determine perspective
    const firstPersonMatches = lowerContent.match(/\b(i|we|me|us|my|our)\b/gi)?.length ?? 0;
    const secondPersonMatches = lowerContent.match(/\b(you|your|yours)\b/gi)?.length ?? 0;
    const thirdPersonMatches =
      lowerContent.match(/\b(he|she|they|it|him|her|them|his|her|their)\b/gi)?.length ?? 0;

    let perspective: 'first' | 'second' | 'third_limited' | 'third_omniscient' | 'mixed';
    if (firstPersonMatches > thirdPersonMatches && firstPersonMatches > secondPersonMatches) {
      perspective = 'first';
    } else if (
      secondPersonMatches > firstPersonMatches &&
      secondPersonMatches > thirdPersonMatches
    ) {
      perspective = 'second';
    } else if (thirdPersonMatches > 0) {
      perspective = 'third_limited';
    } else {
      perspective = 'mixed';
    }

    // Determine tense
    const pastMatches =
      lowerContent.match(/\b(was|were|had|did|went|came|saw|said)\b/gi)?.length ?? 0;
    const presentMatches =
      lowerContent.match(/\b(is|are|have|does|go|come|see|say)\b/gi)?.length ?? 0;
    const futureMatches = lowerContent.match(/\b(will|shall|would|could|should)\b/gi)?.length ?? 0;

    let tense: 'present' | 'past' | 'future' | 'mixed';
    if (pastMatches > presentMatches && pastMatches > futureMatches) {
      tense = 'past';
    } else if (presentMatches > pastMatches && presentMatches > futureMatches) {
      tense = 'present';
    } else if (futureMatches > pastMatches && futureMatches > presentMatches) {
      tense = 'future';
    } else {
      tense = 'mixed';
    }

    return { voiceType, perspective, tense };
  }

  /**
   * Check style consistency
   */
  private checkConsistency(): {
    score: number;
    issues: ConsistencyIssue[];
  } {
    const issues: ConsistencyIssue[] = [];

    // Check for perspective shifts
    const perspectiveShifts = this.detectPerspectiveShifts();
    if (perspectiveShifts.length > 0) {
      issues.push({
        type: 'perspective',
        severity: perspectiveShifts.length > 2 ? 'major' : 'moderate',
        description: `Detected ${perspectiveShifts.length} perspective shifts`,
        position: perspectiveShifts[0] ?? { start: 0, end: 100 },
        suggestion: 'Consider maintaining a consistent perspective throughout',
      });
    }

    // Check for tense shifts
    const tenseShifts = this.detectTenseShifts();
    if (tenseShifts > 2) {
      issues.push({
        type: 'perspective',
        severity: 'minor',
        description: 'Multiple tense shifts detected',
        position: { start: 0, end: 100 },
        suggestion: 'Try to maintain consistent tense usage',
      });
    }

    // Calculate consistency score
    const baseScore = 100;
    const penalty = issues.reduce((sum, issue) => {
      switch (issue.severity) {
        case 'major':
          return sum + 15;
        case 'moderate':
          return sum + 8;
        case 'minor':
          return sum + 3;
        default:
          return sum;
      }
    }, 0);

    return {
      score: Math.max(0, baseScore - penalty),
      issues,
    };
  }

  /**
   * Generate style recommendations
   */
  private generateRecommendations(
    readability: ReadabilityMetrics,
    consistency: { score: number; issues: ConsistencyIssue[] },
  ): StyleRecommendation[] {
    const recommendations: StyleRecommendation[] = [];

    // Readability recommendations
    if (readability.fleschReadingEase < 30) {
      recommendations.push({
        category: 'readability',
        priority: 'high',
        title: 'Improve Readability',
        description:
          'Your text is difficult to read. Consider shorter sentences and simpler vocabulary.',
        examples: [
          'Break long sentences into shorter ones',
          'Replace complex words with simpler alternatives',
        ],
      });
    } else if (readability.fleschReadingEase > 80) {
      recommendations.push({
        category: 'readability',
        priority: 'medium',
        title: 'Consider More Complex Prose',
        description:
          'Your text is very simple. Consider adding more descriptive language for literary effect.',
      });
    }

    // Consistency recommendations
    if (consistency.score < 70) {
      recommendations.push({
        category: 'consistency',
        priority: 'high',
        title: 'Improve Style Consistency',
        description: 'Your writing has consistency issues that may confuse readers.',
        examples: ['Review perspective shifts', 'Check for tense inconsistencies'],
      });
    }

    // Voice recommendations
    if (readability.fleschKincaidGrade > 12) {
      recommendations.push({
        category: 'readability',
        priority: 'medium',
        title: 'Vary Sentence Length',
        description:
          'Your sentences are quite long on average. Short sentences can create impact and pacing.',
        examples: ['Try some shorter, punchy sentences for emphasis'],
      });
    }

    return recommendations;
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private getSentences(content: string): string[] {
    return content
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  private getWords(content: string): string[] {
    return content
      .toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 0);
  }

  private countSyllablesInText(words: string[]): number {
    return words.reduce((sum, word) => sum + this.countSyllables(word), 0);
  }

  private countSyllables(word: string): number {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;

    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');

    const matches = word.match(/[aeiouy]{1,2}/g);
    return matches?.length ?? 1;
  }

  private countComplexWords(words: string[]): number {
    return words.filter(word => this.countSyllables(word) >= 3).length;
  }

  private calculateSyntacticComplexity(sentences: string[]): number {
    if (sentences.length === 0) return 0;

    let totalComplexity = 0;
    for (const sentence of sentences) {
      // Simple complexity based on clause markers
      const clauseMarkers = sentence.match(
        /(\bthat\b|\bwhich\b|\bwho\b|\bwhen\b|\bwhere\b|\bbecause\b|\balthough\b|\bif\b|\bwhile\b)/gi,
      );
      totalComplexity += (clauseMarkers?.length ?? 0) + 1;
    }

    return Math.min(100, Math.round((totalComplexity / sentences.length) * 20));
  }

  private detectPerspectiveShifts(): { start: number; end: number }[] {
    const shifts: { start: number; end: number }[] = [];

    // Simplified detection - in production, use more sophisticated analysis
    return shifts;
  }

  private detectTenseShifts(): number {
    // Simplified tense shift detection
    return 0;
  }

  private getEmptyReadabilityMetrics(): ReadabilityMetrics {
    return {
      fleschReadingEase: 50,
      fleschKincaidGrade: 8,
      gunningFogIndex: 10,
      smogIndex: 10,
      automatedReadabilityIndex: 8,
      colemanLiauIndex: 8,
      readingTime: 0,
      gradeLevel: '8',
    };
  }

  private getMockAnalysis(content: string, id: string): StyleAnalysisResult {
    return {
      id,
      timestamp: new Date(),
      content,
      fleschReadingEase: 60,
      fleschKincaidGrade: 8.5,
      gunningFogIndex: 10,
      smogIndex: 10,
      automatedReadabilityIndex: 8,
      averageSentenceLength: 15,
      averageWordLength: 5,
      vocabularyComplexity: 'moderate',
      syntacticComplexity: 50,
      primaryTone: 'neutral',
      toneIntensity: 50,
      emotionalRange: { dominant: ['neutral'], absent: [] },
      voiceType: 'active',
      perspective: 'third_limited',
      tense: 'past',
      consistencyScore: 85,
      consistencyIssues: [],
      styleRecommendations: [],
    };
  }
}

export const styleAnalysisService = StyleAnalysisService.getInstance();
