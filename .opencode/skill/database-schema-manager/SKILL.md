---
name: database-schema-manager
description:
  Manage LibSQL/Turso database schemas with Zod validation, create migrations,
  and ensure type-safe database operations.
---

# Database Schema Manager

Enforce database best practices, schema integrity, and type safety when working
with LibSQL/Turso databases.

## Quick Reference

**Core Responsibilities**:

- Schema Design - Normalization, relationships, indexing
- Migration Management - Versioned, reversible changes
- Zod Validation - Runtime type checking for database operations
- Type Safety - TypeScript integration with database schemas
- Data Integrity - Constraints, foreign keys, validation

## When to Use

- Creating new database tables or modifying existing schemas
- Writing database migrations (ALTER TABLE, CREATE INDEX, etc.)
- Setting up Zod schemas for database entities
- Implementing type-safe repository patterns
- Optimizing database queries with indexes
- Ensuring data validation and integrity
- Writing tests for database operations

## LibSQL/Turso Fundamentals

### Database Client Setup

```typescript
import { createClient } from 'libsql';

export const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

// For testing
export const testDb = createClient({
  url: 'file::memory:',
});
```

### Query Execution

```typescript
// Single query with prepared statement
const result = await db.execute({
  sql: 'SELECT * FROM characters WHERE project_id = ?',
  args: [projectId],
});

// Batch operations
await db.batch([
  {
    sql: 'INSERT INTO characters (id, name) VALUES (?, ?)',
    args: [id1, name1],
  },
  {
    sql: 'INSERT INTO characters (id, name) VALUES (?, ?)',
    args: [id2, name2],
  },
]);

// Transactions (manual)
await db.batch([
  { sql: 'BEGIN' },
  { sql: 'INSERT INTO ...' },
  { sql: 'COMMIT' },
]);
```

## Schema Design Guidelines

### Table Naming

- Use snake_case, plural form: `characters`, `chapters`, `project_members`
- Avoid reserved words: `user`, `order`, `group` → `users`, `orders`, `groups`

### Column Naming

- Primary keys: `id` (TEXT/UUID)
- Foreign keys: `[table]_id` → `project_id`, `chapter_id`
- Timestamps: `created_at`, `updated_at` (TEXT datetime)
- Booleans: `is_*` → `is_published`, `is_active`
- JSON columns: Store serialized JSON as TEXT

### Data Types

```typescript
// Primary key - always UUID
id TEXT PRIMARY KEY

// Foreign key - UUID reference
project_id TEXT NOT NULL
REFERENCES projects(id) ON DELETE CASCADE

// Text - use appropriate length
name TEXT NOT NULL
description TEXT

// Integer
word_count INTEGER NOT NULL DEFAULT 0

// Boolean (stored as INTEGER)
is_published INTEGER NOT NULL DEFAULT 0
-- 0 = false, 1 = true

// JSON (stored as TEXT)
attributes TEXT NOT NULL DEFAULT '{}'
-- Parse/sanitize in application code

// Timestamps
created_at TEXT NOT NULL DEFAULT (datetime('now'))
updated_at TEXT NOT NULL DEFAULT (datetime('now'))
```

## Zod Schema Integration

### Complete Schema Pattern

Every database table needs:

1. **Database Schema** - Full table schema with validation
2. **Input Schema** - For create/update operations (non-auto fields)
3. **Type Export** - TypeScript type from Zod schema

```typescript
import { z } from 'zod';

// Full database schema
export const CharacterSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  name: z.string().min(1).max(200).trim(),
  role: z.enum(['protagonist', 'antagonist', 'supporting', 'minor']),
  attributes: z.record(z.string()),
  is_active: z.coerce.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Character = z.infer<typeof CharacterSchema>;

// Input schemas (exclude auto-generated fields)
export const CreateCharacterSchema = CharacterSchema.pick({
  project_id: true,
  name: true,
  role: true,
  attributes: true,
  is_active: true,
});

export const UpdateCharacterSchema = CreateCharacterSchema.partial();

export type CreateCharacterInput = z.infer<typeof CreateCharacterSchema>;
export type UpdateCharacterInput = z.infer<typeof UpdateCharacterSchema>;
```

### JSON Column Handling

