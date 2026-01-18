# Phase 3: Repository Pattern Design

## Overview

Phase 3 focuses on implementing a robust **Repository Pattern** to abstract data
access, improve testability, and enforce clean separation between business logic
and data persistence.

## Goals

1. **Design Repository Layer Architecture**
   - Define repository interfaces
   - Create base repository abstractions
   - Establish repository patterns for different data types

2. **Implement Base Repository**
   - Abstract common CRUD operations
   - Define transaction handling
   - Implement caching strategies

3. **Create Feature-Specific Repositories**
   - Project repositories
   - Character repositories
   - Plot repositories
   - Analytics repositories

4. **Refactor Services to Use Repositories**
   - Migrate data access logic
   - Update dependency injection
   - Ensure backward compatibility

## Current State Analysis

### Existing Data Access Patterns

#### Direct Database Access (Current Pattern)

```typescript
// Current implementation in services
import { db } from '@/lib/db';

export const projectService = {
  async getProject(id: string): Promise<Project | null> {
    return await db.query.projects.findFirst({
      where: eq(projects.id, id),
    });
  },
};
```

#### Issues with Current Approach

- Services are tightly coupled to Drizzle ORM
- Difficult to mock in tests
- No abstraction layer for switching storage backends
- Data access logic scattered across services
- No consistent caching strategy

### Target Repository Pattern

#### Proposed Structure

```
src/
├── lib/
│   ├── repositories/
│   │   ├── base/
│   │   │   ├── BaseRepository.ts
│   │   │   ├── IRepository.ts
│   │   │   └── types.ts
│   │   ├── projects/
│   │   │   ├── ProjectRepository.ts
│   │   │   ├── IProjectRepository.ts
│   │   │   └── index.ts
│   │   ├── characters/
│   │   ├── plot/
│   │   ├── analytics/
│   │   └── index.ts
│   └── db/
│       └── schema.ts
└── features/
    └── [feature]/
        ├── services/
        │   └── projectService.ts (refactored to use repositories)
```

## Design Principles

### 1. Dependency Inversion

```typescript
// Services depend on abstractions, not implementations
class ProjectService {
  constructor(private projectRepo: IProjectRepository) {}
}
```

### 2. Single Responsibility

- Repositories handle data access only
- Services handle business logic only
- No mixing of concerns

### 3. Interface Segregation

```typescript
// Small, focused interfaces
interface IProjectReader {
  findById(id: string): Promise<Project | null>;
  findAll(filters: ProjectFilters): Promise<Project[]>;
}

interface IProjectWriter {
  create(data: CreateProjectDTO): Promise<Project>;
  update(id: string, data: UpdateProjectDTO): Promise<Project>;
  delete(id: string): Promise<void>;
}

interface IProjectRepository extends IProjectReader, IProjectWriter {}
```

### 4. Liskov Substitution

- Any repository implementation can be substituted
- In-memory repositories for testing
- Real database implementations for production

## Base Repository Design

### Core Interface

```typescript
interface IRepository<T, ID = string> {
  // Read operations
  findById(id: ID): Promise<T | null>;
  findAll(filter?: QueryFilter): Promise<T[]>;
  exists(id: ID): Promise<boolean>;

  // Write operations
  create(data: CreateDTO<T>): Promise<T>;
  update(id: ID, data: UpdateDTO<T>): Promise<T>;
  delete(id: ID): Promise<void>;

  // Batch operations
  createMany(data: CreateDTO<T>[]): Promise<T[]>;
  updateMany(filter: QueryFilter, data: UpdateDTO<T>): Promise<number>;
  deleteMany(filter: QueryFilter): Promise<number>;

  // Transaction support
  transaction<T>(callback: (repo: this) => Promise<T>): Promise<T>;
}
```

### Base Implementation

```typescript
abstract class BaseRepository<T, ID = string> implements IRepository<T, ID> {
  protected db: typeof db;

  constructor(db: typeof db) {
    this.db = db;
  }

  abstract get tableName(): string;

  // Common implementations
  async findById(id: ID): Promise<T | null> {
    // Implementation uses db instance
  }

  // Transaction handling
  async transaction<T>(callback: (repo: this) => Promise<T>): Promise<T> {
    return await this.db.transaction(async tx => {
      const txRepo = this.withTransaction(tx);
      return await callback(txRepo);
    });
  }

  protected abstract withTransaction(tx: any): this;
}
```

## Feature-Specific Repositories

### Project Repository

```typescript
interface IProjectRepository extends IRepository<Project> {
  // Domain-specific queries
  findByAuthor(authorId: string): Promise<Project[]>;
  findByGenre(genre: string[]): Promise<Project[]>;
  findByStatus(status: PublishStatus): Promise<Project[]>;

  // Complex queries
  findWithStats(id: string): Promise<ProjectWithStats | null>;
  findRecent(limit: number): Promise<Project[]>;

  // Search
  search(query: string, filters?: ProjectSearchFilters): Promise<Project[]>;
}

class ProjectRepository extends BaseRepository<Project> {
  get tableName() {
    return 'projects';
  }

  async findByAuthor(authorId: string): Promise<Project[]> {
    // Implementation using Drizzle queries
  }

  // ... other methods
}
```

### Character Repository

