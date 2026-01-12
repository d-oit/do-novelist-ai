# Editor Feature

The Editor is the primary content creation interface of Novelist.ai, providing a
rich writing experience with AI-powered assistance, GOAP (Goal-Oriented Action
Planning) integration, and comprehensive chapter management.

## Overview

The Editor feature enables authors to:

- ✍️ **Write & Edit** - Rich text editing for chapters and content
- 🤖 **AI Assistance** - GOAP engine for AI-powered writing refinement
- 📚 **Chapter Management** - Organize and navigate chapter structure
- 🎯 **Focus Mode** - Distraction-free writing environment
- 🎨 **Cover Generation** - AI-powered book cover creation
- 🗣️ **Voice Input** - Speech-to-text dictation support
- 📖 **Book Preview** - Full manuscript preview and reading mode
- 💾 **Auto-Save** - Automatic draft saving with version history

## Architecture

```
editor/
├── components/              # UI Components
│   ├── ChapterEditor.tsx           # Main editor component
│   ├── ChapterList.tsx             # Chapter navigation sidebar
│   ├── ProjectOverview.tsx         # Project summary view
│   ├── FocusMode.tsx               # Distraction-free mode
│   ├── BookViewer.tsx              # Full book reading view
│   ├── CoverGenerator.tsx          # AI cover generation
│   ├── PublishPanel.tsx            # Export and publishing
│   └── VoiceInputPanel.tsx         # Speech-to-text panel
│
├── hooks/                   # React Hooks
│   ├── useEditorState.ts           # Editor state management
│   └── useGoapEngine.ts            # GOAP AI integration
│
├── services/                # Business Logic
│   └── editorService.ts            # Editor operations
│
└── types/                   # TypeScript Types
    └── index.ts                    # Editor type definitions
```

## Key Components

### ChapterEditor

Main rich text editor for chapter content.

**Features**:

- Markdown editor with live preview
- Word count and character count tracking
- Auto-save functionality
- Version history access
- AI refinement integration
- Inline spell check

**Usage**:

```tsx
import { ChapterEditor } from '@/features/editor';

<ChapterEditor
  projectId={projectId}
  chapterId={chapterId}
  onSave={content => console.log('Saved:', content)}
/>;
```

**Props**:

```typescript
interface ChapterEditorProps {
  projectId: string;
  chapterId: string;
  initialContent?: string;
  onSave?: (content: string) => void;
  autoSaveInterval?: number; // milliseconds (default: 30000)
}
```

---

### FocusMode

Distraction-free full-screen writing mode.

**Features**:

- Full-screen immersive writing
- Minimalist interface
- Keyboard shortcuts
- Background customization
- Ambient sound options (optional)
- Goal tracking overlay

**Usage**:

```tsx
import { FocusMode } from '@/features/editor';

<FocusMode
  content={content}
  onChange={newContent => setContent(newContent)}
  onExit={() => setFocusMode(false)}
/>;
```

**Keyboard Shortcuts**:

- `Cmd/Ctrl + Shift + F` - Toggle focus mode
- `Esc` - Exit focus mode
- `Cmd/Ctrl + S` - Save
- `Cmd/Ctrl + /` - Toggle word count

---

### ChapterList

Sidebar navigation for chapter organization.

**Features**:

- Drag-and-drop reordering
- Chapter creation and deletion
- Chapter status indicators
- Quick chapter switching
- Word count per chapter
- Chapter filtering and search

**Usage**:

```tsx
import { ChapterList } from '@/features/editor';

<ChapterList
  projectId={projectId}
  currentChapterId={chapterId}
  onChapterSelect={id => navigate(`/editor/${id}`)}
  onChapterReorder={chapters => saveOrder(chapters)}
/>;
```

---

### BookViewer

Full manuscript preview and reading mode.

**Features**:

- Continuous scroll reading
- Table of contents navigation
- Export preview
- Print-friendly view
- Typography customization
- Night mode

**Usage**:

```tsx
import { BookViewer } from '@/features/editor';

<BookViewer projectId={projectId} onClose={() => setViewMode('edit')} />;
```

---

### CoverGenerator

AI-powered book cover creation.

**Features**:

- Text-to-image generation
- Style presets (fantasy, sci-fi, romance, etc.)
- Custom prompt input
- Multiple variants generation
- Cover preview and download
- Integration with project metadata

**Usage**:

```tsx
import { CoverGenerator } from '@/features/editor';

<CoverGenerator
  projectId={projectId}
  projectTitle={title}
  genre={genre}
  onCoverGenerated={imageUrl => saveCover(imageUrl)}
/>;
```

---

### VoiceInputPanel

Speech-to-text dictation for hands-free writing.

**Features**:

- Real-time transcription
- Multiple language support
- Punctuation commands
- Voice commands ("new paragraph", "delete last sentence")
- Continuous dictation mode
- Background recording

**Usage**:

```tsx
import { VoiceInputPanel } from '@/features/editor';

<VoiceInputPanel onTranscript={text => insertText(text)} language="en-US" />;
```

---

