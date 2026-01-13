/**
 * Spelling checker module
 * Handles spelling error detection
 */

import { COMMON_MISSPELLINGS } from '@/features/writing-assistant/services/grammar-utils/constants';
import {
  findPatternPosition,
  generateSuggestionId,
} from '@/features/writing-assistant/services/grammar-utils/helpers';
import type { GrammarSuggestion } from '@/features/writing-assistant/types';

/**
 * Check for spelling errors
 */
export function checkSpelling(content: string): GrammarSuggestion[] {
  const suggestions: GrammarSuggestion[] = [];

  const lines = content.split('\n');
  lines.forEach((line, lineIndex) => {
    for (const [misspelled, correct] of Object.entries(COMMON_MISSPELLINGS)) {
      // eslint-disable-next-line security/detect-non-literal-regexp -- misspelled comes from controlled hardcoded dictionary
      const pattern = new RegExp(`\\b${misspelled}\\b`, 'gi');
      const match = line.match(pattern);
      if (match) {
        const position = findPatternPosition(line, pattern);
        suggestions.push({
          id: generateSuggestionId('spell'),
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
