# Architecture Core Guidance

Detailed implementation of clean architecture principles, layering, and boundary
enforcement.

## Layer Architecture

### Clean Layers Overview

```
┌─────────────────────────────────────────┐
│         Presentation Layer             │  ← React components, hooks
├─────────────────────────────────────────┤
│         Application Layer            │  ← Orchestration, use cases
├─────────────────────────────────────────┤
│          Domain Layer               │  ← Business logic, entities
├─────────────────────────────────────────┤
│      Infrastructure Layer           │  ← Database, APIs, I/O
└─────────────────────────────────────────┘
```

### Layer Responsibilities

**Presentation Layer** (`src/components/`, `src/features/*/components/`):

- Render UI
- Handle user interactions
- Format data for display
- Call application layer services

**Allowed Dependencies**:

- Application layer services
- Shared components
- Utility libraries

**Forbidden Dependencies**:

- Direct database access
- Domain entities (use DTOs instead)
- Infrastructure concerns

### Application Layer (`src/features/*/services/`, `src/features/*/hooks/`):

- Orchestrate domain operations
- Transform DTOs to domain objects
- Handle cross-cutting concerns (logging, caching)
- Coordinate multiple domain services

**Allowed Dependencies**:

- Domain layer (entities, services)
- Repository interfaces
- Infrastructure implementations

**Forbidden Dependencies**:

- UI components
- Framework-specific details

### Domain Layer (`src/features/*/types/`, `src/lib/*/domain/`):

- Contain business logic
- Define entities and value objects
- Enforce invariants
- Define repository interfaces (only interfaces)
- Handle business rules and invariants

**Allowed Dependencies**:

- Other domain types
- Domain events

**Forbidden Dependencies**:

- Infrastructure details (database, APIs)
- UI concerns
- Application services

### Infrastructure Layer (`src/lib/database/`, `src/lib/api/`):

- Implement repository interfaces
- Handle external API calls
- Manage database connections
- File I/O operations

**Allowed Dependencies**:

- Database drivers
- HTTP clients
- File system libraries

**Forbidden Dependencies**:

- Domain logic (should be passed in)
- Business rules

## Dependency Flow

### Upward Dependency Rule

Dependencies must flow upward:

```
Infrastructure (concrete)
      ↑ implements
Domain (interfaces)
      ↑ uses
Application (orchestration)
      ↑ uses
Presentation (UI)
```

### Dependency Examples

**Correct Dependencies**:

```typescript
// ✅ Presentation → Application
import { useProjectService } from '@/features/projects/services/projectService';

// ✅ Application → Domain
import { Project, Chapter } from '@/features/projects/types';

// ✅ Infrastructure → Domain interfaces
import { ChapterRepository } from '@/features/projects/types';

// ✅ Domain → Domain events
import { ChapterCreatedEvent } from '@/features/projects/types/events';
```

**Incorrect Dependencies**:

```typescript
// ❌ Presentation → Domain (use DTOs instead)
import { Project } from '@/features/projects/types';
// Instead: import { ProjectDTO } from '@/features/projects/services/types';

// ❌ Domain → Infrastructure
import { db } from '@/lib/database/connection';
// Instead: Domain defines repository interface, infrastructure implements it

// ❌ Infrastructure → Application
import { projectService } from '@/features/projects/services/projectService';
// Instead: Infrastructure implements repository, Application uses repository
```

### Circular Dependency Detection

**Symptoms of circular dependencies**:

- Import errors: "Cannot find module"
- TypeScript errors about circular references
- Build failures with confusing error messages

**Resolution Strategies**:

1. Extract shared interface to third module
2. Use domain events for communication
3. Apply dependency inversion
4. Consolidate tightly coupled modules

## Module Boundaries

### Bounded Contexts

Each feature module is a bounded context with its own domain model:

```
src/features/
├── characters/         # Character management bounded context
│   ├── types/         # Domain entities & value objects
│   ├── services/      # Domain services
│   └── components/    # UI components
├── projects/          # Project management bounded context
└── world-building/    # World management bounded context
```

### Public API Definition

Define clear public APIs for each module:

```typescript
// features/characters/index.ts
export {
  // Types
  Character,
  CharacterDTO,
  CreateCharacterRequest,

  // Services
  useCharacters,
  useCharacter,

  // Components (if shared)
  CharacterList,
  CharacterCard,
} from './index';
```

### Internal vs Public

