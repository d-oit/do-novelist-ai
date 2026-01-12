# Writing Assistant Feature

The Writing Assistant provides real-time AI-powered writing feedback, grammar
suggestions, style analysis, and goal tracking to help authors improve their
craft and maintain consistency.

## Overview

The Writing Assistant helps authors:

- ✍️ **Grammar & Spelling** - Real-time grammar and spelling suggestions
- 🎨 **Style Analysis** - Analyze writing style, voice, and tone consistency
- 💡 **Inline Suggestions** - Contextual writing improvements as you type
- 🎯 **Writing Goals** - Set and track word count and quality goals
- 📊 **Analytics Dashboard** - Comprehensive writing metrics and insights
- 📖 **Readability** - Analyze readability scores and complexity
- 🔍 **Clarity Metrics** - Identify passive voice, weak verbs, redundancy

## Architecture

```
writing-assistant/
├── components/              # UI Components
│   ├── WritingAssistantPanel.tsx       # Main assistant interface
│   ├── WritingAssistantSettings.tsx    # Configuration panel
│   ├── WritingAnalyticsDashboard.tsx   # Metrics dashboard
│   ├── InlineSuggestionTooltip.tsx     # Inline suggestion UI
│   ├── StyleAnalysisCard.tsx           # Style analysis display
│   ├── WritingGoalsPanel.tsx           # Goals management
│   └── Goal*.tsx                       # Goal-related components
│
├── hooks/                   # React Hooks
│   ├── useWritingAssistant.ts          # Main assistant hook
│   ├── useRealTimeAnalysis.ts          # Real-time feedback
│   ├── useInlineSuggestions.ts         # Inline suggestions
│   └── useWritingGoals.ts              # Goals tracking
│
├── services/                # Business Logic
│   ├── writingAssistantService.ts      # Core service
│   ├── grammarSuggestionService.ts     # Grammar analysis
│   ├── styleAnalysisService.ts         # Style analysis
│   ├── realTimeAnalysisService.ts      # Real-time processing
│   ├── goalsService.ts                 # Goals management
│   ├── writingAssistantDb.ts           # Database operations
│   └── writing-*-analyzers.ts          # Analysis engines
│
└── types/                   # TypeScript Types
    ├── index.ts                        # Main types
    ├── grammarSuggestions.ts           # Grammar types
    ├── styleAnalysis.ts                # Style types
    ├── realTimeFeedback.ts             # Feedback types
    └── writingGoals.ts                 # Goals types
```

## Key Components

### WritingAssistantPanel

Main panel with tabbed interface for all writing assistance features.

**Features**:

- Tabbed navigation (Grammar, Style, Goals, Analytics)
- Real-time suggestion count badges
- Quick toggle for inline suggestions
- Settings access
- Export reports

**Usage**:

```tsx
import { WritingAssistantPanel } from '@/features/writing-assistant';

<WritingAssistantPanel
  projectId={projectId}
  chapterId={chapterId}
  content={editorContent}
  onApplySuggestion={suggestion => handleApply(suggestion)}
/>;
```

---

### InlineSuggestionTooltip

Displays contextual suggestions inline with editor content.

**Features**:

- Hover-based tooltip
- Multiple suggestion types (grammar, style, clarity)
- Quick accept/reject actions
- Severity indicators
- Explanation with examples

**Usage**:

```tsx
import { InlineSuggestionTooltip } from '@/features/writing-assistant';

<InlineSuggestionTooltip
  suggestion={suggestion}
  position={cursorPosition}
  onAccept={() => applySuggestion(suggestion)}
  onReject={() => dismissSuggestion(suggestion)}
  onIgnore={() => ignoreSuggestionType(suggestion.type)}
/>;
```

**Suggestion Types**:

- 🔴 **Error**: Grammar/spelling mistakes (high priority)
- 🟡 **Warning**: Style issues, passive voice (medium priority)
- 🔵 **Info**: Suggestions, alternatives (low priority)

---

### StyleAnalysisCard

Displays comprehensive style analysis results.

**Features**:

- Writing style profile (formal, casual, academic, etc.)
- Tone analysis (serious, humorous, dark, light)
- Voice consistency checking
- Readability metrics (Flesch-Kincaid, etc.)
- Vocabulary richness analysis
- Sentence structure breakdown

**Usage**:

```tsx
import { StyleAnalysisCard } from '@/features/writing-assistant';

<StyleAnalysisCard
  analysisResult={styleAnalysis}
  onReanalyze={() => runStyleAnalysis()}
  showDetails={true}
/>;
```

**Analysis Metrics**:

```typescript
interface StyleAnalysisResult {
  readability: {
    fleschKincaid: number; // Reading ease (0-100)
    gradeLevel: number; // Grade level required
    avgSentenceLength: number;
    avgWordLength: number;
  };
  tone: {
    sentiment: 'positive' | 'negative' | 'neutral';
    mood: string[]; // ['dark', 'suspenseful']
    formality: number; // 0-10 (informal to formal)
  };
  voice: {
    consistency: number; // 0-100%
    issues: ConsistencyIssue[];
  };
  vocabulary: {
    uniqueWords: number;
    repetitiveWords: string[];
    complexityScore: number;
  };
}
```

---

### WritingGoalsPanel

Manage and track writing goals (word count, quality, consistency).

**Features**:

- Create custom goals or use presets
- Progress tracking with charts
- Goal streaks and achievements
- Daily/weekly/monthly targets
- Deadline management
- Goal completion celebrations

**Usage**:

```tsx
import { WritingGoalsPanel } from '@/features/writing-assistant';

<WritingGoalsPanel
  projectId={projectId}
  onGoalComplete={goal => celebrateGoal(goal)}
/>;
```

**Goal Types**:

- **Word Count**: Daily/weekly/total targets
- **Chapter Count**: Chapters to complete
- **Writing Streak**: Consecutive days writing
- **Quality**: Maintain style score above threshold
- **Consistency**: Regular writing schedule

---

### WritingAnalyticsDashboard

Comprehensive writing metrics and visualizations.

**Features**:

- Writing velocity (words per day)
- Most productive times
- Word count trends
- Style score history
- Grammar improvement over time
- Chapter completion rate
- Readability trends

**Usage**:

```tsx
import { WritingAnalyticsDashboard } from '@/features/writing-assistant';

<WritingAnalyticsDashboard
  projectId={projectId}
  timeRange="30d" // '7d' | '30d' | '90d' | 'all'
/>;
```

---

## Hooks API

### useWritingAssistant

Main hook for writing assistance features.

```typescript
const {
  // Analysis State
  grammarSuggestions, // Grammar/spelling issues
  styleSuggestions, // Style improvements
  claritySuggestions, // Clarity improvements
  isAnalyzing, // Analysis in progress

  // Actions
  analyze, // Analyze content
  applySuggestion, // Apply a suggestion
  dismissSuggestion, // Dismiss a suggestion
  ignoreSuggestionType, // Ignore suggestion category

  // Configuration
  config, // Current config
  updateConfig, // Update settings

  // Stats
  stats, // Writing statistics
} = useWritingAssistant(projectId, chapterId);
```

**Example - Analyze Content**:

```typescript
const { analyze, grammarSuggestions, styleSuggestions } = useWritingAssistant(
  projectId,
  chapterId,
);

// Analyze text
await analyze(editorContent);

// Process suggestions
grammarSuggestions.forEach(suggestion => {
  console.log(`${suggestion.type}: ${suggestion.message}`);
  console.log(`Line ${suggestion.line}: "${suggestion.text}"`);
  console.log(`Suggested: "${suggestion.replacement}"`);
});
```

---

### useRealTimeAnalysis

Provides real-time writing feedback as user types.

```typescript
const {
  // Inline Suggestions
  suggestions, // Current inline suggestions
  activeSuggestion, // Suggestion at cursor

  // Actions
  handleTextChange, // Process text changes
  acceptSuggestion, // Accept suggestion
  rejectSuggestion, // Reject suggestion

  // Configuration
  enabled, // Real-time analysis enabled
  setEnabled, // Toggle real-time analysis
  debounceMs, // Analysis delay
} = useRealTimeAnalysis(content, options);
```

**Example - Real-time Feedback**:

```typescript
const { suggestions, handleTextChange, acceptSuggestion } = useRealTimeAnalysis(
  editorContent,
  {
    debounceMs: 500, // Wait 500ms after typing stops
    enableGrammar: true,
    enableStyle: true,
    enableClarity: true,
  },
);

// In editor onChange handler
const onChange = newContent => {
  setContent(newContent);
  handleTextChange(newContent);
};

// Display suggestions count
console.log(`${suggestions.length} suggestions available`);
```

---

### useWritingGoals

Manage and track writing goals.

