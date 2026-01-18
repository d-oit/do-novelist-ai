# Repository Pattern Interface Enhancements

**Date**: 2026-01-17 **Status**: Addendum to REPOSITORY-PATTERN-DESIGN.md
**Type**: Interface Enhancement Proposal

---

## Summary

This document proposes enhancements to the existing repository pattern
interfaces while maintaining full backward compatibility with existing
implementations. The enhancements add optional methods for bulk operations,
pagination, advanced querying, and error handling.

---

## Backward Compatibility Commitment

**Important**: All proposed changes preserve existing interfaces. All existing
methods remain unchanged. New methods are optional additions that can be
implemented incrementally.

---

## Enhanced Interface Specifications

### 1. Enhanced FindAllOptions Type

**File**: `src/lib/repositories/interfaces/IRepository.ts`

**Status**: ✅ Already implemented for backward compatibility

```typescript
/**
 * Options for findAll operations
 */
export interface FindAllOptions {
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}
```

---

### 2. Enhanced IRepository Interface (Additions)

**New Methods** (Optional, implement as needed):

```typescript
export interface IRepository<TEntity, TID = string> {
  // ==================== Existing Methods (Unchanged) ====================
  findById(id: TID): Promise<TEntity | null>;
  findAll(): Promise<TEntity[]>;
  findWhere(predicate: (entity: TEntity) => boolean): Promise<TEntity[]>;
  create(entity: Omit<TEntity, 'id'>): Promise<TEntity>;
  update(id: TID, data: Partial<TEntity>): Promise<TEntity | null>;
  delete(id: TID): Promise<boolean>;
  exists(id: TID): Promise<boolean>;
  count(): Promise<number>;
  transaction<T>(operations: () => Promise<T>): Promise<T>;

  // ==================== Enhanced Additions (Optional) ====================

  /**
   * Find multiple entities by their IDs
   * @param ids - Array of entity IDs
   * @returns Array of found entities (null for not found)
   */
  findByIds?(ids: TID[]): Promise<Array<TEntity | null>>;

  /**
   * Find all entities with options
   * @param options - Pagination and sorting options
   * @returns Array of entities
   */
  findAllWithOptions?(options: FindAllOptions): Promise<TEntity[]>;

  /**
   * Create multiple entities in a single operation
   * @param entities - Array of entities to create
   * @returns Array of created entities
   */
  createMany?(entities: Array<Omit<TEntity, 'id'>>): Promise<TEntity[]>;

  /**
   * Update multiple entities
   * @param updates - Array of { id, data } tuples
   * @returns Array of updated entities
   */
  updateMany?(
    updates: Array<{ id: TID; data: Partial<TEntity> }>,
  ): Promise<TEntity[]>;

  /**
   * Delete multiple entities by IDs
   * @param ids - Array of entity IDs
   * @returns Number of deleted entities
   */
  deleteMany?(ids: TID[]): Promise<number>;

  /**
   * Get a query builder for complex queries
   * @returns Query builder instance
   */
  query?(): IQueryBuilder<TEntity>;

  /**
   * Execute a transaction with callback
   * @param operations - Function with operations to execute
   * @returns Result of transaction
   */
  executeTransaction?<T>(operations: () => Promise<T>): Promise<T>;
}
```

**Implementation Notes**:

- All new methods are optional (marked with `?`)
- Existing implementations continue to work without changes
- New methods can be added incrementally as needed
- TypeScript will enforce type safety when new methods are used

---

### 3. Enhanced IProjectRepository (Additions)

**File**: `src/lib/repositories/interfaces/IProjectRepository.ts`

**New Methods** (Optional additions):

