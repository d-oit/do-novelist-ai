/**
 * Punctuation checker module
 * Handles punctuation error detection
 */

import {
  findPatternPosition,
  generateSuggestionId,
} from '@/features/writing-assistant/services/grammar-utils/helpers';
import type { GrammarSuggestion } from '@/features/writing-assistant/types';

/**
 * Check for punctuation issues
 */
export function checkPunctuation(content: string): GrammarSuggestion[] {
  const suggestions: GrammarSuggestion[] = [];

  const lines = content.split('\n');
  lines.forEach((line, lineIndex) => {
    // Check for double spaces
    if (/\s{2,}/.test(line)) {
      suggestions.push({
        id: generateSuggestionId('punct-ds'),
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
      const position = findPatternPosition(line, missingSpacePattern);
      suggestions.push({
        id: generateSuggestionId('punct-ms'),
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
