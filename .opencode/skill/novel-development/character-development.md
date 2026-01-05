# Character Development

## Core Concepts

Character development involves tracking character arcs, relationships, and
evolution throughout the story.

## Character Data Model

```typescript
interface Character {
  id: string;
  name: string;
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
  traits: CharacterTrait[];
  arc: CharacterArc;
  relationships: CharacterRelationship[];
  backstory: string;
  goals: CharacterGoal[];
  flaws: CharacterFlaw[];
}
```

## Character Arcs

### Arc Types

```typescript
enum ArcType {
  HERO_JOURNEY = 'hero_journey',
  TRAGEDY = 'tragedy',
  REDEMPTION = 'redemption',
  GROWTH = 'growth',
  FALL = 'fall',
}

interface CharacterArc {
  type: ArcType;
  startState: ArcState;
  endState: ArcState;
  milestones: ArcMilestone[];
  isComplete: boolean;
}
```

### Arc Tracking

```typescript
function trackCharacterArc(
  character: Character,
  events: PlotEvent[],
): ArcProgress {
  const progress: ArcProgress = {
    currentMilestone: 0,
    completedMilestones: [],
    nextMilestone: character.arc.milestones[0],
  };

  for (const event of events) {
    if (event.characters.includes(character.id)) {
      const milestoneIndex = character.arc.milestones.findIndex(
        m => m.event === event.id,
      );

      if (milestoneIndex !== -1) {
        progress.completedMilestones.push(
          character.arc.milestones[milestoneIndex],
        );
        progress.currentMilestone = milestoneIndex + 1;
        progress.nextMilestone = character.arc.milestones[milestoneIndex + 1];
      }
    }
  }

  return progress;
}
```

## Character Relationships

### Relationship Graph

```typescript
interface CharacterRelationship {
  sourceId: string;
  targetId: string;
  type: RelationshipType;
  strength: number;
  evolution: RelationshipEvolution[];
  currentStatus: string;
}

enum RelationshipType {
  FAMILY = 'family',
  ROMANTIC = 'romantic',
  FRIENDSHIP = 'friendship',
  RIVALRY = 'rivalry',
  MENTOR = 'mentor',
  ALLY = 'ally',
  ENEMY = 'enemy',
}
```

### Relationship Visualization

```typescript
function buildRelationshipGraph(characters: Character[]): RelationshipGraph {
  const graph = new Map<string, Relationship[]>();

  characters.forEach(char => {
    graph.set(char.id, char.relationships);
  });

  return graph;
}
```

## Character Evolution

```typescript
interface CharacterEvolution {
  characterId: string;
  chapter: number;
  state: CharacterState;
  changes: CharacterChange[];
}

interface CharacterState {
  traits: CharacterTrait[];
  motivation: string;
  emotionalState: string;
  activeGoals: CharacterGoal[];
}
```

## Performance Considerations

- Use adjacency lists for relationship graphs
- Cache character arc calculations
- Index characters by role and location
- Optimize relationship queries with spatial indexing

## Testing

```typescript
describe('character-arc-tracker', () => {
  it('tracks hero journey arc progress', () => {
    const character = createCharacterWithHeroJourneyArc();
    const events = createPlotEventsForHeroJourney();

    const progress = trackCharacterArc(character, events);

    expect(progress.completedMilestones).toHaveLength(12);
    expect(progress.isComplete).toBe(true);
  });
});
```

## Integration

- Plot engine for event-driven character changes
- World-building for character locations
- Writing-assistant for consistency checking
