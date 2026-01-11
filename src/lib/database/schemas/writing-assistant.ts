/**
 * Drizzle ORM schema for writing assistant tables
 * Stores analysis history, user preferences, and suggestion feedback
 */
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

import { chapters } from './chapters';
import { projects } from './projects';

/**
 * Analysis history table
 */
export const analysisHistory = sqliteTable('analysis_history', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  chapterId: text('chapter_id')
    .notNull()
    .references(() => chapters.id, { onDelete: 'cascade' }),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  readabilityScore: real('readability_score').notNull(),
  engagementScore: real('engagement_score').notNull(),
  sentimentScore: real('sentiment_score').notNull(),
  paceScore: real('pace_score').notNull(),
  suggestionCount: integer('suggestion_count').notNull(),
  suggestionCategories: text('suggestion_categories', { mode: 'json' }).$type<string[]>(),
  acceptedSuggestions: integer('accepted_suggestions').notNull().default(0),
  dismissedSuggestions: integer('dismissed_suggestions').notNull().default(0),
  analysisDepth: text('analysis_depth').notNull(), // 'basic' | 'standard' | 'comprehensive'
  contentWordCount: integer('content_word_count').notNull(),
  timestamp: text('timestamp')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

/**
 * User writing preferences table
 */
export const userWritingPreferences = sqliteTable('user_writing_preferences', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  preferences: text('preferences', { mode: 'json' }).$type<{
    grammarLevel?: 'strict' | 'moderate' | 'lenient';
    stylePreference?: 'formal' | 'casual' | 'creative' | 'academic';
    suggestionFrequency?: 'high' | 'medium' | 'low';
    enableRealTimeAnalysis?: boolean;
    autoAcceptGrammar?: boolean;
    preferredTone?: string[];
    avoidedWords?: string[];
  }>(),
  lastSyncedAt: text('last_synced_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  deviceId: text('device_id').notNull(),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

/**
 * Suggestion feedback table
 */
export const suggestionFeedback = sqliteTable('suggestion_feedback', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  suggestionType: text('suggestion_type').notNull(),
  suggestionCategory: text('suggestion_category').notNull(),
  action: text('action').notNull(), // 'accepted' | 'dismissed' | 'ignored'
  context: text('context'),
  chapterId: text('chapter_id').references(() => chapters.id, { onDelete: 'set null' }),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'set null' }),
  timestamp: text('timestamp')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

/**
 * Writing goals table
 */
export const writingGoals = sqliteTable('writing_goals', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  goalType: text('goal_type').notNull(), // 'daily' | 'weekly' | 'monthly' | 'project'
  targetValue: integer('target_value').notNull(),
  currentValue: integer('current_value').notNull().default(0),
  unit: text('unit').notNull(), // 'words' | 'chapters' | 'hours'
  startDate: text('start_date').notNull(),
  endDate: text('end_date'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown>>(),
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
export type AnalysisHistoryRow = typeof analysisHistory.$inferSelect;
export type NewAnalysisHistoryRow = typeof analysisHistory.$inferInsert;
export type UserWritingPreferencesRow = typeof userWritingPreferences.$inferSelect;
export type NewUserWritingPreferencesRow = typeof userWritingPreferences.$inferInsert;
export type SuggestionFeedbackRow = typeof suggestionFeedback.$inferSelect;
export type NewSuggestionFeedbackRow = typeof suggestionFeedback.$inferInsert;
export type WritingGoalRow = typeof writingGoals.$inferSelect;
export type NewWritingGoalRow = typeof writingGoals.$inferInsert;
