# Repository Pattern Design

**Created**: 2026-01-16 **Status**: Design Complete **Phase**: 3A - Repository
Pattern Design

---

## Executive Summary

This document outlines the design and implementation strategy for a Repository
Pattern layer in Novelist.ai. The repository pattern provides a clean separation
between business logic and data access, improving testability, maintainability,
and code organization.

---

## Current Architecture Issues

### Problems with Current Approach

1. **Tight Coupling**: Services directly call `drizzleDbService`, mixing
   business logic with data access
2. **Difficult Testing**: Testing services requires mocking Drizzle ORM
   internals
3. **Code Duplication**: Similar CRUD operations repeated across services
4. **Limited Abstraction**: No clear boundary between business and data layers
5. **Inconsistent Error Handling**: Different error handling patterns across
   services

### Example of Current Approach

```typescript
// src/features/projects/services/projectService.ts
class ProjectService {
  public async create(data: ProjectCreationData): Promise<Project> {
    // Business logic mixed with data access
    const project: Project = {
      /* ... */
    };
    await drizzleDbService.saveProject(project); // Direct Drizzle call
    semanticSyncService.syncProject(projectId, project).catch(error => {
      logger.warn('Failed to sync project embedding', { error });
    });
    return project;
  }
}
```

---

## Proposed Repository Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│  (React Components, Hooks, UI Logic)                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                            │
│  (Business Logic, Orchestration, Domain Rules)             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Repository Layer                           │
│  (Data Access Abstraction, Queries, Mappers)                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   IRepository<TEntity> (Generic Interface)           │  │
│  │   - findById, findAll, create, update, delete       │  │
│  │   - transaction, exists, count                      │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────┬──────────────┬──────────────┬────────┐ │
│  │ ProjectRepo  │ ChapterRepo  │ CharacterRepo│ PlotRepo│ │
│  │ (Project)    │ (Chapter)    │ (Character)  │ (Plot)  │ │
│  └──────────────┴──────────────┴──────────────┴────────┘ │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   Data Access Layer                         │
│  (Drizzle ORM, Database Schema, SQL Queries)               │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Principles

1. **Interface-Based Design**: All repositories implement typed interfaces
2. **Generic Base Interface**: Common CRUD operations defined once
3. **Entity-Specific Extensions**: Each entity adds domain-specific query
   methods
4. **Type Safety**: Leverage TypeScript generics and Drizzle type inference
5. **Error Handling**: Consistent error handling with custom `RepositoryError`
   type
6. **Transaction Support**: Built-in transaction support for complex operations

---

## Interface Design

### 1. Generic Repository Interface

**File**: `src/lib/repositories/interfaces/IRepository.ts`

```typescript
export interface IRepository<TEntity, TID = string> {
  // CRUD Operations
  findById(id: TID): Promise<TEntity | null>;
  findAll(): Promise<TEntity[]>;
  findWhere(predicate: (entity: TEntity) => boolean): Promise<TEntity[]>;
  create(entity: Omit<TEntity, 'id'>): Promise<TEntity>;
  update(id: TID, data: Partial<TEntity>): Promise<TEntity | null>;
  delete(id: TID): Promise<boolean>;

  // Utility Methods
  exists(id: TID): Promise<boolean>;
  count(): Promise<number>;

  // Transactions
  transaction<T>(operations: () => Promise<T>): Promise<T>;
}
```

**Features**:

- Generic for any entity type
- Optional ID type parameter (defaults to string)
- Type-safe CRUD operations
- Built-in transaction support

### 2. Entity-Specific Interfaces

#### Project Repository

**File**: `src/lib/repositories/interfaces/IProjectRepository.ts`

```typescript
export interface IProjectRepository extends IRepository<Project> {
  findByStatus(status: PublishStatus): Promise<Project[]>;
  findByStyle(style: Project['style']): Promise<Project[]>;
  findByLanguage(language: Project['language']): Promise<Project[]>;
  findByQuery(options: ProjectQueryOptions): Promise<Project[]>;
  getSummaries(): Promise<ProjectSummary[]>;
  getStats(): Promise<ProjectStats>;
  titleExists(title: string, excludeId?: string): Promise<boolean>;
}
```

