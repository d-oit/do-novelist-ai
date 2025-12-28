/**
 * Drizzle ORM schema for chapters table
 * Matches existing Turso database structure
 */
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

import { projects } from './projects';

/**
 * Chapters table schema
 * Child entity of projects, stores chapter content
 */
export const chapters = sqliteTable('chapters', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  orderIndex: integer('order_index').notNull(),
  title: text('title').notNull(),
  summary: text('summary'),
  content: text('content'),
  status: text('status').notNull().default('pending'),
});

/**
 * Type inference helpers
 */
export type ChapterRow = typeof chapters.$inferSelect;
export type NewChapterRow = typeof chapters.$inferInsert;
