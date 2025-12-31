# Module Boundaries

Maintaining loose coupling and high cohesion across modules.

## Bounded Contexts

### Definition

A bounded context is a distinct part of the domain with:

- Its own domain model
- Clear boundaries
- Internal consistency
- Minimal external dependencies

### Feature Module Bounded Contexts

```
src/features/
├── characters/         # Character management bounded context
│   ├── types/         # Character entities, value objects
│   ├── services/      # Character domain services
│   └── components/    # Character UI
├── projects/          # Project management bounded context
│   ├── types/         # Project entities, value objects
│   ├── services/      # Project domain services
│   └── components/    # Project UI
└── world-building/    # World management bounded context
```

## Coupling Types

### Loose Coupling

**Definition**: Modules depend on abstractions, not concrete implementations

```typescript
// ✅ Good - Depends on interface
export class ChapterService {
  constructor(
    private chapterRepository: ChapterRepository, // Interface
  ) {}
}

// ✗ Bad - Depends on concrete
export class ChapterService {
  constructor(
    private tursoRepo: TursoChapterRepository, // Concrete
  ) {}
}
```

### Tight Coupling within Context

**Within bounded context**: Tight coupling is acceptable

```typescript
// Domain layer - OK to be coupled
class ProjectAggregate {
  constructor(
    private project: Project,
    private chapters: Chapter[], // Tight coupling within aggregate
  ) {}
}

// Application layer - Depend on domain interface
export class ChapterService {
  constructor(private chapterRepository: ChapterRepository) {}
}
```

## Cohesion

### High Cohesion

**Definition**: Elements within a module belong together and support a single
purpose

**Good Example - High Cohesion**:

```typescript
// ✅ All methods relate to chapter management
export class ChapterService {
  constructor(
    private repository: ChapterRepository,
    private eventBus: EventBus,
  ) {}

  async createChapter(dto: CreateChapterDTO): Promise<Chapter> {
    const chapter = Chapter.fromDTO(dto);
    await this.repository.save(chapter);
    this.eventBus.publish(new ChapterCreatedEvent(chapter.id));
  }

  async getChapter(id: string): Promise<Chapter | null> {
    return this.repository.findById(id);
  }

  async updateChapter(id: string, dto: UpdateChapterDTO): Promise<Chapter> {
    const existing = await this.repository.findById(id);
    const updated = existing.update(dto);
    await this.repository.save(updated);
    this.eventBus.publish(new ChapterUpdatedEvent(id, Object.keys(dto)));
  }
}
```

**Bad Example - Low Cohesion**:

```typescript
// ✗ Unrelated methods in single class
export class UtilityService {
  async createChapter(dto): Promise<Chapter> { ... }
  async sendEmail(to: string, subject: string): Promise<void> { ... }
  async logError(error: Error): Promise<void> { ... }
  async validateUser(user: User): Promise<boolean> { ... }
  async formatJSON(json: unknown): Promise<string> { ... }
  async calculateStats(chapters: Chapter[]): Promise<Stats> { ... }
  async generateReport(stats: Stats): Promise<string> { ... }
}
```

## Module Dependency Rules

### Within Feature Module

```
src/features/characters/
├── types/         # Can import: types from same feature
├── services/      # Can import: types from same feature
└── components/    # Can import: services from same feature
```

**Allowed Dependencies**:

```typescript
// ✅ Good - Feature internal dependencies
import { Character } from '../types';
import { useCharacters } from '../hooks';

export function CharacterList() {
  const { characters, isLoading } = useCharacters();
  return <div>{characters.map(...)}</div>;
}

// ✅ Good - Shared UI components
import { Button, Card } from '@/shared/components/ui';

export function CharacterCard() {
  return (
    <Card>
      <Button>Save</Button>
    </Card>
  );
}
```

### Between Feature Modules

**Prohibited Dependencies**:

```typescript
// ✗ Bad - Direct feature-to-feature coupling
import { ChapterService } from '@/features/projects/services/chapterService';

export class CharacterService {
  async createCharacter(data) {
    // Directly calling another feature's service
    const chapter = await ChapterService.createChapter({
      projectId: data.projectId,
      title: 'Character introduction',
    });
  }
}

// ✅ Good - Use shared interfaces or events
import { ChapterCreatedEvent } from '@/shared/types/events';

export class CharacterService {
  async createCharacter(data) {
    // Create character
    const character = await this.repository.save(data);

    // Emit event, let project feature handle it
    this.eventBus.publish(
      new ChapterCreatedEvent(
        data.projectId,
        'Chapter created for character: ' + character.name,
      ),
    );
  }
}
```

### Cross-Cutting Concerns

**Shared Infrastructure**:

```
src/shared/
├── types/          # Shared types
├── events/         # Domain events
├── services/       # Shared services (logging, caching)
└── components/    # Shared UI components
```

**Import Pattern**:

