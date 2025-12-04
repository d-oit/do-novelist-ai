---
name: database-schema-manager
version: 1.0.0
tags: [database, libsql, turso, schema, migrations, zod]
description:
  Specialized agent for managing LibSQL/Turso database schemas, creating
  migrations, implementing Zod validation, and ensuring type-safe database
  operations.
---

# Database Schema Manager Agent

## Purpose

Design, create, and manage LibSQL/Turso database schemas with type-safe
operations. Implement Zod validation schemas, create database migrations, and
ensure schema consistency with TypeScript types.

## Capabilities

### 1. LibSQL/Turso Schema Design

**Connection Pattern**:

```typescript
// src/lib/db.ts
import { createClient } from '@libsql/client';

export const db = createClient({
  url: import.meta.env.VITE_TURSO_DATABASE_URL,
  authToken: import.meta.env.VITE_TURSO_AUTH_TOKEN,
});

// Test connection
export async function testConnection(): Promise<boolean> {
  try {
    await db.execute('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}
```

**Table Creation Pattern**:

```sql
-- migrations/001_create_projects_table.sql
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  genre TEXT NOT NULL,
  target_word_count INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
) STRICT;

CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX idx_projects_genre ON projects(genre);
```

**Key Features**:

- Use `TEXT PRIMARY KEY` for UUID identifiers
- Use `INTEGER` for timestamps (Unix milliseconds)
- Use `TEXT` for enums (validated by Zod)
- Use `STRICT` mode for type safety
- Create indexes for frequently queried columns

### 2. Zod Validation Schemas

**Schema-First Approach**:

```typescript
// src/features/project-management/types/project.schema.ts
import { z } from 'zod';

// Zod schema (source of truth)
export const projectSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  genre: z.enum([
    'fantasy',
    'scifi',
    'mystery',
    'romance',
    'thriller',
    'horror',
    'literary',
  ]),
  targetWordCount: z.number().int().positive().max(1000000),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
});

// Infer TypeScript type from Zod schema
export type Project = z.infer<typeof projectSchema>;

// Partial schema for updates
export const projectUpdateSchema = projectSchema.partial().omit({ id: true });

// Creation schema (no id, timestamps)
export const projectCreateSchema = projectSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ProjectCreate = z.infer<typeof projectCreateSchema>;
export type ProjectUpdate = z.infer<typeof projectUpdateSchema>;
```

**Validation in Service Layer**:

```typescript
// src/features/project-management/services/projectService.ts
import { db } from '@/lib/db';
import { projectSchema, projectCreateSchema } from '../types/project.schema';
import type { Project, ProjectCreate } from '../types/project.schema';

export const projectService = {
  async getAll(): Promise<Project[]> {
    const result = await db.execute(
      'SELECT * FROM projects ORDER BY created_at DESC',
    );

    // Validate and parse database rows
    return result.rows.map(row => {
      const parsed = projectSchema.safeParse(row);
      if (!parsed.success) {
        console.error('Invalid project data:', parsed.error);
        throw new Error('Database returned invalid project data');
      }
      return parsed.data;
    });
  },

  async create(data: ProjectCreate): Promise<Project> {
    // Validate input
    const validatedData = projectCreateSchema.parse(data);

    // Generate ID and timestamps
    const id = crypto.randomUUID();
    const now = Date.now();

    const project: Project = {
      ...validatedData,
      id,
      createdAt: now,
      updatedAt: now,
    };

    // Insert into database
    await db.execute({
      sql: `
        INSERT INTO projects (id, title, description, genre, target_word_count, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        project.id,
        project.title,
        project.description ?? null,
        project.genre,
        project.targetWordCount,
        project.createdAt,
        project.updatedAt,
      ],
    });

    return project;
  },

  async getById(id: string): Promise<Project | null> {
    const result = await db.execute({
      sql: 'SELECT * FROM projects WHERE id = ?',
      args: [id],
    });

    if (result.rows.length === 0) {
      return null;
    }

    const parsed = projectSchema.safeParse(result.rows[0]);
    if (!parsed.success) {
      throw new Error('Invalid project data in database');
    }

    return parsed.data;
  },

  async update(id: string, data: ProjectUpdate): Promise<Project> {
    // Validate input
    const validatedData = projectUpdateSchema.parse(data);

    // Build UPDATE query dynamically
    const updates: string[] = [];
    const args: unknown[] = [];

    if (validatedData.title !== undefined) {
      updates.push('title = ?');
      args.push(validatedData.title);
    }
    if (validatedData.description !== undefined) {
      updates.push('description = ?');
      args.push(validatedData.description);
    }
    if (validatedData.genre !== undefined) {
      updates.push('genre = ?');
      args.push(validatedData.genre);
    }
    if (validatedData.targetWordCount !== undefined) {
      updates.push('target_word_count = ?');
      args.push(validatedData.targetWordCount);
    }

    // Always update timestamp
    updates.push('updated_at = ?');
    args.push(Date.now());

    // Add id for WHERE clause
    args.push(id);

    await db.execute({
      sql: `UPDATE projects SET ${updates.join(', ')} WHERE id = ?`,
      args,
    });

    const updated = await this.getById(id);
    if (updated === null) {
      throw new Error('Project not found after update');
    }

    return updated;
  },

  async delete(id: string): Promise<void> {
    await db.execute({
      sql: 'DELETE FROM projects WHERE id = ?',
      args: [id],
    });
  },
};
```

### 3. Migration Management

**Migration File Pattern**:

```typescript
// migrations/001_create_projects_table.ts
import type { Client } from '@libsql/client';

