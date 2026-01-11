/**
 * Drizzle ORM schema for publishing analytics tables
 * Stores publishing metrics, platform status, and export history
 */
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

import { projects } from './projects';

/**
 * Publishing metrics table
 */
export const publishingMetrics = sqliteTable('publishing_metrics', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  platform: text('platform').notNull(), // 'kdp' | 'draft2digital' | 'ingramspark' | 'smashwords' | 'custom'
  metricType: text('metric_type').notNull(), // 'sales' | 'downloads' | 'reads' | 'revenue' | 'reviews'
  value: real('value').notNull(),
  unit: text('unit'), // 'count' | 'usd' | 'eur' | 'pages'
  period: text('period'), // 'daily' | 'weekly' | 'monthly' | 'all-time'
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown>>(),
  recordedAt: text('recorded_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

/**
 * Platform status table
 */
export const platformStatus = sqliteTable('platform_status', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  platform: text('platform').notNull(),
  status: text('status').notNull(), // 'not-configured' | 'configured' | 'pending' | 'published' | 'error'
  publishedUrl: text('published_url'),
  lastSyncedAt: text('last_synced_at'),
  errorMessage: text('error_message'),
  configuration: text('configuration', { mode: 'json' }).$type<Record<string, unknown>>(),
  metrics: text('metrics', { mode: 'json' }).$type<{
    views?: number;
    downloads?: number;
    revenue?: number;
    rating?: number;
  }>(),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

/**
 * Export history table
 */
export const exportHistory = sqliteTable('export_history', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  format: text('format').notNull(), // 'epub' | 'pdf' | 'mobi' | 'docx' | 'markdown'
  status: text('status').notNull(), // 'pending' | 'processing' | 'completed' | 'failed'
  fileUrl: text('file_url'),
  fileSize: integer('file_size'),
  errorMessage: text('error_message'),
  metadata: text('metadata', { mode: 'json' }).$type<{
    includeImages?: boolean;
    includeToc?: boolean;
    customCss?: boolean;
    version?: string;
  }>(),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  completedAt: text('completed_at'),
});

/**
 * Type inference helpers
 */
export type PublishingMetricRow = typeof publishingMetrics.$inferSelect;
export type NewPublishingMetricRow = typeof publishingMetrics.$inferInsert;
export type PlatformStatusRow = typeof platformStatus.$inferSelect;
export type NewPlatformStatusRow = typeof platformStatus.$inferInsert;
export type ExportHistoryRow = typeof exportHistory.$inferSelect;
export type NewExportHistoryRow = typeof exportHistory.$inferInsert;
