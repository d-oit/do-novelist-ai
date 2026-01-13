/**
 * Style checker module
 * Handles style, clarity, redundancy, and passive voice detection
 */

import {
  WORDY_PHRASES,
  WEAK_WORDS,
  REDUNDANT_PHRASES,
  PASSIVE_PATTERNS,
  VAGUE_PATTERNS,
} from '@/features/writing-assistant/services/grammar-utils/constants';
import {
  findPatternPosition,
  findSentencePosition,
  getLineInfo,
  generateSuggestionId,
} from '@/features/writing-assistant/services/grammar-utils/helpers';
import type { GrammarSuggestion } from '@/features/writing-assistant/types';

/**
 * Check for clarity issues
 */
export function checkClarity(content: string): GrammarSuggestion[] {
  const suggestions: GrammarSuggestion[] = [];
  const lines = content.split('\n');

  lines.forEach((line, lineIndex) => {
    // Check for very long sentences
    const sentences = line.split(/[.!?]+/);
    sentences.forEach((sentence, sentenceIndex) => {
      const wordCount = sentence.split(/\s+/).filter(w => w.length > 0).length;
      if (wordCount > 35) {
        const position = findSentencePosition(line, sentence, sentenceIndex);
        suggestions.push({
          id: generateSuggestionId('clarity-long'),
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
    VAGUE_PATTERNS.forEach(({ pattern, issue }) => {
      const matches = line.match(pattern);
      if (matches) {
        const position = findPatternPosition(line, pattern);
        suggestions.push({
          id: generateSuggestionId('clarity-vague'),
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
    for (const [wordyPhrase, replacement] of Object.entries(WORDY_PHRASES)) {
      // eslint-disable-next-line security/detect-non-literal-regexp -- wordyPhrase comes from controlled WORDY_PHRASES constant
      const pattern = new RegExp(`\\b${wordyPhrase}\\b`, 'gi');
      const match = line.match(pattern);
      if (match) {
        const position = findPatternPosition(line, pattern);
        suggestions.push({
          id: generateSuggestionId('clarity-wordy'),
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
export function checkStyle(content: string): GrammarSuggestion[] {
  const suggestions: GrammarSuggestion[] = [];

  // Check for weak words
  for (const [weakWord, suggestion] of Object.entries(WEAK_WORDS)) {
    // eslint-disable-next-line security/detect-non-literal-regexp -- weakWord comes from controlled WEAK_WORDS constant
    const pattern = new RegExp(`\\b${weakWord}\\b`, 'gi');
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      if (match.index !== undefined) {
        suggestions.push({
          id: generateSuggestionId('style-weak'),
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
export function checkRedundancy(content: string): GrammarSuggestion[] {
  const suggestions: GrammarSuggestion[] = [];

  for (const { phrase, replacement } of REDUNDANT_PHRASES) {
    // Escape special regex characters in phrase
    const escapedPhrase = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // eslint-disable-next-line security/detect-non-literal-regexp -- escapedPhrase is sanitized from controlled REDUNDANT_PHRASES array
    const pattern = new RegExp(`\\b${escapedPhrase}\\b`, 'gi');
    const matches = content.matchAll(pattern);

    for (const match of matches) {
      if (match.index !== undefined) {
        const lineInfo = getLineInfo(content, match.index);
        suggestions.push({
          id: generateSuggestionId('redundancy'),
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
export function checkPassiveVoice(content: string): GrammarSuggestion[] {
  const suggestions: GrammarSuggestion[] = [];
  const lines = content.split('\n');

  lines.forEach((line, lineIndex) => {
    for (const pattern of PASSIVE_PATTERNS) {
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(line)) !== null) {
        suggestions.push({
          id: generateSuggestionId('passive'),
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
