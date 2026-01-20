/**
 * Drizzle ORM schema for key_value_store table
 * Generic key-value store to replace localStorage usage
 * Stores JSON-serialized data with namespacing support
 */
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

/**
 * Key-value store table schema
 * Replaces localStorage with namespaced, typed storage
 * 
 * Namespaces:
 * - user: user preferences, theme, userId
 * - ai: AI configuration, preferences, cache
 * - writing-assistant: writing assistant config and state
 * - onboarding: onboarding progress
 * - settings: general settings
 * - world-building: world building data
 * - plot-feedback: plot engine feedback
 * - models: model cache and metadata
 * - db-config: database configuration
 * - projects: project-related data (when not using cloud)
 */
export const keyValueStore = sqliteTable('key_value_store', {
  id: text('id').primaryKey(),
  namespace: text('namespace').notNull(), // e.g., 'user', 'ai', 'settings'
  key: text('key').notNull(), // e.g., 'theme', 'userId', 'preferences'
  value: text('value').notNull(), // JSON-serialized data
  userId: text('user_id'), // Optional: associate with user
  expiresAt: integer('expires_at', { mode: 'timestamp' }), // Optional: for cache expiration
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * AI preferences table schema
 * Stores user-specific AI model preferences and configuration
 */
export const aiPreferences = sqliteTable('ai_preferences', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().unique(),
  provider: text('provider'), // 'openrouter', 'openai', etc.
  model: text('model'),
  temperature: integer('temperature'), // Store as integer (e.g., 70 = 0.7)
  maxTokens: integer('max_tokens'),
  preferences: text('preferences'), // JSON-serialized additional preferences
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * Type inference helpers
 */
export type KeyValueStoreRow = typeof keyValueStore.$inferSelect;
export type NewKeyValueStoreRow = typeof keyValueStore.$inferInsert;
export type AIPreferencesRow = typeof aiPreferences.$inferSelect;
export type NewAIPreferencesRow = typeof aiPreferences.$inferInsert;

/**
 * Helper type for namespace constants
 */
export const KV_NAMESPACES = {
  USER: 'user',
  AI: 'ai',
  WRITING_ASSISTANT: 'writing-assistant',
  ONBOARDING: 'onboarding',
  SETTINGS: 'settings',
  WORLD_BUILDING: 'world-building',
  PLOT_FEEDBACK: 'plot-feedback',
  MODELS: 'models',
  DB_CONFIG: 'db-config',
  PROJECTS: 'projects',
} as const;

export type KVNamespace = (typeof KV_NAMESPACES)[keyof typeof KV_NAMESPACES];