```typescript
// ✅ All features use shared infrastructure
import { logger } from '@/shared/services/logger';
import { EventBus } from '@/shared/services/eventBus';
import { Button } from '@/shared/components/ui/Button';

export function FeatureComponent() {
  const handleAction = async () => {
    logger.info('Action triggered');
    await featureService.doSomething();
  };

  return <Button onClick={handleAction}>Action</Button>;
}
```

## Public API Definition

### Feature Module Public Interface

```typescript
// features/characters/index.ts
export * from './types';
export * from './services';
export * from './components';

// Only export what external features need
// Internal modules not exported
```

### Internal Module API

```typescript
// features/characters/services/internal/
export const CHARACTER_CONSTANTS = {
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 100,
} as const;

// Internal helper, not exported
export function normalizeName(name: string): string {
  return name.trim();
}
```

## Boundary Enforcement

### TypeScript Module Resolution

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Import Rules**:

```typescript
// ✅ Good - Absolute imports within codebase
import { Character } from '@/features/characters/types';
import { useCharacters } from '@/features/characters/hooks';

// ✗ Bad - Relative imports crossing modules
import { Character } from '../../projects/types';
```

### Module Size Limits

**Per File**: Max 500 LOC

**Rationale**: Smaller modules are:

- Easier to understand
- Easier to test
- Easier to refactor
- Less prone to bugs
- More cohesive

**Module Splitting Strategy**:

```
Too Large (> 500 LOC)
├── ChapterService.ts (800 LOC)
│
└── Split into:
    ├── ChapterReader.ts (250 LOC)
    ├── ChapterWriter.ts (250 LOC)
    ├── ChapterValidator.ts (200 LOC)
    └── ChapterAggregator.ts (100 LOC)
```

## Dependency Visualization

### Healthy Module Dependency Graph

```
              ┌─────────────┐
              │ Shared      │
              └──────┬──────┘
        ┌──────────┴───┐
        │               │
┌───────┐ ┌───────┐ ┌───────┐
│Chars  │ │Projects│ │World   │
└───────┘ └───────┘ └───────┘
  Independent (shared events only)
```

### Unhealthy Module Dependency Graph

```
        ┌─────────────┐
        │ Shared      │
        └──────┬──────┘
      ┌───┴───────┐
      │ Chars    │
      └───┼───────┘
   Directly coupled (tight, hard to change)
```

## Anti-Patterns to Avoid

### ❌ God Modules

```typescript
// ✗ Bad - One module does everything
export class SuperService {
  async createCharacter() { ... }
  async createProject() { ... }
  async createWorld() { ... }
  async createChapter() { ... }
  async createLocation() { ... }
  async updateAnyEntity() { ... }
  async deleteAnyEntity() { ... }
  // ... 100 more methods
}

// ✅ Good - Focused modules
export class CharacterService {
  async createCharacter() { ... }
}

export class ProjectService {
  async createProject() { ... }
}
```

### ❌ Circular Dependencies

```typescript
// ✗ Bad - Circular imports
// features/characters/services/characterService.ts
import { ProjectService } from '../projects/services/projectService';

// features/projects/services/projectService.ts
import { CharacterService } from '../characters/services/characterService';

// ✅ Good - Extract shared interface or use events
// shared/types/events.ts
export class ProjectCreatedEvent { ... }

// features/characters/services/characterService.ts
export class CharacterService {
  async createCharacter(data) {
    const character = await this.repository.save(data);
    this.eventBus.publish(new ProjectCreatedEvent(character.projectId));
  }
}
```

### ❌ Leakage of Implementation Details

```typescript
// ✗ Bad - Domain exposes infrastructure
export class Chapter {
  constructor(
    private db: TursoDatabase, // Infrastructure in domain!
  ) {}

  async save() {
    await this.db.execute('INSERT INTO chapters ...');
  }
}

// ✅ Good - Domain defines interface
export interface ChapterRepository {
  save(chapter: Chapter): Promise<void>;
}

// Domain entity (pure)
export class Chapter {
  constructor(...) {}
}

// Infrastructure implements interface
export class TursoChapterRepository implements ChapterRepository {
  async save(chapter: Chapter): Promise<void> {
    await this.db.execute('INSERT ...');
  }
}
```

## Module Checklist

### Boundary Verification

- [ ] Module has single, clear responsibility
- [ ] Dependencies flow in correct direction
- [ ] No circular dependencies
- [ ] Public API is minimal and well-defined
- [ ] Internal implementation is encapsulated
- [ ] Module size is within limits (< 500 LOC)
- [ ] Module name reflects its purpose

### Cohesion Check

- [ ] All functions/operations relate to module purpose
- [ ] Elements are logically grouped
- [ ] No unnecessary dependencies
- [ ] Shared functionality properly extracted

### Coupling Check

- [ ] Dependencies are loose (based on interfaces)
- [ ] No direct module-to-module coupling
- [ ] Changes in one module don't cascade to others
- [ ] Cross-cutting concerns are shared
- [ ] Event-driven communication between features

---

Maintain high cohesion and low coupling for maintainable, scalable architecture.
