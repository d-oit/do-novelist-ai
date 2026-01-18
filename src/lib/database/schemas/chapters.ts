/**
 * Drizzle ORM schema for chapters table
 * Matches ChapterSchema type definition
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
  // Enhanced metadata fields
  wordCount: integer('word_count').notNull().default(0),
  characterCount: integer('character_count').notNull().default(0),
  estimatedReadingTime: integer('estimated_reading_time').notNull().default(0),
  tags: text('tags').notNull().default(''),
  notes: text('notes'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  // AI generation metadata
  generationPrompt: text('generation_prompt'),
  aiModel: text('ai_model'),
  generationSettings: text('generation_settings').$type<{
    temperature: number;
    maxTokens: number;
    topP: number;
  }>(),
  plotPoints: text('plot_points'),
  characters: text('characters'),
  locations: text('locations'),
  scenes: text('scenes'),
  // Optional extended metadata
  illustration: text('illustration'),
});

/**
 * Type inference helpers
 */
export type ChapterRow = typeof chapters.$inferSelect;
export type NewChapterRow = typeof chapters.$inferInsert;
