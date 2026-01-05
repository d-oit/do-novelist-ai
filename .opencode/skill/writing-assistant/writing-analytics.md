# Writing Analytics

## Core Concepts

Writing analytics and productivity metrics for tracking performance, patterns,
and insights.

## Analytics Metrics

```typescript
interface WritingMetrics {
  productivity: ProductivityMetrics;
  consistency: ConsistencyMetrics;
  quality: QualityMetrics;
  patterns: WritingPattern[];
  insights: WritingInsight[];
}
```

## Productivity Metrics

```typescript
interface ProductivityMetrics {
  totalWordsWritten: number;
  averageWordsPerDay: number;
  averageWordsPerSession: number;
  totalWritingTime: number; // in minutes
  averageSessionLength: number; // in minutes
  mostProductiveHour: number; // 0-23
  mostProductiveDay: DayOfWeek;
  wordsWrittenToday: number;
  writingStreak: number;
  longestWritingStreak: number;
}

enum DayOfWeek {
  SUNDAY = 'sunday',
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
}

class ProductivityAnalyzer {
  async calculateProductivity(
    userId: string,
    period: TimePeriod,
  ): Promise<ProductivityMetrics> {
    const sessions = await this.getWritingSessions(userId, period);

    const totalWords = sessions.reduce((sum, s) => sum + s.wordsWritten, 0);
    const totalTime = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
    const wordsToday = await this.getWordsWrittenToday(userId);
    const streak = await this.getWritingStreak(userId);
    const longestStreak = await this.getLongestWritingStreak(userId);

    const wordsPerHour = this.groupByHour(sessions);
    const mostProductiveHour = this.findMostProductiveHour(wordsPerHour);

    const wordsPerDay = this.groupByDayOfWeek(sessions);
    const mostProductiveDay = this.findMostProductiveDay(wordsPerDay);

    return {
      totalWordsWritten: totalWords,
      averageWordsPerDay: totalWords / this.getDaysInPeriod(period),
      averageWordsPerSession: totalWords / sessions.length,
      totalWritingTime: totalTime,
      averageSessionLength: totalTime / sessions.length,
      mostProductiveHour,
      mostProductiveDay,
      wordsWrittenToday: wordsToday,
      writingStreak: streak.current,
      longestWritingStreak: streak.longest,
    };
  }

  private groupByHour(sessions: WritingSession[]): Map<number, number> {
    const grouped = new Map<number, number>();

    sessions.forEach(session => {
      const hour = session.startTime.getHours();
      const current = grouped.get(hour) || 0;
      grouped.set(hour, current + session.wordsWritten);
    });

    return grouped;
  }

  private findMostProductiveHour(wordsPerHour: Map<number, number>): number {
    let maxWords = 0;
    let mostProductiveHour = 9; // Default to 9 AM

    for (const [hour, words] of wordsPerHour.entries()) {
      if (words > maxWords) {
        maxWords = words;
        mostProductiveHour = hour;
      }
    }

    return mostProductiveHour;
  }
}
```

## Consistency Metrics

```typescript
interface ConsistencyMetrics {
  daysWritten: number;
  totalDays: number;
  consistencyRate: number; // 0-1
  weeklyPattern: WeeklyPattern;
  sessionFrequency: SessionFrequency;
  longestGap: number; // days
  averageGap: number; // days
}

interface WeeklyPattern {
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
}

interface SessionFrequency {
  sessionsPerWeek: number;
  averageGapBetweenSessions: number;
  mostFrequentGap: number;
}

class ConsistencyAnalyzer {
  async calculateConsistency(
    userId: string,
    period: TimePeriod,
  ): Promise<ConsistencyMetrics> {
    const sessions = await this.getWritingSessions(userId, period);
    const daysWritten = await this.getDaysWritten(userId, period);
    const totalDays = this.getDaysInPeriod(period);

    const consistencyRate = daysWritten.length / totalDays;

    const weeklyPattern = this.calculateWeeklyPattern(daysWritten);
    const sessionFrequency = this.calculateSessionFrequency(sessions);

    const gaps = this.calculateGaps(sessions);
    const longestGap = Math.max(...gaps);
    const averageGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;

    return {
      daysWritten: daysWritten.length,
      totalDays,
      consistencyRate,
      weeklyPattern,
      sessionFrequency,
      longestGap,
      averageGap,
    };
  }

  private calculateWeeklyPattern(daysWritten: Date[]): WeeklyPattern {
    const pattern: WeeklyPattern = {
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0,
      sunday: 0,
    };

    daysWritten.forEach(date => {
      const day = date.getDay();
      switch (day) {
        case 1:
          pattern.monday++;
          break;
        case 2:
          pattern.tuesday++;
          break;
        case 3:
          pattern.wednesday++;
          break;
        case 4:
          pattern.thursday++;
          break;
        case 5:
          pattern.friday++;
          break;
        case 6:
          pattern.saturday++;
          break;
        case 0:
          pattern.sunday++;
          break;
      }
    });

    return pattern;
  }

  private calculateGaps(sessions: WritingSession[]): number[] {
    const sorted = [...sessions].sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime(),
    );
    const gaps: number[] = [];

    for (let i = 1; i < sorted.length; i++) {
      const gap = this.daysBetween(
        sorted[i - 1].startTime,
        sorted[i].startTime,
      );
      gaps.push(gap);
    }

    return gaps;
  }

  private daysBetween(date1: Date, date2: Date): number {
    const msPerDay = 1000 * 60 * 60 * 24;
    return Math.floor((date2.getTime() - date1.getTime()) / msPerDay);
  }
}
```

