/**
 * Drizzle ORM schema for versioning tables
 * Stores chapter versions, branches, and version history
 */
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

import { chapters } from './chapters';
import { projects } from './projects';

/**
 * Chapter versions table
 */
export const chapterVersions = sqliteTable('chapter_versions', {
  id: text('id').primaryKey(),
  chapterId: text('chapter_id')
    .notNull()
    .references(() => chapters.id, { onDelete: 'cascade' }),
  versionNumber: integer('version_number').notNull(),
  content: text('content').notNull(),
  title: text('title').notNull(),
  summary: text('summary'),
  status: text('status'),
  message: text('message'),
  authorName: text('author_name').notNull(),
  type: text('type').notNull().default('manual'),
  contentHash: text('content_hash'),
  wordCount: integer('word_count'),
  charCount: integer('char_count'),
  branchId: text('branch_id'),
  parentVersionId: text('parent_version_id'),
  tags: text('tags', { mode: 'json' }).$type<string[]>(),
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown>>(),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

/**
 * Branches table
 */
export const branches = sqliteTable('branches', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  chapterId: text('chapter_id'), // For backward compatibility with feature layer
  name: text('name').notNull(),
  description: text('description'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(false),
  parentVersionId: text('parent_version_id'),
  color: text('color'),
  createdFrom: text('created_from'),
  createdBy: text('created_by').notNull(),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

/**
 * Type inference helpers
 */
export type ChapterVersionRow = typeof chapterVersions.$inferSelect;
export type NewChapterVersionRow = typeof chapterVersions.$inferInsert;
export type BranchRow = typeof branches.$inferSelect;
export type NewBranchRow = typeof branches.$inferInsert;
