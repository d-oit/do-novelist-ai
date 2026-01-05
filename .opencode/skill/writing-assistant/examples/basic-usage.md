# Basic Usage - Writing Assistant

## Example 1: Real-Time Style Analysis

```typescript
import { RealTimeStyleAnalyzer } from '@/features/writing-assistant';

const analyzer = new RealTimeStyleAnalyzer();

// Analyze text with debouncing
const suggestions = await analyzer.analyzeWithDebounce(text, 500);

console.log('Voice consistency:', suggestions.voiceConsistency);
console.log('Tone:', suggestions.tone);
console.log('Readability:', suggestions.readability);
```

## Example 2: Grammar Checking

```typescript
import { GrammarChecker } from '@/features/writing-assistant';

const checker = new GrammarChecker();

// Check grammar
const result = await checker.check(text);

console.log('Grammar score:', result.score);
console.log('Issues:', result.issues);

// Display issues
result.issues.forEach(issue => {
  console.log(`- ${issue.category}: ${issue.message}`);
  issue.suggestions.forEach(suggestion => {
    console.log(`  Suggestion: ${suggestion.text}`);
  });
});
```

## Example 3: Setting Writing Goals

```typescript
import { GoalTracker } from '@/features/writing-assistant';

const tracker = new GoalTracker();

// Create a daily writing goal
const goal: WritingGoal = {
  id: 'goal-001',
  name: 'Daily 500 Words',
  description: 'Write 500 words every day',
  type: GoalType.WORD_COUNT,
  period: GoalPeriod.DAILY,
  target: 500,
  current: 0,
  unit: 'words',
  startDate: new Date(),
  status: GoalStatus.ACTIVE,
  priority: GoalPriority.MEDIUM,
  isCompleted: false,
  streak: { current: 0, longest: 0, history: [] },
};

await tracker.createGoal(goal);

// Track progress
const result = await tracker.trackProgress('goal-001', 250);
console.log('Progress:', result.progress);
console.log('Streak:', result.streak);
```

## Example 4: Getting Writing Analytics

```typescript
import { ProductivityAnalyzer } from '@/features/writing-assistant';

const analyzer = new ProductivityAnalyzer();

// Get productivity metrics for this month
const metrics = await analyzer.calculateProductivity(
  'user-001',
  TimePeriod.MONTH,
);

console.log('Total words written:', metrics.totalWordsWritten);
console.log('Average words per day:', metrics.averageWordsPerDay);
console.log('Most productive hour:', metrics.mostProductiveHour);
console.log('Writing streak:', metrics.writingStreak);
```

## Example 5: Inline Suggestions

```typescript
import { InlineSuggestionEngine } from '@/features/writing-assistant';

const engine = new InlineSuggestionEngine();

// Get inline suggestions as user types
const suggestions = await engine.analyzeWithDebounce(text, cursorPosition, 500);

// Display suggestions
suggestions.forEach(suggestion => {
  console.log(`[${suggestion.severity.toUpperCase()}] ${suggestion.message}`);
  suggestion.suggestions.forEach(option => {
    console.log(`  ${option.label}: ${option.text}`);
  });
});

// Apply suggestion
const modifiedText = await engine.applySuggestion(text, suggestion, 0);
```

## Example 6: Achievements

```typescript
import { AchievementTracker } from '@/features/writing-assistant';

const tracker = new AchievementTracker();

// Check for new achievements
const unlocked = await tracker.checkAchievements(goal);

if (unlocked.length > 0) {
  console.log('New achievements unlocked!');
  unlocked.forEach(achievement => {
    console.log(`🏆 ${achievement.name}: ${achievement.description}`);
  });
}
```
