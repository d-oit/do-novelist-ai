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

/**
 * Options for findAll operations - for backward compatibility with existing implementations
 */
export interface FindAllOptions {
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * Generic Repository Interface
 *
 * Defines a contract for data access operations with type safety.
 * Provides CRUD operations and query methods for any entity type.
 *
 * @template TEntity - The domain entity type
 * @template TID - The ID type (usually string or number)
 */
export interface IRepository<TEntity, TID = string> {
  // ==================== CRUD Operations ====================

  /**
   * Find an entity by its ID
   * @param id - The entity ID
   * @returns The entity if found, null otherwise
   */
  findById(id: TID): Promise<TEntity | null>;

  /**
   * Find all entities
   * @returns Array of all entities
   */
  findAll(): Promise<TEntity[]>;

  /**
   * Find entities matching a predicate
   * @param predicate - A function that returns true for matching entities
   * @returns Array of matching entities
   */
  findWhere(predicate: (entity: TEntity) => boolean): Promise<TEntity[]>;

  /**
   * Create a new entity
   * @param entity - The entity to create
   * @returns The created entity with generated ID
   */
  create(entity: Omit<TEntity, 'id'>): Promise<TEntity>;

  /**
   * Update an existing entity
   * @param id - The entity ID
   * @param data - Partial entity data to update
   * @returns The updated entity if found, null otherwise
   */
  update(id: TID, data: Partial<TEntity>): Promise<TEntity | null>;

  /**
   * Delete an entity by ID
   * @param id - The entity ID
   * @returns true if deleted, false if not found
   */
  delete(id: TID): Promise<boolean>;

  /**
   * Check if an entity exists
   * @param id - The entity ID
   * @returns true if exists, false otherwise
   */
  exists(id: TID): Promise<boolean>;

  /**
   * Count total entities
   * @returns The count of entities
   */
  count(): Promise<number>;

  /**
   * Execute a transaction with multiple operations
   * @param operations - Array of operations to execute atomically
   * @returns Result of the transaction
   */
  transaction<T>(operations: () => Promise<T>): Promise<T>;
}

/**
 * Query builder interface for complex queries
 */
export interface IQueryBuilder<TEntity> {
  /**
   * Filter entities by a condition
   * @param condition - The filter condition
   */
  where(condition: (entity: TEntity) => boolean): IQueryBuilder<TEntity>;

  /**
   * Order results by a key
   * @param key - The entity property to sort by
   * @param direction - Sort direction ('asc' or 'desc')
   */
  orderBy(key: keyof TEntity, direction?: 'asc' | 'desc'): IQueryBuilder<TEntity>;

  /**
   * Limit number of results
   * @param limit - Maximum number of results
   */
  limit(limit: number): IQueryBuilder<TEntity>;

  /**
   * Skip a number of results (pagination)
   * @param skip - Number of results to skip
   */
  skip(skip: number): IQueryBuilder<TEntity>;

  /**
   * Execute the query
   * @returns Array of matching entities
   */
  execute(): Promise<TEntity[]>;
}

/**
 * Repository error types for error handling
 */
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

/**
 * Result type for repository operations
 */
export type RepositoryResult<T> =
  | { success: true; data: T }
  | { success: false; error: RepositoryError };
