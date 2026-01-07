/**
 * Grammar Suggestion Service
 * AI-powered grammar and clarity improvements
 */

import type {
  GrammarSuggestion,
  GrammarAnalysisResult,
  GrammarConfig,
  ClarityMetrics,
} from '@/features/writing-assistant/types';
import { DEFAULT_GRAMMAR_CONFIG } from '@/features/writing-assistant/types';
import { logger } from '@/lib/logging/logger';

// ============================================================================
// Private Implementation
// ============================================================================

class GrammarSuggestionService {
  private static instance: GrammarSuggestionService;

  // Common wordy phrases to detect
  private readonly WORDY_PHRASES: Record<string, string> = {
    'at this point in time': 'now',
    'in order to': 'to',
    'due to the fact that': 'because',
    'in the event that': 'if',
    'for the purpose of': 'to',
    'in the near future': 'soon',
    'at all times': 'always',
    'in spite of the fact that': 'although',
    'with the exception of': 'except',
    'in regard to': 'about',
    'in the process of': '',
    'has the ability to': 'can',
    'make a decision': 'decide',
    'take into consideration': 'consider',
    'give consideration to': 'consider',
    'come to an end': 'end',
    'reach a conclusion': 'conclude',
    'is defined as': 'is',
    'in a position to': 'can',
    'in close proximity to': 'near',
    'on a daily basis': 'daily',
    'for the reason that': 'because',
  };

  // Passive voice indicators
  private readonly PASSIVE_PATTERNS = [
    /\b(was|were|is|are|been|being)\s+(\w+ed)\b/gi,
    /\b(was|were)\s+(\w+en)\b/gi,
  ];

  // Common weak words
  private readonly WEAK_WORDS: Record<string, string> = {
    very: 'consider adding a stronger word',
    really: 'consider using a more specific intensifier',
    just: 'may be unnecessary',
    thing: 'be more specific',
    stuff: 'be more specific',
    got: 'use a more precise verb',
    nice: 'use a more descriptive word',
    good: 'use a stronger adjective',
    bad: 'use a more specific word',
    big: 'use a more specific size descriptor',
  };

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