```typescript
export interface IProjectRepository extends IRepository<Project> {
  // ==================== Existing Methods (Unchanged) ====================
  findByStatus(status: PublishStatus): Promise<Project[]>;
  findByStyle(style: Project['style']): Promise<Project[]>;
  findByLanguage(language: Project['language']): Promise<Project[]>;
  findByQuery(options: ProjectQueryOptions): Promise<Project[]>;
  getSummaries(): Promise<ProjectSummary[]>;
  getStats(): Promise<ProjectStats>;
  titleExists(title: string, excludeId?: string): Promise<boolean>;

  // ==================== Enhanced Additions (Optional) ====================

  /**
   * Find projects by status with pagination options
   * @param status - The publish status
   * @param options - Optional pagination and sorting
   * @returns Array of projects with matching status
   */
  findByStatusWithOptions?(
    status: PublishStatus,
    options?: FindAllOptions,
  ): Promise<Project[]>;

  /**
   * Duplicate a project with all its chapters
   * @param id - The project ID to duplicate
   * @param newTitle - Optional new title for the duplicate
   * @returns The duplicated project
   */
  duplicate?(id: string, newTitle?: string): Promise<Project>;

  /**
   * Archive a project (soft delete)
   * @param id - The project ID
   * @returns true if archived, false if not found
   */
  archive?(id: string): Promise<boolean>;

  /**
   * Restore an archived project
   * @param id - The project ID
   * @returns The restored project if found, null otherwise
   */
  restore?(id: string): Promise<Project | null>;

  /**
   * Find archived projects
   * @returns Array of archived projects
   */
  findArchived?(): Promise<Project[]>;

  /**
   * Get project with full chapter data
   * @param id - The project ID
   * @returns The project with populated chapters, null if not found
   */
  findByIdWithChapters?(id: string): Promise<Project | null>;

  /**
   * Get statistics for projects with filters
   * @param filters - Optional filters for stats
   * @returns Project statistics
   */
  getStatsWithFilters?(filters?: {
    status?: PublishStatus;
    language?: Project['language'];
    style?: Project['style'];
  }): Promise<ProjectStats>;

  /**
   * Search projects by title, idea, or description
   * @param query - Search query string
   * @returns Array of matching projects
   */
  search?(query: string): Promise<Project[]>;

  /**
   * Get recent projects
   * @param limit - Number of recent projects to return
   * @returns Array of recent projects
   */
  getRecent?(limit?: number): Promise<Project[]>;
}
```

**Use Cases**:

- **duplicate**: Quick project cloning for experimentation
- **archive/restore**: Soft delete for recovery
- **findByIdWithChapters**: Eager loading for project detail views
- **search**: Full-text search across project metadata
- **getRecent**: Quick access to recently modified projects

---

### 4. Enhanced IChapterRepository (Additions)

**File**: `src/lib/repositories/interfaces/IChapterRepository.ts`

**New Methods** (Optional additions):

