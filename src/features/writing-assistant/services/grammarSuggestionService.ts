/**
 * Grammar Suggestion Service
 * AI-powered grammar and clarity improvements
 *
 * Refactored for better organization and maintainability.
 * Rule checking logic extracted to separate modules:
 * - grammar-rules/: Individual checker modules
 * - grammar-utils/: Shared constants and helpers
 */

import type {
  GrammarSuggestion,
  GrammarAnalysisResult,
  GrammarConfig,
  ClarityMetrics,
} from '@/features/writing-assistant/types';
import { DEFAULT_GRAMMAR_CONFIG } from '@/features/writing-assistant/types';
import { logger } from '@/lib/logging/logger';

// Import checker modules
import { checkGrammar } from './grammar-rules/grammar-checker';
import { checkPunctuation } from './grammar-rules/punctuation-checker';
import { checkSpelling } from './grammar-rules/spelling-checker';
import {
  checkClarity,
  checkStyle,
  checkRedundancy,
  checkPassiveVoice,
} from './grammar-rules/style-checker';
// Import constants and helpers
import { WORDY_PHRASES, PASSIVE_PATTERNS } from './grammar-utils/constants';
import { countSyllables } from './grammar-utils/helpers';

// ============================================================================
// Private Implementation
// ============================================================================

class GrammarSuggestionService {
  private static instance: GrammarSuggestionService;

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): GrammarSuggestionService {
    GrammarSuggestionService.instance ??= new GrammarSuggestionService();
    return GrammarSuggestionService.instance;
  }

  /**
   * Perform comprehensive grammar analysis
   */
  public analyzeGrammar(
    content: string,
    config: Partial<GrammarConfig> = {},
  ): GrammarAnalysisResult {
    const mergedConfig = { ...DEFAULT_GRAMMAR_CONFIG, ...config };
    const startTime = Date.now();
    const id = `grammar-analysis-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    try {
      const suggestions: GrammarSuggestion[] = [];

      // Run various checks based on config using imported checker modules
      if (mergedConfig.checkGrammar) {
        suggestions.push(...checkGrammar(content));
      }
      if (mergedConfig.checkSpelling) {
        suggestions.push(...checkSpelling(content));
      }
      if (mergedConfig.checkPunctuation) {
        suggestions.push(...checkPunctuation(content));
      }
      if (mergedConfig.checkClarity) {
        suggestions.push(...checkClarity(content));
      }
      if (mergedConfig.checkStyle) {
        suggestions.push(...checkStyle(content));
      }
      if (mergedConfig.checkRedundancy) {
        suggestions.push(...checkRedundancy(content));
      }
      if (mergedConfig.checkPassiveVoice) {
        suggestions.push(...checkPassiveVoice(content));
      }

      // Filter by confidence and limit
      const filteredSuggestions = suggestions
        .filter(s => s.confidence >= (mergedConfig.minimumConfidence ?? 0.7))
        .sort((a, b) => {
          // Sort by severity first
          const severityOrder = { error: 0, warning: 1, suggestion: 2, info: 3 };
          const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
          if (severityDiff !== 0) return severityDiff;
          return b.confidence - a.confidence;
        })
        .slice(0, mergedConfig.maxSuggestions ?? 20);

      // Calculate stats
      const stats = {
        totalIssues: filteredSuggestions.length,
        errorCount: filteredSuggestions.filter(s => s.severity === 'error').length,
        warningCount: filteredSuggestions.filter(s => s.severity === 'warning').length,
        suggestionCount: filteredSuggestions.filter(s => s.severity === 'suggestion').length,
        infoCount: filteredSuggestions.filter(s => s.severity === 'info').length,
      };

      // Calculate readability impact
      const readabilityImpact = this.calculateReadabilityImpact(content, filteredSuggestions);

      const analysisDuration = Date.now() - startTime;

      logger.info('Grammar analysis completed', {
        component: 'GrammarSuggestionService',
        duration: analysisDuration,
        totalIssues: stats.totalIssues,
        errorCount: stats.errorCount,
      });

      return {
        id,
        timestamp: new Date(),
        content,
        suggestions: filteredSuggestions,
        stats,
        readabilityImpact,
      };
    } catch (error) {
      logger.error('Grammar analysis failed', {
        component: 'GrammarSuggestionService',
        error: error instanceof Error ? error.message : String(error),
      });

      return this.getMockAnalysis(content, id);
    }
  }

  /**
   * Calculate clarity metrics
   */
  public calculateClarityMetrics(content: string): ClarityMetrics {
    const words = content.split(/\s+/).filter(w => w.length > 0);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);

    const avgWordsPerSentence = words.length / Math.max(sentences.length, 1);
    const complexWordRatio =
      words.filter(w => countSyllables(w) >= 3).length / Math.max(words.length, 1);

    // Calculate passive voice ratio
    let passiveCount = 0;
    for (const pattern of PASSIVE_PATTERNS) {
      const matches = content.match(pattern);
      passiveCount += matches?.length ?? 0;
    }
    const passiveVoiceRatio = (passiveCount / Math.max(sentences.length, 1)) * 100;

    // Check for wordy phrases
    let wordyCount = 0;
    for (const phrase of Object.keys(WORDY_PHRASES)) {
      // eslint-disable-next-line security/detect-non-literal-regexp -- phrase comes from controlled WORDY_PHRASES constant
      const matches = content.match(new RegExp(`\\b${phrase}\\b`, 'gi'));
      wordyCount += matches?.length ?? 0;
    }
    const wordinessScore = Math.max(0, 100 - wordyCount * 10);

    // Calculate overall clarity score
    const clarityScore = Math.max(
      0,
      Math.min(
        100,
        100 -
          (avgWordsPerSentence > 20 ? (avgWordsPerSentence - 20) * 2 : 0) -
          (complexWordRatio > 0.3 ? (complexWordRatio - 0.3) * 50 : 0) -
          (passiveVoiceRatio > 20 ? (passiveVoiceRatio - 20) * 0.5 : 0) -
          wordyCount * 5,
      ),
    );

    return {
      clarityScore: Math.round(clarityScore),
      sentenceComplexity: Math.min(100, Math.round(avgWordsPerSentence * 3)),
      wordinessScore,
      passiveVoiceRatio,
      averageWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
      complexWordRatio: Math.round(complexWordRatio * 100),
      suggestions: [],
    };
  }

  private calculateReadabilityImpact(_content: string, suggestions: GrammarSuggestion[]): number {
    if (suggestions.length === 0) return 100;

    const impact = suggestions.reduce((sum, s) => {
      switch (s.severity) {
        case 'error':
          return sum - 5;
        case 'warning':
          return sum - 3;
        case 'suggestion':
          return sum - 1;
        default:
          return sum;
      }
    }, 100);

    return Math.max(0, impact);
  }

  private getMockAnalysis(content: string, id: string): GrammarAnalysisResult {
    return {
      id,
      timestamp: new Date(),
      content,
      suggestions: [],
      stats: {
        totalIssues: 0,
        errorCount: 0,
        warningCount: 0,
        suggestionCount: 0,
        infoCount: 0,
      },
      readabilityImpact: 100,
    };
  }
}

export const grammarSuggestionService = GrammarSuggestionService.getInstance();
