# Generation Feature

The Generation feature orchestrates AI-powered content creation using the GOAP
(Goal-Oriented Action Planning) engine, providing intelligent content generation
for outlines, chapters, characters, world-building, and more.

## Overview

The Generation feature helps authors:

- 📝 **Generate Outlines** - Create story outlines and plot structures
- ✍️ **Write Content** - AI-assisted chapter and scene writing
- 🔄 **Refine Text** - Polish and improve existing content
- 🎨 **Create Images** - Generate cover art and illustrations
- 👤 **Develop Characters** - Expand character profiles and backstories
- 🗺️ **Build Worlds** - Generate locations, cultures, and lore
- 💬 **Polish Dialogue** - Improve dialogue quality and authenticity
- 🌐 **Translate Content** - Multi-language translation
- 🧠 **GOAP Engine** - Intelligent goal-based action planning

## What is GOAP?

**GOAP (Goal-Oriented Action Planning)** is an AI decision-making system that:

- Breaks complex writing tasks into smaller, manageable goals
- Plans the sequence of actions needed to achieve those goals
- Adapts based on context and user preferences
- Learns from previous actions to improve suggestions

**Example GOAP Workflow**:

```
User Goal: "Write Chapter 3"
    ↓
GOAP Planning:
1. Analyze previous chapters for context
2. Review character states and plot points
3. Generate chapter outline
4. Write chapter sections sequentially
5. Ensure consistency with story
6. Refine and polish
    ↓
Result: Complete, contextually-aware chapter
```

## Architecture

```
generation/
├── components/              # UI Components
│   ├── AgentConsole.tsx            # GOAP agent activity console
│   ├── PlannerControl.tsx          # GOAP planning controls
│   ├── ActionCard.tsx              # Individual action display
│   ├── AIToolsPanel.tsx            # AI tools interface
│   ├── ImageGenerationDialog.tsx   # Image generation UI
│   ├── BookViewer.tsx              # Generated content preview
│   ├── ChapterContentEditor.tsx    # Chapter editing
│   ├── ChapterSidebar.tsx          # Chapter navigation
│   └── ProjectOverviewPanel.tsx    # Project overview
│
├── hooks/                   # React Hooks
│   ├── useGoapEngine.ts            # Main GOAP engine hook
│   └── useGoapEngine.utils.ts      # GOAP utility functions
│
└── services/                # Business Logic
    └── imageGenerationService.ts   # Image generation
    (Most services in @/lib/ai)
```

## Key Components

### AgentConsole

Real-time console showing GOAP agent activity and reasoning.

**Features**:

- Live action stream
- Agent reasoning display
- Action progress tracking
- Error handling
- Action history
- Pause/resume controls

**Usage**:

```tsx
import { AgentConsole } from '@/features/generation';

<AgentConsole
  projectId={projectId}
  onActionComplete={action => handleComplete(action)}
  showReasoning={true}
  maxActions={50}
/>;
```

**Console Output Example**:

```
🤔 Agent: Analyzing story context...
📊 Agent: Found 3 previous chapters
🎯 Goal: Generate Chapter 4 outline
⚡ Action: Analyzing character arcs
✅ Complete: Character states updated
⚡ Action: Checking plot consistency
✅ Complete: No conflicts found
⚡ Action: Generating chapter outline
✅ Complete: Outline generated (5 scenes)
```

---

### PlannerControl

Interface for configuring and controlling the GOAP planner.

**Features**:

- Goal input
- Planning strategy selection
- Context configuration
- Model selection
- Temperature/creativity control
- Stop/pause/resume

**Usage**:

```tsx
import { PlannerControl } from '@/features/generation';

<PlannerControl
  projectId={projectId}
  onPlanGenerated={plan => executePlan(plan)}
  initialGoal="Write Chapter 5"
  strategy="balanced" // 'creative' | 'balanced' | 'consistent'
/>;
```

**Planning Strategies**:

- **Creative**: High temperature, novel ideas, less constrained
- **Balanced**: Medium temperature, mix of creativity and consistency
- **Consistent**: Low temperature, adheres closely to existing story

---

### AIToolsPanel

Quick access panel for common AI generation tasks.

**Features**:

- One-click generation tools
- Preset prompts
- Recent generations
- Favorites
- Custom tool creation

**Usage**:

```tsx
import { AIToolsPanel } from '@/features/generation';

<AIToolsPanel
  projectId={projectId}
  onToolSelect={tool => runTool(tool)}
  tools={['outline', 'chapter', 'character', 'world', 'image']}
/>;
```

**Available Tools**:

- 📝 Generate Outline
- ✍️ Write Chapter
- 🔄 Refine Selection
- 👤 Develop Character
- 🗺️ Create Location
- 🎨 Generate Cover
- 💬 Polish Dialogue
- 🌐 Translate

