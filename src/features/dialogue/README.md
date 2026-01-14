# Dialogue Feature

Advanced dialogue analysis and editing tools for novelists, focusing on
character voice consistency, conversation flow, and dialogue quality.

## Features

### 🎭 Character Voice Tracking

- Analyze speech patterns per character
- Track vocabulary level, formality, and complexity
- Identify common phrases and speech tics
- Monitor voice consistency across chapters
- Detect emotional range in dialogue

### 📊 Dialogue Analysis

- Overall quality scoring (0-100)
- Speaker distribution statistics
- Dialogue tag usage patterns
- Issue detection (voice inconsistency, repetitive tags, unclear speakers)
- Naturalness checks for common problems

### 💬 Conversation Flow Visualizer

- Visual representation of dialogue exchanges
- Tension tracking throughout conversations
- Turn-by-turn analysis
- Identify dominant speakers
- Conversation type classification

### ✏️ Dialogue Editor

- Focused view showing only dialogue lines
- Inline editing capabilities
- Character color coding
- Quick tag changes
- Line-by-line navigation

## Architecture

```
src/features/dialogue/
  components/
    DialogueDashboard.tsx      - Main dashboard view
    DialogueEditor.tsx         - Focused dialogue editing
    ConversationFlow.tsx       - Conversation visualizer
    CharacterVoiceCard.tsx     - Voice profile display
  services/
    dialogueExtractionService.ts  - Extract dialogue from text
    dialogueAnalysisService.ts    - Analyze dialogue quality
    characterVoiceService.ts      - Build voice profiles
  types/
    index.ts                   - Type definitions
```

## Usage

### Extract Dialogue from Chapter

```typescript
import { extractDialogueLines } from '@/features/dialogue';

const result = extractDialogueLines(chapterContent, chapterId, projectId);

console.log(`Found ${result.totalDialogueCount} dialogue lines`);
console.log(`Characters: ${result.charactersFound.join(', ')}`);
```

### Analyze Dialogue Quality

```typescript
import { analyzeDialogue } from '@/features/dialogue';

const analysis = await analyzeDialogue(
  dialogueLines,
  projectId,
  chapterId,
  voiceProfiles,
  {
    checkVoiceConsistency: true,
    checkTagRepetition: true,
    checkUnclearSpeakers: true,
    checkNaturalness: true,
  },
);

console.log(`Quality Score: ${analysis.overallQualityScore}`);
console.log(`Issues Found: ${analysis.issues.length}`);
```

### Build Character Voice Profile

```typescript
import { buildVoiceProfile } from '@/features/dialogue';

const profile = buildVoiceProfile(
  characterId,
  characterName,
  projectId,
  dialogueLines,
);

console.log(`Formality: ${profile.speechPattern.formalityScore}/10`);
console.log(`Consistency: ${profile.voiceConsistencyScore}%`);
console.log(
  `Common phrases: ${profile.speechPattern.commonPhrases.join(', ')}`,
);
```

### Display Dialogue Dashboard

```tsx
import { DialogueDashboard } from '@/features/dialogue';

function MyComponent() {
  return <DialogueDashboard projectId={projectId} chapterId={chapterId} />;
}
```

## Database Schema

### Dialogue Lines

Stores individual dialogue lines extracted from chapters.

```sql
CREATE TABLE dialogue_lines (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  chapter_id TEXT NOT NULL,
  character_id TEXT,
  character_name TEXT NOT NULL,
  text TEXT NOT NULL,
  tag TEXT NOT NULL,
  action TEXT,
  start_offset INTEGER NOT NULL,
  end_offset INTEGER NOT NULL,
  line_number INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
```

### Character Voice Profiles

Tracks speech patterns and voice characteristics per character.

```sql
CREATE TABLE character_voice_profiles (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL UNIQUE,
  character_name TEXT NOT NULL,
  project_id TEXT NOT NULL,
  total_lines INTEGER NOT NULL,
  speech_pattern TEXT,
  favorite_words TEXT,
  common_tags TEXT,
  voice_consistency_score REAL NOT NULL,
  last_analyzed_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### Dialogue Analyses

Cached analysis results for chapters or projects.

```sql
CREATE TABLE dialogue_analyses (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  chapter_id TEXT,
  total_lines INTEGER NOT NULL,
  speaker_distribution TEXT,
  average_line_length REAL NOT NULL,
  tag_distribution TEXT,
  issues TEXT,
  overall_quality_score REAL NOT NULL,
  analyzed_at TEXT NOT NULL
);
```

## Dialogue Extraction Patterns

The extraction service recognizes multiple dialogue formats:

1. **Pattern 1**: `"Hello," she said.`
2. **Pattern 2**: `John asked, "What happened?"`
3. **Pattern 3**: `"I don't know."` (standalone quotes)

### Supported Dialogue Tags

- said, asked, whispered, shouted, murmured
- replied, exclaimed, muttered, stammered
- declared, demanded, pleaded, teased, joked
- sighed, gasped, growled, hissed, snapped, continued

## Issue Detection

### Voice Inconsistency

Detects when a character speaks in a way that doesn't match their established
voice profile:

- Unusual line length (too long/short)
- Formality shift (formal character using casual language)
- Vocabulary level changes

### Repetitive Tags

Flags when the same dialogue tag is used 3+ times in a row:

```
"Hello," she said.
"Hi," she said.
"How are you?" she said.  // ⚠️ Warning
```

### Unclear Speakers

Identifies dialogue where the speaker is ambiguous or marked as "Unknown".

### Unnatural Speech

Checks for:

- Overly long sentences (>50 words)
- Exposition dumps ("as you know", "remember when")
- Lack of contractions in casual speech

## Performance Considerations

- Dialogue extraction is optimized for large chapters (10k+ words)
- Voice profiles are cached and updated incrementally
- Analysis results are stored in database for quick retrieval
- Conversation grouping uses configurable gap length (default: 500 characters)

## Testing

```bash
# Run all dialogue feature tests
npm run test src/features/dialogue

# Run specific test file
npm run test src/features/dialogue/services/__tests__/dialogueAnalysisService.test.ts
```

## Future Enhancements

- [ ] AI-powered dialogue generation
- [ ] Dialect and accent tracking
- [ ] Emotion detection using sentiment analysis
- [ ] Dialogue pacing recommendations
- [ ] Export dialogue scripts
- [ ] Audio preview (text-to-speech)
- [ ] Multi-language dialogue support
- [ ] Real-time collaboration on dialogue editing

## Integration with GOAP Engine

The dialogue feature integrates with the existing GOAP engine through:

1. **dialogue_doctor** action - Refines dialogue using voice profiles
2. **Character consistency** - Uses voice profiles for character validation
3. **Scene analysis** - Conversation flow data feeds into plot engine

## Best Practices

✅ **DO:**

- Run dialogue extraction after significant chapter edits
- Update voice profiles regularly as characters develop
- Review issues flagged by the analyzer
- Use conversation flow to check pacing

❌ **DON'T:**

- Ignore voice inconsistency warnings for main characters
- Overuse the same dialogue tags
- Leave speakers unclear in complex scenes
- Write unnaturally long dialogue lines

## Contributing

When adding new features to the dialogue system:

1. Update type definitions in `types/index.ts`
2. Add service logic to appropriate service file
3. Create corresponding UI components
4. Write comprehensive tests
5. Update this README with examples
