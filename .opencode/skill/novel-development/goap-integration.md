# GOAP Integration

## Core Concepts

GOAP (Goal-Oriented Action Planning) enables AI-driven story generation and plot
development.

## GOAP for Story Generation

### Story Goals

```typescript
interface StoryGoal {
  id: string;
  description: string;
  priority: number;
  category: 'plot' | 'character' | 'theme' | 'conflict';
  isTerminal: boolean;
}

interface StoryState {
  plotPoints: PlotPoint[];
  characterStates: Map<string, CharacterState>;
  worldState: WorldState;
  themes: Theme[];
  conflicts: Conflict[];
}
```

### Plot Actions

```typescript
interface PlotAction {
  id: string;
  name: string;
  description: string;
  preconditions: StoryGoal[];
  effects: StoryGoal[];
  cost: number;
  type: ActionType;
  requiredCharacters?: string[];
  requiredLocation?: string;
}

enum ActionType {
  REVELATION = 'revelation',
  CONFLICT = 'conflict',
  RESOLUTION = 'resolution',
  DEVELOPMENT = 'development',
  TWIST = 'twist',
}
```

## Story Planning

```typescript
class StoryPlanner {
  private goals: StoryGoal[];
  private actions: PlotAction[];
  private state: StoryState;

  generateStoryPlan(targetGoal: string): PlotAction[] {
    const plan: PlotAction[] = [];
    const currentGoals = this.goals.filter(g => g.id === targetGoal);

    while (currentGoals.length > 0) {
      const action = this.findBestAction(currentGoals);
      if (!action) break;

      plan.push(action);
      this.applyAction(action, this.state);

      currentGoals.length = 0;
      currentGoals.push(...action.effects);
    }

    return plan;
  }

  private findBestAction(goals: StoryGoal[]): PlotAction | undefined {
    const applicable = this.actions.filter(a =>
      this.satisfiesPreconditions(a, goals),
    );

    return this.selectOptimalAction(applicable, this.state);
  }
}
```

## Character Behavior Planning

```typescript
interface CharacterGoal {
  characterId: string;
  motivation: string;
  priority: number;
  obstacles: string[];
}

interface CharacterAction {
  characterId: string;
  action: string;
  motivation: string;
  consequences: string[];
}

class CharacterPlanner {
  planCharacterAction(
    character: Character,
    state: StoryState,
  ): CharacterAction {
    const goals = character.goals;
    const availableActions = this.getAvailableActions(character, state);

    return this.selectOptimalAction(goals, availableActions);
  }
}
```

## Story Conflict Generation

```typescript
interface Conflict {
  id: string;
  type: ConflictType;
  parties: string[];
  intensity: 'low' | 'medium' | 'high' | 'extreme';
  resolution?: string;
}

enum ConflictType {
  MAN_VERSUS_SELF = 'man_versus_self',
  MAN_VERSUS_MAN = 'man_versus_man',
  MAN_VERSUS_NATURE = 'man_versus_nature',
  MAN_VERSUS_SOCIETY = 'man_versus_society',
  MAN_VERSUS_FATE = 'man_versus_fate',
}

function generateConflict(characters: Character[], world: WorldData): Conflict {
  const conflictType = this.selectConflictType(characters, world);
  const parties = this.selectParties(conflictType, characters);

  return {
    id: generateId(),
    type: conflictType,
    parties: parties.map(c => c.id),
    intensity: 'medium',
  };
}
```

## Plot Twist Planning

```typescript
interface PlotTwist {
  id: string;
  type: TwistType;
  setup: PlotEvent[];
  reveal: PlotEvent;
  foreshadowing: PlotEvent[];
  impact: 'minor' | 'major' | 'game_changer';
}

enum TwistType {
  BETRAYAL = 'betrayal',
  IDENTITY_REVEAL = 'identity_reveal',
  MOTIVE_SHIFT = 'motive_shift',
  FATAL_FLAW = 'fatal_flaw',
  RED_HERRING = 'red_herring',
}

function planTwist(
  storyState: StoryState,
  existingEvents: PlotEvent[],
): PlotTwist {
  const twistType = this.selectTwistType(storyState);
  const foreshadowing = this.generateForeshadowing(twistType);
  const reveal = this.createReveal(twistType, storyState);

  return {
    id: generateId(),
    type: twistType,
    setup: [],
    reveal,
    foreshadowing,
    impact: 'game_changer',
  };
}
```

## Performance Optimization

- Use A\* algorithm for optimal pathfinding
- Cache action evaluations
- Precompute character goal hierarchies
- Use heuristic scoring for action selection

## Testing

```typescript
describe('story-planner', () => {
  it('generates complete story plan', () => {
    const planner = new StoryPlanner(testGoals, testActions);
    const plan = planner.generateStoryPlan('hero_journey');

    expect(plan).toHaveLengthGreaterThan(0);
    expect(plan[0].type).toBe('revelation');
  });

  it('selects optimal action based on priority', () => {
    const planner = new StoryPlanner(testGoals, testActions);
    const action = planner.findBestAction([highPriorityGoal]);

    expect(action.priority).toBeLessThanOrEqual(action.cost);
  });
});
```

## Integration

- Plot engine for action execution
- Character development for character goals
- Story structure for framework validation