```typescript
// Schema
export const CharacterSchema = z.object({
  id: z.string().uuid(),
  attributes: z.record(z.string(), z.string()), // JSON column
});

// Repository - parse on read
async findById(id: string): Promise<Character | null> {
  const result = await db.execute({
    sql: 'SELECT * FROM characters WHERE id = ?',
    args: [id],
  });

  if (!result.rows[0]) return null;

  const row = result.rows[0] as Record<string, unknown>;
  return CharacterSchema.parse({
    ...row,
    attributes: JSON.parse(row.attributes as string),
  });
}

// Repository - stringify on write
async create(data: CreateCharacterInput): Promise<Character> {
  const validated = CreateCharacterSchema.parse(data);

  await db.execute({
    sql: 'INSERT INTO characters (id, attributes) VALUES (?, ?)',
    args: [validated.id, JSON.stringify(validated.attributes)],
  });
}
```

### Boolean Column Handling

```typescript
// Schema - use z.coerce.boolean() for SQLite INTEGER
export const ProjectSchema = z.object({
  id: z.string().uuid(),
  is_active: z.coerce.boolean(),
});

// SQLite stores booleans as INTEGER (0 or 1)
// Database schema
is_active INTEGER NOT NULL DEFAULT 0

// Zod coerces 0 → false, 1 → true
const project = ProjectSchema.parse({ is_active: 1 }); // { is_active: false }
```

## Migration Workflow

### Migration File Template

```typescript
import type { Migration } from '@/lib/database/migrations/types';

export const migration: Migration = {
  id: '001_create_characters_table',
  version: '2024-01-18-001',
  description: 'Create characters table with indexes',
  up: async db => {
    // Create table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS characters (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        attributes TEXT NOT NULL DEFAULT '{}',
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);

    // Create indexes
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_characters_project_id
      ON characters(project_id)
    `);

    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_characters_role
      ON characters(role)
    `);
  },
  down: async db => {
    // Drop indexes first (reverse order)
    await db.execute('DROP INDEX IF EXISTS idx_characters_role');
    await db.execute('DROP INDEX IF EXISTS idx_characters_project_id');
    await db.execute('DROP TABLE IF EXISTS characters');
  },
};
```

### Common Migration Patterns

**Add Column:**

```typescript
up: async (db) => {
  await db.execute(`
    ALTER TABLE characters ADD COLUMN bio TEXT DEFAULT NULL
  `);
},
down: async (db) => {
  await db.execute(`
    ALTER TABLE characters DROP COLUMN bio
  `);
},
```

**Rename Column:**

```typescript
up: async (db) => {
  await db.execute(`
    ALTER TABLE characters RENAME COLUMN bio TO description
  `);
},
down: async (db) => {
  await db.execute(`
    ALTER TABLE characters RENAME COLUMN description TO bio
  `);
},
```

**Add Index:**

