/**
 * Drizzle ORM schema for user_identity table
 * Stores anonymous user and device identifiers
 */
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * User identity table schema
 * Stores generated user/device IDs - one row per device
 */
export const userIdentity = sqliteTable('user_identity', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  deviceId: text('device_id').notNull(),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

/**
 * Type inference helpers
 */
export type UserIdentityRow = typeof userIdentity.$inferSelect;
export type NewUserIdentityRow = typeof userIdentity.$inferInsert;
