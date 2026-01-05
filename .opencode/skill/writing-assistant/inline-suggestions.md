# Inline Suggestions

## Core Concepts

Real-time inline suggestions for improving writing quality, style, and clarity.

## Suggestion Types

```typescript
enum SuggestionType {
  GRAMMAR = 'grammar',
  SPELLING = 'spelling',
  STYLE = 'style',
  CLARITY = 'clarity',
  VOCABULARY = 'vocabulary',
  PUNCTUATION = 'punctuation',
  VOICE = 'voice',
}
```

## Inline Suggestion

```typescript
interface InlineSuggestion {
  id: string;
  type: SuggestionType;
  severity: 'error' | 'warning' | 'suggestion';
  message: string;
  position: TextPosition;
  suggestions: SuggestionOption[];
  explanation: string;
  context: string;
  confidence: number; // 0-1
  isDismissed: boolean;
  isApplied: boolean;
}

interface SuggestionOption {
  text: string;
  label: string;
  confidence: number;
  reason: string;
}

interface TextPosition {
  start: number;
  end: number;
  line: number;
  column: number;
}
```

## Real-Time Suggestion Engine

```typescript
class InlineSuggestionEngine {
  private debounceTimer: number | null = null;
  private suggestionCache: Map<string, InlineSuggestion[]> = new Map();

  async analyzeWithDebounce(
    text: string,
    cursorPosition: number,
    delay: number = 500,
  ): Promise<InlineSuggestion[]> {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    return new Promise(resolve => {
      this.debounceTimer = window.setTimeout(async () => {
        const suggestions = await this.analyze(text, cursorPosition);
        resolve(suggestions);
        this.debounceTimer = null;
      }, delay);
    });
  }

  private async analyze(
    text: string,
    cursorPosition: number,
  ): Promise<InlineSuggestion[]> {
    const cacheKey = this.generateCacheKey(text, cursorPosition);

    if (this.suggestionCache.has(cacheKey)) {
      return this.suggestionCache.get(cacheKey)!;
    }

    const context = this.extractContext(text, cursorPosition);
    const suggestions: InlineSuggestion[] = [];

    // Check for spelling
    const spellingSuggestions = await this.checkSpelling(context);
    suggestions.push(...spellingSuggestions);

    // Check for grammar
    const grammarSuggestions = await this.checkGrammar(context);
    suggestions.push(...grammarSuggestions);

    // Check for style
    const styleSuggestions = await this.checkStyle(context);
    suggestions.push(...styleSuggestions);

    // Check for vocabulary
    const vocabularySuggestions = await this.checkVocabulary(context);
    suggestions.push(...vocabularySuggestions);

    const prioritized = this.prioritizeSuggestions(suggestions);

    this.suggestionCache.set(cacheKey, prioritized);

    return prioritized;
  }

  private extractContext(text: string, cursorPosition: number): string {
    const contextSize = 200; // characters
    const start = Math.max(0, cursorPosition - contextSize);
    const end = Math.min(text.length, cursorPosition + contextSize);

    return text.substring(start, end);
  }
}
```

## Spelling Suggestions

```typescript
async function checkSpelling(context: string): Promise<InlineSuggestion[]> {
  const suggestions: InlineSuggestion[] = [];
  const words = tokenize(context);

  for (const word of words) {
    if (!isCorrect(word.text)) {
      const corrections = await getCorrections(word.text);

      suggestions.push({
        id: generateId(),
        type: SuggestionType.SPELLING,
        severity: 'error',
        message: `Possible spelling error: "${word.text}"`,
        position: {
          start: word.start,
          end: word.end,
          line: 0,
          column: word.start,
        },
        suggestions: corrections.slice(0, 3).map(correction => ({
          text: correction.text,
          label: correction.text,
          confidence: correction.confidence,
          reason: 'Similar word found in dictionary',
        })),
        explanation: `The word "${word.text}" may be misspelled. Consider one of these corrections.`,
        context,
        confidence: corrections[0]?.confidence || 0,
        isDismissed: false,
        isApplied: false,
      });
    }
  }

  return suggestions;
}
```

## Grammar Suggestions