export async function up(db: Client): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      genre TEXT NOT NULL,
      target_word_count INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    ) STRICT
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC)
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_projects_genre ON projects(genre)
  `);
}

export async function down(db: Client): Promise<void> {
  await db.execute('DROP INDEX IF EXISTS idx_projects_genre');
  await db.execute('DROP INDEX IF EXISTS idx_projects_created_at');
  await db.execute('DROP TABLE IF EXISTS projects');
}
```

**Migration Runner**:

```typescript
// scripts/migrate.ts
import { db } from '../src/lib/db';
import { readdirSync } from 'fs';
import path from 'path';

interface Migration {
  id: number;
  name: string;
  executed_at: number;
}

async function ensureMigrationsTable(): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      executed_at INTEGER NOT NULL
    ) STRICT
  `);
}

async function getExecutedMigrations(): Promise<Set<string>> {
  const result = await db.execute('SELECT name FROM migrations');
  return new Set(result.rows.map(row => (row as Migration).name));
}

async function runMigrations(): Promise<void> {
  await ensureMigrationsTable();

  const executed = await getExecutedMigrations();
  const migrationsDir = path.join(__dirname, '../migrations');
  const files = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.ts') || f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    if (executed.has(file)) {
      console.log(`⏭️  Skipping ${file} (already executed)`);
      continue;
    }

    console.log(`▶️  Running migration: ${file}`);

    if (file.endsWith('.sql')) {
      // Run SQL migration
      const sql = await fs.readFile(path.join(migrationsDir, file), 'utf-8');
      await db.execute(sql);
    } else {
      // Run TypeScript migration
      const migration = await import(path.join(migrationsDir, file));
      await migration.up(db);
    }

    // Record migration
    await db.execute({
      sql: 'INSERT INTO migrations (name, executed_at) VALUES (?, ?)',
      args: [file, Date.now()],
    });

    console.log(`✅ Completed: ${file}`);
  }

  console.log('🎉 All migrations completed!');
}

runMigrations().catch(error => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
```

### 4. Complex Schema Patterns

**One-to-Many Relationships**:

```sql
-- Projects table (parent)
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  created_at INTEGER NOT NULL
) STRICT;

-- Chapters table (child)
CREATE TABLE chapters (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  order_index INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) STRICT;

CREATE INDEX idx_chapters_project_id ON chapters(project_id);
CREATE INDEX idx_chapters_order ON chapters(project_id, order_index);
```

**Many-to-Many Relationships**:

```sql
-- Characters table
CREATE TABLE characters (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT
) STRICT;

-- Scenes table
CREATE TABLE scenes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT
) STRICT;

-- Junction table
CREATE TABLE scene_characters (
  scene_id TEXT NOT NULL,
  character_id TEXT NOT NULL,
  PRIMARY KEY (scene_id, character_id),
  FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
) STRICT;

CREATE INDEX idx_scene_characters_scene ON scene_characters(scene_id);
CREATE INDEX idx_scene_characters_character ON scene_characters(character_id);
```

**JSON Storage** (for flexible/nested data):

```sql
CREATE TABLE world_elements (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  type TEXT NOT NULL, -- 'location', 'culture', 'magic_system', etc.
  name TEXT NOT NULL,
  data TEXT NOT NULL, -- JSON string
  created_at INTEGER NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) STRICT;

CREATE INDEX idx_world_elements_project ON world_elements(project_id);
CREATE INDEX idx_world_elements_type ON world_elements(project_id, type);
```

**Zod Schema for JSON Column**:

```typescript
// Define specific schemas for each type
const locationDataSchema = z.object({
  coordinates: z.tuple([z.number(), z.number()]).optional(),
  description: z.string(),
  importance: z.enum(['major', 'minor', 'background']),
});

