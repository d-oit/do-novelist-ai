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
  deviceId: text('device_id'),
  theme: text('theme').notNull().default('system'),
  language: text('language').notNull().default('en'),
  onboardingComplete: integer('onboarding_complete', { mode: 'boolean' }).notNull().default(false),
  onboardingStep: text('onboarding_step').default('welcome'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Model cache table schema
 * Stores cached model data with expiration
 */
export const modelCache = sqliteTable('model_cache', {
  id: text('id').primaryKey(),
  cacheKey: text('cache_key').notNull().unique(),
  data: text('data').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Device registry table schema
 * Tracks user devices for sync
 */
export const deviceRegistry = sqliteTable('device_registry', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  deviceId: text('device_id').notNull().unique(),
  lastSeenAt: integer('last_seen_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Type inference helpers
 */
export type UserSettingsRow = typeof userSettings.$inferSelect;
export type NewUserSettingsRow = typeof userSettings.$inferInsert;
export type ModelCacheRow = typeof modelCache.$inferSelect;
export type NewModelCacheRow = typeof modelCache.$inferInsert;
export type DeviceRegistryRow = typeof deviceRegistry.$inferSelect;
export type NewDeviceRegistryRow = typeof deviceRegistry.$inferInsert;