```typescript
async function checkGrammar(context: string): Promise<InlineSuggestion[]> {
  const suggestions: InlineSuggestion[] = [];

  // Check subject-verb agreement
  const agreementErrors = await checkSubjectVerbAgreement(context);
  suggestions.push(...agreementErrors);

  // Check for double negatives
  const doubleNegatives = await checkDoubleNegatives(context);
  suggestions.push(...doubleNegatives);

  // Check for passive voice
  const passiveVoice = await checkPassiveVoice(context);
  suggestions.push(...passiveVoice);

  // Check for tense consistency
  const tenseErrors = await checkTenseConsistency(context);
  suggestions.push(...tenseErrors);

  return suggestions;
}

async function checkPassiveVoice(context: string): Promise<InlineSuggestion[]> {
  const suggestions: InlineSuggestion[] = [];
  const passivePattern =
    /\b(was|were|is|are|been|being)\s+(\w+ed)\s+(by|with)\b/gi;

  let match;
  while ((match = passivePattern.exec(context)) !== null) {
    const activeAlternative = convertToActive(match[0]);

    suggestions.push({
      id: generateId(),
      type: SuggestionType.STYLE,
      severity: 'suggestion',
      message: 'Consider using active voice instead of passive voice',
      position: {
        start: match.index!,
        end: match.index! + match[0].length,
        line: 0,
        column: match.index!,
      },
      suggestions: [
        {
          text: activeAlternative,
          label: 'Active voice',
          confidence: 0.6,
          reason: 'Active voice is more direct and engaging',
        },
      ],
      explanation:
        'Passive voice can make writing less engaging. Active voice is generally preferred for fiction.',
      context,
      confidence: 0.6,
      isDismissed: false,
      isApplied: false,
    });
  }

  return suggestions;
}
```

## Style Suggestions

```typescript
async function checkStyle(context: string): Promise<InlineSuggestion[]> {
  const suggestions: InlineSuggestion[] = [];

  // Check for wordy phrases
  const wordyPhrases = await checkWordyPhrases(context);
  suggestions.push(...wordyPhrases);

  // Check for weak verbs
  const weakVerbs = await checkWeakVerbs(context);
  suggestions.push(...weakVerbs);

  // Check for sentence variety
  const sentenceVariety = await checkSentenceVariety(context);
  suggestions.push(...sentenceVariety);

  // Check for repetitive words
  const repetitiveWords = await checkRepetitiveWords(context);
  suggestions.push(...repetitiveWords);

  return suggestions;
}

async function checkWordyPhrases(context: string): Promise<InlineSuggestion[]> {
  const suggestions: InlineSuggestion[] = [];

  const wordyPhraseMap = {
    'in order to': 'to',
    'due to the fact that': 'because',
    'at this point in time': 'now',
    'in the event that': 'if',
    'for the purpose of': 'for',
    'in the vicinity of': 'near',
    'make an effort to': 'try to',
    'give consideration to': 'consider',
    'take into consideration': 'consider',
  };

  for (const [wordy, concise] of Object.entries(wordyPhraseMap)) {
    const regex = new RegExp(wordy, 'gi');
    let match;

    while ((match = regex.exec(context)) !== null) {
      suggestions.push({
        id: generateId(),
        type: SuggestionType.STYLE,
        severity: 'suggestion',
        message: 'This phrase can be more concise',
        position: {
          start: match.index!,
          end: match.index! + match[0].length,
          line: 0,
          column: match.index!,
        },
        suggestions: [
          {
            text: context.replace(match[0], concise),
            label: 'More concise',
            confidence: 0.8,
            reason: 'Shorter phrases are more direct and easier to read',
          },
        ],
        explanation: `The phrase "${wordy}" can be simplified to "${concise}" for better clarity and conciseness.`,
        context,
        confidence: 0.8,
        isDismissed: false,
        isApplied: false,
      });
    }
  }

  return suggestions;
}

async function checkRepetitiveWords(
  context: string,
): Promise<InlineSuggestion[]> {
  const suggestions: InlineSuggestion[] = [];
  const words = tokenize(context);
  const wordCounts = new Map<string, { count: number; positions: number[] }>();

  words.forEach(word => {
    const lower = word.text.toLowerCase();
    const current = wordCounts.get(lower) || { count: 0, positions: [] };
    current.count++;
    current.positions.push(word.start);
    wordCounts.set(lower, current);
  });

  const commonWords = [
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
    'of',
    'is',
    'was',
    'are',
  ];

  for (const [word, data] of wordCounts.entries()) {
    if (!commonWords.includes(word) && data.count >= 3) {
      const alternatives = await getSynonyms(word);

      data.positions.forEach(position => {
        suggestions.push({
          id: generateId(),
          type: SuggestionType.VOCABULARY,
          severity: 'suggestion',
          message: `"${word}" is repeated ${data.count} times in this passage`,
          position: {
            start: position,
            end: position + word.length,
            line: 0,
            column: position,
          },
          suggestions: alternatives.slice(0, 3).map(alt => ({
            text: alt,
            label: alt,
            confidence: 0.7,
            reason: 'Alternative word for variety',
          })),
          explanation: `Using a variety of vocabulary keeps writing engaging. Consider synonyms for "${word}".`,
          context,
          confidence: 0.7,
          isDismissed: false,
          isApplied: false,
        });
      });
    }
  }

  return suggestions;
}
```

