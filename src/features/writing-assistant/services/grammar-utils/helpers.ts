/**
 * Helper utilities for grammar checking
 * Extracted from grammarSuggestionService.ts for better organization
 */

/**
 * Find the position of a pattern match in a line
 */
export function findPatternPosition(
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

/**
 * Find the position of a sentence within a line
 */
export function findSentencePosition(
  line: string,
  sentence: string,
  index: number,
): { start: number; end: number } {
  const beforeSentences = line.split(/[.!?]+/).slice(0, index);
  const start = beforeSentences.join('.').length;
  return { start, end: start + sentence.length };
}

/**
 * Get line and column information for a character index in content
 */
export function getLineInfo(content: string, index: number): { line: number; column: number } {
  const beforeIndex = content.substring(0, index);
  const lines = beforeIndex.split('\n');
  const lastLine = lines[lines.length - 1];
  return {
    line: lines.length,
    column: lastLine?.length ?? 0,
  };
}

/**
 * Count syllables in a word (for readability calculations)
 */
export function countSyllables(word: string): number {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches?.length ?? 1;
}

/**
 * Generate a unique ID for a suggestion
 */
export function generateSuggestionId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