## Hooks API

### useEditorState

Manages editor content and UI state.

```typescript
const {
  // Content State
  content, // Current editor content
  summary, // Chapter summary
  wordCount, // Word count
  characterCount, // Character count

  // UI State
  isFocusMode, // Focus mode active
  isSidebarOpen, // Sidebar visibility
  hasUnsavedChanges, // Unsaved changes flag

  // Actions
  updateContent, // Update content
  save, // Save to database
  toggleFocusMode, // Toggle focus mode
  toggleSidebar, // Toggle sidebar
  reset, // Reset state

  // Status
  isSaving, // Save in progress
  lastSaved, // Last save timestamp
  error, // Error state
} = useEditorState(projectId, chapterId);
```

**Example**:

```typescript
const { content, updateContent, save, hasUnsavedChanges } = useEditorState(
  'project-123',
  'chapter-456',
);

// Update content
updateContent('New chapter content...');

// Manual save
if (hasUnsavedChanges) {
  await save();
}
```

---

### useGoapEngine

Integrates GOAP (Goal-Oriented Action Planning) AI engine for intelligent
writing assistance.

```typescript
const {
  // State
  isGenerating, // AI generation in progress
  suggestions, // AI suggestions
  error, // Error state

  // Actions
  refineText, // Refine selected text
  expandText, // Expand/continue text
  generateChapter, // Generate full chapter
  analyzeTone, // Analyze writing tone
  improveDialogue, // Improve dialogue

  // Configuration
  setModel, // Set AI model
  setTemperature, // Set creativity level
  setGoals, // Set writing goals
} = useGoapEngine(projectId);
```

**Example - Text Refinement**:

```typescript
const { refineText, isGenerating } = useGoapEngine(projectId);

const refined = await refineText({
  text: selectedText,
  goal: 'improve-clarity',
  style: 'concise',
  maintainVoice: true,
});
```

**Example - Chapter Generation**:

```typescript
const { generateChapter } = useGoapEngine(projectId);

const chapter = await generateChapter({
  outline: 'Chapter outline...',
  previousContext: previousChapterContent,
  targetLength: 2000,
  tone: 'suspenseful',
});
```

**GOAP Goals**:

- `improve-clarity` - Make text clearer and more understandable
- `enhance-description` - Add vivid sensory details
- `improve-dialogue` - Strengthen character dialogue
- `adjust-tone` - Match desired tone (dark, light, mysterious, etc.)
- `expand-scene` - Elaborate on scene details
- `tighten-prose` - Make writing more concise

---

## Services

### editorService

Core editor operations and data management.

```typescript
import { editorService } from '@/features/editor';

// Save chapter content
await editorService.saveChapter({
  projectId,
  chapterId,
  content,
  summary,
});

// Load chapter
const chapter = await editorService.loadChapter(chapterId);

// Auto-save with debouncing
editorService.autoSave(chapterId, content, { debounce: 3000 });

// Create new chapter
const newChapter = await editorService.createChapter({
  projectId,
  title: 'Chapter 5',
  position: 4,
});

// Delete chapter
await editorService.deleteChapter(chapterId);

// Reorder chapters
await editorService.reorderChapters(projectId, [
  { id: 'ch1', position: 0 },
  { id: 'ch2', position: 1 },
]);
```

---

## Data Flow

```
User Input → Component → Hook → Service → Database
                ↓                           ↓
          Local State ←─────────────────────
                ↓
        Auto-save (debounced)
```

**Auto-Save Flow**:

1. User types in editor
2. Content updates in local state (immediate)
3. Debounced auto-save triggers (30s default)
4. Service saves to IndexedDB
5. Background sync to Turso (if online)

**AI Refinement Flow**:

1. User selects text and chooses refinement goal
2. `useGoapEngine` hook called
3. Context gathered (previous paragraphs, character info)
4. AI API request sent
5. Response streamed back to UI
6. User accepts or rejects suggestion

---

## Database Schema

### Chapters Table

```sql
CREATE TABLE chapters (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  summary TEXT,
  position INTEGER NOT NULL,
  word_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);
```

### Drafts Table (Auto-save)

```sql
CREATE TABLE drafts (
  id TEXT PRIMARY KEY,
  chapter_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (chapter_id) REFERENCES chapters(id)
);
```

---

## Editor State Management

### Local State (React)

- Current content (immediate updates)
- Cursor position
- Selection range
- UI state (sidebar, focus mode)

### Persisted State (IndexedDB)

- Draft content (auto-saved)
- Editor preferences
- Last cursor position

### Server State (Turso)

- Final saved chapters
- Version history
- Shared project data

---

## Auto-Save Strategy

```typescript
// Auto-save configuration
const AUTO_SAVE_CONFIG = {
  debounceMs: 30000, // 30 seconds after last keystroke
  minCharsChanged: 10, // Minimum characters to trigger save
  maxDraftHistory: 50, // Keep last 50 drafts
  syncInterval: 120000, // Sync to server every 2 minutes
};
```

**Save Triggers**:

