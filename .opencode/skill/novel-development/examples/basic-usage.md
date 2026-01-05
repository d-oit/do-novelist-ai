# Basic Usage - Novel Development

## Example 1: Creating a Plot Engine

```typescript
import { PlotEngine } from '@/features/plot-engine';

// Initialize plot engine
const engine = new PlotEngine();

// Create plot events
const events: PlotEvent[] = [
  {
    id: 'plot-001',
    chapter: 1,
    description: 'Hero discovers their powers',
    characters: ['hero-001'],
    location: 'location-001',
    type: { category: 'revelation', significance: 'critical' },
    introduces: 'magic powers',
  },
  {
    id: 'plot-002',
    chapter: 5,
    description: 'Hero masters their powers',
    characters: ['hero-001'],
    location: 'location-002',
    type: { category: 'action', significance: 'high' },
    resolves: 'magic powers',
  },
];

// Analyze plot for holes
const holes = engine.detectPlotHoles(events);
if (holes.length > 0) {
  console.log('Plot holes found:', holes);
}
```

## Example 2: Creating a Character with Arc

```typescript
import { CharacterManager } from '@/features/characters';

const manager = new CharacterManager();

// Create hero with journey arc
const hero: Character = {
  id: 'hero-001',
  name: 'Alex',
  role: 'protagonist',
  traits: [
    { name: 'bravery', strength: 8 },
    { name: 'curiosity', strength: 9 },
  ],
  arc: {
    type: ArcType.HERO_JOURNEY,
    startState: { motivation: 'survival', confidence: 3 },
    endState: { motivation: 'purpose', confidence: 9 },
    milestones: [
      { event: 'plot-001', description: 'Call to adventure' },
      { event: 'plot-005', description: 'Crossing threshold' },
      { event: 'plot-015', description: 'Ordeal' },
      { event: 'plot-020', description: 'Return with elixir' },
    ],
    isComplete: false,
  },
  relationships: [],
  backstory: 'Orphaned at age 10',
  goals: [{ id: 'goal-001', description: 'Find family' }],
  flaws: [{ name: 'impulsiveness', severity: 'medium' }],
};

await manager.createCharacter(hero);
```

## Example 3: Building a World

```typescript
import { WorldBuilder } from '@/features/world-building';

const builder = new WorldBuilder();

// Create a location
const kingdom: Location = {
  id: 'loc-001',
  name: 'Eldoria',
  type: 'location',
  description: 'A kingdom of magic and mystery',
  geography: 'Mountains to the west, plains to the east',
  climate: 'Temperate',
  population: 500000,
  settlements: ['city-001', 'town-002'],
  resources: ['gold', 'magic crystals'],
  connections: [],
};

// Create a culture
const culture: Culture = {
  id: 'culture-001',
  name: 'Eldorian',
  type: 'culture',
  beliefs: ['Magic is sacred', 'Balance is everything'],
  traditions: ['Annual harvest festival', 'Magic blessing ceremony'],
  language: 'Eldorian',
  customs: [
    { name: 'bowing', description: 'Greeting elders with a bow' },
    { name: 'gift-giving', description: 'Offering crystals as gifts' },
  ],
  socialStructure: 'Monarchy with council',
  connections: [
    {
      sourceId: 'culture-001',
      targetId: 'loc-001',
      type: ConnectionType.GEOGRAPHICAL,
      strength: 1.0,
      description: 'Primary culture of Eldoria',
    },
  ],
};

await builder.createLocation(kingdom);
await builder.createCulture(culture);
```

## Example 4: Using GOAP for Story Generation

```typescript
import { StoryPlanner } from '@/features/plot-engine';

const planner = new StoryPlanner();

// Define story goals
const goals: StoryGoal[] = [
  {
    id: 'goal-001',
    description: 'Hero discovers powers',
    priority: 10,
    category: 'plot',
    isTerminal: false,
  },
  {
    id: 'goal-002',
    description: 'Hero learns to use powers',
    priority: 8,
    category: 'plot',
    isTerminal: false,
  },
  {
    id: 'goal-003',
    description: 'Hero defeats villain',
    priority: 10,
    category: 'plot',
    isTerminal: true,
  },
];

// Define plot actions
const actions: PlotAction[] = [
  {
    id: 'action-001',
    name: 'Discover Powers',
    description: 'Hero discovers their magical abilities',
    preconditions: [goals[0]],
    effects: [goals[1]],
    cost: 1,
    type: ActionType.REVELATION,
  },
  {
    id: 'action-002',
    name: 'Training Montage',
    description: 'Hero trains to master their powers',
    preconditions: [goals[1]],
    effects: [
      {
        id: 'goal-004',
        description: 'Hero is ready',
        priority: 9,
        category: 'character',
        isTerminal: false,
      },
    ],
    cost: 2,
    type: ActionType.DEVELOPMENT,
  },
];

// Generate story plan
const plan = planner.generateStoryPlan('goal-003');
console.log('Story plan:', plan);
```