```typescript
export interface IChapterRepository extends IRepository<Chapter> {
  // ==================== Existing Methods (Unchanged) ====================
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
  findByQuery(options: ChapterQueryOptions): Promise<Chapter[]>;
  reorderChapters(projectId: string, chapterIds: string[]): Promise<Chapter[]>;
  countByProject(projectId: string): Promise<number>;
  getTotalWordCount(projectId: string): Promise<number>;
  bulkUpdateOrder(
    chapters: Array<{ id: string; orderIndex: number }>,
  ): Promise<Chapter[]>;

  // ==================== Enhanced Additions (Optional) ====================

  /**
   * Find chapters by tags
   * @param projectId - The project ID
   * @param tags - Array of tags to match
   * @returns Array of chapters with matching tags
   */
  findByTags?(projectId: string, tags: string[]): Promise<Chapter[]>;

  /**
   * Search chapters by title, summary, or content
   * @param projectId - The project ID
   * @param query - Search query
   * @returns Array of matching chapters
   */
  search?(projectId: string, query: string): Promise<Chapter[]>;

  /**
   * Get word count by status for a project
   * @param projectId - The project ID
   * @returns Word count by status
   */
  getWordCountByStatus?(
    projectId: string,
  ): Promise<Record<ChapterStatus, number>>;

  /**
   * Duplicate a chapter
   * @param chapterId - The chapter ID to duplicate
   * @param newOrderIndex - Optional new order index for the duplicate
   * @returns The duplicated chapter
   */
  duplicate?(chapterId: string, newOrderIndex?: number): Promise<Chapter>;

  /**
   * Archive chapters (soft delete)
   * @param chapterIds - Array of chapter IDs to archive
   * @returns Number of archived chapters
   */
  archive?(chapterIds: string[]): Promise<number>;

  /**
   * Restore archived chapters
   * @param chapterIds - Array of chapter IDs to restore
   * @returns Array of restored chapters
   */
  restore?(chapterIds: string[]): Promise<Chapter[]>;

  /**
   * Find archived chapters for a project
   * @param projectId - The project ID
   * @returns Array of archived chapters
   */
  findArchived?(projectId: string): Promise<Chapter[]>;

  /**
   * Get chapter count by status for a project
   * @param projectId - The project ID
   * @param status - The chapter status
   * @returns The number of chapters with the status
   */
  countByProjectAndStatus?(
    projectId: string,
    status: ChapterStatus,
  ): Promise<number>;

  /**
   * Find chapters by word count range
   * @param projectId - The project ID
   * @param minWordCount - Minimum word count
   * @param maxWordCount - Maximum word count
   * @returns Array of chapters within word count range
   */
  findByWordCountRange?(
    projectId: string,
    minWordCount: number,
    maxWordCount: number,
  ): Promise<Chapter[]>;

  /**
   * Get chapters that contain specific characters
   * @param projectId - The project ID
   * @param characterIds - Array of character IDs
   * @returns Array of chapters containing the characters
   */
  findByCharacters?(
    projectId: string,
    characterIds: string[],
  ): Promise<Chapter[]>;
}
```

**Use Cases**:

- **findByTags**: Tag-based filtering for chapter organization
- **search**: Full-text search across chapter content
- **duplicate**: Quick chapter cloning for variations
- **archive/restore**: Soft delete for recovery
- **findByCharacters**: Find all chapters where specific characters appear

---

### 5. Enhanced ICharacterRepository (Additions)

**File**: `src/lib/repositories/interfaces/ICharacterRepository.ts`

**New Methods** (Optional additions):

```typescript
export interface ICharacterRepository extends IRepository<Character> {
  // ==================== Existing Methods (Unchanged) ====================
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

  // ==================== Enhanced Additions (Optional) ====================

  /**
   * Find characters by arc
   * @param arc - The character arc
   * @returns Array of characters with matching arc
   */
  findByArc?(arc: CharacterArc, options?: FindAllOptions): Promise<Character[]>;

  /**
   * Find characters by tags
   * @param projectId - The project ID
   * @param tags - Array of tags to match
   * @returns Array of characters with matching tags
   */
  findByTags?(projectId: string, tags: string[]): Promise<Character[]>;

  /**
   * Get character statistics for a project
   * @param projectId - The project ID
   * @returns Character statistics
   */
  getStats?(projectId: string): Promise<CharacterStats>;

  /**
   * Create multiple relationships
   * @param relationships - Array of relationships to create
   * @returns Array of created relationships
   */
  createRelationships?(
    relationships: CharacterRelationship[],
  ): Promise<CharacterRelationship[]>;

  /**
   * Delete multiple relationships
   * @param ids - Array of relationship IDs
   * @returns Number of deleted relationships
   */
  deleteRelationships?(ids: string[]): Promise<number>;

  /**
   * Archive characters (soft delete)
   * @param characterIds - Array of character IDs to archive
   * @returns Number of archived characters
   */
  archive?(characterIds: string[]): Promise<number>;

  /**
   * Restore archived characters
   * @param characterIds - Array of character IDs to restore
   * @returns Array of restored characters
   */
  restore?(characterIds: string[]): Promise<Character[]>;

  /**
   * Find archived characters for a project
   * @param projectId - The project ID
   * @returns Array of archived characters
   */
  findArchived?(projectId: string): Promise<Character[]>;

  /**
   * Duplicate a character
   * @param characterId - The character ID to duplicate
   * @param newName - Optional new name for the duplicate
   * @returns The duplicated character
   */
  duplicate?(characterId: string, newName?: string): Promise<Character>;

  /**
   * Find characters with specific traits
   * @param projectId - The project ID
   * @param traits - Array of trait names
   * @returns Array of characters with matching traits
   */
  findByTraits?(projectId: string, traits: string[]): Promise<Character[]>;

  /**
   * Get character count by arc for a project
   * @param projectId - The project ID
   * @param arc - The character arc
   * @returns The number of characters with the arc
   */
  countByProjectAndArc?(projectId: string, arc: CharacterArc): Promise<number>;

  /**
   * Find characters appearing in specific chapters
   * @param chapterIds - Array of chapter IDs
   * @returns Array of characters appearing in the chapters
   */
  findByChapters?(chapterIds: string[]): Promise<Character[]>;
}
```

