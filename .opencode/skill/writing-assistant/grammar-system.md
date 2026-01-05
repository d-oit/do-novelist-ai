# Grammar System

## Core Concepts

Grammar checking and suggestion system with explanations and context-aware
recommendations.

## Grammar Categories

```typescript
enum GrammarCategory {
  SPELLING = 'spelling',
  PUNCTUATION = 'punctuation',
  GRAMMAR = 'grammar',
  SYNTAX = 'syntax',
  STYLE = 'style',
  CLARITY = 'clarity',
  VOICE = 'voice',
  TENSE = 'tense',
}
```

## Grammar Issues

```typescript
interface GrammarIssue {
  id: string;
  category: GrammarCategory;
  severity: 'error' | 'warning' | 'suggestion';
  message: string;
  context: string;
  suggestions: GrammarSuggestion[];
  position: TextPosition;
  explanation: string;
  examples: GrammarExample[];
}

interface GrammarSuggestion {
  text: string;
  confidence: number; // 0-1
  reason: string;
}

interface TextPosition {
  start: number;
  end: number;
  line: number;
  column: number;
}

interface GrammarExample {
  incorrect: string;
  correct: string;
  explanation: string;
}
```

## Spelling Check

```typescript
class SpellingChecker {
  private dictionary: Set<string>;
  private userDictionary: Set<string>;

  async check(text: string): Promise<GrammarIssue[]> {
    const words = tokenize(text);
    const issues: GrammarIssue[] = [];

    words.forEach((word, index) => {
      if (!this.isCorrect(word)) {
        const position = findWordPosition(text, word, index);

        issues.push({
          id: generateId(),
          category: GrammarCategory.SPELLING,
          severity: 'error',
          message: `Possible spelling error: "${word}"`,
          context: this.getContext(text, position),
          suggestions: this.getSuggestions(word),
          position,
          explanation: this.getSpellingExplanation(word),
          examples: this.getSpellingExamples(word),
        });
      }
    });

    return issues;
  }

  private getSuggestions(word: string): GrammarSuggestion[] {
    const corrections = this.findCorrections(word);

    return corrections.slice(0, 3).map(correction => ({
      text: correction,
      confidence: this.calculateCorrectionConfidence(word, correction),
      reason: 'Similar word found in dictionary',
    }));
  }

  private findCorrections(word: string): string[] {
    const suggestions: string[] = [];

    for (const dictWord of this.dictionary) {
      const distance = levenshteinDistance(
        word.toLowerCase(),
        dictWord.toLowerCase(),
      );

      if (distance <= 2) {
        suggestions.push(dictWord);
      }
    }

    return suggestions.sort(
      (a, b) => levenshteinDistance(word, a) - levenshteinDistance(word, b),
    );
  }
}
```

## Grammar Rules Engine