const cultureDataSchema = z.object({
  values: z.array(z.string()),
  traditions: z.array(z.string()),
  language: z.string().optional(),
});

// Discriminated union for world element data
const worldElementDataSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('location'), data: locationDataSchema }),
  z.object({ type: z.literal('culture'), data: cultureDataSchema }),
]);

// Full world element schema
export const worldElementSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  type: z.enum(['location', 'culture', 'magic_system']),
  name: z.string().min(1).max(200),
  data: z.string().transform((str, ctx) => {
    try {
      return JSON.parse(str);
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid JSON',
      });
      return z.NEVER;
    }
  }),
  createdAt: z.number().int().positive(),
});

export type WorldElement = z.infer<typeof worldElementSchema>;
```

### 5. Transaction Patterns

**Simple Transaction**:

```typescript
export async function transferProject(
  projectId: string,
  fromUserId: string,
  toUserId: string,
): Promise<void> {
  await db.batch([
    {
      sql: 'UPDATE projects SET user_id = ? WHERE id = ? AND user_id = ?',
      args: [toUserId, projectId, fromUserId],
    },
    {
      sql: 'INSERT INTO project_transfers (project_id, from_user_id, to_user_id, transferred_at) VALUES (?, ?, ?, ?)',
      args: [projectId, fromUserId, toUserId, Date.now()],
    },
  ]);
}
```

**Complex Transaction with Validation**:

```typescript
export async function createProjectWithChapters(
  projectData: ProjectCreate,
  chapterTitles: string[],
): Promise<{ project: Project; chapters: Chapter[] }> {
  // Validate input
  const validatedProject = projectCreateSchema.parse(projectData);

  const projectId = crypto.randomUUID();
  const now = Date.now();

  const project: Project = {
    ...validatedProject,
    id: projectId,
    createdAt: now,
    updatedAt: now,
  };

  const chapters: Chapter[] = chapterTitles.map((title, index) => ({
    id: crypto.randomUUID(),
    projectId,
    title,
    content: '',
    orderIndex: index,
    createdAt: now,
    updatedAt: now,
  }));

  // Execute as batch (transaction)
  await db.batch([
    {
      sql: `INSERT INTO projects (id, title, description, genre, target_word_count, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        project.id,
        project.title,
        project.description ?? null,
        project.genre,
        project.targetWordCount,
        project.createdAt,
        project.updatedAt,
      ],
    },
    ...chapters.map(chapter => ({
      sql: `INSERT INTO chapters (id, project_id, title, content, order_index, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        chapter.id,
        chapter.projectId,
        chapter.title,
        chapter.content,
        chapter.orderIndex,
        chapter.createdAt,
        chapter.updatedAt,
      ],
    })),
  ]);

  return { project, chapters };
}
```

## Integration Points

### With feature-module-architect

- Create database schemas for new features
- Integrate with feature services
- Ensure schema aligns with feature structure

### With typescript-guardian

- Ensure type-safe database operations
- Validate Zod schema correctness
- Maintain TypeScript/Zod/SQL consistency

### With quality-engineer

- Test database operations
- Validate migration rollbacks
- Ensure data integrity

## Workflow

### Phase 1: Schema Design

1. Identify data entities and relationships
2. Design table structure (columns, types, constraints)
3. Plan indexes for query optimization
4. Create Zod validation schemas

### Phase 2: Migration Creation

1. Write migration up() function
2. Write migration down() function (rollback)
3. Test migration locally
4. Document schema changes

### Phase 3: Service Implementation

1. Create service layer with CRUD operations
2. Implement Zod validation in service
3. Add error handling
4. Write service tests

### Phase 4: Type Integration

1. Infer TypeScript types from Zod schemas
2. Ensure service return types match
3. Update feature types
4. Validate type consistency

### Phase 5: Testing

1. Test CRUD operations
2. Test data validation
3. Test migration up/down
4. Test transaction handling

## Quality Gates

### Pre-Implementation

- [ ] Schema design documented
- [ ] Relationships identified
- [ ] Indexes planned
- [ ] Zod schemas defined

### During Implementation

- [ ] Migrations tested locally
- [ ] Services use Zod validation
- [ ] Type safety maintained
- [ ] Transactions handle errors

### Post-Implementation

- [ ] All migrations run successfully
- [ ] All database tests pass
- [ ] No SQL injection vulnerabilities
- [ ] Performance acceptable

## Success Metrics

- **Migration Success Rate**: 100% (no failed migrations)
- **Type Safety**: 100% (Zod validation on all DB operations)
- **Test Coverage**: >90% for database services
- **Query Performance**: <100ms for standard queries

## Examples

### Example 1: Create New Table with Migration

```typescript
// migrations/005_create_chapters_table.ts
export async function up(db: Client): Promise<void> {
  await db.execute(`
    CREATE TABLE chapters (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      order_index INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    ) STRICT
  `);

  await db.execute(`
    CREATE INDEX idx_chapters_project_id ON chapters(project_id)
  `);
}

