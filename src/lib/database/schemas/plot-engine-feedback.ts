/**
 * Drizzle ORM schema for plot_engine_feedback table
 * Stores user feedback for plot engine
 */
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * Feedback content interface
 */
export interface FeedbackContent {
  category?: string;
  message: string;
  context?: string;
  severity?: 'low' | 'medium' | 'high';
  metadata?: Record<string, unknown>;
  [key: string]: unknown; // Index signature for JSON storage
}

/**
 * Plot engine feedback table schema
 * Primary entity for storing plot engine feedback
 */
export const plotEngineFeedback = sqliteTable('plot_engine_feedback', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  projectId: text('project_id'),
  feedbackType: text('feedback_type').notNull(),
  content: text('content', { mode: 'json' }).$type<FeedbackContent>(),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

/**
 * Type inference helpers
 */
export type PlotEngineFeedbackRow = typeof plotEngineFeedback.$inferSelect;
export type NewPlotEngineFeedbackRow = typeof plotEngineFeedback.$inferInsert;