**Key Features**:

- Domain-specific queries (by status, style, language)
- Complex query builder (multiple criteria)
- Summary queries (lightweight data for lists)
- Statistics aggregation
- Uniqueness validation

#### Chapter Repository

**File**: `src/lib/repositories/interfaces/IChapterRepository.ts`

```typescript
export interface IChapterRepository extends IRepository<Chapter> {
  findByProjectId(projectId: string): Promise<Chapter[]>;
  findByStatus(status: ChapterStatus): Promise<Chapter[]>;
  findByProjectIdAndStatus(
    projectId: string,
    status: ChapterStatus,
  ): Promise<Chapter[]>;
  findByOrderIndex(
    projectId: string,
    orderIndex: number,
  ): Promise<Chapter | null>;
  getNextChapter(
    projectId: string,
    currentOrderIndex: number,
  ): Promise<Chapter | null>;
  getPreviousChapter(
    projectId: string,
    currentOrderIndex: number,
  ): Promise<Chapter | null>;
  reorderChapters(projectId: string, chapterIds: string[]): Promise<Chapter[]>;
  countByProject(projectId: string): Promise<number>;
  getTotalWordCount(projectId: string): Promise<number>;
  bulkUpdateOrder(
    chapters: Array<{ id: string; orderIndex: number }>,
  ): Promise<Chapter[]>;
}
```

**Key Features**:

- Project-scoped queries
- Navigation queries (next/previous)
- Bulk operations (reordering)
- Aggregations (count, word count)

#### Character Repository

**File**: `src/lib/repositories/interfaces/ICharacterRepository.ts`

```typescript
export interface ICharacterRepository extends IRepository<Character> {
  findByProjectId(projectId: string): Promise<Character[]>;
  findByRole(role: Character['role']): Promise<Character[]>;
  findByProjectIdAndRole(
    projectId: string,
    role: Character['role'],
  ): Promise<Character[]>;
  findByOccupation(occupation: string): Promise<Character[]>;
  findByAgeRange(minAge: number, maxAge: number): Promise<Character[]>;
  search(projectId: string, query: string): Promise<Character[]>;
  findByQuery(options: CharacterQueryOptions): Promise<Character[]>;
  getRelationships(characterId: string): Promise<CharacterRelationship[]>;
  findRelationshipBetween(
    characterAId: string,
    characterBId: string,
  ): Promise<CharacterRelationship | null>;
  findRelationshipsByProject(
    projectId: string,
    options?: CharacterRelationshipQueryOptions,
  ): Promise<CharacterRelationship[]>;
  createRelationship(
    relationship: CharacterRelationship,
  ): Promise<CharacterRelationship>;
  updateRelationship(
    id: string,
    data: Partial<CharacterRelationship>,
  ): Promise<CharacterRelationship | null>;
  deleteRelationship(id: string): Promise<boolean>;
  countByProject(projectId: string): Promise<number>;
  countByProjectAndRole(
    projectId: string,
    role: Character['role'],
  ): Promise<number>;
}
```

**Key Features**:

- Character-specific filters (role, occupation, age range)
- Full-text search (name, description)
- Relationship management (CRUD)
- Aggregations by role

#### Plot Repository

**File**: `src/lib/repositories/interfaces/IPlotRepository.ts`

