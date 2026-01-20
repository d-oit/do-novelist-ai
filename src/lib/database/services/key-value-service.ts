/**
 * Key-Value Store Service
 * Provides a localStorage-like API backed by Turso database
 * Supports both local file database and cloud Turso
 */
import { eq, and } from 'drizzle-orm';

import { getDrizzleClient } from '@/lib/database/drizzle';
import {
  keyValueStore,
  aiPreferences,
  KV_NAMESPACES,
  type KVNamespace,
  type NewKeyValueStoreRow,
  type NewAIPreferencesRow,
} from '@/lib/database/schemas/key-value-store';
import { logger } from '@/lib/logging/logger';

/**
 * Generate a unique ID for key-value store entries
 */
const generateId = (namespace: string, key: string, userId?: string): string => {
  const parts = [namespace, key];
  if (userId) parts.push(userId);
  return parts.join(':');
};

/**
 * Key-Value Store Service
 * Replaces localStorage with database-backed storage
 */
export class KeyValueService {
  /**
   * Get a value from the key-value store
   */
  async get<T = unknown>(namespace: KVNamespace, key: string, userId?: string): Promise<T | null> {
    try {
      const client = getDrizzleClient();
      if (!client) {
        logger.warn('No Drizzle client available, using memory fallback', {
          component: 'kv-service',
        });
        return null;
      }

      const id = generateId(namespace, key, userId);
      const result = await client
        .select()
        .from(keyValueStore)
        .where(eq(keyValueStore.id, id))
        .limit(1);

      if (result.length === 0) {
        return null;
      }

      const row = result[0];
      if (!row) {
        return null;
      }

      // Check expiration
      if (row.expiresAt && row.expiresAt < new Date()) {
        // Expired, delete it
        await this.delete(namespace, key, userId);
        return null;
      }

      return JSON.parse(row.value) as T;
    } catch (error) {
      logger.error(
        'Failed to get value from key-value store',
        { component: 'kv-service', namespace, key, userId },
        error instanceof Error ? error : undefined,
      );
      return null;
    }
  }

  /**
   * Set a value in the key-value store
   */
  async set<T = unknown>(
    namespace: KVNamespace,
    key: string,
    value: T,
    userId?: string,
    expiresAt?: Date,
  ): Promise<void> {
    try {
      const client = getDrizzleClient();
      if (!client) {
        logger.warn('No Drizzle client available, cannot set value', {
          component: 'kv-service',
        });
        return;
      }

      const id = generateId(namespace, key, userId);
      const now = new Date();

      const row: NewKeyValueStoreRow = {
        id,
        namespace,
        key,
        value: JSON.stringify(value),
        userId: userId ?? null,
        expiresAt: expiresAt ?? null,
        createdAt: now,
        updatedAt: now,
      };

      // Use INSERT OR REPLACE (upsert)
      await client
        .insert(keyValueStore)
        .values(row)
        .onConflictDoUpdate({
          target: keyValueStore.id,
          set: {
            value: row.value,
            expiresAt: row.expiresAt,
            updatedAt: now,
          },
        });

      logger.debug('Set value in key-value store', { component: 'kv-service', namespace, key });
    } catch (error) {
      logger.error(
        'Failed to set value in key-value store',
        { component: 'kv-service', namespace, key, userId },
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Delete a value from the key-value store
   */
  async delete(namespace: KVNamespace, key: string, userId?: string): Promise<void> {
    try {
      const client = getDrizzleClient();
      if (!client) {
        logger.warn('No Drizzle client available, cannot delete value', {
          component: 'kv-service',
        });
        return;
      }

      const id = generateId(namespace, key, userId);
      await client.delete(keyValueStore).where(eq(keyValueStore.id, id));

      logger.debug('Deleted value from key-value store', { component: 'kv-service', namespace, key });
    } catch (error) {
      logger.error(
        'Failed to delete value from key-value store',
        { component: 'kv-service', namespace, key, userId },
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Get all values in a namespace
   */
  async getAll<T = unknown>(namespace: KVNamespace, userId?: string): Promise<Record<string, T>> {
    try {
      const client = getDrizzleClient();
      if (!client) {
        logger.warn('No Drizzle client available, using memory fallback', {
          component: 'kv-service',
        });
        return {};
      }

      const conditions = userId
        ? and(eq(keyValueStore.namespace, namespace), eq(keyValueStore.userId, userId))
        : eq(keyValueStore.namespace, namespace);

      const results = await client.select().from(keyValueStore).where(conditions);

      const data: Record<string, T> = {};
      const now = new Date();

      for (const row of results) {
        // Skip expired entries
        if (row.expiresAt && row.expiresAt < now) {
          continue;
        }
        data[row.key] = JSON.parse(row.value) as T;
      }

      return data;
    } catch (error) {
      logger.error(
        'Failed to get all values from key-value store',
        { component: 'kv-service', namespace, userId },
        error instanceof Error ? error : undefined,
      );
      return {};
    }
  }

  /**
   * Clear all values in a namespace
   */
  async clearNamespace(namespace: KVNamespace, userId?: string): Promise<void> {
    try {
      const client = getDrizzleClient();
      if (!client) {
        logger.warn('No Drizzle client available, cannot clear namespace', {
          component: 'kv-service',
        });
        return;
      }

      const conditions = userId
        ? and(eq(keyValueStore.namespace, namespace), eq(keyValueStore.userId, userId))
        : eq(keyValueStore.namespace, namespace);

      await client.delete(keyValueStore).where(conditions);

      logger.debug('Cleared namespace in key-value store', { component: 'kv-service', namespace });
    } catch (error) {
      logger.error(
        'Failed to clear namespace in key-value store',
        { component: 'kv-service', namespace, userId },
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * AI Preferences methods
   */

  /**
   * Get AI preferences for a user
   */
  async getAIPreferences(userId: string): Promise<NewAIPreferencesRow | null> {
    try {
      const client = getDrizzleClient();
      if (!client) {
        return null;
      }

      const result = await client
        .select()
        .from(aiPreferences)
        .where(eq(aiPreferences.userId, userId))
        .limit(1);

      return result.length > 0 && result[0] ? result[0] : null;
    } catch (error) {
      logger.error(
        'Failed to get AI preferences',
        { component: 'kv-service', userId },
        error instanceof Error ? error : undefined,
      );
      return null;
    }
  }

  /**
   * Save AI preferences for a user
   */
  async saveAIPreferences(prefs: NewAIPreferencesRow): Promise<void> {
    try {
      const client = getDrizzleClient();
      if (!client) {
        return;
      }

      const now = new Date();
      await client
        .insert(aiPreferences)
        .values({ ...prefs, updatedAt: now })
        .onConflictDoUpdate({
          target: aiPreferences.userId,
          set: {
            provider: prefs.provider,
            model: prefs.model,
            temperature: prefs.temperature,
            maxTokens: prefs.maxTokens,
            preferences: prefs.preferences,
            updatedAt: now,
          },
        });

      logger.debug('Saved AI preferences', { component: 'kv-service', userId: prefs.userId });
    } catch (error) {
      logger.error(
        'Failed to save AI preferences',
        { component: 'kv-service', userId: prefs.userId },
        error instanceof Error ? error : undefined,
      );
    }
  }
}

/**
 * Singleton instance
 */
export const kvService = new KeyValueService();

/**
 * Export namespace constants for convenience
 */
export { KV_NAMESPACES };