```typescript
interface GrammarRule {
  id: string;
  name: string;
  category: GrammarCategory;
  pattern: RegExp | string;
  check: (match: RegExpMatchArray, context: string) => GrammarIssue | null;
  suggestions: (match: RegExpMatchArray) => GrammarSuggestion[];
  explanation: string;
  examples: GrammarExample[];
}

class GrammarRulesEngine {
  private rules: GrammarRule[] = [
    {
      id: 'subject-verb-agreement',
      name: 'Subject-Verb Agreement',
      category: GrammarCategory.GRAMMAR,
      pattern: /\b(he|she|it|the \w+)\s+(are|were)\b/gi,
      check: (match, context) => {
        return {
          id: generateId(),
          category: GrammarCategory.GRAMMAR,
          severity: 'error',
          message: 'Subject-verb agreement error',
          context,
          suggestions: [
            {
              text: match[1] + ' is',
              confidence: 0.8,
              reason: 'Use "is" for singular subjects',
            },
            {
              text: match[1] + ' was',
              confidence: 0.8,
              reason: 'Use "was" for singular subjects in past tense',
            },
          ],
          position: {
            start: match.index!,
            end: match.index! + match[0].length,
            line: 0,
            column: match.index!,
          },
          explanation: 'Singular subjects require singular verbs',
          examples: [
            {
              incorrect: 'She are happy',
              correct: 'She is happy',
              explanation: 'Change "are" to "is"',
            },
          ],
        };
      },
      suggestions: match => [
        {
          text: match[1] + ' is',
          confidence: 0.8,
          reason: 'Use "is" for singular subjects',
        },
        {
          text: match[1] + ' was',
          confidence: 0.8,
          reason: 'Use "was" for singular subjects in past tense',
        },
      ],
      explanation: 'Singular subjects require singular verbs',
      examples: [
        {
          incorrect: 'She are happy',
          correct: 'She is happy',
          explanation: 'Change "are" to "is"',
        },
      ],
    },
    {
      id: 'double-negative',
      name: 'Double Negative',
      category: GrammarCategory.GRAMMAR,
      pattern:
        /\b(not|never|no|nobody|nothing|nowhere)\s+(not|never|no|nobody|nothing|nowhere)\b/gi,
      check: (match, context) => {
        return {
          id: generateId(),
          category: GrammarCategory.GRAMMAR,
          severity: 'warning',
          message: 'Possible double negative',
          context,
          suggestions: [
            {
              text: context.replace(match[1], ''),
              confidence: 0.7,
              reason: 'Remove one negative',
            },
            {
              text: context.replace(match[2], ''),
              confidence: 0.7,
              reason: 'Remove one negative',
            },
          ],
          position: {
            start: match.index!,
            end: match.index! + match[0].length,
            line: 0,
            column: match.index!,
          },
          explanation: 'Using two negatives can create confusion',
          examples: [
            {
              incorrect: "I don't want nothing",
              correct: "I don't want anything",
              explanation: 'Replace second negative with positive',
            },
          ],
        };
      },
      suggestions: match => [
        {
          text: context.replace(match[1], ''),
          confidence: 0.7,
          reason: 'Remove one negative',
        },
      ],
      explanation: 'Using two negatives can create confusion',
      examples: [
        {
          incorrect: "I don't want nothing",
          correct: "I don't want anything",
          explanation: 'Replace second negative with positive',
        },
      ],
    },
  ];

  check(text: string): GrammarIssue[] {
    const issues: GrammarIssue[] = [];

    for (const rule of this.rules) {
      const matches = text.matchAll(rule.pattern);

      for (const match of matches) {
        const issue = rule.check(match, text);
        if (issue) {
          issues.push(issue);
        }
      }
    }

    return issues;
  }
}
```

## Punctuation Checker

```typescript
class PunctuationChecker {
  check(text: string): GrammarIssue[] {
    const issues: GrammarIssue[] = [];

    // Check for missing commas before coordinating conjunctions
    const missingCommas = this.checkMissingCommas(text);
    issues.push(...missingCommas);

    // Check for run-on sentences
    const runOnSentences = this.checkRunOnSentences(text);
    issues.push(...runOnSentences);

    // Check for comma splices
    const commaSplices = this.checkCommaSplices(text);
    issues.push(...commaSplices);

    return issues;
  }

  private checkMissingCommas(text: string): GrammarIssue[] {
    const issues: GrammarIssue[] = [];
    const pattern = /([^.!?]+)\s+(and|or|but|nor|for|so|yet)\s+([^.!?]+[.!?])/g;

    let match;
    while ((match = pattern.exec(text)) !== null) {
      const [, firstClause, conjunction, secondClause] = match;

      if (firstClause.trim().length > 10 && secondClause.trim().length > 10) {
        issues.push({
          id: generateId(),
          category: GrammarCategory.PUNCTUATION,
          severity: 'warning',
          message: 'Consider adding a comma before the conjunction',
          context: match[0],
          suggestions: [
            {
              text: `${firstClause.trim()}, ${conjunction} ${secondClause.trim()}`,
              confidence: 0.6,
              reason: 'Improve readability',
            },
          ],
          position: {
            start: match.index!,
            end: match.index! + match[0].length,
            line: 0,
            column: match.index!,
          },
          explanation:
            'Use commas before coordinating conjunctions joining independent clauses',
          examples: [
            {
              incorrect: 'I went to the store and bought milk',
              correct: 'I went to the store, and bought milk',
              explanation: 'Add comma before "and"',
            },
          ],
        });
      }
    }

    return issues;
  }

  private checkCommaSplices(text: string): GrammarIssue[] {
    const issues: GrammarIssue[] = [];
    const sentences = text.match(/[^.!?]+[.!?]/g) || [];

    for (const sentence of sentences) {
      const clauses = sentence.split(', ');
      if (clauses.length >= 2) {
        for (let i = 0; i < clauses.length - 1; i++) {
          const currentClause = clauses[i].trim();
          const nextClause = clauses[i + 1].trim();

          if (
            isIndependentClause(currentClause) &&
            isIndependentClause(nextClause)
          ) {
            issues.push({
              id: generateId(),
              category: GrammarCategory.PUNCTUATION,
              severity: 'error',
              message:
                'Comma splice: two independent clauses joined only by a comma',
              context: `${currentClause}, ${nextClause}`,
              suggestions: [
                {
                  text: `${currentClause}; ${nextClause}`,
                  confidence: 0.7,
                  reason: 'Use semicolon',
                },
                {
                  text: `${currentClause}, and ${nextClause}`,
                  confidence: 0.6,
                  reason: 'Add coordinating conjunction',
                },
              ],
              position: { start: 0, end: 0, line: 0, column: 0 },
              explanation:
                'Use semicolons or conjunctions to join independent clauses',
              examples: [
                {
                  incorrect: 'I love coffee, it keeps me awake',
                  correct: 'I love coffee; it keeps me awake',
                  explanation: 'Use semicolon',
                },
              ],
            });
          }
        }
      }
    }

    return issues;
  }
}
```

