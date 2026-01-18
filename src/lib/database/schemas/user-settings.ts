/**
 * Drizzle ORM schema for user_settings table
 * Stores user preferences and onboarding state
 */
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

/**
 * User settings table schema
 * Primary entity for storing user-specific settings and state
 */
export const userSettings = sqliteTable('user_settings', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().unique(),
  theme: text('theme').notNull().default('light'),
  language: text('language').notNull().default('en'),
  onboardingComplete: integer('onboarding_complete', { mode: 'boolean' }).notNull().default(false),
  onboardingStep: text('onboarding_step').default('welcome'),
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
export type UserSettingsRow = typeof userSettings.$inferSelect;
export type NewUserSettingsRow = typeof userSettings.$inferInsert;