```typescript
up: async (db) => {
  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_characters_name
    ON characters(name)
  `);
},
down: async (db) => {
  await db.execute(`
    DROP INDEX IF EXISTS idx_characters_name
  `);
},
```

**Add Foreign Key Constraint:**

```typescript
up: async (db) => {
  // Note: LibSQL doesn't support ADD CONSTRAINT for foreign keys
  // Need to recreate table
  await db.execute(`
    CREATE TABLE characters_new (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);

  await db.execute(`
    INSERT INTO characters_new
    SELECT id, project_id, name, created_at
    FROM characters
  `);

  await db.execute('DROP TABLE characters');
  await db.execute('ALTER TABLE characters_new RENAME TO characters');
},
```

### Migration Ordering

Migrations are applied in version order. Follow this naming:

```
[YYYY]-[MM]-[DD]-[sequence]_[description]
2024-01-18-001_create_projects_table
2024-01-18-002_create_characters_table
2024-01-19-001_add_chapter_status
```

## Type-Safe Repository Pattern

### Repository Interface

```typescript
export interface CharacterRepository {
  create(data: CreateCharacterInput): Promise<Character>;
  findById(id: string): Promise<Character | null>;
  findByProjectId(projectId: string): Promise<Character[]>;
  update(id: string, data: UpdateCharacterInput): Promise<Character>;
  delete(id: string): Promise<void>;
}
```

### Repository Implementation

```typescript
import type { LibSQLDatabase } from 'libsql';
import {
  CharacterSchema,
  CreateCharacterSchema,
  UpdateCharacterSchema,
} from './schemas';

export class CharacterRepositoryImpl implements CharacterRepository {
  constructor(private db: LibSQLDatabase) {}

  async create(data: CreateCharacterInput): Promise<Character> {
    const validated = CreateCharacterSchema.parse(data);
    const id = crypto.randomUUID();

    await db.execute({
      sql: `
        INSERT INTO characters (id, project_id, name, role, attributes, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `,
      args: [
        id,
        validated.project_id,
        validated.name,
        validated.role,
        JSON.stringify(validated.attributes),
        validated.is_active ? 1 : 0,
      ],
    });

    return this.findById(id);
  }

  async findById(id: string): Promise<Character | null> {
    const result = await db.execute({
      sql: 'SELECT * FROM characters WHERE id = ?',
      args: [id],
    });

    if (result.rows.length === 0) {
      return null;
    }

    return this.parseRow(result.rows[0] as Record<string, unknown>);
  }

  async findByProjectId(projectId: string): Promise<Character[]> {
    const result = await db.execute({
      sql: `
        SELECT * FROM characters
        WHERE project_id = ?
        ORDER BY created_at DESC
      `,
      args: [projectId],
    });

    return result.rows.map(row =>
      this.parseRow(row as Record<string, unknown>),
    );
  }

  async update(id: string, data: UpdateCharacterInput): Promise<Character> {
    const validated = UpdateCharacterSchema.parse(data);

    const updates: string[] = [];
    const args: unknown[] = [];

    if (validated.name !== undefined) {
      updates.push('name = ?');
      args.push(validated.name);
    }
    if (validated.role !== undefined) {
      updates.push('role = ?');
      args.push(validated.role);
    }
    if (validated.attributes !== undefined) {
      updates.push('attributes = ?');
      args.push(JSON.stringify(validated.attributes));
    }
    if (validated.is_active !== undefined) {
      updates.push('is_active = ?');
      args.push(validated.is_active ? 1 : 0);
    }

    updates.push('updated_at = datetime("now")');
    args.push(id);

    await db.execute({
      sql: `
        UPDATE characters
        SET ${updates.join(', ')}
        WHERE id = ?
      `,
      args,
    });

    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await db.execute({
      sql: 'DELETE FROM characters WHERE id = ?',
      args: [id],
    });
  }

  private parseRow(row: Record<string, unknown>): Character {
    return CharacterSchema.parse({
      ...row,
      attributes: JSON.parse(row.attributes as string),
    });
  }
}
```

## Constraints and Data Integrity

### Foreign Key Constraints

```typescript
// In migration
await db.execute(`
  CREATE TABLE IF NOT EXISTS chapters (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    title TEXT NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
  )
`);
```

**Actions:**

- `ON DELETE CASCADE` - Delete child records when parent is deleted
- `ON DELETE SET NULL` - Set foreign key to NULL when parent is deleted
- `ON DELETE RESTRICT` - Prevent deletion if child records exist
- `ON DELETE NO ACTION` - Default, prevent deletion if child records exist

### Check Constraints

```typescript
await db.execute(`
  CREATE TABLE IF NOT EXISTS chapters (
    id TEXT PRIMARY KEY,
    word_count INTEGER NOT NULL CHECK(word_count >= 0),
    status TEXT NOT NULL CHECK(status IN ('draft', 'review', 'published', 'archived'))
  )
`);
```

### Unique Constraints

```typescript
await db.execute(`
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    user_id TEXT NOT NULL
  )
`);

// Composite unique constraint
await db.execute(`
  CREATE TABLE IF NOT EXISTS chapter_order (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    chapter_id TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    UNIQUE(project_id, chapter_id),
    UNIQUE(project_id, order_index)
  )
`);
```

## Query Optimization

### Indexing Strategy

**Single Column Index:**

```typescript
await db.execute(`
  CREATE INDEX idx_characters_project_id
  ON characters(project_id)
`);
```

**Composite Index:**

```typescript
// For queries filtering on multiple columns
await db.execute(`
  CREATE INDEX idx_chapters_project_status
  ON chapters(project_id, status)
`);

// Query that uses this index:
// SELECT * FROM chapters WHERE project_id = ? AND status = ?
```

**Covering Index:**

```typescript
// Include frequently accessed columns to avoid table lookups
await db.execute(`
  CREATE INDEX idx_chapters_project_title
  ON chapters(project_id) INCLUDE(title, word_count)
`);
```

### Query Performance Checklist

- [ ] Query uses index (check with EXPLAIN QUERY PLAN)
- [ ] Selects only needed columns (avoid SELECT \*)
- [ ] Uses prepared statements
- [ ] Limits results with LIMIT for large tables
- [ ] Uses appropriate JOIN types
- [ ] Filters early (WHERE clause first)
- [ ] Avoids function calls in WHERE clause on indexed columns

```typescript
// BAD - function on indexed column prevents index usage
db.execute({
  sql: 'SELECT * FROM characters WHERE LOWER(name) = ?',
  args: [name],
});

// GOOD - use case-insensitive collation or store normalized value
db.execute({
  sql: 'SELECT * FROM characters WHERE name = ?',
  args: [name],
});
```

## Testing Database Operations

### Test Database Setup

```typescript
// lib/database/test-utils.ts
import { createClient } from 'libsql';

export function createTestClient() {
  return createClient({
    url: 'file::memory:',
  });
}

export async function runMigrations(db: LibSQLDatabase) {
  // Run all migrations in order
  const migrations = await importMigrations();
  for (const migration of migrations) {
    await migration.up(db);
  }
}
```

### Unit Test Example

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestClient, runMigrations } from '@/lib/database/test-utils';
import { CharacterRepositoryImpl } from './character-repository';
import { CreateCharacterSchema } from './schemas';

describe('CharacterRepository', () => {
  let db: LibSQLDatabase;
  let repository: CharacterRepositoryImpl;

  beforeEach(async () => {
    db = createTestClient();
    await runMigrations(db);
    repository = new CharacterRepositoryImpl(db);
  });

  afterEach(async () => {
    await db.close();
  });

  describe('create', () => {
    it('should create a character with valid data', async () => {
      const character = await repository.create({
        project_id: 'project-123',
        name: 'John Doe',
        role: 'protagonist',
        attributes: { age: '30', gender: 'male' },
        is_active: true,
      });

      expect(character.id).toBeDefined();
      expect(character.name).toBe('John Doe');
      expect(character.role).toBe('protagonist');
    });

    it('should throw error for invalid role', async () => {
      await expect(
        repository.create({
          project_id: 'project-123',
          name: 'Jane Doe',
          role: 'invalid-role' as any,
          attributes: {},
          is_active: true,
        }),
      ).rejects.toThrow();
    });

    it('should validate name length', async () => {
      await expect(
        repository.create({
          project_id: 'project-123',
          name: '', // Too short
          role: 'protagonist',
          attributes: {},
          is_active: true,
        }),
      ).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('should find existing character', async () => {
      const created = await repository.create({
        project_id: 'project-123',
        name: 'John Doe',
        role: 'protagonist',
        attributes: {},
        is_active: true,
      });

      const found = await repository.findById(created.id);
      expect(found).not.toBeNull();
      expect(found?.name).toBe('John Doe');
    });

    it('should return null for non-existent character', async () => {
      const found = await repository.findById('non-existent');
      expect(found).toBeNull();
    });
  });
});
```

## Anti-Patterns to Avoid

### ❌ SQL Injection

```typescript
// BAD - SQL injection risk
const result = await db.execute(
  `SELECT * FROM characters WHERE name = '${name}'`,
);

// GOOD - prepared statement
const result = await db.execute({
  sql: 'SELECT * FROM characters WHERE name = ?',
  args: [name],
});
```

### ❌ No Validation

```typescript
// BAD - no validation
async create(data: any): Promise<Character> {
  await db.execute('INSERT INTO characters ...');
}

// GOOD - Zod validation
async create(data: CreateCharacterInput): Promise<Character> {
  const validated = CreateCharacterSchema.parse(data);
  await db.execute({ sql: 'INSERT INTO characters ...', args: [...] });
}
```

### ❌ SELECT \*

```typescript
// BAD - fetches all columns
const result = await db.execute('SELECT * FROM characters');

// GOOD - select only needed columns
const result = await db.execute('SELECT id, name, role FROM characters');
```

### ❌ Missing Indexes

```typescript
// BAD - no index on project_id, full table scan
db.execute({
  sql: 'SELECT * FROM characters WHERE project_id = ?',
  args: [projectId],
});

// GOOD - index exists
await db.execute(`
  CREATE INDEX idx_characters_project_id
  ON characters(project_id)
`);
```

## Best Practices Summary

### DO:

✓ Use prepared statements for all queries ✓ Validate all inputs and outputs with
Zod schemas ✓ Create indexes for frequently queried columns ✓ Use foreign keys
for relationships ✓ Write both up and down migrations ✓ Test database operations
with test database ✓ Use transactions for multi-step operations ✓ Normalize data
appropriately ✓ Include timestamps (created_at, updated_at) ✓ Handle JSON
columns with proper parsing/stringifying

### DON'T:

✗ Use string interpolation for SQL queries ✗ Skip Zod validation ✓ Forget to
create indexes ✓ Write migrations without down functions ✗ Use SELECT \* in
production ✗ Ignore foreign key constraints ✓ Store unvalidated data ✗ Mix
database and domain logic in components

---

Follow these guidelines to maintain a robust, type-safe database layer that
ensures data integrity and provides excellent developer experience.
