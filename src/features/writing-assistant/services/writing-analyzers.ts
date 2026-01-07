/**
 * Writing Assistant Analyzers
 * Engagement and readability analysis utilities
 */

/**
 * Count syllables in a word (approximate)
 */
export function countSyllables(word: string): number {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;

  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

/**
 * Calculate Flesch Reading Ease score
 */
export function calculateReadabilityScore(content: string): number {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = content.split(/\s+/).filter(w => w.trim().length > 0);
  const syllables = words.reduce((count, word) => count + countSyllables(word), 0);

  if (sentences.length === 0 || words.length === 0) return 0;

  const avgSentenceLength = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;

  const score = 206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord;
  return Math.max(0, Math.min(100, score));
}

/**
 * Analyze sentiment of the content
 */
export function analyzeSentiment(content: string): number {
  const positiveWords = ['happy', 'joy', 'love', 'wonderful', 'amazing', 'brilliant', 'fantastic'];
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
export function analyzePacing(content: string): number {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgSentenceLength =
    sentences.reduce((acc, s) => acc + s.split(/\s+/).length, 0) / sentences.length;

  const actionWords = ['ran', 'jumped', 'shouted', 'grabbed', 'rushed', 'burst', 'slammed'];
  const actionCount = actionWords.reduce((count, word) => {
    // eslint-disable-next-line security/detect-non-literal-regexp -- word comes from controlled actionWords array
    return count + (content.toLowerCase().match(new RegExp(word, 'g')) ?? []).length;
  }, 0);

  const lengthScore = Math.max(0, 100 - avgSentenceLength * 2);
  const actionScore = Math.min(100, actionCount * 10);

  return (lengthScore + actionScore) / 2;
}

/**
 * Calculate engagement score
 */
export function calculateEngagementScore(content: string): number {
  const factors = [
    analyzeDialogueRatio(content),
    analyzeQuestionUsage(content),
    analyzeSensoryDetails(content),
    analyzeVariety(content),
    analyzeConflictIndicators(content),
  ];

  return factors.reduce((acc, score) => acc + score, 0) / factors.length;
}

function analyzeDialogueRatio(content: string): number {
  const dialogueMatches = content.match(/"[^"]*"/g) ?? [];
  const dialogueLength = dialogueMatches.join('').length;
  const ratio = dialogueLength / content.length;

  if (ratio >= 0.3 && ratio <= 0.6) return 100;
  if (ratio < 0.3) return ratio * 333;
  return Math.max(0, 100 - (ratio - 0.6) * 250);
}

function analyzeQuestionUsage(content: string): number {
  const questions = (content.match(/\?/g) ?? []).length;
  const sentences = content.split(/[.!?]+/).length;
  const ratio = questions / sentences;

  return Math.min(100, ratio * 500);
}

function analyzeSensoryDetails(content: string): number {
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

function analyzeVariety(content: string): number {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const lengths = sentences.map(s => s.split(/\s+/).length);

  if (lengths.length === 0) return 0;

  const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((acc, len) => acc + Math.pow(len - avg, 2), 0) / lengths.length;

  return Math.min(100, variance * 2);
}

function analyzeConflictIndicators(content: string): number {
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