## Style and Clarity Suggestions

```typescript
class StyleChecker {
  check(text: string): GrammarIssue[] {
    const issues: GrammarIssue[] = [];

    // Check for passive voice
    const passiveVoice = this.checkPassiveVoice(text);
    issues.push(...passiveVoice);

    // Check for wordy phrases
    const wordyPhrases = this.checkWordyPhrases(text);
    issues.push(...wordyPhrases);

    // Check for weak verbs
    const weakVerbs = this.checkWeakVerbs(text);
    issues.push(...weakVerbs);

    return issues;
  }

  private checkPassiveVoice(text: string): GrammarIssue[] {
    const issues: GrammarIssue[] = [];
    const passivePattern =
      /\b(was|were|is|are|been|being)\s+(\w+ed)\s+(by|with)\b/gi;

    let match;
    while ((match = passivePattern.exec(text)) !== null) {
      issues.push({
        id: generateId(),
        category: GrammarCategory.VOICE,
        severity: 'suggestion',
        message: 'Consider using active voice instead of passive voice',
        context: match[0],
        suggestions: [
          {
            text: this.convertToActive(match[0]),
            confidence: 0.6,
            reason: 'Active voice is more direct',
          },
        ],
        position: {
          start: match.index!,
          end: match.index! + match[0].length,
          line: 0,
          column: match.index!,
        },
        explanation: 'Active voice is generally more direct and engaging',
        examples: [
          {
            incorrect: 'The ball was thrown by John',
            correct: 'John threw the ball',
            explanation: 'Make John the subject',
          },
        ],
      });
    }

    return issues;
  }
}
```

## Integrated Grammar Checker

```typescript
class GrammarChecker {
  private spelling: SpellingChecker;
  private rules: GrammarRulesEngine;
  private punctuation: PunctuationChecker;
  private style: StyleChecker;

  async check(text: string): Promise<GrammarCheckResult> {
    const [spellingIssues, ruleIssues, punctuationIssues, styleIssues] =
      await Promise.all([
        this.spelling.check(text),
        Promise.resolve(this.rules.check(text)),
        Promise.resolve(this.punctuation.check(text)),
        Promise.resolve(this.style.check(text)),
      ]);

    const allIssues = [
      ...spellingIssues,
      ...ruleIssues,
      ...punctuationIssues,
      ...styleIssues,
    ];

    const prioritized = this.prioritizeIssues(allIssues);

    return {
      issues: prioritized,
      summary: this.generateSummary(allIssues),
      score: this.calculateGrammarScore(allIssues),
    };
  }

  private prioritizeIssues(issues: GrammarIssue[]): GrammarIssue[] {
    return issues.sort((a, b) => {
      const severityOrder = ['error', 'warning', 'suggestion'];
      const aSeverity = severityOrder.indexOf(a.severity);
      const bSeverity = severityOrder.indexOf(b.severity);

      return aSeverity - bSeverity;
    });
  }
}
```

## Performance Optimization

- Use caching for repeated checks
- Implement incremental checking
- Batch similar checks
- Use efficient regex patterns
- Parallelize independent checks

## Testing

```typescript
describe('grammar-checker', () => {
  it('detects subject-verb agreement errors', () => {
    const checker = new GrammarRulesEngine();
    const issues = checker.check('She are happy');

    expect(issues).toHaveLength(1);
    expect(issues[0].category).toBe(GrammarCategory.GRAMMAR);
  });

  it('suggests corrections for spelling errors', async () => {
    const checker = new SpellingChecker();
    const issues = await checker.check('The quik brown fox');

    expect(issues).toHaveLength(1);
    expect(issues[0].suggestions[0].text).toBe('quick');
  });
});
```

## Integration

- Style analysis for comprehensive feedback
- Inline suggestions for real-time corrections
- Writing goals for grammar targets
