/**
 * Writing Assistant Style Analyzers
 * Style, tone, and structure analysis utilities
 */

import type {
  StyleProfile,
  ToneAnalysis,
  WordUsageAnalysis,
  ParagraphAnalysis,
  SentenceVarietyAnalysis,
  TransitionAnalysis,
} from '@/features/writing-assistant/types';

/**
 * Analyze writing style
 */
export function analyzeStyle(content: string): StyleProfile {
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

  const passiveIndicators = ['was', 'were', 'been', 'being'];
  const passiveCount = passiveIndicators.reduce((count, indicator) => {
    // eslint-disable-next-line security/detect-non-literal-regexp -- indicator comes from controlled passiveIndicators array
    return (
      count + (content.toLowerCase().match(new RegExp(`\\b${indicator}\\b`, 'g')) ?? []).length
    );
  }, 0);
  const voice = passiveCount / sentences.length > 0.3 ? 'passive' : 'active';

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
    formality: 'neutral',
    voice,
    perspective,
    tense: 'past',
    strengths: [],
    improvements: [],
    consistency: 85,
  };
}

/**
 * Analyze tone
 */
export function analyzeTone(content: string): ToneAnalysis {
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
export function analyzeWordUsage(content: string): WordUsageAnalysis {
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
    .filter(([, count]) => count > 3)
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
export function analyzeParagraphs(content: string): ParagraphAnalysis {
  const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
  const sentences = paragraphs.map(p => p.split(/[.!?]+/).filter(s => s.trim().length > 0).length);

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
export function analyzeSentenceVariety(content: string): SentenceVarietyAnalysis {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const lengths = sentences.map(s => s.split(/\s+/).length);
  const avgLength = lengths.reduce((acc, len) => acc + len, 0) / sentences.length;

  let simple = 0,
    compound = 0,
    complex = 0,
    compoundComplex = 0;

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

  sentences.forEach(sentence => {
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
export function analyzeTransitions(content: string): TransitionAnalysis {
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
    // eslint-disable-next-line security/detect-non-literal-regexp -- transition comes from controlled transitions array
    return (
      count + (content.toLowerCase().match(new RegExp(`\\b${transition}\\b`, 'g')) ?? []).length
    );
  }, 0);

  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const transitionRatio = transitionCount / sentences.length;

  return {
    quality: Math.min(100, transitionRatio * 200),
    missingTransitions: [],
    weakTransitions: [],
  };
}