```typescript
const {
  // Goals
  goals, // All active goals
  completedGoals, // Completed goals
  goalProgress, // Progress for each goal

  // Actions
  createGoal, // Create new goal
  updateGoal, // Update goal
  deleteGoal, // Delete goal
  markComplete, // Mark goal complete

  // Presets
  applyPreset, // Use goal preset
  presets, // Available presets

  // Stats
  stats, // Goal statistics
} = useWritingGoals(projectId);
```

**Example - Create Writing Goal**:

```typescript
const { createGoal, goalProgress } = useWritingGoals(projectId);

// Create daily word count goal
await createGoal({
  type: 'word_count_daily',
  target: 1000,
  deadline: addDays(new Date(), 30),
  title: 'Write 1000 words per day for 30 days',
});

// Check progress
const todayProgress = goalProgress['word_count_daily'];
console.log(`Today: ${todayProgress.current} / ${todayProgress.target} words`);
```

**Goal Presets**:

```typescript
const GOAL_PRESETS = [
  {
    id: 'nanowrimo',
    title: 'NaNoWriMo Challenge',
    goals: [
      { type: 'word_count_total', target: 50000, days: 30 },
      { type: 'word_count_daily', target: 1667, days: 30 },
    ],
  },
  {
    id: 'steady_pace',
    title: 'Steady Pace',
    goals: [{ type: 'word_count_daily', target: 500, days: 90 }],
  },
  {
    id: 'quality_focus',
    title: 'Quality Focus',
    goals: [
      { type: 'style_score', target: 80, maintain: true },
      { type: 'readability', target: 70, maintain: true },
    ],
  },
];
```

---

### useInlineSuggestions

Manages inline suggestions display and interaction.

```typescript
const {
  // Suggestions
  visibleSuggestions, // Suggestions to show
  activeSuggestion, // Suggestion at cursor

  // Actions
  acceptSuggestion, // Accept and apply
  rejectSuggestion, // Dismiss suggestion
  navigateNext, // Go to next suggestion
  navigatePrevious, // Go to previous suggestion

  // Configuration
  highlightColor, // Highlight color by severity
  tooltipPosition, // Tooltip positioning
} = useInlineSuggestions(suggestions, cursorPosition);
```

---

## Services

### grammarSuggestionService

Analyzes grammar, spelling, and punctuation.

```typescript
import { grammarSuggestionService } from '@/features/writing-assistant';

// Analyze text
const result = await grammarSuggestionService.analyzeText({
  text: content,
  projectId,
  options: {
    checkGrammar: true,
    checkSpelling: true,
    checkPunctuation: true,
    ignoreWords: ['protagonist', 'antagonist'], // Custom dictionary
  },
});

// Process results
result.suggestions.forEach(suggestion => {
  if (suggestion.severity === 'error') {
    console.error(`Grammar error: ${suggestion.message}`);
  }
});
```

**Grammar Categories**:

- **Spelling**: Misspelled words
- **Grammar**: Subject-verb agreement, tense errors
- **Punctuation**: Missing/incorrect punctuation
- **Capitalization**: Proper noun capitalization
- **Word Choice**: Commonly confused words

---

### styleAnalysisService

Analyzes writing style, voice, and tone.

```typescript
import { styleAnalysisService } from '@/features/writing-assistant';

// Analyze style
const analysis = await styleAnalysisService.analyzeStyle({
  text: content,
  projectId,
  options: {
    includeReadability: true,
    includeTone: true,
    includeVoice: true,
    compareToProject: true, // Compare with rest of project
  },
});

// Check readability
if (analysis.readability.fleschKincaid < 60) {
  console.warn('Text may be difficult to read');
}

// Check consistency
if (analysis.voice.consistency < 70) {
  console.warn('Voice inconsistency detected');
  analysis.voice.issues.forEach(issue => {
    console.log(`Chapter ${issue.location}: ${issue.description}`);
  });
}
```

---

### realTimeAnalysisService

Processes text changes and generates suggestions in real-time.

```typescript
import { realTimeAnalysisService } from '@/features/writing-assistant';

// Initialize
const analyzer = realTimeAnalysisService.create({
  debounceMs: 500,
  batchSize: 100, // Process 100 characters at a time
  enabledChecks: ['grammar', 'style', 'clarity'],
});

// Analyze text change
const suggestions = await analyzer.analyzeChange({
  text: newContent,
  previousText: oldContent,
  cursorPosition: 145,
});

// Get suggestions near cursor
const nearby = analyzer.getSuggestionsNear(cursorPosition, 50);
```

