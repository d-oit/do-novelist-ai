# Interface Design

API and interface design principles for clean architecture.

## Interface Segregation

### Principle

Clients should not depend on interfaces they don't use.

**Bad Example - Too Large**:

```typescript
// ❌ Violation - Clients forced to use methods they don't need
export interface Repository {
  create<T>(entity: T): Promise<T>;
  read<T>(id: string): Promise<T>;
  update<T>(entity: T): Promise<void>;
  delete(id: string): Promise<void>;
  query<T>(filter: Filter): Promise<T[]>;
  findByIds<T>(ids: string[]): Promise<T[]>;
  count<T>(filter: Filter): Promise<number>;
  // ... more methods
}
```

**Good Example - Focused**:

```typescript
// ✅ Compliance - Each interface has single responsibility
export interface ChapterReader {
  findById(id: string): Promise<Chapter | null>;
  findByProjectId(projectId: string): Promise<Chapter[]>;
}

export interface ChapterWriter {
  save(chapter: Chapter): Promise<void>;
  delete(id: string): Promise<void>;
}
```

### Interface Definition Guidelines

**Rules**:

- Keep interfaces small and focused
- Define methods by what they do, not how
- Use descriptive names
- Group related methods
- Prefer reader/writer pattern for CQRS

## Repository Interface Pattern

### Standard Repository Interface

```typescript
export interface Repository<T, ID = string> {
  // Read operations
  findById(id: ID): Promise<T | null>;
  findAll(filter?: QueryFilter): Promise<T[]>;

  // Write operations
  create(entity: Omit<ID, T>): Promise<T>;
  update(id: ID, updates: Partial<Omit<ID, T>>): Promise<void>;
  delete(id: ID): Promise<void>;

  // Query operations
  exists(id: ID): Promise<boolean>;
  count(filter?: QueryFilter): Promise<number>;
}

export interface QueryFilter {
  equals?: Record<string, unknown>;
  contains?: Record<string, unknown>;
  greaterThan?: Record<string, number>;
  lessThan?: Record<string, number>;
}
```

### Specialized Repository Example

```typescript
// Domain layer
export interface ChapterRepository extends Repository<Chapter, string> {
  findByProjectId(projectId: string): Promise<Chapter[]>;
  findByDateRange(start: Date, end: Date): Promise<Chapter[]>;
  findByWordCountRange(min: number, max: number): Promise<Chapter[]>;
}

export interface CharacterRepository extends Repository<Character, string> {
  findByProjectId(projectId: string): Promise<Character[]>;
  searchByName(query: string): Promise<Character[]>;
}
```

## Service Interface Pattern

### Service Interface Definition

```typescript
export interface Service<TInput, TOutput, TError = Error> {
  execute(input: TInput): Promise<ServiceResult<TOutput, TError>>;
}

export interface ServiceResult<TData, TError> {
  data: TData;
  error: TError | null;
  isSuccess: boolean;
}
```

### Example Application Service

```typescript
// Interface
export interface IChapterService {
  createChapter(dto: CreateChapterDTO): Promise<ServiceResult<Chapter, Error>>;
  getChapter(id: string): Promise<ServiceResult<Chapter, Error>>;
  updateChapter(
    id: string,
    dto: UpdateChapterDTO,
  ): Promise<ServiceResult<Chapter, Error>>;
  deleteChapter(id: string): Promise<ServiceResult<void, Error>>;
}

// Implementation
export class ChapterService implements IChapterService {
  constructor(
    private chapterRepository: ChapterRepository,
    private eventBus: EventBus,
  ) {}

  async createChapter(
    dto: CreateChapterDTO,
  ): Promise<ServiceResult<Chapter, Error>> {
    try {
      const chapter = Chapter.fromDTO(dto);
      await this.chapterRepository.save(chapter);
      this.eventBus.publish(new ChapterCreatedEvent(chapter.id));

      return {
        data: chapter,
        error: null,
        isSuccess: true,
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        isSuccess: false,
      };
    }
  }
}
```

## DTO Pattern

### DTO Definition

```typescript
// DTO for API boundaries
export interface CreateChapterDTO {
  projectId: string;
  title: string;
  content: string;
}

export interface ChapterDTO {
  id: string;
  projectId: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChapterViewModel {
  id: string;
  title: string;
  wordCount: number;
  lastModified: string;
}
```

### Domain to DTO Transformation