```typescript
export interface IPlotRepository {
  // Plot Structures
  savePlotStructure(structure: PlotStructure): Promise<void>;
  getPlotStructure(id: string): Promise<PlotStructure | null>;
  getPlotStructuresByProject(projectId: string): Promise<PlotStructure[]>;
  deletePlotStructure(id: string): Promise<void>;

  // Plot Holes
  savePlotHoles(projectId: string, holes: PlotHole[]): Promise<void>;
  getPlotHolesByProject(
    projectId: string,
    options?: PlotHoleQueryOptions,
  ): Promise<PlotHole[]>;
  getPlotHolesBySeverity(
    projectId: string,
    severity: PlotHoleSeverity,
  ): Promise<PlotHole[]>;
  getPlotHolesByType(
    projectId: string,
    type: PlotHoleType,
  ): Promise<PlotHole[]>;
  getPlotHolesByChapters(
    projectId: string,
    chapterIds: string[],
  ): Promise<PlotHole[]>;
  getPlotHolesByCharacters(
    projectId: string,
    characterIds: string[],
  ): Promise<PlotHole[]>;

  // Character Graphs
  saveCharacterGraph(graph: CharacterGraph): Promise<void>;
  getCharacterGraphByProject(projectId: string): Promise<CharacterGraph | null>;
  deleteCharacterGraph(projectId: string): Promise<void>;

  // Analysis Results (Cached)
  saveAnalysisResult<T>(
    projectId: string,
    analysisType: string,
    resultData: T,
    config?: AnalysisCacheConfig,
  ): Promise<void>;
  getAnalysisResult<T>(
    projectId: string,
    analysisType: string,
  ): Promise<T | null>;
  saveStoryArc(
    projectId: string,
    storyArc: StoryArc,
    config?: AnalysisCacheConfig,
  ): Promise<void>;
  getStoryArc(projectId: string): Promise<StoryArc | null>;
  cleanupExpiredAnalysis(): Promise<number>;

  // Plot Suggestions
  savePlotSuggestions(
    projectId: string,
    suggestions: PlotSuggestion[],
  ): Promise<void>;
  getPlotSuggestionsByProject(
    projectId: string,
    options?: PlotSuggestionQueryOptions,
  ): Promise<PlotSuggestion[]>;
  getPlotSuggestionsByType(
    projectId: string,
    type: PlotSuggestionType,
  ): Promise<PlotSuggestion[]>;
  getPlotSuggestionsByImpact(
    projectId: string,
    impact: PlotSuggestion['impact'],
  ): Promise<PlotSuggestion[]>;
  getPlotSuggestionsByCharacters(
    projectId: string,
    characterIds: string[],
  ): Promise<PlotSuggestion[]>;

  // Bulk Operations
  deleteProjectData(projectId: string): Promise<void>;
  exportProjectData(projectId: string): Promise<ExportData>;
  importProjectData(projectId: string, data: ImportData): Promise<void>;
}
```

**Key Features**:

- Multi-entity management (structures, holes, graphs, suggestions)
- Cached analysis results with TTL
- Bulk operations (export/import, cleanup)
- Complex filtering (by severity, type, chapters, characters)

---

## Implementation Strategy

### Phase 1: Core Infrastructure (30 minutes)

1. **Create base repository class**
   - Abstract class implementing `IRepository`
   - Common error handling
   - Transaction management
   - Logging integration

2. **Create repository factory**
   - Dependency injection setup
   - Singleton instances
   - Type-safe constructors

### Phase 2: Implement Repositories (120 minutes)

**Order of Implementation**:

1. **ProjectRepository** (30 min)
   - Implement all CRUD methods
   - Add query methods
   - Add aggregation methods
   - Write unit tests

2. **ChapterRepository** (30 min)
   - Implement all CRUD methods
   - Add navigation queries
   - Add bulk operations
   - Write unit tests

3. **CharacterRepository** (30 min)
   - Implement all CRUD methods
   - Add relationship management
   - Add search functionality
   - Write unit tests

4. **PlotRepository** (30 min)
   - Implement all entity methods
   - Add caching layer
   - Add bulk operations
   - Write unit tests

### Phase 3: Service Refactoring (180 minutes)

**Migration Strategy**:

1. **Parallel Approach**
   - Create new service methods using repositories
   - Keep old methods for fallback
   - Gradually migrate call sites

2. **Example Migration**:

```typescript
// OLD CODE
class ProjectService {
  public async create(data: ProjectCreationData): Promise<Project> {
    const project: Project = {
      /* ... */
    };
    await drizzleDbService.saveProject(project);
    return project;
  }
}

// NEW CODE
class ProjectService {
  constructor(private projectRepository: IProjectRepository) {}

  public async create(data: ProjectCreationData): Promise<Project> {
    const project: Project = {
      /* ... */
    };
    const created = await this.projectRepository.create(project);
    return created;
  }
}
```

3. **Test Updates**
   - Mock repositories instead of Drizzle
   - Focus on business logic testing
   - Remove database coupling

---

## Error Handling

### Error Type Hierarchy