**Use Cases**:

- **findByArc**: Filter characters by narrative arc type
- **findByTags**: Tag-based character filtering
- **getStats**: Aggregated character data for analytics
- **duplicate**: Quick character cloning for variations
- **findByChapters**: Find all characters appearing in specific chapters

---

### 6. IPlotRepository (No Changes Recommended)

**Status**: ✅ Appropriate as-is

The existing `IPlotRepository` interface is well-designed for its specific use
case. It manages derived data (analysis results) rather than persistent
entities, so it correctly does NOT extend `IRepository`.

**Recommendation**: Keep existing interface unchanged.

---

## Error Handling Enhancements

### RepositoryErrorCode Enum (Already Exists)

**File**: `src/lib/repositories/interfaces/IRepository.ts`

```typescript
/**
 * Error codes for repository operations
 */
export enum RepositoryErrorCode {
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DUPLICATE_KEY = 'DUPLICATE_KEY',
  DATABASE_ERROR = 'DATABASE_ERROR',
  TRANSACTION_ERROR = 'TRANSACTION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}
```

### Enhanced Error Classes (Optional)

```typescript
/**
 * Specific error types for common repository errors
 */
export class NotFoundError extends RepositoryError {
  constructor(entity: string, id: string) {
    super(`${entity} with id ${id} not found`, RepositoryErrorCode.NOT_FOUND);
    this.name = 'NotFoundError';
  }
}

export class DuplicateKeyError extends RepositoryError {
  constructor(entity: string, field: string, value: string) {
    super(
      `Duplicate ${entity} with ${field} ${value}`,
      RepositoryErrorCode.DUPLICATE_KEY,
    );
    this.name = 'DuplicateKeyError';
  }
}

export class ValidationError extends RepositoryError {
  constructor(message: string, issues: string[]) {
    super(message, RepositoryErrorCode.VALIDATION_ERROR);
    this.name = 'ValidationError';
    (this as Record<string, unknown>).issues = issues;
  }
}
```

---

## Implementation Strategy (Phased Approach)

### Phase 1: Backward Compatibility Verification (1 hour)

**Tasks**:

1. ✅ Verify existing interfaces compile without errors
2. ✅ Add `FindAllOptions` type to `IRepository.ts` (completed)
3. ✅ Fix TypeScript errors in existing implementations (completed)
4. 🔄 Run full test suite to ensure no regressions

**Success Criteria**:

- All existing tests pass
- No TypeScript compilation errors
- Existing implementations work unchanged

### Phase 2: Add Optional Methods Incrementally (As needed)

**Strategy**: Implement new methods only when needed by features.

**Priority Methods** (Most useful):