---

### goalsService

Manages writing goals persistence and progress tracking.

```typescript
import { goalsService } from '@/features/writing-assistant';

// Create goal
const goal = await goalsService.createGoal({
  projectId,
  type: 'word_count_daily',
  target: 1000,
  title: 'Daily Writing Goal',
});

// Update progress
await goalsService.updateProgress(goal.id, {
  current: 750,
  lastUpdated: Date.now(),
});

// Check if goal completed
const isComplete = await goalsService.checkCompletion(goal.id);

// Get goal statistics
const stats = await goalsService.getGoalStats(projectId);
// { totalGoals: 5, completed: 3, inProgress: 2, streak: 7 }
```

---

## Data Flow

### Real-time Analysis Flow

```
User Types → Debounce (500ms) → Content Diff → Batch Analysis
                                                       ↓
                                            Grammar + Style + Clarity
                                                       ↓
                                               Generate Suggestions
                                                       ↓
                                          Cache → Display Inline
```

### Style Analysis Flow

```
Trigger Analysis → Extract Text → Calculate Metrics
                                          ↓
                         Readability + Tone + Voice + Vocabulary
                                          ↓
                                   Compare with Project
                                          ↓
                                   Generate Report → Cache
```

### Goals Tracking Flow

```
Writing Event → Update Word Count → Check Goal Progress
                                          ↓
                                   Calculate Percentage
                                          ↓
                            Check if Goal Met → Celebrate
                                          ↓
                                   Update Database
```

---

## Database Schema

### Writing Suggestions Table

```sql
CREATE TABLE writing_suggestions (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  chapter_id TEXT NOT NULL,
  type TEXT NOT NULL,           -- 'grammar' | 'style' | 'clarity'
  severity TEXT NOT NULL,       -- 'error' | 'warning' | 'info'
  message TEXT NOT NULL,
  original_text TEXT NOT NULL,
  suggested_text TEXT,
  position_start INTEGER NOT NULL,
  position_end INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',  -- 'pending' | 'accepted' | 'rejected' | 'ignored'
  created_at INTEGER NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (chapter_id) REFERENCES chapters(id)
);
```

### Writing Goals Table

```sql
CREATE TABLE writing_goals (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  type TEXT NOT NULL,           -- 'word_count_daily' | 'word_count_total' | etc.
  title TEXT NOT NULL,
  target INTEGER NOT NULL,
  current INTEGER DEFAULT 0,
  deadline INTEGER,
  status TEXT DEFAULT 'active',  -- 'active' | 'completed' | 'failed'
  created_at INTEGER NOT NULL,
  completed_at INTEGER,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);
```

### Writing Analytics Table

```sql
CREATE TABLE writing_analytics (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  date INTEGER NOT NULL,        -- Day timestamp
  words_written INTEGER DEFAULT 0,
  chapters_edited TEXT[],        -- Array of chapter IDs
  style_score REAL,
  readability_score REAL,
  suggestions_accepted INTEGER DEFAULT 0,
  suggestions_rejected INTEGER DEFAULT 0,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);
```

---

## Grammar Rules

### Built-in Grammar Checks

**1. Subject-Verb Agreement**

```
❌ The cats was sleeping.
✅ The cats were sleeping.
```

**2. Tense Consistency**

```
❌ He walked to the store and buys milk.
✅ He walked to the store and bought milk.
```

**3. Passive Voice Detection**

```
❌ The ball was thrown by John.
✅ John threw the ball.
```

**4. Redundancy**

```
❌ She returned back to the house.
✅ She returned to the house.
```

**5. Weak Verbs**

```
❌ He was going quickly.
✅ He rushed.
```

---

## Style Guidelines

### Readability Scores

**Flesch-Kincaid Reading Ease** (0-100):

- 90-100: Very Easy (5th grade)
- 80-89: Easy (6th grade)
- 70-79: Fairly Easy (7th grade)
- 60-69: Standard (8th-9th grade)
- 50-59: Fairly Difficult (10th-12th grade)
- 30-49: Difficult (College)
- 0-29: Very Difficult (College graduate)

**Target for Fiction**: 60-80 (Standard to Fairly Easy)

### Writing Style Profiles

**Formal**:

- Complex sentences
- Academic vocabulary
- Passive voice acceptable
- Minimal contractions

