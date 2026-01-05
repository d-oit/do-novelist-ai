# Plot Engine

## Core Concepts

The plot engine handles story analysis, generation, and hole detection using
narrative theory and data structures.

## Plot Analysis

### Three-Act Structure

```typescript
interface ThreeActStructure {
  setup: PlotEvent[];
  confrontation: PlotEvent[];
  resolution: PlotEvent[];
}
```

### Beat Sheet Analysis

```typescript
interface BeatSheet {
  openingImage: PlotEvent;
  catalyst: PlotEvent;
  debate: PlotEvent[];
  breakIntoTwo: PlotEvent;
  funAndGames: PlotEvent[];
  midpoint: PlotEvent;
  badGuysCloseIn: PlotEvent[];
  allIsLost: PlotEvent;
  darkNightOfTheSoul: PlotEvent;
  breakIntoThree: PlotEvent;
  finale: PlotEvent[];
  finalImage: PlotEvent;
}
```

## Plot Hole Detection

### Consistency Checking

```typescript
function detectPlotHoles(events: PlotEvent[]): PlotHole[] {
  const holes: PlotHole[] = [];

  for (let i = 0; i < events.length; i++) {
    const event = events[i];

    if (event.introduces && !isResolved(event.introduces, events.slice(i))) {
      holes.push({
        type: 'unresolved_introduction',
        location: event.chapter,
        issue: `${event.introduces} introduced but never resolved`,
      });
    }

    if (
      event.requires &&
      !hasPrecedingEvent(event.requires, events.slice(0, i))
    ) {
      holes.push({
        type: 'missing_preceding_event',
        location: event.chapter,
        issue: `${event.requires} referenced but not introduced`,
      });
    }
  }

  return holes;
}
```

## Plot Generation

### GOAP-Based Generation

```typescript
interface StoryGoal {
  id: string;
  description: string;
  priority: number;
}

interface PlotEvent {
  id: string;
  type: 'action' | 'revelation' | 'climax' | 'resolution';
  prerequisites: StoryGoal[];
  effects: StoryGoal[];
}
```

## Data Structures

```typescript
interface PlotEvent {
  id: string;
  chapter: number;
  description: string;
  characters: string[];
  location: string;
  introduces?: string;
  requires?: string;
  resolves?: string;
  type: EventType;
}

interface EventType {
  category: 'action' | 'dialogue' | 'revelation' | 'climax' | 'resolution';
  significance: 'low' | 'medium' | 'high' | 'critical';
}
```

## Performance Optimization

- Index events by chapter for O(1) lookups
- Cache plot analysis results
- Use memoization for expensive computations
- Optimize plot hole detection with early termination

## Testing

```typescript
describe('plot-hole-detector', () => {
  it('detects unresolved introductions', () => {
    const events = createTestEvents([
      { introduces: 'magic sword' },
      { resolves: 'magic sword' },
    ]);

    const holes = detectPlotHoles(events);
    expect(holes).toHaveLength(0);
  });

  it('detects missing preceding events', () => {
    const events = createTestEvents([{ requires: 'character backstory' }]);

    const holes = detectPlotHoles(events);
    expect(holes[0].type).toBe('missing_preceding_event');
  });
});
```

## Integration

- Connect with character graph for character arc tracking
- Use world-building data for location consistency
- Integrate with writing-assistant for style analysis