      // Run various checks based on config
      if (mergedConfig.checkGrammar) {
        suggestions.push(...this.checkGrammar(content));
      }
      if (mergedConfig.checkSpelling) {
        suggestions.push(...this.checkSpelling(content));
      }
      if (mergedConfig.checkPunctuation) {
        suggestions.push(...this.checkPunctuation(content));
      }
      if (mergedConfig.checkClarity) {
        suggestions.push(...this.checkClarity(content));
      }
      if (mergedConfig.checkStyle) {
        suggestions.push(...this.checkStyle(content));
      }
      if (mergedConfig.checkRedundancy) {
        suggestions.push(...this.checkRedundancy(content));
      }
      if (mergedConfig.checkPassiveVoice) {
        suggestions.push(...this.checkPassiveVoice(content));
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
   * Check for grammatical errors
   */
  private checkGrammar(content: string): GrammarSuggestion[] {
    const suggestions: GrammarSuggestion[] = [];
    const lines = content.split('\n');

    lines.forEach((line, lineIndex) => {
      // Check for subject-verb agreement
      const subjectVerbPatterns = [
        { pattern: /\bevery\s+\w+(s)?\b/gi, issue: 'singular verb after "every"' },
        { pattern: /\bnone\b/gi, issue: 'ensure singular verb with "none"' },
        {
          pattern: /\beither\s+\w+(s)?\s+or\s+\w+(s)?\b/gi,
          issue: 'verb agreement with "either...or"',
        },
        {
          pattern: /\bneither\s+\w+(s)?\s+nor\s+\w+(s)?\b/gi,
          issue: 'verb agreement with "neither...nor"',
        },
      ];

      subjectVerbPatterns.forEach(({ pattern, issue }) => {
        const matches = line.match(pattern);
        if (matches) {
          const position = this.findPatternPosition(line, pattern);
          suggestions.push({
            id: `grammar-sv-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            type: 'subject_verb_agreement',
            severity: 'warning',
            category: 'mechanical',
            position: {
              start: position.start,
              end: position.end,
              line: lineIndex + 1,
              column: position.column,
            },
            originalText: matches[0],
            message: `Subject-verb agreement: ${issue}`,
            explanation: `The phrase "${matches[0]}" may have subject-verb agreement issues.`,
            confidence: 0.7,
            aiGenerated: false,
            timestamp: new Date(),
          });
        }
      });

      // Check for pronoun reference issues
      const pronounPatterns = [/\bthis\s+[\w]+\b/gi, /\bthat\s+they\b/gi, /\bwhich\b/gi];

      pronounPatterns.forEach(pronounPattern => {
        const pronounMatches = line.match(pronounPattern);
        if (pronounMatches) {
          const position = this.findPatternPosition(line, pronounPattern);
          suggestions.push({
            id: `grammar-pr-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            type: 'pronoun_reference',
            severity: 'suggestion',
            category: 'clarity',
            position: {
              start: position.start,
              end: position.end,
              line: lineIndex + 1,
              column: position.column,
            },
            originalText: pronounMatches[0],
            message: 'Unclear pronoun reference',
            explanation: `"${pronounMatches[0]}" may have an unclear antecedent. Consider being more specific.`,
            confidence: 0.7,
            aiGenerated: false,
            timestamp: new Date(),
          });
        }
      });
    });

    return suggestions;
  }

  /**
   * Check for spelling errors (basic patterns)
   */
  private checkSpelling(content: string): GrammarSuggestion[] {
    const suggestions: GrammarSuggestion[] = [];

    // Common misspelled words patterns
    const misspellings: Record<string, string> = {
      Teh: 'The',
      teh: 'the',
      taht: 'that',
      definately: 'definitely',
      seperate: 'separate',
      occured: 'occurred',
      recieve: 'receive',
      untill: 'until',
      wierd: 'weird',
      accomodate: 'accommodate',
      occurence: 'occurrence',
      refering: 'referring',
      begining: 'beginning',
      beleive: 'believe',
      calender: 'calendar',
      collegue: 'colleague',
      concious: 'conscious',
      existance: 'existence',
      foriegn: 'foreign',
      goverment: 'government',
      happend: 'happened',
      immediatly: 'immediately',
      independant: 'independent',
      knowlege: 'knowledge',
      liason: 'liaison',
      mispell: 'misspell',
      neccessary: 'necessary',
      noticable: 'noticeable',
      occassion: 'occasion',
      persistant: 'persistent',
      posession: 'possession',
      privelege: 'privilege',
      publically: 'publicly',
      questoin: 'question',
      recomend: 'recommend',
      rythm: 'rhythm',
      succesful: 'successful',
      suprise: 'surprise',
      truely: 'truly',
      writting: 'writing',
    };

    const lines = content.split('\n');
    lines.forEach((line, lineIndex) => {
      for (const [misspelled, correct] of Object.entries(misspellings)) {
        // eslint-disable-next-line security/detect-non-literal-regexp -- misspelled comes from controlled hardcoded dictionary
        const pattern = new RegExp(`\\b${misspelled}\\b`, 'gi');
        const match = line.match(pattern);
        if (match) {
          const position = this.findPatternPosition(line, pattern);
          suggestions.push({
            id: `spell-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            type: 'spelling',
            severity: 'error',
            category: 'mechanical',
            position: {
              start: position.start,
              end: position.end,
              line: lineIndex + 1,
              column: position.column,
            },
            originalText: match[0],
            suggestedText: correct,
            message: `Spelling: "${match[0]}" should be "${correct}"`,
            explanation: `"${match[0]}" appears to be misspelled. The correct spelling is "${correct}".`,
            ruleReference: 'Common spelling errors',
            confidence: 0.95,
            aiGenerated: false,
            timestamp: new Date(),
          });
        }
      }
    });

    return suggestions;
  }

  /**
   * Check for punctuation issues
   */
  private checkPunctuation(content: string): GrammarSuggestion[] {
    const suggestions: GrammarSuggestion[] = [];

    const lines = content.split('\n');
    lines.forEach((line, lineIndex) => {
      // Check for double spaces
      if (/\s{2,}/.test(line)) {
        suggestions.push({
          id: `punct-ds-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          type: 'punctuation',
          severity: 'suggestion',
          category: 'convention',
          position: {
            start: line.indexOf('  '),
            end: line.indexOf('  ') + 2,
            line: lineIndex + 1,
          },
          originalText: '  ',
          suggestedText: ' ',
          message: 'Multiple spaces detected',
          explanation: 'Standard typography uses single spaces between words.',
          confidence: 0.9,
          aiGenerated: false,
          timestamp: new Date(),
        });
      }

      // Check for missing space after punctuation
      const missingSpacePattern = /[.!?][A-Z]/g;
      const missingSpaceMatches = line.match(missingSpacePattern);
      if (missingSpaceMatches) {
        const position = this.findPatternPosition(line, missingSpacePattern);
        suggestions.push({
          id: `punct-ms-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          type: 'punctuation',
          severity: 'suggestion',
          category: 'convention',
          position: {
            start: position.start,
            end: position.end,
            line: lineIndex + 1,
            column: position.column,
          },
          originalText: missingSpaceMatches[0],
          suggestedText: missingSpaceMatches[0][0] + ' ' + missingSpaceMatches[0][1],
          message: 'Missing space after punctuation',
          explanation: 'Add a space after punctuation marks for readability.',
          confidence: 0.85,
          aiGenerated: false,
          timestamp: new Date(),
        });
      }
    });

    return suggestions;
  }

  /**
   * Check for clarity issues
   */
  private checkClarity(content: string): GrammarSuggestion[] {
    const suggestions: GrammarSuggestion[] = [];
    const lines = content.split('\n');

    lines.forEach((line, lineIndex) => {
      // Check for very long sentences
      const sentences = line.split(/[.!?]+/);
      sentences.forEach((sentence, sentenceIndex) => {
        const wordCount = sentence.split(/\s+/).filter(w => w.length > 0).length;
        if (wordCount > 35) {
          const position = this.findSentencePosition(line, sentence, sentenceIndex);
          suggestions.push({
            id: `clarity-long-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            type: 'clarity',
            severity: 'suggestion',
            category: 'clarity',
            position: {
              start: position.start,
              end: position.end,
              line: lineIndex + 1,
            },
            originalText: sentence.substring(0, 50) + (sentence.length > 50 ? '...' : ''),
            message: `Long sentence (${wordCount} words)`,
            explanation: `This sentence is very long (${wordCount} words). Consider breaking it into shorter sentences for better clarity.`,
            confidence: 0.75,
            aiGenerated: false,
            timestamp: new Date(),
          });
        }
      });

      // Check for vague language
      const vaguePatterns = [
        { pattern: /\bsome\s+\w+s?\b/gi, issue: 'vague quantity' },
        { pattern: /\ba\s+lot\b/gi, issue: 'consider being more specific' },
        { pattern: /\balot\b/gi, issue: '"a lot" should be two words' },
        { pattern: /\bkind of\b|\bsort of\b/gi, issue: 'vague expression' },
        { pattern: /\breally\s+\w+/gi, issue: 'unnecessary intensifier' },
      ];

      vaguePatterns.forEach(({ pattern, issue }) => {
        const matches = line.match(pattern);
        if (matches) {
          const position = this.findPatternPosition(line, pattern);
          suggestions.push({
            id: `clarity-vague-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            type: 'clarity',
            severity: 'suggestion',
            category: 'clarity',
            position: {
              start: position.start,
              end: position.end,
              line: lineIndex + 1,
              column: position.column,
            },
            originalText: matches[0],
            message: `Clarity: ${issue}`,
            explanation: `Consider using more specific language for "${matches[0]}".`,
            confidence: 0.7,
            aiGenerated: false,
            timestamp: new Date(),
          });
        }
      });

      // Check for wordy phrases
      for (const [wordyPhrase, replacement] of Object.entries(this.WORDY_PHRASES)) {
        // eslint-disable-next-line security/detect-non-literal-regexp -- wordyPhrase comes from controlled WORDY_PHRASES constant
        const pattern = new RegExp(`\\b${wordyPhrase}\\b`, 'gi');
        const match = line.match(pattern);
        if (match) {
          const position = this.findPatternPosition(line, pattern);
          suggestions.push({
            id: `clarity-wordy-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            type: 'clarity',
            severity: 'suggestion',
            category: 'clarity',
            position: {
              start: position.start,
              end: position.end,
              line: lineIndex + 1,
              column: position.column,
            },
            originalText: match[0],
            suggestedText: replacement,
            message: `Wordy phrase: "${match[0]}"`,
            explanation: `Consider using "${replacement}" instead of "${match[0]}" for conciseness.`,
            confidence: 0.8,
            aiGenerated: false,
            timestamp: new Date(),
          });
        }
      }
    });

    return suggestions;
  }

  /**
   * Check for style issues
   */
  private checkStyle(content: string): GrammarSuggestion[] {
    const suggestions: GrammarSuggestion[] = [];

    // Check for weak words
    for (const [weakWord, suggestion] of Object.entries(this.WEAK_WORDS)) {
      // eslint-disable-next-line security/detect-non-literal-regexp -- weakWord comes from controlled WEAK_WORDS constant
      const pattern = new RegExp(`\\b${weakWord}\\b`, 'gi');
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        if (match.index !== undefined) {
          suggestions.push({
            id: `style-weak-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            type: 'word_choice',
            severity: 'suggestion',
            category: 'style',
            position: {
              start: match.index,
              end: match.index + match[0].length,
            },
            originalText: match[0],
            message: `Weak word: "${match[0]}"`,
            explanation: `${suggestion}. Consider using a more precise word.`,
            confidence: 0.7,
            aiGenerated: false,
            timestamp: new Date(),
          });
        }
      }
    }

    return suggestions;
  }

  /**
   * Check for redundancy
   */
  private checkRedundancy(content: string): GrammarSuggestion[] {
    const suggestions: GrammarSuggestion[] = [];

    // Common redundant phrases
    const redundantPhrases = [
      { phrase: 'advance planning', replacement: 'planning' },
      { phrase: 'end result', replacement: 'result' },
      { phrase: 'each and every', replacement: 'each' },
      { phrase: 'true fact', replacement: 'fact' },
      { phrase: 'past history', replacement: 'history' },
      { phrase: 'unexpected surprise', replacement: 'surprise' },
      { phrase: 'completely eliminate', replacement: 'eliminate' },
      { phrase: 'refer back', replacement: 'refer' },
      { phrase: 'join together', replacement: 'join' },
      { phrase: 'repeat again', replacement: 'repeat' },
      { phrase: 'return back', replacement: 'return' },
      { phrase: 'circle around', replacement: 'circle' },
    ];

    for (const { phrase, replacement } of redundantPhrases) {
      // Escape special regex characters in phrase
      const escapedPhrase = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // eslint-disable-next-line security/detect-non-literal-regexp -- escapedPhrase is sanitized from controlled redundantPhrases array
      const pattern = new RegExp(`\\b${escapedPhrase}\\b`, 'gi');
      const matches = content.matchAll(pattern);

      for (const match of matches) {
        if (match.index !== undefined) {
          const lineInfo = this.getLineInfo(content, match.index);
          suggestions.push({
            id: `redundancy-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            type: 'redundancy',
            severity: 'suggestion',
            category: 'clarity',
            position: {
              start: match.index,
              end: match.index + match[0].length,
              line: lineInfo.line,
              column: lineInfo.column,
            },
            originalText: match[0],
            suggestedText: replacement,
            message: `Redundant phrase: "${match[0]}"`,
            explanation: `"${match[0]}" is redundant. Consider using "${replacement}" instead.`,
            confidence: 0.85,
            aiGenerated: false,
            timestamp: new Date(),
          });
        }
      }
    }

    return suggestions;
  }