```typescript
// Domain entity
export class Chapter {
  constructor(
    private id: string,
    private projectId: string,
    private title: string,
    private content: string,
  ) {}

  toDTO(): ChapterDTO {
    return {
      id: this.id,
      projectId: this.projectId,
      title: this.title,
      content: this.content,
      createdAt: new Date(), // Set current date
      updatedAt: new Date(),
    };
  }

  toViewModel(): ChapterViewModel {
    return {
      id: this.id,
      title: this.title,
      wordCount: this.content.split(/\s+/).length,
      lastModified: `${new Date().toLocaleDateString()}`,
    };
  }

  static fromDTO(dto: ChapterDTO): Chapter {
    return new Chapter(dto.id, dto.projectId, dto.title, dto.content);
  }
}
```

## Event Interface Pattern

### Domain Event Interface

```typescript
export interface DomainEvent {
  readonly eventType: string;
  readonly timestamp: Date;
}

export interface ChapterEvent extends DomainEvent {
  chapterId: string;
}

export interface ProjectEvent extends DomainEvent {
  projectId: string;
}
```

### Event Types

```typescript
export class ChapterCreatedEvent implements ChapterEvent {
  readonly eventType = 'ChapterCreated';
  constructor(
    public readonly chapterId: string,
    public readonly projectId: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}

export class ChapterDeletedEvent implements ChapterEvent {
  readonly eventType = 'ChapterDeleted';
  constructor(
    public readonly chapterId: string,
    public readonly projectId: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}

export class ChapterUpdatedEvent implements ChapterEvent {
  readonly eventType = 'ChapterUpdated';
  constructor(
    public readonly chapterId: string,
    public readonly changes: string[],
    public readonly projectId: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
```

## Event Handler Interface

```typescript
export interface EventHandler<TEvent extends DomainEvent> {
  canHandle(event: DomainEvent): event is TEvent;
  handle(event: TEvent): Promise<void>;
}

export class ChapterCreatedHandler implements EventHandler<ChapterCreatedEvent> {
  canHandle(event: DomainEvent): event is ChapterCreatedEvent {
    return event.eventType === 'ChapterCreated';
  }

  async handle(event: ChapterCreatedEvent): Promise<void> {
    await analyticsService.trackChapterCreated(event.chapterId);
    await notificationService.notifyUsers(event.projectId);
  }
}
```

## API Response Interface

```typescript
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}
```

## Interface Best Practices

### DO

```typescript
// ✅ Use descriptive names
export interface ChapterRepository {
  findById(id: string): Promise<Chapter | null>;
}

// ✅ Keep interfaces focused
export interface ChapterReader {
  findById(id: string): Promise<Chapter | null>;
}

export interface ChapterWriter {
  save(chapter: Chapter): Promise<void>;
  delete(id: string): Promise<void>;
}

// ✅ Use generic types with constraints
export interface Repository<T, ID = string> {
  findById(id: ID): Promise<T | null>;
  create(entity: Omit<ID, T>): Promise<T>;
}

// ✅ Define DTOs for layer boundaries
export interface CreateChapterDTO { ... }
export interface ChapterViewModel { ... }

// ✅ Use domain events
export interface DomainEvent {
  readonly eventType: string;
  readonly timestamp: Date;
}

// ✅ Type service results
export interface ServiceResult<TData, TError> {
  data: TData;
  error: TError | null;
  isSuccess: boolean;
}
```

### DON'T

```typescript
// ✗ Create too large interfaces
export interface ChapterService {
  create(): Promise<Chapter>;
  read(): Promise<Chapter>;
  update(): Promise<void>;
  delete(): Promise<void>;
  export(): Promise<string>;
  import(): Promise<string>;
  validate(): Promise<boolean>;
  query(): Promise<Chapter[]>;
  // ... 50 more methods
}

// ✗ Use vague names
export interface Service1 {
  do(data: unknown): Promise<unknown>;
}

// ✗ Mix responsibilities
export interface UserChapterRepository {
  // Domain methods
  findById(id: string): Promise<Chapter | null>;

  // App infrastructure methods
  sendEmail(chapterId: string): Promise<void>;
  notifyUsers(chapterId: string): Promise<void>;
}

// ✗ Use 'any' in interfaces
export interface Repository {
  findById(id: string): Promise<any>;
  save(entity: any): Promise<void>;
}
```

## Interface Documentation

### Documenting Interfaces

```typescript
/**
 * Repository interface for managing Chapter entities.
 *
 * @template T - The entity type
 * @template ID - The ID type (defaults to string)
 */
export interface ChapterRepository extends Repository<Chapter> {
  /**
   * Find a chapter by its ID.
   *
   * @param id - The chapter ID
   * @returns The chapter if found, null otherwise
   */
  findById(id: string): Promise<Chapter | null>;

  /**
   * Find all chapters for a project.
   *
   * @param projectId - The project ID
   * @returns Array of chapters
   */
  findByProjectId(projectId: string): Promise<Chapter[]>;
}
```

---

Design focused interfaces following SOLID principles for maintainable code.