```typescript
export class RepositoryError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly originalError?: unknown,
  ) {
    super(message);
    this.name = 'RepositoryError';
  }
}

export class NotFoundError extends RepositoryError {
  constructor(entity: string, id: string) {
    super(`${entity} with id ${id} not found`, 'NOT_FOUND');
  }
}

export class ConflictError extends RepositoryError {
  constructor(message: string) {
    super(message, 'CONFLICT');
  }
}

export class ValidationError extends RepositoryError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
  }
}

export class DatabaseError extends RepositoryError {
  constructor(message: string, originalError?: unknown) {
    super(message, 'DATABASE_ERROR', originalError);
  }
}
```

### Error Handling Pattern

```typescript
export abstract class BaseRepository<TEntity> implements IRepository<TEntity> {
  protected handleError(error: unknown, operation: string): never {
    if (error instanceof RepositoryError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.message.includes('UNIQUE constraint')) {
        throw new ConflictError('Resource already exists');
      }
      if (error.message.includes('not found')) {
        throw new NotFoundError(this.entityName, 'unknown');
      }
    }

    throw new DatabaseError(`${this.entityName} ${operation} failed`, error);
  }
}
```

---

## Testing Strategy

### Unit Tests

**Test Scope**:

- Repository method behavior
- Error handling
- Edge cases
- Mapping between domain and database entities

**Example Test**:

```typescript
describe('ProjectRepository', () => {
  let mockDb: MockDatabase;
  let repository: ProjectRepository;

  beforeEach(() => {
    mockDb = createMockDatabase();
    repository = new ProjectRepository(mockDb);
  });

  describe('findById', () => {
    it('should return project when found', async () => {
      const project = createMockProject();
      mockDb.projects.findOne.mockResolvedValue(project);

      const result = await repository.findById(project.id);

      expect(result).toEqual(project);
      expect(mockDb.projects.findOne).toHaveBeenCalledWith(project.id);
    });

    it('should return null when not found', async () => {
      mockDb.projects.findOne.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });

    it('should throw DatabaseError on database failure', async () => {
      mockDb.projects.findOne.mockRejectedValue(new Error('Connection lost'));

      await expect(repository.findById('test-id')).rejects.toThrow(
        DatabaseError,
      );
    });
  });
});
```

### Integration Tests

**Test Scope**:

- End-to-end repository operations
- Transaction behavior
- Complex queries
- Database constraints

**Example Test**:

```typescript
describe('ProjectRepository Integration', () => {
  let db: DrizzleClient;
  let repository: ProjectRepository;

  beforeAll(async () => {
    db = await createTestDatabase();
    repository = new ProjectRepository(db);
  });

  afterAll(async () => {
    await cleanupTestDatabase(db);
  });

  it('should create and retrieve project', async () => {
    const projectData: Omit<Project, 'id'> = {
      /* ... */
    };

    const created = await repository.create(projectData);
    const retrieved = await repository.findById(created.id);

    expect(retrieved).toEqual(created);
  });

  it('should maintain transaction integrity', async () => {
    await expect(
      repository.transaction(async () => {
        await repository.create(projectData1);
        await repository.create(projectData2);
        throw new Error('Rollback');
      }),
    ).rejects.toThrow();

    const projects = await repository.findAll();
    expect(projects).toHaveLength(0);
  });
});
```

---

## Quality Gates

### Before Implementation

- [ ] Interfaces compiled without errors
- [ ] Drizzle schemas defined for all entities
- [ ] Type definitions imported correctly

### After Each Repository

- [ ] Lint: 0 errors, 0 warnings
- [ ] Tests: All passing with ≥80% coverage
- [ ] TypeScript: Strict mode compliance
- [ ] Build: Success

### After Refactoring

- [ ] All services using repositories
- [ ] All tests passing (unit + integration)
- [ ] No breaking changes to public APIs
- [ ] Performance maintained or improved

---

## Migration Path

### Step-by-Step Migration

1. **Week 1: Repository Implementation**
   - Implement all repositories
   - Write comprehensive tests
   - Verify quality gates

2. **Week 2: Service Refactoring (Non-Critical Services)**
   - Refactor `characterService.ts`
   - Refactor `plotStorageService.ts`
   - Update tests
   - Verify functionality