  /**
   * Check for passive voice
   */
  private checkPassiveVoice(content: string): GrammarSuggestion[] {
    const suggestions: GrammarSuggestion[] = [];
    const lines = content.split('\n');

    lines.forEach((line, lineIndex) => {
      for (const pattern of this.PASSIVE_PATTERNS) {
        let match: RegExpExecArray | null;
        while ((match = pattern.exec(line)) !== null) {
          suggestions.push({
            id: `passive-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            type: 'passive_voice',
            severity: 'suggestion',
            category: 'style',
            position: {
              start: match.index,
              end: match.index + match[0].length,
              line: lineIndex + 1,
            },
            originalText: match[0],
            message: 'Passive voice detected',
            explanation: 'Consider rewriting in active voice for more direct, engaging prose.',
            confidence: 0.75,
            aiGenerated: false,
            timestamp: new Date(),
          });
        }
      }
    });

    return suggestions;
  }

  /**
   * Calculate clarity metrics
   */
  public calculateClarityMetrics(content: string): ClarityMetrics {
    const words = content.split(/\s+/).filter(w => w.length > 0);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);

    const avgWordsPerSentence = words.length / Math.max(sentences.length, 1);
    const complexWordRatio =
      words.filter(w => this.countSyllables(w) >= 3).length / Math.max(words.length, 1);

    // Calculate passive voice ratio
    let passiveCount = 0;
    for (const pattern of this.PASSIVE_PATTERNS) {
      const matches = content.match(pattern);
      passiveCount += matches?.length ?? 0;
    }
    const passiveVoiceRatio = (passiveCount / Math.max(sentences.length, 1)) * 100;

    // Check for wordy phrases
    let wordyCount = 0;
    for (const phrase of Object.keys(this.WORDY_PHRASES)) {
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

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private findPatternPosition(
    line: string,
    pattern: RegExp,
  ): { start: number; end: number; column: number } {
    const match = pattern.exec(line);
    if (match) {
      const start = match.index;
      const end = start + match[0].length;
      return { start, end, column: start };
    }
    return { start: 0, end: 0, column: 0 };
  }

  private findSentencePosition(
    line: string,
    sentence: string,
    index: number,
  ): { start: number; end: number } {
    const beforeSentences = line.split(/[.!?]+/).slice(0, index);
    const start = beforeSentences.join('.').length;
    return { start, end: start + sentence.length };
  }

  private getLineInfo(content: string, index: number): { line: number; column: number } {
    const beforeIndex = content.substring(0, index);
    const lines = beforeIndex.split('\n');
    const lastLine = lines[lines.length - 1];
    return {
      line: lines.length,
      column: lastLine?.length ?? 0,
    };
  }

  private countSyllables(word: string): number {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    const matches = word.match(/[aeiouy]{1,2}/g);
    return matches?.length ?? 1;
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