---

### ImageGenerationDialog

Dialog for generating book covers and chapter illustrations.

**Features**:

- Text-to-image generation
- Style presets (realistic, artistic, fantasy, sci-fi)
- Aspect ratio selection
- Prompt templates
- Multiple variants
- Download and save

**Usage**:

```tsx
import { ImageGenerationDialog } from '@/features/generation';

<ImageGenerationDialog
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  projectTitle={projectTitle}
  genre={genre}
  onImageGenerated={url => saveCover(url)}
  imageType="cover" // or "illustration"
/>;
```

**Image Types**:

- **Cover**: Book cover (6:9 aspect ratio)
- **Illustration**: Chapter/scene illustration (16:9 or 4:3)
- **Character**: Character portrait (1:1)
- **Location**: Scene/location concept art (16:9)

---

## Hooks API

### useGoapEngine

Main hook for GOAP-based AI generation.

```typescript
const {
  // State
  isGenerating, // Generation in progress
  currentAction, // Current action being executed
  actionHistory, // History of completed actions
  plan, // Current action plan

  // Generation Functions
  generateOutline, // Generate story outline
  writeChapter, // Write chapter content
  refineContent, // Refine existing text
  continueWriting, // Continue from where you left off

  // Character & World
  developCharacter, // Expand character details
  buildWorld, // Generate world elements

  // Dialogue & Polish
  polishDialogue, // Improve dialogue
  analyzeConsistency, // Check story consistency
  translateContent, // Translate to other languages

  // Images
  generateCoverImage, // Create book cover
  generateIllustration, // Create chapter illustration

  // Controls
  pause, // Pause generation
  resume, // Resume generation
  cancel, // Cancel generation
  retry, // Retry failed action

  // Configuration
  config, // Current configuration
  updateConfig, // Update settings
  selectModel, // Choose AI model

  // Error Handling
  error, // Error state
  clearError, // Clear error
} = useGoapEngine(projectId);
```

**Example - Generate Outline**:

```typescript
const { generateOutline, isGenerating, plan } = useGoapEngine(projectId);

const outline = await generateOutline({
  premise: 'A detective investigating mysterious disappearances',
  genre: 'mystery-thriller',
  targetChapters: 20,
  acts: 3,
  includeCharacterArcs: true,
});

console.log('Generated outline:', outline);
/*
{
  title: "The Vanishing",
  acts: [
    {
      act: 1,
      name: "Setup",
      chapters: [
        { number: 1, title: "The First Disappearance", summary: "..." },
        { number: 2, title: "Following Clues", summary: "..." },
        ...
      ]
    },
    ...
  ],
  characterArcs: [...],
  plotPoints: [...]
}
*/
```

**Example - Write Chapter**:

```typescript
const { writeChapter, isGenerating, currentAction } = useGoapEngine(projectId);

// Watch progress
console.log('Current action:', currentAction);
// "Analyzing previous chapters..."
// "Gathering character context..."
// "Writing chapter content..."

const chapter = await writeChapter({
  chapterNumber: 5,
  outline: chapterOutline,
  previousContext: {
    chapters: ['ch1', 'ch2', 'ch3', 'ch4'],
    includeCharacterStates: true,
  },
  targetLength: 2500,
  style: 'descriptive',
  pov: 'third-person-limited',
});

console.log('Generated chapter:', chapter.content);
```

**Example - Develop Character**:

```typescript
const { developCharacter } = useGoapEngine(projectId);

const expandedCharacter = await developCharacter({
  characterId: 'char-1',
  aspects: ['backstory', 'motivations', 'relationships', 'secrets'],
  depth: 'detailed', // 'brief' | 'moderate' | 'detailed'
  storyContext: true, // Use existing story for context
});

console.log('Expanded character:', expandedCharacter);
/*
{
  backstory: "Born in a small village...",
  motivations: ["Find redemption for past mistakes", "Protect loved ones"],
  relationships: {
    "char-2": { type: "mentor", description: "..." }
  },
  secrets: ["Was involved in a cover-up 10 years ago"],
  personality: { ... },
  internalConflicts: [ ... ]
}
*/
```

---

## Services

### Generation Services (via @/lib/ai)

All main generation services are exported from `@/lib/ai`:

```typescript
import {
  generateOutline,
  writeChapterContent,
  refineChapterContent,
  analyzeConsistency,
  continueWriting,
  brainstormProject,
  translateContent,
  generateCoverImage,
  generateChapterIllustration,
  developCharacters,
  buildWorld,
  polishDialogue,
} from '@/lib/ai';
```

**Core Generation Functions**:

#### generateOutline

```typescript
const outline = await generateOutline({
  premise: string;
  genre: string;
  targetChapters: number;
  acts?: number;
  themes?: string[];
  conflictType?: 'internal' | 'external' | 'both';
});
```

