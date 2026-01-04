/**
 * Drizzle ORM schema for vectors table
 * Stores vector embeddings for semantic search functionality
 */

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

import { projects } from './projects';

/**
 * Entity types that can be vectorized for semantic search
 */
export type VectorEntityType = 'chapter' | 'character' | 'world_building' | 'project';

/**
 * Embedding models supported
 */
export type EmbeddingModel = 'text-embedding-3-small' | 'text-embedding-3-large';

/**
 * Vectors table schema
 * Stores vector embeddings for semantic similarity search
 */
export const vectors = sqliteTable('vectors', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  entityType: text('entity_type', {
    enum: ['chapter', 'character', 'world_building', 'project'],
  }).notNull(),
  entityId: text('entity_id').notNull(),
  content: text('content').notNull(),
  embedding: text('embedding').notNull(),
  dimensions: integer('dimensions').notNull(),
  model: text('model').notNull(),
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
export type VectorRow = typeof vectors.$inferSelect;
export type NewVectorRow = typeof vectors.$inferInsert;

/**
 * Vector search result interface
 */
export interface VectorSearchResult {
  id: string;
  projectId: string;
  entityType: VectorEntityType;
  entityId: string;
  content: string;
  similarity: number;
}