3. **Week 3: Service Refactoring (Critical Services)**
   - Refactor `projectService.ts`
   - Refactor `chapterService.ts` (if exists)
   - Update tests
   - Verify functionality

4. **Week 4: Cleanup and Optimization**
   - Remove old `drizzleDbService` (if unused)
   - Add performance optimizations
   - Documentation updates
   - Final verification

### Rollback Plan

If issues arise during migration:

1. **Instant Rollback**: Keep old services as fallback
2. **Gradual Rollback**: Revert one service at a time
3. **Data Safety**: Database schema remains unchanged

---

## Benefits

### Immediate Benefits

1. **Separation of Concerns**: Clear boundaries between layers
2. **Testability**: Easy to mock repositories for unit tests
3. **Code Reuse**: Common operations defined once
4. **Type Safety**: Full TypeScript type safety

### Long-Term Benefits

1. **Maintainability**: Easier to modify data access logic
2. **Scalability**: Add new repositories easily
3. **Flexibility**: Switch database implementations without changing business
   logic
4. **Performance**: Optimize queries in one place

---

## Future Enhancements

### Phase 2: Advanced Features

1. **Caching Layer**: Add Redis/memory cache for frequent queries
2. **Query Builder**: Fluent query API for complex queries
3. **Auditing**: Track all data changes with audit logs
4. **Soft Deletes**: Implement soft delete with trash bin

### Phase 3: Integration

1. **Dependency Injection Container**: Full DI implementation
2. **Event Sourcing**: Domain events for cross-cutting concerns
3. **Read Models**: CQRS pattern for read/write separation

---

## Appendix: Code Examples

### Example: Base Repository Implementation

```typescript
export abstract class BaseRepository<
  TEntity,
  TID = string,
> implements IRepository<TEntity, TID> {
  protected abstract tableName: string;
  protected abstract entityName: string;

  constructor(protected db: DrizzleClient) {}

  async findById(id: TID): Promise<TEntity | null> {
    try {
      const result = await this.db
        .select()
        .from(this.table)
        .where(eq(this.table.id, id as string))
        .limit(1);

      return result[0] ?? null;
    } catch (error) {
      this.handleError(error, 'findById');
    }
  }

  async create(data: Omit<TEntity, 'id'>): Promise<TEntity> {
    try {
      const id = crypto.randomUUID();
      const entity = { ...data, id } as TEntity;

      await this.db.insert(this.table).values(entity);

      return entity;
    } catch (error) {
      this.handleError(error, 'create');
    }
  }

  protected handleError(error: unknown, operation: string): never {
    if (error instanceof RepositoryError) {
      throw error;
    }

    throw new DatabaseError(`${this.entityName} ${operation} failed`, error);
  }
}
```

### Example: Project Repository Implementation

```typescript
export class ProjectRepository extends BaseRepository<Project> {
  protected tableName = schema.projects;
  protected entityName = 'Project';

  async findByStatus(status: PublishStatus): Promise<Project[]> {
    try {
      const results = await this.db
        .select()
        .from(this.tableName)
        .where(eq(this.tableName.status, status));

      return results.map(row => this.mapToEntity(row));
    } catch (error) {
      this.handleError(error, 'findByStatus');
    }
  }

  async getSummaries(): Promise<ProjectSummary[]> {
    try {
      const results = await this.db
        .select({
          id: this.tableName.id,
          title: this.tableName.title,
          style: this.tableName.style,
          status: this.tableName.status,
          language: this.tableName.language,
          targetWordCount: this.tableName.targetWordCount,
          updatedAt: this.tableName.updatedAt,
          coverImage: this.tableName.coverImage,
        })
        .from(this.tableName);

      return results;
    } catch (error) {
      this.handleError(error, 'getSummaries');
    }
  }

  private mapToEntity(row: typeof schema.projects.$inferSelect): Project {
    return {
      id: row.id,
      title: row.title,
      // ... map all fields
      chapters: [], // Load separately
    };
  }
}
```

---

**Status**: ✅ Design Complete **Next Step**: Begin Phase 3B - Repository
Implementation **Estimated Time**: 120 minutes for implementation, 180 minutes
for refactoring
