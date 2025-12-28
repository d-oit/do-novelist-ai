/**
 * Drizzle ORM schema for projects table
 * Matches existing Turso database structure
 */
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

import type { Project } from '@/types';
import type { WorldState, ProjectSettings } from '@/types/schemas';

/**
 * Projects table schema
 * Primary entity for storing book projects
 */
export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  idea: text('idea').notNull(),
  style: text('style').notNull(),
  coverImage: text('cover_image'),
  worldState: text('world_state', { mode: 'json' }).$type<WorldState>().notNull(),
  status: text('status').notNull().default('Draft'),
  language: text('language').notNull().default('en'),
  targetWordCount: integer('target_word_count').notNull().default(50000),
  settings: text('settings', { mode: 'json' }).$type<ProjectSettings>(),
  timeline: text('timeline', { mode: 'json' }).$type<Project['timeline']>(),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

/**
 * Type inference helpers
 */
export type ProjectRow = typeof projects.$inferSelect;
export type NewProjectRow = typeof projects.$inferInsert;