## Quality Metrics

```typescript
interface QualityMetrics {
  averageReadabilityScore: number;
  vocabularyRichness: number;
  grammarErrorRate: number;
  voiceConsistencyScore: number;
  editRatio: number; // edits / total words
  revisionCount: number;
  chaptersCompleted: number;
}

class QualityAnalyzer {
  async calculateQuality(
    userId: string,
    period: TimePeriod,
  ): Promise<QualityMetrics> {
    const texts = await this.getWrittenTexts(userId, period);

    const readabilityScores = texts.map(t => calculateReadability(t.content));
    const averageReadability =
      readabilityScores.reduce((a, b) => a + b.fleschKincaid, 0) /
      readabilityScores.length;

    const vocabularyRichness = this.calculateAverageVocabularyRichness(texts);
    const grammarErrors = await this.getGrammarErrors(userId, period);
    const grammarErrorRate =
      grammarErrors.length / texts.reduce((sum, t) => sum + t.wordCount, 0);

    const editRatio = await this.getEditRatio(userId, period);
    const voiceConsistency = await this.getVoiceConsistencyScore(
      userId,
      period,
    );

    return {
      averageReadabilityScore: averageReadability,
      vocabularyRichness,
      grammarErrorRate,
      voiceConsistencyScore: voiceConsistency,
      editRatio,
      revisionCount: await this.getRevisionCount(userId, period),
      chaptersCompleted: await this.getChaptersCompleted(userId, period),
    };
  }

  private calculateAverageVocabularyRichness(texts: WrittenText[]): number {
    const richnessScores = texts.map(text => {
      const words = tokenize(text.content);
      const uniqueWords = new Set(words.map(w => w.toLowerCase()));
      return uniqueWords.size / words.length;
    });

    return richnessScores.reduce((a, b) => a + b, 0) / richnessScores.length;
  }
}
```

## Writing Patterns

```typescript
interface WritingPattern {
  id: string;
  name: string;
  type: PatternType;
  description: string;
  frequency: number;
  confidence: number; // 0-1
  examples: PatternExample[];
  recommendation?: PatternRecommendation;
}

enum PatternType {
  TIME = 'time',
  DURATION = 'duration',
  WORD_COUNT = 'word_count',
  LOCATION = 'location',
  DEVICE = 'device',
  GENRE = 'genre',
}

interface PatternExample {
  date: Date;
  words: number;
  duration: number;
  context: string;
}

interface PatternRecommendation {
  action: string;
  reason: string;
  priority: 'low' | 'medium' | 'high';
}

class PatternAnalyzer {
  async analyzePatterns(
    userId: string,
    period: TimePeriod,
  ): Promise<WritingPattern[]> {
    const sessions = await this.getWritingSessions(userId, period);
    const patterns: WritingPattern[] = [];

    // Analyze time patterns
    const timePattern = await this.analyzeTimePattern(sessions);
    if (timePattern) patterns.push(timePattern);

    // Analyze duration patterns
    const durationPattern = await this.analyzeDurationPattern(sessions);
    if (durationPattern) patterns.push(durationPattern);

    // Analyze word count patterns
    const wordCountPattern = await this.analyzeWordCountPattern(sessions);
    if (wordCountPattern) patterns.push(wordCountPattern);

    return patterns;
  }

  private async analyzeTimePattern(
    sessions: WritingSession[],
  ): Promise<WritingPattern | null> {
    const hourlyCounts = this.groupSessionsByHour(sessions);
    const maxCount = Math.max(...hourlyCounts.values());

    if (maxCount < 3) return null; // Not enough data

    const mostFrequentHour = Array.from(hourlyCounts.entries()).find(
      ([_, count]) => count === maxCount,
    )!;

    return {
      id: generateId(),
      name: 'Peak Writing Time',
      type: PatternType.TIME,
      description: `You write most frequently at ${mostFrequentHour[0]}:00`,
      frequency: mostFrequentHour[1],
      confidence: mostFrequentHour[1] / sessions.length,
      examples: sessions
        .filter(s => s.startTime.getHours() === mostFrequentHour[0])
        .slice(0, 3)
        .map(s => ({
          date: s.startTime,
          words: s.wordsWritten,
          duration: s.durationMinutes,
          context: s.location || 'unknown',
        })),
      recommendation: {
        action: `Schedule dedicated writing time around ${mostFrequentHour[0]}:00`,
        reason: 'You write consistently during this time period',
        priority: 'medium',
      },
    };
  }
}
```