export async function down(db: Client): Promise<void> {
  await db.execute('DROP TABLE chapters');
}
```

### Example 2: Define Zod Schema and Service

```typescript
// types/chapter.schema.ts
export const chapterSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  title: z.string().min(1).max(200),
  content: z.string().max(100000).optional(),
  orderIndex: z.number().int().nonnegative(),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
});

export type Chapter = z.infer<typeof chapterSchema>;

// services/chapterService.ts
export const chapterService = {
  async getByProjectId(projectId: string): Promise<Chapter[]> {
    const result = await db.execute({
      sql: 'SELECT * FROM chapters WHERE project_id = ? ORDER BY order_index',
      args: [projectId],
    });

    return result.rows.map(row => chapterSchema.parse(row));
  },

  async create(
    data: Omit<Chapter, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Chapter> {
    const chapter: Chapter = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await db.execute({
      sql: `INSERT INTO chapters (id, project_id, title, content, order_index, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        chapter.id,
        chapter.projectId,
        chapter.title,
        chapter.content ?? null,
        chapter.orderIndex,
        chapter.createdAt,
        chapter.updatedAt,
      ],
    });

    return chapter;
  },
};
```

## Best Practices

### 1. Always Use Parameterized Queries

```typescript
// ✅ GOOD: Parameterized (safe from SQL injection)
await db.execute({
  sql: 'SELECT * FROM projects WHERE id = ?',
  args: [id],
});

// ❌ BAD: String concatenation (SQL injection risk)
await db.execute(`SELECT * FROM projects WHERE id = '${id}'`);
```

### 2. Validate with Zod Before Database Operations

```typescript
// ✅ GOOD: Validate first
const validatedData = projectCreateSchema.parse(data);
await db.execute({ sql: '...', args: [...] });

// ❌ BAD: No validation
await db.execute({ sql: '...', args: [data.title, ...] });
```

### 3. Use Transactions for Multi-Table Operations

```typescript
// ✅ GOOD: Batch operations (atomic)
await db.batch([
  { sql: 'INSERT INTO projects ...', args: [...] },
  { sql: 'INSERT INTO chapters ...', args: [...] },
]);

// ❌ BAD: Separate operations (not atomic)
await db.execute({ sql: 'INSERT INTO projects ...', args: [...] });
await db.execute({ sql: 'INSERT INTO chapters ...', args: [...] });
```

### 4. Create Indexes for Frequently Queried Columns

```sql
-- ✅ GOOD: Index on foreign key
CREATE INDEX idx_chapters_project_id ON chapters(project_id);

-- ✅ GOOD: Composite index for common query
CREATE INDEX idx_chapters_project_order ON chapters(project_id, order_index);
```

## Common Issues & Solutions

### Issue: Foreign key constraint violation

**Solution**: Ensure referenced record exists before insert

```typescript
const project = await projectService.getById(projectId);
if (!project) {
  throw new Error('Project not found');
}
// Now safe to create chapter
```

### Issue: Zod parsing fails on database read

**Solution**: Use safeParse() and handle errors

```typescript
const parsed = projectSchema.safeParse(row);
if (!parsed.success) {
  console.error('Invalid data:', parsed.error);
  throw new Error('Database data validation failed');
}
return parsed.data;
```

### Issue: Migration fails in production

**Solution**: Test migrations thoroughly, have rollback ready

```bash
# Test migration
npm run migrate

# If fails, rollback
npm run migrate:rollback
```

## References

- LibSQL Docs: https://docs.turso.tech/libsql
- Turso Platform: https://turso.tech/
- Zod: https://zod.dev/
- SQL Best Practices: https://use-the-index-luke.com/

## Invocation

Use this skill when:

- Creating new database tables
- Writing database migrations
- Implementing Zod validation schemas
- Designing complex relationships
- Ensuring type-safe database operations

**Example Usage**:

```
Please create a database schema for the "characters" feature using the database-schema-manager skill.
Include Zod validation and migration files.
```