```typescript
// Public API - Exported from index.ts
export class CharacterService {
  async createCharacter(data: CreateCharacterDTO): Promise<Character> {
    // Public method
  }
}

// Internal - Not exported
class CharacterValidator {
  validate(data: CreateCharacterDTO): ValidationResult {
    // Internal helper
  }
}
```

## Interface Design

### Interface Segregation

Keep interfaces small and focused:

```typescript
// ❌ Too large
export interface Repository {
  create<T>(entity: T): Promise<T>;
  read<T>(id: string): Promise<T>;
  update<T>(entity: T): Promise<void>;
  delete<T>(id: string): Promise<void>;
  query<T>(filter: Filter): Promise<T[]>;
}

// ✅ Focused
export interface ChapterRepository {
  findById(id: string): Promise<Chapter | null>;
  findByProjectId(projectId: string): Promise<Chapter[]>;
  save(chapter: Chapter): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface ProjectRepository {
  findById(id: string): Promise<Project | null>;
  findAll(userId: string): Promise<Project[]>;
  save(project: Project): Promise<void>;
}
```

### Dependency Inversion

Depend on abstractions, not concretions:

```typescript
// ❌ Depends on concrete
export class ChapterService {
  constructor(
    private db: TursoDatabase, // Concrete dependency
  ) {}
}

// ✅ Depends on abstraction
export class ChapterService {
  constructor(
    private chapterRepository: ChapterRepository, // Abstract interface
  ) {}
}
```

## Anti-Patterns to Avoid

### ❌ Leaking Domain to Presentation

```typescript
// ❌ Bad - Domain entity in component
import { Chapter } from '@/features/chapters/types';

export function ChapterList() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
}

// ✅ Good - Use DTO or ViewModel
import { ChapterViewModel } from '@/features/chapters/services/types';

export function ChapterList() {
  const [chapters, setChapters] = useState<ChapterViewModel[]>([]);
}
```

### ❌ Business Logic in Infrastructure

```typescript
// ❌ Bad - Business rules in repository
export class ChapterRepository {
  async save(chapter: Chapter): Promise<void> {
    if (chapter.wordCount < 100) {
      throw new Error('Too short'); // Business logic!
    }
    // ...
  }
}

// ✅ Good - Repository only persists
export class ChapterRepository {
  async save(chapter: Chapter): Promise<void> {
    // Just save
    await this.db.execute('INSERT ...', [...]);
  }
}

// ✅ Business logic in domain entity
export class Chapter {
  constructor(...) {
    if (this.wordCount < 100) {
      throw new ValidationError('Too short');
    }
  }
}
```

### ❌ Tight Coupling Between Features

```typescript
// ❌ Bad - Direct feature-to-feature dependency
import { CharacterService } from '@/features/characters/services/characterService';

export class ProjectService {
  async createProject(data) {
    // Directly calling another feature
    const character = await CharacterService.createCharacter(...);
  }
}

// ✅ Good - Use events or shared abstractions
export class ProjectService {
  async createProject(data) {
    const project = Project.create(data);
    // Emit event, let other features handle it
    this.eventBus.publish(new ProjectCreatedEvent(project.id));
  }
}
```

## Architecture Validation Checklist

### Code Review

- [ ] Layers properly separated
- [ ] Dependencies flow upward only
- [ ] No circular dependencies
- [ ] Interfaces used at boundaries
- [ ] DTOs used for layer transitions
- [ ] Domain logic stays in domain layer
- [ ] Infrastructure doesn't contain business rules
- [ ] Public APIs clearly defined
- [ ] Proper dependency directions

### Refactoring

- [ ] Can swap infrastructure implementation?
- [ ] Can test domain layer without infrastructure?
- [ ] Can replace UI layer without touching business logic?
- [ ] Are feature modules independently deployable?
- [ ] Can add new feature without modifying existing?

## Module Organization

### File Structure by Layer

```
src/
├── components/          # Presentation layer
├── features/
│   ├── [feature]/
│   │   ├── types/        # Domain layer
│   │   ├── services/     # Application layer
│   │   ├── components/    # Presentation layer
│   │   ├── hooks/        # Application layer
│   │   └── index.ts
└── lib/
    ├── database/          # Infrastructure layer
    └── api/              # Infrastructure layer
```

## See Also

- **[Layering Rules](layering-rules.md)** - Specific layer separation rules
- **[Dependency Flow](dependency-flow.md)** - Dependency management patterns
- **[Interface Design](interface-design.md)** - API design principles
- **[Module Boundaries](module-boundaries.md)** - Coupling and cohesion
  guidelines
