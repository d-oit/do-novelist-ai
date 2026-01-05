# Story Structure

## Core Concepts

Story structure encompasses narrative frameworks, timeline management, and plot
organization.

## Narrative Frameworks

### Three-Act Structure

```typescript
interface ThreeActStructure {
  actOne: {
    setup: string[];
    incitingIncident: string;
    plotPoint1: string;
  };
  actTwo: {
    risingAction: string[];
    midpoint: string;
    complications: string[];
    plotPoint2: string;
  };
  actThree: {
    climax: string;
    fallingAction: string[];
    resolution: string;
  };
}
```

### Save the Cat Beat Sheet

```typescript
interface BeatSheet {
  openingImage: string;
  themeStated: string;
  setup: string[];
  catalyst: string;
  debate: string[];
  breakIntoTwo: string;
  bStory: string;
  funAndGames: string[];
  midpoint: string;
  badGuysCloseIn: string[];
  allIsLost: string;
  darkNightOfTheSoul: string;
  breakIntoThree: string;
  finale: string[];
  finalImage: string;
}
```

### Hero's Journey

```typescript
interface HeroJourney {
  ordinaryWorld: string;
  callToAdventure: string;
  refusal: string;
  meetingMentor: string;
  crossingThreshold: string;
  testsAlliesEnemies: string[];
  approach: string;
  ordeal: string;
  reward: string;
  roadBack: string;
  resurrection: string;
  returnWithElixir: string;
}
```

## Timeline Management

```typescript
interface Timeline {
  id: string;
  events: TimelineEvent[];
  parallelThreads: StoryThread[];
}

interface TimelineEvent {
  id: string;
  timestamp: StoryTime;
  chapter: number;
  description: string;
  characters: string[];
  location: string;
  significance: 'low' | 'medium' | 'high';
}

interface StoryThread {
  id: string;
  name: string;
  events: string[];
  arc: ThreadArc;
  resolution: string;
}
```

## Story Pacing

```typescript
interface PacingAnalysis {
  overall: 'slow' | 'moderate' | 'fast' | 'varied';
  chapterBreakdown: ChapterPacing[];
  recommendations: PacingRecommendation[];
}

interface ChapterPacing {
  chapter: number;
  speed: 'slow' | 'moderate' | 'fast';
  actionDensity: number;
  dialogueRatio: number;
  descriptionRatio: number;
}
```

## Structure Validation

```typescript
function validateStructure(
  events: PlotEvent[],
  structure: NarrativeFramework,
): StructureValidation {
  const issues: StructureIssue[] = [];

  const requiredBeats = getRequiredBeatsForFramework(structure);
  requiredBeats.forEach(beat => {
    const event = events.find(e => e.beat === beat);
    if (!event) {
      issues.push({
        type: 'missing_beat',
        beat,
        message: `Required beat '${beat}' not found in story`,
      });
    }
  });

  return {
    isValid: issues.length === 0,
    issues,
    framework: structure,
  };
}
```

## Parallel Story Threads

```typescript
interface ThreadManager {
  threads: StoryThread[];
  intersections: ThreadIntersection[];
}

function findThreadIntersections(threads: StoryThread[]): ThreadIntersection[] {
  const intersections: ThreadIntersection[] = [];

  for (let i = 0; i < threads.length; i++) {
    for (let j = i + 1; j < threads.length; j++) {
      const intersection = findIntersection(threads[i], threads[j]);
      if (intersection) {
        intersections.push(intersection);
      }
    }
  }

  return intersections;
}
```

## Performance Optimization

- Index events by timestamp for O(1) lookups
- Cache structure validation results
- Use spatial indexing for timeline visualization
- Optimize thread intersection detection

## Testing

```typescript
describe('structure-validator', () => {
  it('validates complete three-act structure', () => {
    const events = createEventsForThreeActStructure();
    const result = validateStructure(events, 'three-act');

    expect(result.isValid).toBe(true);
  });

  it('detects missing midpoint', () => {
    const events = createEventsWithoutMidpoint();
    const result = validateStructure(events, 'beat-sheet');

    expect(result.issues[0].type).toBe('missing_beat');
    expect(result.issues[0].beat).toBe('midpoint');
  });
});
```

## Integration

- Plot engine for event generation
- Character development for character arcs
- World-building for location continuity