#### writeChapterContent

```typescript
const chapter = await writeChapterContent({
  projectId: string;
  chapterNumber: number;
  outline?: string;
  previousChapters?: string[];
  targetLength?: number;
  style?: string;
  pov?: string;
});
```

#### refineChapterContent

```typescript
const refined = await refineChapterContent({
  content: string;
  goals: Array<'clarity' | 'pacing' | 'dialogue' | 'description' | 'show-not-tell'>;
  style?: string;
  preserveVoice?: boolean;
});
```

#### continueWriting

```typescript
const continuation = await continueWriting({
  existingContent: string;
  desiredLength?: number;
  direction?: 'continue-plot' | 'develop-character' | 'describe-scene';
});
```

#### analyzeConsistency

```typescript
const analysis = await analyzeConsistency({
  projectId: string;
  checkTypes: Array<'character' | 'plot' | 'timeline' | 'world'>;
});
```

---

### imageGenerationService

Handles image generation for covers and illustrations.

```typescript
import { imageGenerationService } from '@/features/generation';

// Generate book cover
const coverUrl = await imageGenerationService.generateCover({
  title: 'The Dark Tower',
  author: 'J. Smith',
  genre: 'fantasy',
  description: 'A lone tower against stormy skies',
  style: 'dark-fantasy', // 'realistic' | 'artistic' | 'fantasy' | 'sci-fi'
  aspectRatio: '6:9',
});

// Generate chapter illustration
const illustrationUrl = await imageGenerationService.generateIllustration({
  chapterId: 'ch5',
  scene: 'A battle in the courtyard at dawn',
  style: 'cinematic',
  aspectRatio: '16:9',
});

// Generate multiple variants
const variants = await imageGenerationService.generateVariants({
  prompt: 'A mysterious forest at twilight',
  count: 4,
  style: 'artistic',
});
```

---

## Data Flow

### GOAP Generation Flow

```
User Goal → GOAP Planner → Action Plan
                ↓
         Context Gathering
         (previous chapters, characters, world)
                ↓
         Sequential Actions
         (analyze → plan → generate → refine)
                ↓
         Result → User Review → Accept/Retry
```

### Action Execution Flow

```
Action Start → Validate Preconditions
                     ↓
              Execute Action
              (AI API Call)
                     ↓
              Postprocess
              (format, validate)
                     ↓
              Update State → Next Action
```

### Context Flow

```
Project → Chapters → Characters → World → Settings
                           ↓
                     Context Bundle
                           ↓
                     AI Generation
                           ↓
                  Contextually-Aware Output
```

---

## GOAP Action Types

### Content Generation Actions

- **GenerateOutline**: Create story structure
- **WriteChapter**: Write chapter content
- **WriteScene**: Write individual scene
- **ContinueWriting**: Extend existing content
- **Refine Text**: Polish and improve

### Character Actions

- **DevelopCharacter**: Expand character details
- **CreateCharacterArc**: Plan character development
- **WriteCharacterScene**: Character-focused scene

### World Building Actions

- **CreateLocation**: Generate location details
- **DefineCulture**: Develop cultural details
- **WriteLore**: Create historical/mythological entries

### Analysis Actions

- **AnalyzePlot**: Check plot consistency
- **AnalyzeCharacter**: Check character consistency
- **AnalyzeStyle**: Evaluate writing style
- **DetectPlotHoles**: Find logical issues

### Polish Actions

- **PolishDialogue**: Improve dialogue quality
- **EnhanceDescription**: Add vivid details
- **ImproveP acing**: Adjust narrative pacing
- **FixGrammar**: Correct grammar/spelling

---

## AI Models

### Available Models

**For Text Generation**:

- `claude-opus-4` - Highest quality, best for creative writing
- `claude-sonnet-4` - Balanced quality/speed (default)
- `claude-haiku-4` - Fast, good for drafts and outlines
- `gpt-4o` - OpenAI alternative, very capable
- `gpt-4-turbo` - Faster GPT-4 variant

**For Images**:

- `dall-e-3` - High quality, artistic
- `stable-diffusion-xl` - Fast, customizable
- `midjourney` - Artistic, stylized (via API)

### Model Selection Strategy

```typescript
const config = {
  outlines: 'claude-haiku-4', // Fast, structured
  chapters: 'claude-sonnet-4', // Quality writing
  refinement: 'claude-opus-4', // Best quality
  dialogue: 'gpt-4o', // Natural conversation
  images: 'dall-e-3', // High quality
};
```

---

## Configuration

### GOAP Engine Config