## Vocabulary Suggestions

```typescript
async function checkVocabulary(context: string): Promise<InlineSuggestion[]> {
  const suggestions: InlineSuggestion[] = [];

  // Check for weak adjectives
  const weakAdjectives = await checkWeakAdjectives(context);
  suggestions.push(...weakAdjectives);

  // Check for cliches
  const cliches = await checkCliches(context);
  suggestions.push(...cliches);

  return suggestions;
}

async function checkWeakAdjectives(
  context: string,
): Promise<InlineSuggestion[]> {
  const suggestions: InlineSuggestion[] = [];

  const weakAdjectiveMap = {
    good: ['excellent', 'wonderful', 'outstanding', 'superb', 'exceptional'],
    bad: ['terrible', 'awful', 'horrible', 'dreadful', 'abysmal'],
    big: ['large', 'enormous', 'massive', 'immense', 'colossal'],
    small: ['tiny', 'minute', 'diminutive', 'petite', 'microscopic'],
    beautiful: ['gorgeous', 'stunning', 'magnificent', 'lovely', 'exquisite'],
    ugly: ['hideous', 'repulsive', 'grotesque', 'unsightly', 'disfigured'],
  };

  for (const [weak, alternatives] of Object.entries(weakAdjectiveMap)) {
    const regex = new RegExp(`\\b${weak}\\b`, 'gi');
    let match;

    while ((match = regex.exec(context)) !== null) {
      suggestions.push({
        id: generateId(),
        type: SuggestionType.VOCABULARY,
        severity: 'suggestion',
        message: `"${match[0]}" is a weak adjective`,
        position: {
          start: match.index!,
          end: match.index! + match[0].length,
          line: 0,
          column: match.index!,
        },
        suggestions: alternatives.map(alt => ({
          text: context.replace(match[0], alt),
          label: alt,
          confidence: 0.6,
          reason: 'More descriptive adjective',
        })),
        explanation: `The adjective "${match[0]}" is generic. Consider using more descriptive alternatives.`,
        context,
        confidence: 0.6,
        isDismissed: false,
        isApplied: false,
      });
    }
  }

  return suggestions;
}
```

## Suggestion Management

```typescript
class SuggestionManager {
  private dismissedSuggestions: Set<string> = new Set();

  dismissSuggestion(suggestionId: string): void {
    this.dismissedSuggestions.add(suggestionId);
  }

  isDismissed(suggestionId: string): boolean {
    return this.dismissedSuggestions.has(suggestionId);
  }

  async applySuggestion(
    text: string,
    suggestion: InlineSuggestion,
    optionIndex: number,
  ): Promise<string> {
    const option = suggestion.suggestions[optionIndex];

    const before = text.substring(0, suggestion.position.start);
    const after = text.substring(suggestion.position.end);

    const newText = before + option.text + after;

    suggestion.isApplied = true;

    return newText;
  }

  async applyAllSuggestions(
    text: string,
    suggestions: InlineSuggestion[],
  ): Promise<string> {
    let modifiedText = text;

    const sortedSuggestions = [...suggestions].sort(
      (a, b) => b.position.start - a.position.start,
    );

    for (const suggestion of sortedSuggestions) {
      if (
        !suggestion.isApplied &&
        !suggestion.isDismissed &&
        suggestion.suggestions.length > 0
      ) {
        modifiedText = await this.applySuggestion(modifiedText, suggestion, 0);
      }
    }

    return modifiedText;
  }
}
```

## Performance Optimization

- Use debouncing for real-time analysis
- Cache suggestion results
- Analyze only changed text
- Use efficient tokenization
- Implement incremental analysis

## Testing

```typescript
describe('inline-suggestions', () => {
  it('detects spelling errors', async () => {
    const engine = new InlineSuggestionEngine();
    const suggestions = await engine.analyze('The quik brown fox', 0);

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].type).toBe(SuggestionType.SPELLING);
  });

  it('suggests active voice alternatives', async () => {
    const engine = new InlineSuggestionEngine();
    const suggestions = await engine.analyze('The ball was thrown by John', 0);

    expect(suggestions).toContainEqual(
      expect.objectContaining({ type: SuggestionType.STYLE }),
    );
  });
});
```

## Integration

- Style analysis for comprehensive feedback
- Grammar system for detailed checking
- Writing goals for improvement tracking
