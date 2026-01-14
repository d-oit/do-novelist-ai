/**
 * Character Voice Service
 *
 * Tracks and analyzes character speech patterns and voice consistency
 */

import type {
  DialogueLine,
  CharacterVoiceProfile,
  SpeechPattern,
  DialogueTag,
} from '@/features/dialogue/types';

/**
 * Build or update a character voice profile from dialogue lines
 */
export function buildVoiceProfile(
  characterId: string,
  characterName: string,
  projectId: string,
  lines: DialogueLine[],
): CharacterVoiceProfile {
  const characterLines = lines.filter(
    l => l.characterId === characterId || l.characterName === characterName,
  );

  if (characterLines.length === 0) {
    // Return minimal profile for character with no dialogue
    return {
      characterId,
      characterName,
      projectId,
      totalLines: 0,
      speechPattern: getDefaultSpeechPattern(),
      favoriteWords: [],
      commonTags: [],
      voiceConsistencyScore: 0,
      lastAnalyzedAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  const speechPattern = analyzeSpeechPattern(characterLines);
  const favoriteWords = extractFavoriteWords(characterLines);
  const commonTags = analyzeTagUsage(characterLines);
  const consistencyScore = calculateVoiceConsistency(characterLines, speechPattern);

  return {
    characterId,
    characterName,
    projectId,
    totalLines: characterLines.length,
    speechPattern,
    favoriteWords,
    commonTags,
    voiceConsistencyScore: consistencyScore,
    lastAnalyzedAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Analyze speech pattern from dialogue lines
 */
function analyzeSpeechPattern(lines: DialogueLine[]): SpeechPattern {
  const allText = lines.map(l => l.text).join(' ');
  const words = allText.split(/\s+/).filter(w => w.length > 0);
  const totalWords = words.length;

  // Calculate average word count per line
  const averageWordCount = totalWords / lines.length;

  // Analyze sentence complexity
  const complexity = analyzeSentenceComplexity(lines);

  // Analyze vocabulary level
  const vocabularyLevel = analyzeVocabulary(words);

  // Extract common phrases (2-3 word sequences)
  const commonPhrases = extractCommonPhrases(lines);

  // Extract speech tics
  const speechTics = extractSpeechTics(lines);

  // Calculate formality score
  const formalityScore = calculateFormality(allText);

  // Detect emotional range
  const emotionalRange = detectEmotionalRange(lines);

  return {
    averageWordCount,
    sentenceComplexity: complexity,
    vocabularyLevel,
    commonPhrases,
    speechTics,
    formalityScore,
    emotionalRange,
  };
}

/**
 * Analyze sentence complexity (simple, moderate, complex)
 */
function analyzeSentenceComplexity(lines: DialogueLine[]): 'simple' | 'moderate' | 'complex' {
  const avgWordsPerLine =
    lines.reduce((sum, line) => sum + line.text.split(/\s+/).length, 0) / lines.length;

  const avgClausesPerLine =
    lines.reduce((sum, line) => {
      const clauses = line.text.split(/[,;]/).length;
      return sum + clauses;
    }, 0) / lines.length;

  if (avgWordsPerLine < 10 && avgClausesPerLine < 2) {
    return 'simple';
  } else if (avgWordsPerLine < 20 && avgClausesPerLine < 3) {
    return 'moderate';
  } else {
    return 'complex';
  }
}

/**
 * Analyze vocabulary level
 */
function analyzeVocabulary(words: string[]): 'basic' | 'intermediate' | 'advanced' | 'technical' {
  const advancedWords = [
    'moreover',
    'nevertheless',
    'furthermore',
    'albeit',
    'consequently',
    'discern',
    'eloquent',
    'meticulous',
    'paradigm',
    'pragmatic',
  ];

  const technicalIndicators = [
    'algorithm',
    'protocol',
    'synthesis',
    'hypothesis',
    'methodology',
    'infrastructure',
    'coefficient',
    'trajectory',
  ];

  const advancedCount = words.filter(w =>
    advancedWords.some(aw => w.toLowerCase().includes(aw)),
  ).length;
  const technicalCount = words.filter(w =>
    technicalIndicators.some(ti => w.toLowerCase().includes(ti)),
  ).length;

  const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;

  if (technicalCount > 2) {
    return 'technical';
  } else if (advancedCount > 3 || avgWordLength > 6) {
    return 'advanced';
  } else if (avgWordLength > 4.5) {
    return 'intermediate';
  } else {
    return 'basic';
  }
}

/**
 * Extract common phrases (2-3 word sequences that appear multiple times)
 */
function extractCommonPhrases(lines: DialogueLine[], minOccurrences: number = 2): string[] {
  const phrases = new Map<string, number>();

  lines.forEach(line => {
    const words = line.text.toLowerCase().split(/\s+/);

    // Extract 2-word phrases
    for (let i = 0; i < words.length - 1; i++) {
      const phrase = `${words[i]} ${words[i + 1]}`;
      if (phrase.length > 3) {
        // Skip very short phrases
        phrases.set(phrase, (phrases.get(phrase) ?? 0) + 1);
      }
    }

    // Extract 3-word phrases
    for (let i = 0; i < words.length - 2; i++) {
      const phrase = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
      phrases.set(phrase, (phrases.get(phrase) ?? 0) + 1);
    }
  });

  return Array.from(phrases.entries())
    .filter(([, count]) => count >= minOccurrences)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([phrase]) => phrase);
}

/**
 * Extract speech tics (filler words, repeated patterns)
 */
function extractSpeechTics(lines: DialogueLine[]): string[] {
  const commonTics = [
    'um',
    'uh',
    'er',
    'ah',
    'like',
    'you know',
    'i mean',
    'basically',
    'actually',
    'literally',
    'sort of',
    'kind of',
  ];

  const allText = lines.map(l => l.text.toLowerCase()).join(' ');
  const foundTics: string[] = [];

  commonTics.forEach(tic => {
    // Escape special regex characters in tic
    const escapedTic = tic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // eslint-disable-next-line security/detect-non-literal-regexp
    const regex = new RegExp(`\\b${escapedTic}\\b`, 'gi');
    const matches = allText.match(regex);
    if (matches && matches.length >= 2) {
      foundTics.push(tic);
    }
  });

  return foundTics;
}

/**
 * Calculate formality score (0-10)
 */
function calculateFormality(text: string): number {
  let score = 5; // Start neutral

  // Formal indicators
  const formalWords = [
    'indeed',
    'moreover',
    'furthermore',
    'nevertheless',
    'therefore',
    'subsequently',
    'accordingly',
  ];
  const formalCount = formalWords.filter(word => {
    const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // eslint-disable-next-line security/detect-non-literal-regexp
    return new RegExp(`\\b${escapedWord}\\b`, 'i').test(text);
  }).length;
  score += formalCount * 0.5;

  // Informal indicators
  const informalWords = ['yeah', 'nah', 'gonna', 'wanna', 'kinda', 'sorta', 'dunno', 'gotta'];
  const informalCount = informalWords.filter(word => {
    const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // eslint-disable-next-line security/detect-non-literal-regexp
    return new RegExp(`\\b${escapedWord}\\b`, 'i').test(text);
  }).length;
  score -= informalCount * 0.5;

  // Contractions reduce formality slightly
  const contractionCount = (text.match(/(n't|'ll|'re|'ve|'m|'d)\b/g) || []).length;
  score -= contractionCount * 0.1;

  // Complete sentences increase formality
  const sentenceCount = text.split(/[.!?]+/).length;
  if (sentenceCount > 5) {
    score += 1;
  }

  return Math.max(0, Math.min(10, score));
}

/**
 * Detect emotional range from dialogue tags and content
 */
function detectEmotionalRange(
  lines: DialogueLine[],
): Array<'angry' | 'happy' | 'sad' | 'neutral' | 'excited' | 'fearful'> {
  const emotions = new Set<'angry' | 'happy' | 'sad' | 'neutral' | 'excited' | 'fearful'>();

  lines.forEach(line => {
    const text = line.text.toLowerCase();
    const tag = line.tag;

    // Angry indicators
    if (
      tag === 'shouted' ||
      tag === 'snapped' ||
      tag === 'growled' ||
      tag === 'hissed' ||
      /\b(damn|hell|angry|furious)\b/.test(text)
    ) {
      emotions.add('angry');
    }

    // Happy indicators
    if (tag === 'joked' || tag === 'teased' || /\b(laugh|happy|joy|smile|wonderful)\b/.test(text)) {
      emotions.add('happy');
    }

    // Sad indicators
    if (tag === 'sighed' || tag === 'murmured' || /\b(sad|sorry|regret|tears|cry)\b/.test(text)) {
      emotions.add('sad');
    }

    // Excited indicators
    if (tag === 'exclaimed' || /!{2,}/.test(line.text)) {
      emotions.add('excited');
    }

    // Fearful indicators
    if (
      tag === 'whispered' ||
      tag === 'stammered' ||
      /\b(afraid|scared|fear|terrified)\b/.test(text)
    ) {
      emotions.add('fearful');
    }

    // Neutral for 'said', 'replied', etc.
    if (tag === 'said' || tag === 'replied' || tag === 'continued') {
      emotions.add('neutral');
    }
  });

  return Array.from(emotions);
}

/**
 * Extract favorite/most used words
 */
function extractFavoriteWords(lines: DialogueLine[]): Array<{ word: string; count: number }> {
  const stopWords = new Set([
    'the',
    'a',
    'an',
    'and',
    'or',
    'but',
    'in',
    'on',
    'at',
    'to',
    'for',
    'of',
    'with',
    'by',
    'from',
    'is',
    'are',
    'was',
    'were',
    'be',
    'been',
    'being',
    'have',
    'has',
    'had',
    'do',
    'does',
    'did',
    'will',
    'would',
    'could',
    'should',
    'may',
    'might',
    'can',
    'i',
    'you',
    'he',
    'she',
    'it',
    'we',
    'they',
    'them',
    'their',
    'this',
    'that',
    'these',
    'those',
  ]);

  const wordCounts = new Map<string, number>();

  lines.forEach(line => {
    const words = line.text
      .toLowerCase()
      .replace(/[.,!?;:"']/g, '')
      .split(/\s+/);

    words.forEach(word => {
      if (word.length > 3 && !stopWords.has(word)) {
        wordCounts.set(word, (wordCounts.get(word) ?? 0) + 1);
      }
    });
  });

  return Array.from(wordCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word, count]) => ({ word, count }));
}

/**
 * Analyze dialogue tag usage
 */
function analyzeTagUsage(
  lines: DialogueLine[],
): Array<{ tag: DialogueTag; count: number; percentage: number }> {
  const tagCounts = new Map<DialogueTag, number>();

  lines.forEach(line => {
    tagCounts.set(line.tag, (tagCounts.get(line.tag) ?? 0) + 1);
  });

  return Array.from(tagCounts.entries())
    .map(([tag, count]) => ({
      tag,
      count,
      percentage: (count / lines.length) * 100,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Calculate voice consistency score (0-100)
 */
function calculateVoiceConsistency(lines: DialogueLine[], pattern: SpeechPattern): number {
  if (lines.length < 5) {
    return 50; // Not enough data
  }

  let score = 100;

  // Check consistency of line length
  const wordCounts = lines.map(l => l.text.split(/\s+/).length);
  const variance = calculateVariance(wordCounts);
  const avgWordCount = pattern.averageWordCount;

  // High variance reduces score
  const coefficientOfVariation = Math.sqrt(variance) / avgWordCount;
  if (coefficientOfVariation > 0.5) {
    score -= 20;
  } else if (coefficientOfVariation > 0.3) {
    score -= 10;
  }

  // Check for formality consistency
  const formalityScores = lines.map(line => calculateFormality(line.text));
  const formalityVariance = calculateVariance(formalityScores);
  if (formalityVariance > 4) {
    score -= 15;
  }

  // Bonus for consistent emotional range
  if (pattern.emotionalRange.length >= 3) {
    score += 5;
  }

  // Bonus for having speech tics (character trait)
  if (pattern.speechTics.length > 0) {
    score += 10;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate variance of a number array
 */
function calculateVariance(values: number[]): number {
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Get default speech pattern
 */
function getDefaultSpeechPattern(): SpeechPattern {
  return {
    averageWordCount: 0,
    sentenceComplexity: 'moderate',
    vocabularyLevel: 'intermediate',
    commonPhrases: [],
    speechTics: [],
    formalityScore: 5,
    emotionalRange: ['neutral'],
  };
}