**Casual**:

- Shorter sentences
- Common vocabulary
- Active voice preferred
- Contractions encouraged

**Literary**:

- Varied sentence length
- Rich vocabulary
- Metaphors and imagery
- Voice consistency critical

---

## Testing

### Unit Tests

- `grammarSuggestionService.test.ts` - Grammar analysis
- `styleAnalysisService.test.ts` - Style analysis
- `goalsService.test.ts` - Goals management
- `writingAssistantDb.test.ts` - Database operations

### Integration Tests

- End-to-end suggestion flow
- Real-time analysis performance
- Goal tracking accuracy

**Run Tests**:

```bash
# All writing-assistant tests
npm run test -- writing-assistant

# Specific test
vitest run src/features/writing-assistant/services/__tests__/grammarSuggestionService.test.ts
```

---

## Performance Considerations

- **Debounced Analysis**: 500ms delay after typing stops
- **Incremental Analysis**: Only analyze changed portions
- **Caching**: Grammar rules and style profiles cached
- **Batch Processing**: Suggestions processed in batches
- **Worker Threads**: Heavy analysis offloaded to workers (future)

**Performance Targets**:

- Real-time suggestion latency: <100ms
- Style analysis (1000 words): <2s
- Grammar check (1000 words): <1s
- Memory usage: <20MB

---

## Configuration

### Environment Variables

```env
# AI Models (optional)
GRAMMAR_CHECK_MODEL=gpt-4
STYLE_ANALYSIS_MODEL=claude-sonnet-4

# Feature Flags
ENABLE_REAL_TIME_ANALYSIS=true
ENABLE_GRAMMAR_CHECK=true
ENABLE_STYLE_ANALYSIS=true
ENABLE_GOALS=true
```

### User Settings

```typescript
interface WritingAssistantConfig {
  realTime: {
    enabled: boolean;
    debounceMs: number;
    enableGrammar: boolean;
    enableStyle: boolean;
    enableClarity: boolean;
  };
  grammar: {
    strictness: 'relaxed' | 'standard' | 'strict';
    ignoreWords: string[];
    customRules: GrammarRule[];
  };
  style: {
    targetReadability: number;
    preferredTone: string[];
    enforcePOV: boolean;
  };
  goals: {
    dailyReminders: boolean;
    celebrateAchievements: boolean;
    showProgress: boolean;
  };
}
```

---

## Common Issues & Solutions

### Issue: Too many suggestions overwhelming

**Solution**: Adjust strictness and filter by severity

```typescript
const { updateConfig } = useWritingAssistant(projectId, chapterId);

updateConfig({
  grammar: { strictness: 'relaxed' },
  showOnlySeverity: ['error', 'warning'], // Hide 'info'
});
```

### Issue: Real-time analysis lagging

**Solution**: Increase debounce delay or disable temporarily

```typescript
const { setEnabled, updateConfig } = useRealTimeAnalysis(content);

// Increase delay
updateConfig({ debounceMs: 1000 }); // Was 500ms

// Or disable while writing fast
setEnabled(false);
```

### Issue: False positive grammar suggestions

**Solution**: Add words to ignore list

```typescript
updateConfig({
  grammar: {
    ignoreWords: ['protagonist', 'worldbuilding', 'magic-system'],
  },
});
```

---

## Future Enhancements

- [ ] AI-powered rephrasing suggestions
- [ ] Character voice consistency analysis
- [ ] Dialogue attribution checking
- [ ] Cliché detection
- [ ] Plot consistency checking (integrate with plot-engine)
- [ ] Multi-language grammar support
- [ ] Custom style guides (AP, Chicago, etc.)
- [ ] Writing coach with personalized tips
- [ ] Voice-to-text with grammar correction
- [ ] Collaborative editing with shared feedback

---

## Related Features

- **Editor** (`src/features/editor`) - Integrates inline suggestions
- **Plot Engine** (`src/features/plot-engine`) - Consistency checking
- **Characters** (`src/features/characters`) - Character voice analysis
- **Analytics** (`src/features/analytics`) - Extended analytics

---

## Contributing

When modifying Writing Assistant:

1. Maintain real-time performance (<100ms latency)
2. Test grammar rules extensively
3. Validate style analysis accuracy
4. Ensure suggestions are actionable
5. Consider user overwhelm (limit suggestions)
6. Add comprehensive tests for new rules

---

## License

Part of Novelist.ai - See root LICENSE file