1. **Bulk operations**: `findByIds`, `createMany`, `updateMany`, `deleteMany`
2. **Search**: `search` methods in repositories
3. **Archive/restore**: Soft delete for recovery
4. **Duplicate**: Quick cloning functionality

**Example Implementation**:

```typescript
export class ProjectRepository implements IProjectRepository {
  // Existing methods unchanged...

  async findByIds(ids: string[]): Promise<Array<Project | null>> {
    const results = await Promise.all(ids.map(id => this.findById(id)));
    return results;
  }

  async duplicate(id: string, newTitle?: string): Promise<Project> {
    const project = await this.findById(id);
    if (!project) {
      throw new RepositoryError(
        `Project ${id} not found`,
        RepositoryErrorCode.NOT_FOUND,
      );
    }

    const duplicateData: Omit<Project, 'id'> = {
      ...project,
      title: newTitle || `Copy of ${project.title}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return await this.create(duplicateData);
  }

  async archive(id: string): Promise<boolean> {
    const project = await this.findById(id);
    if (!project) return false;

    await this.update(id, { status: 'archived' as PublishStatus });
    return true;
  }

  async restore(id: string): Promise<Project | null> {
    const project = await this.findById(id);
    if (!project) return null;

    await this.update(id, { status: 'draft' as PublishStatus });
    return await this.findById(id);
  }
}
```

### Phase 3: Testing (Parallel with implementation)

**Tests for New Methods**:

```typescript
describe('ProjectRepository - New Methods', () => {
  describe('duplicate', () => {
    it('should duplicate project with new title', async () => {
      const original = createMockProject();
      await repository.create(original);

      const duplicate = await repository.duplicate(original.id, 'New Title');

      expect(duplicate.id).not.toBe(original.id);
      expect(duplicate.title).toBe('New Title');
      expect(duplicate.chapters).toEqual(original.chapters);
    });

    it('should throw error for non-existent project', async () => {
      await expect(repository.duplicate('non-existent')).rejects.toThrow(
        RepositoryError,
      );
    });
  });

  describe('archive', () => {
    it('should archive project', async () => {
      const project = createMockProject();
      await repository.create(project);

      const archived = await repository.archive(project.id);

      expect(archived).toBe(true);
    });
  });
});
```

---

## Quality Gates

### Before New Method Implementation

- [ ] TypeScript strict mode enabled
- [ ] All existing tests pass
- [ ] Interface method documented with JSDoc
- [ ] Use case identified and documented

### After New Method Implementation

- [ ] TypeScript compilation succeeds
- [ ] Unit tests written and passing
- [ ] Integration tests (if database interaction)
- [ ] Error handling verified
- [ ] Performance acceptable
- [ ] Documentation updated

---

## Migration Checklist

- [x] Review existing repository interfaces
- [x] Analyze existing implementations
- [x] Verify TypeScript strict mode compliance
- [x] Add `FindAllOptions` type for backward compatibility
- [x] Fix TypeScript errors in existing implementations
- [ ] Document enhancement proposals
- [ ] Identify priority methods to implement
- [ ] Implement high-priority methods
- [ ] Write tests for new methods
- [ ] Update service layer to use new methods (as needed)
- [ ] Update documentation

---

## Benefits of This Approach

1. **Backward Compatibility**: Existing code continues to work
2. **Incremental Adoption**: New methods implemented as needed
3. **Type Safety**: TypeScript enforces correct usage
4. **Flexibility**: Different repositories can implement different subsets of
   methods
5. **Minimal Risk**: No breaking changes to existing functionality

---

## Next Steps

1. ✅ **Immediate**: Verify existing interfaces compile and work
2. 🔄 **Short-term**: Implement high-priority methods as features need them
3. 📅 **Medium-term**: Add comprehensive tests for all new methods
4. 📝 **Long-term**: Consider deprecation of older patterns in favor of new
   methods

---

**Status**: ✅ Design Complete - Ready for Implementation

**Last Updated**: 2026-01-17
