---
name: domain-expert
description:
  Apply domain-driven design principles for business logic, entities, events and
  aggregate boundaries. Use when modeling domain concepts, implementing business
  rules, or defining clear separation between domain and infrastructure layers.
---

# Domain Expert

Enforce domain-driven design (DDD) principles and ensure clean separation
between domain logic, application logic, and infrastructure.

## Quick Reference

**Core Concepts**:

- Bounded Contexts - Feature module isolation
- Domain Layers - Pure business logic separation
- Entity Modeling - Rich domain objects
- Value Objects - Immutable, equality-by-value
- Aggregates - Consistency boundaries
- Domain Events - Event-driven design
- Repository Pattern - Interface-based persistence

## When to Use

- Modeling new domain concepts (entities, value objects, aggregates)
- Implementing business rules and invariants
- Designing domain events and event handlers
- Defining aggregate boundaries and consistency boundaries
- Ensuring domain layer remains pure and independent
- Writing feature modules in `src/features/`

## Core DDD Principles

### Bounded Contexts

Each feature module represents a bounded context with its own domain model:

```
src/features/
├── characters/         # Character management bounded context
│   ├── types/         # Domain entities & value objects
│   ├── services/      # Domain services
│   └── components/    # UI components
├── projects/          # Project management bounded context
└── world-building/    # World management bounded context
```

### Domain Layers

**1. Domain Layer** (Pure business logic)

- Domain entities and value objects
- Domain services
- Domain events
- Repository interfaces (only interfaces)
- Business rules and invariants

**2. Application Layer** (Use cases)

- Application services (orchestrate domain)
- DTOs for API boundaries
- Command/query handlers (CQRS pattern)
- Event handlers

**3. Infrastructure Layer** (Technical details)

- Repository implementations
- External service integrations
- Database operations
- File I/O

### Domain Modeling

**Entities**:

- Have identity (ID)
- Contain business logic
- Enforce invariants
- Mutable state

```typescript
export class Character {
  constructor(
    public id: string,
    public name: string,
    public attributes: CharacterAttributes,
  ) {}

  addAttribute(key: string, value: string): void {
    this.attributes[key] = value;
  }

  removeAttribute(key: string): void {
    if (this.attributes[key]) {
      delete this.attributes[key];
    }
  }
}
```

**Value Objects**:

- No identity (equality by value)
- Immutable
- Replaceable
- Validate on creation

```typescript
export class CharacterAttributes {
  constructor(
    public readonly hairColor: string,
    public readonly eyeColor: string,
    public readonly height: number,
  ) {
    if (height < 0 || height > 300) {
      throw new Error('Invalid height');
    }
  }

  equals(other: CharacterAttributes): boolean {
    return (
      this.hairColor === other.hairColor &&
      this.eyeColor === other.eyeColor &&
      this.height === other.height
    );
  }
}
```

### Aggregate Design

**Aggregate Rules**:

- One aggregate root per consistency boundary
- All invariants enforced by aggregate root
- Aggregates are loaded and saved atomically
- External references only by ID

```typescript
export class ProjectAggregate {
  constructor(
    public readonly project: Project,
    private chapters: Chapter[],
    private characters: Map<string, Character>,
  ) {}

  addChapter(chapter: Chapter): void {
    if (this.project.chapterCount >= this.project.maxChapters) {
      throw new Error('Maximum chapters reached');
    }
    this.chapters.push(chapter);
    this.domainEvents.push(new ChapterAddedEvent(this.project.id, chapter.id));
  }

  removeChapter(chapterId: string): void {
    this.chapters = this.chapters.filter(c => c.id !== chapterId);
    this.domainEvents.push(new ChapterRemovedEvent(this.project.id, chapterId));
  }

  private domainEvents: DomainEvent[] = [];
}
```

### Domain Events

**Event Design**:

- Past tense (ChapterAdded, ProjectCreated)
- Immutable
- Carry minimal context
- No side effects (pure event data)

```typescript
export class ChapterAddedEvent implements DomainEvent {
  readonly eventType = 'ChapterAdded';
  constructor(
    public readonly projectId: string,
    public readonly chapterId: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}

// Event handler (in application layer)
export class ChapterAddedHandler {
  async handle(event: ChapterAddedEvent): Promise<void> {
    await analyticsService.trackChapterCreated(event.chapterId);
  }
}
```

## Business Rules Implementation

### Rule Enforcement

**Invariants** (Rules that must always hold):

- Domain entities enforce invariants
- Fail fast with clear errors
- Never allow invalid state

```typescript
export class Chapter {
  private wordCount: number;

  setContent(text: string): void {
    const words = text.split(/\s+/).length;
    if (words < 100) {
      throw new ValidationError('Chapter must have at least 100 words');
    }
    if (words > 10000) {
      throw new ValidationError('Chapter cannot exceed 10,000 words');
    }
    this.wordCount = words;
  }
}
```

### Specification Pattern

Use specifications for reusable business rules:

```typescript
export interface Specification<T> {
  isSatisfiedBy(candidate: T): boolean;
}

export class ValidChapterSpecification implements Specification<Chapter> {
  isSatisfiedBy(chapter: Chapter): boolean {
    return chapter.wordCount >= 100 && chapter.wordCount <= 10000;
  }
}

// Usage
if (!validChapterSpec.isSatisfiedBy(chapter)) {
  throw new ValidationError('Invalid chapter');
}
```

## Repository Pattern

### Repository Interfaces (Domain Layer)

Define interfaces in domain, implement in infrastructure:

```typescript
// Domain layer
export interface ChapterRepository {
  findById(id: string): Promise<Chapter | null>;
  save(chapter: Chapter): Promise<void>;
  delete(id: string): Promise<void>;
  findByProjectId(projectId: string): Promise<Chapter[]>;
}
```

### Repository Implementation (Infrastructure Layer)

```typescript
// Infrastructure layer
export class TursoChapterRepository implements ChapterRepository {
  constructor(private db: LibSQLDatabase) {}

  async findById(id: string): Promise<Chapter | null> {
    const result = await this.db.execute(
      'SELECT * FROM chapters WHERE id = ?',
      [id],
    );
    return result.rows[0] ? Chapter.fromRow(result.rows[0]) : null;
  }

  async save(chapter: Chapter): Promise<void> {
    await this.db.execute(
      'INSERT INTO chapters (id, project_id, title, content) VALUES (?, ?, ?, ?)',
      [chapter.id, chapter.projectId, chapter.title, chapter.content],
    );
  }
}
```

## Common Patterns

### Factory Pattern

Create complex aggregates with validation:

```typescript
export class ProjectFactory {
  static create(
    userId: string,
    title: string,
    config: ProjectConfig,
  ): ProjectAggregate {
    if (!title || title.trim().length < 3) {
      throw new ValidationError('Title must be at least 3 characters');
    }

    const project = new Project(generateId(), userId, title);
    const aggregate = new ProjectAggregate(project, [], new Map());

    aggregate.applyConfig(config);
    return aggregate;
  }
}
```

### Domain Service

Business logic that doesn't naturally belong to any entity:

```typescript
export class ProjectPricingService {
  calculatePrice(project: Project, usage: UsageMetrics): Price {
    const basePrice = project.pricingTier.basePrice;
    const wordCountBonus = (usage.totalWords / 1000) * 0.01;
    const storagePenalty = usage.storageUsageGB * 0.5;

    return {
      base: basePrice,
      adjustments: wordCountBonus + storagePenalty,
      total: basePrice + wordCountBonus + storagePenalty,
    };
  }
}
```

## Anti-Patterns to Avoid

### ❌ Anemic Domain Model

Don't make entities data-only objects:

```typescript
// BAD - Anemic
class Chapter {
  id: string;
  title: string;
  content: string;
}

// GOOD - Rich domain model
class Chapter {
  constructor(
    private id: string,
    private title: string,
    private content: string,
  ) {}

  get title(): string {
    return this.title;
  }

  setTitle(title: string): void {
    if (title.length > 100) {
      throw new Error('Title too long');
    }
    this.title = title;
  }
}
```

### ❌ God Aggregates

Don't create aggregates that contain unrelated concepts:

```typescript
// BAD - Too large
class ProjectAggregate {
  project: Project;
  chapters: Chapter[];
  characters: Character[];
  locations: Location[];
  settings: Settings;
  analytics: Analytics[];
  // ...everything else
}

// GOOD - Bounded aggregates
class ProjectAggregate {
  project: Project;
  chapters: Chapter[];
}

class CharacterAggregate {
  character: Character;
  attributes: CharacterAttributes[];
}
```

### ❌ Leaking Infrastructure

Don't import infrastructure dependencies in domain:

```typescript
// BAD - Database in domain
class Chapter {
  async saveToDatabase(db: LibSQLDatabase): Promise<void> { ... }
}

// GOOD - Repository interface in domain
class Chapter {
  // Pure domain logic only
}

// Infrastructure handles persistence
await chapterRepository.save(chapter);
```

## Testing Domain Logic

### Unit Tests for Domain Entities

```typescript
describe('Chapter', () => {
  describe('setContent', () => {
    it('should throw error for too few words', () => {
      const chapter = new Chapter('id', 'projectId', 'Title');
      expect(() => chapter.setContent('short')).toThrow(ValidationError);
    });

    it('should throw error for too many words', () => {
      const chapter = new Chapter('id', 'projectId', 'Title');
      expect(() => chapter.setContent(longText)).toThrow(ValidationError);
    });

    it('should set content for valid word count', () => {
      const chapter = new Chapter('id', 'projectId', 'Title');
      chapter.setContent(validContent);
      expect(chapter.wordCount).toBe(validWordCount);
    });
  });
});
```

## Feature Module Structure

Follow feature-based architecture in `src/features/`:

```
src/features/feature-name/
├── types/                    # Domain entities, value objects, DTOs
├── services/                 # Domain services, application services
├── components/              # React components (UI layer)
├── hooks/                   # Custom React hooks
├── index.ts                 # Public exports
└── [feature-name].test.ts   # Feature tests
```

## Best Practices Summary

### DO:

✓ Model domain concepts as rich entities ✓ Use value objects for immutable
concepts ✓ Define aggregate boundaries clearly ✓ Enforce invariants in domain
layer ✓ Use repository interfaces for persistence ✓ Emit domain events for state
changes ✓ Keep domain layer pure (no infrastructure)

### DON'T:

✗ Create anemic domain models ✗ Put business logic in components ✗ Leak
infrastructure into domain ✗ Create god aggregates ✗ Mix domain and application
logic ✗ Use concrete database types in domain ✗ Allow invalid state in entities

## Quick Reference: File Locations

- **Domain types**: `src/features/*/types/`
- **Domain services**: `src/features/*/services/`
- **Repository interfaces**: `src/features/*/types/` or
  `src/lib/*/repositories/`
- **Repository implementations**: `src/lib/database/repositories/`

---

Apply domain-driven design to keep business logic clean, testable, and
independent of infrastructure.