1. ✅ 30 seconds after last edit
2. ✅ On focus loss (user switches tabs)
3. ✅ Manual save (Cmd/Ctrl + S)
4. ✅ Before closing editor
5. ✅ Before AI operations

---

## Keyboard Shortcuts

### Editing

- `Cmd/Ctrl + S` - Save
- `Cmd/Ctrl + Z` - Undo
- `Cmd/Ctrl + Shift + Z` - Redo
- `Cmd/Ctrl + B` - Bold
- `Cmd/Ctrl + I` - Italic
- `Cmd/Ctrl + K` - Insert link

### Navigation

- `Cmd/Ctrl + P` - Quick chapter search
- `Cmd/Ctrl + [` - Previous chapter
- `Cmd/Ctrl + ]` - Next chapter
- `Cmd/Ctrl + Shift + F` - Toggle focus mode

### AI Assistance

- `Cmd/Ctrl + Shift + R` - Refine selection
- `Cmd/Ctrl + Shift + E` - Expand/continue
- `Cmd/Ctrl + Shift + A` - AI suggestions

---

## Testing

### Unit Tests

- `useEditorState.test.ts` - Editor state hook
- `useGoapEngine.test.ts` - GOAP engine hook
- `editorService.test.ts` - Service operations

### Component Tests

- `ChapterEditor.test.tsx` - Editor component
- `FocusMode.test.tsx` - Focus mode
- `VoiceInputPanel.test.tsx` - Voice input

### Integration Tests

- Editor auto-save flow
- AI refinement flow
- Chapter reordering
- Voice-to-text accuracy

**Run Tests**:

```bash
# All editor tests
npm run test -- editor

# Specific test
vitest run src/features/editor/hooks/__tests__/useGoapEngine.test.ts
```

---

## Performance Considerations

- **Virtualized Chapter List**: Large chapter counts use virtual scrolling
- **Debounced Auto-save**: Prevents excessive database writes
- **Lazy Component Loading**: Heavy components loaded on demand
- **Content Diffing**: Only changed content synced to server
- **AI Response Streaming**: Suggestions stream in real-time

**Performance Targets**:

- Typing latency: <16ms (60fps)
- Auto-save trigger: 30s debounce
- Chapter switch: <100ms
- AI refinement start: <500ms

---

## Dependencies

**External**:

- `@uiw/react-md-editor` - Markdown editor component
- `react-markdown` - Markdown rendering
- `@ai-sdk/anthropic` - Claude AI integration
- `@ai-sdk/openai` - OpenAI integration

**Internal**:

- `@/features/generation` - AI generation orchestration
- `@/lib/database` - Data persistence
- `@/lib/api-gateway` - AI API client
- `@/lib/logging` - Error tracking

---

## Configuration

### Environment Variables

```env
# AI Configuration
OPENROUTER_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
DEFAULT_AI_MODEL=claude-sonnet-4

# Editor Settings
AUTO_SAVE_INTERVAL=30000
MAX_DRAFT_HISTORY=50
ENABLE_VOICE_INPUT=true
```

### User Preferences

Stored per-user:

- Font family and size
- Theme (light/dark)
- Auto-save interval
- AI model preference
- Keyboard shortcuts

---

## Common Issues & Solutions

### Issue: Content not saving

**Solution**: Check auto-save status and database connection

```typescript
const { isSaving, lastSaved, save } = useEditorState(projectId, chapterId);

// Force save
await save();

// Check last save
console.log('Last saved:', new Date(lastSaved));
```

### Issue: AI suggestions too slow

**Solution**: Use faster model or reduce context

```typescript
const { refineText, setModel } = useGoapEngine(projectId);

// Use faster model
setModel('claude-haiku-4');

// Reduce context
refineText(text, { includeContext: false });
```

### Issue: Voice input not working

**Solution**: Check browser permissions and microphone access

```typescript
// Request permissions
const permissions = await navigator.permissions.query({ name: 'microphone' });
console.log('Microphone permission:', permissions.state);
```

---

## Future Enhancements

- [ ] Collaborative editing (real-time multi-user)
- [ ] Advanced version diffing (visual comparison)
- [ ] AI-powered grammar checking (built-in)
- [ ] Custom markdown extensions
- [ ] Advanced formatting toolbar
- [ ] Split-screen editing
- [ ] Outline view with drag-drop
- [ ] Character/location quick-insert
- [ ] Writing sprints with timers
- [ ] Distraction-blocking mode

---

## Related Features

- **Generation** (`src/features/generation`) - AI content generation
- **Writing Assistant** (`src/features/writing-assistant`) - Grammar and style
- **Versioning** (`src/features/versioning`) - Version control
- **Publishing** (`src/features/publishing`) - Export and publish

---

## Contributing

When modifying the Editor:

1. Ensure auto-save doesn't lose user data
2. Test keyboard shortcuts across platforms
3. Verify AI integration doesn't block UI
4. Maintain <600 LOC per file
5. Add comprehensive tests for new features
6. Consider offline functionality

---

## License

Part of Novelist.ai - See root LICENSE file