## Writing Insights

```typescript
interface WritingInsight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  severity: 'info' | 'tip' | 'warning' | 'alert';
  metrics: InsightMetrics;
  suggestions: InsightSuggestion[];
  createdAt: Date;
}

enum InsightType {
  PRODUCTIVITY = 'productivity',
  CONSISTENCY = 'consistency',
  QUALITY = 'quality',
  GOAL = 'goal',
  HABIT = 'habit',
}

interface InsightMetrics {
  currentValue: number;
  targetValue?: number;
  change: number;
  changePercentage: number;
}

interface InsightSuggestion {
  text: string;
  action?: string;
  impact: 'low' | 'medium' | 'high';
}

class InsightsGenerator {
  async generateInsights(
    userId: string,
    period: TimePeriod,
  ): Promise<WritingInsight[]> {
    const insights: WritingInsight[] = [];

    const productivity = await this.analyzeProductivityInsights(userId, period);
    insights.push(...productivity);

    const consistency = await this.analyzeConsistencyInsights(userId, period);
    insights.push(...consistency);

    const quality = await this.analyzeQualityInsights(userId, period);
    insights.push(...quality);

    return insights;
  }

  private async analyzeProductivityInsights(
    userId: string,
    period: TimePeriod,
  ): Promise<WritingInsight[]> {
    const insights: WritingInsight[] = [];
    const metrics = await this.getProductivityMetrics(userId, period);
    const previousMetrics = await this.getProductivityMetrics(
      userId,
      this.getPreviousPeriod(period),
    );

    const change =
      metrics.averageWordsPerDay - previousMetrics.averageWordsPerDay;
    const changePercentage =
      (change / previousMetrics.averageWordsPerDay) * 100;

    if (changePercentage > 20) {
      insights.push({
        id: generateId(),
        type: InsightType.PRODUCTIVITY,
        title: 'Great Productivity Boost!',
        description: `Your daily word count increased by ${changePercentage.toFixed(1)}% this period.`,
        severity: 'info',
        metrics: {
          currentValue: metrics.averageWordsPerDay,
          change,
          changePercentage,
        },
        suggestions: [
          {
            text: 'Keep up the momentum with consistent writing habits',
            impact: 'high',
          },
        ],
        createdAt: new Date(),
      });
    } else if (changePercentage < -20) {
      insights.push({
        id: generateId(),
        type: InsightType.PRODUCTIVITY,
        title: 'Productivity Decline',
        description: `Your daily word count decreased by ${Math.abs(changePercentage).toFixed(1)}% this period.`,
        severity: 'warning',
        metrics: {
          currentValue: metrics.averageWordsPerDay,
          change,
          changePercentage,
        },
        suggestions: [
          {
            text: 'Review your schedule and set aside dedicated writing time',
            impact: 'high',
          },
          {
            text: 'Try shorter, more frequent writing sessions',
            impact: 'medium',
          },
        ],
        createdAt: new Date(),
      });
    }

    return insights;
  }
}
```

## Performance Optimization

- Cache analytics calculations
- Use time-based partitioning
- Implement incremental updates
- Aggregate data periodically
- Use efficient queries

## Testing

```typescript
describe('writing-analytics', () => {
  it('calculates productivity metrics', async () => {
    const analyzer = new ProductivityAnalyzer();
    const metrics = await analyzer.calculateProductivity(
      'user-1',
      TimePeriod.WEEK,
    );

    expect(metrics.totalWordsWritten).toBeGreaterThan(0);
    expect(metrics.averageWordsPerDay).toBeGreaterThan(0);
  });

  it('detects productivity insights', async () => {
    const generator = new InsightsGenerator();
    const insights = await generator.generateInsights(
      'user-1',
      TimePeriod.MONTH,
    );

    expect(insights.length).toBeGreaterThan(0);
  });
});
```

## Integration

- Goals tracking for target comparison
- Style analysis for quality metrics
- Grammar system for error tracking
