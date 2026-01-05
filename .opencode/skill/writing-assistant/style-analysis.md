# Style Analysis

## Core Concepts

Real-time style analysis for voice consistency, tone detection, and writing
quality assessment.

## Style Metrics

```typescript
interface StyleMetrics {
  voiceConsistency: number; // 0-1
  tone: ToneAnalysis;
  vocabulary: VocabularyAnalysis;
  sentenceStructure: SentenceStructureAnalysis;
  readability: ReadabilityScore;
  pacing: PacingAnalysis;
}
```

## Voice Consistency

```typescript
interface VoiceProfile {
  id: string;
  name: string;
  characteristics: VoiceCharacteristics;
  baseline: StyleMetrics;
}

interface VoiceCharacteristics {
  sentenceLength: { mean: number; variance: number };
  vocabularyLevel: 'simple' | 'moderate' | 'complex' | 'academic';
  tenseUsage: TenseUsage;
  perspective: NarrativePerspective;
  dialogueRatio: number;
  descriptionRatio: number;
}

function analyzeVoiceConsistency(
  text: string,
  profile: VoiceProfile,
): ConsistencyResult {
  const current = analyzeStyleMetrics(text);
  const baseline = profile.baseline;

  const consistency = compareMetrics(current, baseline);

  return {
    score: consistency.overall,
    deviations: deviationsFromBaseline(current, baseline),
    suggestions: generateConsistencySuggestions(consistency),
  };
}
```

## Tone Detection

```typescript
interface ToneAnalysis {
  primary: string;
  secondary: string[];
  intensity: number; // 0-1
  emotionalSpectrum: EmotionalSpectrum;
}

interface EmotionalSpectrum {
  joy: number;
  sadness: number;
  anger: number;
  fear: number;
  surprise: number;
  disgust: number;
  anticipation: number;
  trust: number;
}

function detectTone(text: string): ToneAnalysis {
  const wordLists = loadToneWordLists();
  const words = tokenize(text);

  const scores: Record<string, number> = {};

  for (const [tone, list] of Object.entries(wordLists)) {
    const matches = words.filter(w => list.includes(w.toLowerCase()));
    scores[tone] = matches.length / words.length;
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);

  return {
    primary: sorted[0][0],
    secondary: sorted.slice(1, 3).map(s => s[0]),
    intensity: sorted[0][1],
    emotionalSpectrum: calculateEmotionalSpectrum(text),
  };
}
```

## Vocabulary Analysis

```typescript
interface VocabularyAnalysis {
  richness: number; // unique words / total words
  complexity: 'simple' | 'moderate' | 'complex' | 'academic';
  repetition: RepetitionAnalysis;
  rareWords: string[];
  cliches: string[];
}

interface RepetitionAnalysis {
  overall: number; // 0-1
  repeatedWords: Map<string, number>;
  problematicPhrases: string[];
}

function analyzeVocabulary(text: string): VocabularyAnalysis {
  const words = tokenize(text);
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));

  const richness = uniqueWords.size / words.length;

  const repeatedWords = new Map<string, number>();
  words.forEach(word => {
    const lower = word.toLowerCase();
    repeatedWords.set(lower, (repeatedWords.get(lower) || 0) + 1);
  });

  const complexity = determineComplexity(text, uniqueWords);

  return {
    richness,
    complexity,
    repetition: analyzeRepetition(repeatedWords, words.length),
    rareWords: findRareWords(uniqueWords),
    cliches: detectCliches(text),
  };
}
```

## Sentence Structure

```typescript
interface SentenceStructureAnalysis {
  averageLength: number;
  lengthVariance: number;
  complexity: SentenceComplexity;
  variety: StructureVariety;
  patterns: SentencePattern[];
}

enum SentenceComplexity {
  SIMPLE = 'simple',
  COMPOUND = 'compound',
  COMPLEX = 'complex',
  MIXED = 'mixed',
}

interface SentencePattern {
  type: string;
  frequency: number;
  examples: string[];
}

function analyzeSentenceStructure(text: string): SentenceStructureAnalysis {
  const sentences = splitIntoSentences(text);
  const lengths = sentences.map(s => countWords(s));

  const averageLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = calculateVariance(lengths, averageLength);

  const complexity = determineComplexity(sentences);
  const variety = analyzeStructureVariety(sentences);

  return {
    averageLength,
    lengthVariance: variance,
    complexity,
    variety,
    patterns: identifyPatterns(sentences),
  };
}
```

## Readability Scores

