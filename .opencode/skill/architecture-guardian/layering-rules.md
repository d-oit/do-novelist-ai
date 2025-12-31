# Layering Rules

Strict layer separation rules and enforcement guidelines.

## Layer Separation Rules

### Rule 1: Upward Dependency Flow Only

Dependencies must only flow from lower to higher layers:

```
Infrastructure → Domain → Application → Presentation
```

**Allowed Dependencies**:

```
Infrastructure implements Domain interfaces
Domain used by Application
Application called by Presentation
```

**Prohibited Dependencies**:

```
❌ Domain depends on Infrastructure
❌ Application depends on Infrastructure
❌ Presentation depends on Domain (use DTOs)
❌ Infrastructure depends on Application
```

### Rule 2: No Cross-Layer Logic

Each layer must contain only its own concerns:

**Presentation Layer**:

- UI components only
- User interaction handling
- Display formatting
- ❌ No business logic

**Application Layer**:

- Orchestration only
- Coordination between layers
- DTO transformations
- ❌ No direct infrastructure access

**Domain Layer**:

- Business logic only
- Entity validation
- Invariant enforcement
- ❌ No UI code
- ❌ No database/IO code

**Infrastructure Layer**:

- Technical implementation only
- Data persistence
- External API calls
- ❌ No business rules

### Rule 3: Interface-Based Boundaries

Layer transitions must use interfaces, not concrete implementations:

**Domain Layer Definitions**:

```typescript
// Repository interfaces defined in Domain
export interface ChapterRepository {
  findById(id: string): Promise<Chapter | null>;
  save(chapter: Chapter): Promise<void>;
}
```

**Infrastructure Layer Implementations**:

```typescript
// Infrastructure implements Domain interfaces
export class TursoChapterRepository implements ChapterRepository {
  // Implementation
}
```

**Application Layer Usage**:

```typescript
// Application depends on Domain interfaces
export class ChapterService {
  constructor(
    private chapterRepository: ChapterRepository, // Interface
  ) {}
}
```

## Layer Violation Detection

### Common Violations

**Violation 1: Domain depends on Infrastructure**

```typescript
// ❌ Violation
class ChapterService {
  constructor(private db: TursoDatabase) {} // Direct DB in Domain layer
}

// ✅ Correction
interface ChapterRepository {
  findById(id: string): Promise<Chapter | null>;
}

class ChapterService {
  constructor(private chapterRepository: ChapterRepository) {}
}
```

**Violation 2: Business Logic in Wrong Layer**

```typescript
// ❌ Violation - Business logic in Infrastructure
class ChapterRepository {
  async save(chapter: Chapter): Promise<void> {
    if (chapter.wordCount < 100) {
      throw new Error('Too short'); // Business rule!
    }
  }
}

// ✅ Correction - Business logic in Domain
class Chapter {
  constructor(...) {
    if (this.wordCount < 100) {
      throw new ValidationError('Too short');
    }
  }
}
```

**Violation 3: Circular Dependencies**

```typescript
// ❌ Violation
// feature-a/services/service-a.ts
import { ServiceB } from '../feature-b/services/service-b';

// feature-b/services/service-b.ts
import { ServiceA } from '../feature-a/services/service-a';
```

**✅ Correction** - Use events or shared interfaces

```
// feature-a/events.ts
export class ProjectCreatedEvent {
  constructor(public readonly projectId: string) {}
}

// feature-b/services/service-b.ts
// No direct dependency, listen to events instead
```

## Layer Transition Patterns

### Presentation → Application

```typescript
// React component (presentation)
export function ChapterForm({ projectId }: { projectId: string }) {
  const [title, setTitle] = useState('');

  // Call application service
  const { createChapter, isSaving } = useChapterService();

  const handleSubmit = async () => {
    await createChapter({ projectId, title, content: '' });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* UI only */}
    </form>
  );
}
```

### Application → Domain

```typescript
// Application service (orchestration)
export class ChapterService {
  async createChapter(dto: CreateChapterDTO): Promise<Chapter> {
    // Transform DTO to domain entity
    const chapter = Chapter.fromDTO(dto);

    // Apply business logic
    chapter.validateContent();

    // Persist through repository interface
    await this.chapterRepository.save(chapter);

    // Emit domain event
    this.eventBus.publish(new ChapterCreatedEvent(chapter.id));

    return chapter;
  }
}
```

### Domain → Infrastructure

```typescript
// Domain entity (business logic)
export class Chapter {
  // ... business logic
}

// Infrastructure implementation (persistence)
export class TursoChapterRepository implements ChapterRepository {
  async save(chapter: Chapter): Promise<void> {
    // Convert domain entity to database row
    const row = {
      id: chapter.id,
      project_id: chapter.projectId,
      title: chapter.title,
      content: chapter.content,
      word_count: chapter.wordCount,
    };

    await this.db.execute(
      'INSERT INTO chapters (...) VALUES (...)',
      Object.values(row),
    );
  }
}
```

## Quick Reference

### Dependency Rules by Layer

| From → To                    | Allowed? | Example                         |
| ---------------------------- | -------- | ------------------------------- |
| Presentation → Application   | ✅       | `useService()` hooks            |
| Presentation → Domain        | ❌       | Use DTOs instead                |
| Application → Domain         | ✅       | Direct domain usage             |
| Application → Infrastructure | ❌       | Use repository interfaces       |
| Domain → Application         | ❌       | Use events for communication    |
| Domain → Infrastructure      | ❌       | Domain defines interfaces only  |
| Infrastructure → Domain      | ✅       | Implement repository interfaces |
| Infrastructure → Application | ❌       | No upward dependencies          |

## Layer Enforcement Checklist

### Code Review Checklist

- [ ] All dependencies flow upward only
- [ ] No circular dependencies
- [ ] Business logic in correct layer
- [ ] Repository interfaces defined in Domain
- [ ] Infrastructure implements Domain interfaces
- [ ] DTOs used for layer transitions
- [ ] Events used for cross-layer communication
- [ ] Each layer has single responsibility

### Refactoring Checklist

- [ ] Can replace any layer implementation independently?
- [ ] Are interfaces properly defined?
- [ ] Is circular coupling removed?
- [ ] Are boundaries clearly defined?

---

Maintain strict layer separation for maintainable, testable architecture.