```typescript
interface GoapEngineConfig {
  // Model Selection
  defaultModel: string;
  modelPreferences: {
    outline: string;
    chapter: string;
    refinement: string;
  };

  // Generation Parameters
  temperature: number; // 0.0-2.0 (creativity)
  maxTokens: number; // Max response length
  topP: number; // Nucleus sampling

  // Context Settings
  maxContextChapters: number; // How many previous chapters
  includeCharacters: boolean; // Include character context
  includeWorld: boolean; // Include world context

  // Quality Settings
  requireOutline: boolean; // Require outline before writing
  autoRefine: boolean; // Auto-refine generated content
  consistencyChecks: boolean; // Run consistency validation

  // Performance
  streamResponse: boolean; // Stream generation
  cacheContext: boolean; // Cache context for speed
  parallelActions: boolean; // Run actions in parallel when possible
}
```

### Environment Variables

```env
# AI Provider API Keys
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
OPENROUTER_API_KEY=your_key_here

# Default Models
DEFAULT_TEXT_MODEL=claude-sonnet-4
DEFAULT_IMAGE_MODEL=dall-e-3

# Generation Settings
MAX_GENERATION_LENGTH=4000
DEFAULT_TEMPERATURE=0.7
ENABLE_STREAMING=true
```

---

## Testing

### Unit Tests

- `useGoapEngine.test.ts` - GOAP engine logic
- `imageGenerationService.test.ts` - Image generation

### Integration Tests

- End-to-end generation flow
- Multi-action GOAP plans
- Context gathering and injection

**Run Tests**:

```bash
# All generation tests
npm run test -- generation

# GOAP engine tests
vitest run src/features/generation/hooks/__tests__/useGoapEngine.test.ts
```

---

## Performance Considerations

- **Context Caching**: Previous chapters cached to reduce API calls
- **Streaming**: Generation streamed for real-time feedback
- **Parallel Actions**: Independent actions run concurrently
- **Model Selection**: Fast models for drafts, quality models for finals

**Performance Targets**:

- Outline generation: <10s
- Chapter generation (2000 words): <30s
- Refinement: <15s
- Image generation: <10s

---

## Cost Optimization

### Estimated Costs

**Text Generation** (Claude Sonnet 4):

- Outline (1k tokens): ~$0.003
- Chapter (4k tokens): ~$0.012
- Refinement (2k tokens): ~$0.006

**Typical Novel** (80k words, 30 chapters):

- Outlines: $0.01
- Chapters: $0.36
- Refinements: $0.18
- **Total**: ~$0.55 per novel

**Image Generation** (DALL-E 3):

- Cover: $0.04
- Illustrations (10): $0.40
- **Total**: ~$0.44 per novel

**Full Novel Generation**: ~$1.00

### Cost Reduction Strategies

1. **Use Appropriate Models**:
   - Haiku for outlines and drafts
   - Sonnet for final content
   - Opus only for critical refinement

2. **Cache Context**:
   - Reuse previous chapter context
   - Cache character/world info

3. **Batch Operations**:
   - Generate multiple outlines at once
   - Batch refine multiple chapters

---

## Common Issues & Solutions

### Issue: Generated content out of character

**Solution**: Ensure character context included

```typescript
const chapter = await writeChapter({
  // ...
  previousContext: {
    includeCharacterStates: true,
    characterIds: ['protagonist', 'antagonist'],
  },
});
```

### Issue: Inconsistent with previous chapters

**Solution**: Increase context window

```typescript
updateConfig({
  maxContextChapters: 5, // Up from 3
});
```

### Issue: Generation too slow

**Solution**: Use faster model or reduce context

```typescript
updateConfig({
  defaultModel: 'claude-haiku-4',
  maxContextChapters: 2,
});
```

---

## Future Enhancements

- [ ] Multi-agent collaboration (agents work together)
- [ ] Learning from user edits (improve over time)
- [ ] Voice cloning (maintain author's voice)
- [ ] Real-time collaborative generation
- [ ] Version branching (try different directions)
- [ ] Style transfer (mimic famous authors)
- [ ] Auto-publish draft schedule
- [ ] Multilingual generation (native quality)
- [ ] Audio generation (audiobook narration)
- [ ] Video generation (book trailers)

---

## Related Features

- **Editor** (`src/features/editor`) - Edit generated content
- **Plot Engine** (`src/features/plot-engine`) - Analyze generated plots
- **Characters** (`src/features/characters`) - Use in character generation
- **World Building** (`src/features/world-building`) - Generate world elements
- **Writing Assistant** (`src/features/writing-assistant`) - Refine generated
  text

---

## Contributing

When modifying Generation:

1. Test generation quality thoroughly
2. Monitor API costs carefully
3. Validate context injection
4. Ensure GOAP actions are atomic
5. Handle API failures gracefully
6. Add comprehensive tests

---

## License

Part of Novelist.ai - See root LICENSE file
