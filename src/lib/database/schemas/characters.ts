/**
 * Drizzle ORM schema for characters table
 * Stores character information and relationships
 */
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

import { projects } from './projects';

/**
 * Characters table schema
 */
export const characters = sqliteTable('characters', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  role: text('role').notNull(), // 'protagonist' | 'antagonist' | 'supporting' | 'minor'
  description: text('description'),
  personality: text('personality', { mode: 'json' }).$type<string[]>(),
  background: text('background'),
  goals: text('goals', { mode: 'json' }).$type<string[]>(),
  conflicts: text('conflicts', { mode: 'json' }).$type<string[]>(),
  arc: text('arc'),
  appearance: text('appearance'),
  age: integer('age'),
  occupation: text('occupation'),
  skills: text('skills', { mode: 'json' }).$type<string[]>(),
  weaknesses: text('weaknesses', { mode: 'json' }).$type<string[]>(),
  relationships: text('relationships', { mode: 'json' }).$type<
    Array<{
      id: string;
      characterAId: string;
      characterBId: string;
      type: 'family' | 'romantic' | 'friendship' | 'rivalry' | 'mentor-student' | 'enemy' | 'ally';
      description: string;
      strength: number;
    }>
  >(),
  notes: text('notes'),
  imageUrl: text('image_url'),
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
export type CharacterRow = typeof characters.$inferSelect;
export type NewCharacterRow = typeof characters.$inferInsert;