```typescript
interface ICharacterRepository extends IRepository<Character> {
  findByProject(projectId: string): Promise<Character[]>;
  findByName(name: string): Promise<Character[]>;
  findRelationships(characterId: string): Promise<CharacterRelationship[]>;
  findArchetype(archetype: string): Promise<Character[]>;
}
```

### Plot Repository

```typescript
interface IPlotRepository extends IRepository<PlotNode> {
  findByProject(projectId: string): Promise<PlotNode[]>;
  findTimeline(projectId: string): Promise<PlotTimeline>;
  findArcs(projectId: string): Promise<StoryArc[]>;
  findHoles(projectId: string): Promise<PlotHole[]>;
}
```

## Dependency Injection Strategy

### Simple DI Container

```typescript
// lib/di/container.ts
import {
  IProjectRepository,
  ProjectRepository,
} from '@/lib/repositories/projects';

class DIContainer {
  private static instance: DIContainer;
  private repositories: Map<string, any> = new Map();

  static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  registerProjectRepository(repo: IProjectRepository): void {
    this.repositories.set('IProjectRepository', repo);
  }

  getProjectRepository(): IProjectRepository {
    return this.repositories.get('IProjectRepository');
  }
}
```

### Service Refactoring Example

```typescript
// Before (tight coupling)
export const projectService = {
  async getProject(id: string): Promise<Project | null> {
    return await db.query.projects.findFirst({
      where: eq(projects.id, id),
    });
  },
};

// After (loose coupling)
import type { IProjectRepository } from '@/lib/repositories/projects';

class ProjectService {
  constructor(private projectRepo: IProjectRepository) {}

  async getProject(id: string): Promise<Project | null> {
    return await this.projectRepo.findById(id);
  }

  async getProjectWithStats(id: string): Promise<ProjectWithStats | null> {
    const project = await this.projectRepo.findById(id);
    if (!project) return null;

    // Business logic remains in service
    const stats = await this.calculateStats(project);
    return { ...project, stats };
  }
}
```

## Testing Strategy

### Mock Repository for Tests

```typescript
// tests/mocks/ProjectRepository.mock.ts
class MockProjectRepository implements IProjectRepository {
  private data: Map<string, Project> = new Map();

  async findById(id: string): Promise<Project | null> {
    return this.data.get(id) || null;
  }

  async create(data: CreateProjectDTO): Promise<Project> {
    const project: Project = { id: generateId(), ...data };
    this.data.set(project.id, project);
    return project;
  }

  // Mock implementations...
}
```

### Test Example

```typescript
describe('ProjectService', () => {
  let service: ProjectService;
  let mockRepo: MockProjectRepository;

  beforeEach(() => {
    mockRepo = new MockProjectRepository();
    service = new ProjectService(mockRepo);
  });

  it('should get project by id', async () => {
    const project = await mockRepo.create({ title: 'Test' });
    const result = await service.getProject(project.id);

    expect(result).toEqual(project);
  });
});
```

## Migration Plan

### Phase 3.1: Infrastructure

- [ ] Create base repository interfaces and implementation
- [ ] Set up dependency injection container
- [ ] Create repository factory pattern

### Phase 3.2: Core Repositories

- [ ] Implement ProjectRepository
- [ ] Implement CharacterRepository
- [ ] Implement PlotRepository
- [ ] Implement AnalyticsRepository

### Phase 3.3: Service Refactoring

- [ ] Refactor project services
- [ ] Refactor character services
- [ ] Refactor plot services
- [ ] Refactor analytics services

### Phase 3.4: Testing & Validation

- [ ] Update all service tests to use mock repositories
- [ ] Validate all features work correctly
- [ ] Performance testing

### Phase 3.5: Documentation

- [ ] Document repository patterns
- [ ] Update service documentation
- [ ] Create repository usage guidelines

## Success Criteria

### Quality Gates

- [ ] All services use repositories for data access
- [ ] No direct Drizzle calls in services
- [ ] All tests pass with mock repositories
- [ ] No performance regression
- [ ] Lint: 0 errors, 0 warnings
- [ ] Build: Successful

### Code Quality

- [ ] Repository interfaces properly documented
- [ ] Repository implementation follows DRY
- [ ] Dependency injection properly configured
- [ ] Test coverage maintained

## Risks & Mitigations

### Risk 1: Breaking Changes

**Mitigation**: Incremental migration with backward compatibility during
transition

### Risk 2: Performance Regression

**Mitigation**: Benchmark repository layer, implement caching

### Risk 3: Over-Engineering

**Mitigation**: Start simple, add complexity only when needed

### Risk 4: Test Maintenance

**Mitigation**: Create reusable mock repository base class

## Timeline Estimate

- **Phase 3.1**: 2 days
- **Phase 3.2**: 3 days
- **Phase 3.3**: 4 days
- **Phase 3.4**: 2 days
- **Phase 3.5**: 1 day

**Total Estimated Duration**: ~12 days

## Next Steps

1. Create repository base interfaces in `src/lib/repositories/base/`
2. Implement `BaseRepository` abstract class
3. Create DI container for repository management
4. Implement `ProjectRepository` as first concrete implementation
5. Refactor `projectService` to use `IProjectRepository`

---

**Phase 3 Start**: January 17, 2026 **Estimated Completion**: January 29, 2026
