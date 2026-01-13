/**
 * Grammar checker module
 * Handles grammatical error detection
 */

import {
  SUBJECT_VERB_PATTERNS,
  PRONOUN_PATTERNS,
} from '@/features/writing-assistant/services/grammar-utils/constants';
import {
  findPatternPosition,
  generateSuggestionId,
} from '@/features/writing-assistant/services/grammar-utils/helpers';
import type { GrammarSuggestion } from '@/features/writing-assistant/types';

/**
 * Check for grammatical errors
 */
export function checkGrammar(content: string): GrammarSuggestion[] {
  const suggestions: GrammarSuggestion[] = [];
  const lines = content.split('\n');

  lines.forEach((line, lineIndex) => {
    // Check for subject-verb agreement
    SUBJECT_VERB_PATTERNS.forEach(({ pattern, issue }) => {
      const matches = line.match(pattern);
      if (matches) {
        const position = findPatternPosition(line, pattern);
        suggestions.push({
          id: generateSuggestionId('grammar-sv'),
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
    PRONOUN_PATTERNS.forEach(pronounPattern => {
      const pronounMatches = line.match(pronounPattern);
      if (pronounMatches) {
        const position = findPatternPosition(line, pronounPattern);
        suggestions.push({
          id: generateSuggestionId('grammar-pr'),
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