```typescript
interface ReadabilityScore {
  fleschKincaid: number;
  gunningFog: number;
  colemanLiau: number;
  overall: 'elementary' | 'middle' | 'high' | 'college' | 'graduate';
}

function calculateReadability(text: string): ReadabilityScore {
  const sentences = splitIntoSentences(text);
  const words = tokenize(text);
  const syllables = countSyllables(words);

  // Flesch-Kincaid Grade Level
  const fleschKincaid =
    0.39 * (words.length / sentences.length) +
    11.8 * (syllables / words.length) -
    15.59;

  // Gunning Fog Index
  const complexWords = words.filter(w => countSyllables([w]) >= 3).length;
  const gunningFog =
    0.4 *
    (words.length / sentences.length + (100 * complexWords) / words.length);

  // Coleman-Liau Index
  const avgCharsPerWord = words.join('').length / words.length;
  const colemanLiau =
    0.0588 * lettersPer100Words(text) -
    0.296 * sentencesPer100Words(text) -
    15.8;

  return {
    fleschKincaid,
    gunningFog,
    colemanLiau,
    overall: categorizeReadability(fleschKincaid),
  };
}
```

## Pacing Analysis

```typescript
interface PacingAnalysis {
  overall: 'slow' | 'moderate' | 'fast' | 'varied';
  actionDensity: number; // 0-1
  dialogueRatio: number; // 0-1
  descriptionRatio: number; // 0-1
  sentenceLengthTrend: SentenceLengthTrend;
}

interface SentenceLengthTrend {
  sections: LengthSection[];
  pattern: 'increasing' | 'decreasing' | 'stable' | 'variable';
}

function analyzePacing(text: string, chunkSize: number = 500): PacingAnalysis {
  const sentences = splitIntoSentences(text);
  const sections: LengthSection[] = [];

  for (let i = 0; i < sentences.length; i += chunkSize) {
    const chunk = sentences.slice(i, i + chunkSize);
    const lengths = chunk.map(s => countWords(s));

    sections.push({
      startIndex: i,
      endIndex: Math.min(i + chunkSize, sentences.length),
      averageLength: lengths.reduce((a, b) => a + b, 0) / lengths.length,
      variance: calculateVariance(
        lengths,
        lengths.reduce((a, b) => a + b, 0) / lengths.length,
      ),
    });
  }

  return {
    overall: categorizePacing(sections),
    actionDensity: calculateActionDensity(text),
    dialogueRatio: calculateDialogueRatio(text),
    descriptionRatio: calculateDescriptionRatio(text),
    sentenceLengthTrend: analyzeTrend(sections),
  };
}
```

## Real-Time Analysis

```typescript
class RealTimeStyleAnalyzer {
  private debounceTimer: number | null = null;
  private analysisCache: Map<string, StyleAnalysis> = new Map();

  async analyzeWithDebounce(
    text: string,
    delay: number = 500,
  ): Promise<StyleAnalysis> {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    return new Promise(resolve => {
      this.debounceTimer = window.setTimeout(async () => {
        const analysis = await this.analyze(text);
        resolve(analysis);
        this.debounceTimer = null;
      }, delay);
    });
  }

  private async analyze(text: string): Promise<StyleAnalysis> {
    const cacheKey = this.generateCacheKey(text);

    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey)!;
    }

    const analysis = {
      voiceConsistency: analyzeVoiceConsistency(text, this.baselineProfile),
      tone: detectTone(text),
      vocabulary: analyzeVocabulary(text),
      sentenceStructure: analyzeSentenceStructure(text),
      readability: calculateReadability(text),
      pacing: analyzePacing(text),
    };

    this.analysisCache.set(cacheKey, analysis);

    return analysis;
  }
}
```

## Performance Optimization

- Use debouncing for real-time analysis
- Cache analysis results by content hash
- Analyze chunks for long documents
- Use Web Workers for heavy computations
- Optimize tokenization and string operations

## Testing

```typescript
describe('style-analyzer', () => {
  it('detects tone accurately', () => {
    const text = 'The dark clouds gathered ominously overhead.';
    const tone = detectTone(text);

    expect(tone.primary).toBe('dark');
    expect(tone.intensity).toBeGreaterThan(0);
  });

  it('calculates readability scores', () => {
    const text = 'The quick brown fox jumps over the lazy dog.';
    const readability = calculateReadability(text);

    expect(readability.fleschKincaid).toBeGreaterThan(0);
    expect(readability.overall).toBeDefined();
  });
});
```

## Integration

- Grammar system for comprehensive analysis
- Writing goals for style targets
- Inline suggestions for real-time feedback
