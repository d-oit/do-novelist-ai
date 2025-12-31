# Dependency Flow

Allowed and prohibited dependency patterns with validation.

## Upward Dependency Rule

Dependencies must flow upward only:

```
Infrastructure (concrete)
      ↑ implements
Domain (interfaces)
      ↑ uses
Application (orchestration)
      ↑ uses
Presentation (UI)
```

## Allowed Dependency Patterns

### Pattern 1: Infrastructure Implements Domain

```typescript
// Domain layer defines interface
export interface ChapterRepository {
  findById(id: string): Promise<Chapter | null>;
  save(chapter: Chapter): Promise<void>;
}

// Infrastructure layer implements
export class TursoChapterRepository implements ChapterRepository {
  constructor(private db: LibSQLDatabase) {}
  async save(chapter: Chapter): Promise<void> { ... }
}
```

### Pattern 2: Application Uses Domain

```typescript
// Application service uses domain directly
export class ChapterService {
  constructor(
    private chapterRepository: ChapterRepository, // Interface
  ) {}

  async createChapter(data: CreateChapterDTO): Promise<Chapter> {
    const chapter = Chapter.fromDTO(data);
    await this.chapterRepository.save(chapter);
  }
}
```

### Pattern 3: Presentation Calls Application

```typescript
// Presentation layer uses application service
export function ChapterEditor() {
  const { createChapter, isSaving } = useChapterService();

  const handleSave = async () => {
    await createChapter({ title, content });
  };

  return <button onClick={handleSave}>Save</button>;
}
```

### Pattern 4: Domain Events

```typescript
// Domain emits events
export class ProjectAggregate {
  addChapter(chapter: Chapter): void {
    this.domainEvents.push(new ChapterAddedEvent(this.project.id, chapter.id));
  }
}

// Application layer handles events
export class ChapterAddedHandler {
  async handle(event: ChapterAddedEvent): Promise<void> {
    await analyticsService.trackChapterCreated(event.chapterId);
  }
}
```

## Prohibited Dependency Patterns

### Violation 1: Downward Dependency

```typescript
// ❌ Bad - Application depends on Infrastructure
export class ChapterService {
  constructor(private db: TursoDatabase) {} // Direct concrete dependency
}

// ✅ Good - Application depends on Domain interface
export class ChapterService {
  constructor(
    private chapterRepository: ChapterRepository, // Abstract interface
  ) {}
}
```

### Violation 2: Domain Leaking to Presentation

```typescript
// ❌ Bad - Domain entity in component
import { Chapter } from '@/features/chapters/types';

export function ChapterList() {
  const [chapters] = useState<Chapter[]>([]);
}

// ✅ Good - Use DTO or ViewModel
import { ChapterViewModel } from '@/features/chapters/services/types';

export function ChapterList() {
  const [chapters] = useState<ChapterViewModel[]>([]);
}
```

### Violation 3: Tight Feature Coupling

```typescript
// ❌ Bad - Direct feature-to-feature dependency
import { CharacterService } from '@/features/characters/services/characterService';

export class ProjectService {
  async createProject(data) {
    const character = await CharacterService.createCharacter(...);
  }
}

// ✅ Good - Use events or shared abstractions
export class ProjectService {
  async createProject(data) {
    const project = Project.create(data);
    this.eventBus.publish(new ProjectCreatedEvent(project.id));
  }
}
```

### Violation 4: Circular Dependencies

```typescript
// ❌ Bad - Module A imports B, B imports A
// features/characters/services/characterService.ts
import { ProjectService } from '../projects/services/projectService';

// features/projects/services/projectService.ts
import { CharacterService } from '../characters/services/characterService';

// ✅ Good - Extract shared interface or use events
// shared/types/events.ts
export class ProjectCreatedEvent { ... }

// features/characters/services/characterService.ts
// Listen to event instead of direct import
```

## Dependency Validation

### TypeScript Dependency Checking

**Strict mode configuration**:

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noCircular": true,
    "noImplicitAny": true,
    "strictModuleChecking": true,
  }
}
```

**ESLint dependency rules**:

```javascript
// eslint.config.js
export default [
  {
    rules: {
      'no-restricted-imports': 'error',
      'import/no-cycle': 'error',
      'import/no-relative-parent-imports': 'error',
    },
  },
];
```

## Resolution Strategies

### Strategy 1: Extract Shared Interface

```typescript
// shared/types/chapter-repository.ts
export interface ChapterRepository {
  findById(id: string): Promise<Chapter | null>;
  save(chapter: Chapter): Promise<void>;
}

// features/chapters/services/chapter-service.ts
export class ChapterService {
  constructor(
    private chapterRepository: ChapterRepository, // Any implementation
  ) {}
}
```

### Strategy 2: Use Domain Events

```typescript
// domain/events.ts
export class ChapterCreatedEvent {
  constructor(
    public readonly chapterId: string,
    public readonly projectId: string,
  ) {}
}

// features/analytics/services/analytics-listener.ts
export class AnalyticsService {
  onChapterCreated(event: ChapterCreatedEvent) {
    // Handle event instead of direct dependency
  }
}
```

### Strategy 3: Dependency Inversion

```typescript
// Define abstraction in high-level module
interface DatabaseConnection {
  query(sql: string, params: unknown[]): Promise<unknown>;
}

// Low-level module implements abstraction
export class TursoConnection implements DatabaseConnection {
  query(sql: string, params: unknown[]): Promise<unknown> { ... }
}

// High-level module depends on abstraction
export class Repository {
  constructor(private connection: DatabaseConnection) {}
}
```

## Dependency Graph Visualization

### Healthy Dependency Graph

```
         ┌───────┐
         │Domain │
         └───┬───┘
              │
      ┌───────▼───────┐
      │Application  │
      └───────┬───────┘
              │
    ┌─────▼─────┐
    │Presentation│
    └──────────┘

Infrastructure (hidden behind Repository interfaces)
```

### Unhealthy Dependency Graph

```
┌─────────────────────────┐
│      Application      │
└──┬───────┬──────────┘
     │       │
     ▼       ▼
┌──────┐ ┌────────┐
│Domain │ │Infra   │
└────────┘ └────────┘
   (Tight coupling)
```

## Quick Reference

### Allowed Dependency Matrix

| Layer          | Can Depend On                | Cannot Depend On            |
| -------------- | ---------------------------- | --------------------------- |
| Presentation   | Application, Shared UI       | Domain, Infrastructure      |
| Application    | Domain, Application Services | Infrastructure, UI          |
| Domain         | Domain Events, Interfaces    | Application, Infrastructure |
| Infrastructure | External Libs, Drivers       | Domain, Application, UI     |

---

Follow upward dependency flow for maintainable architecture.
