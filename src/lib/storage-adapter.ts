/**
 * Storage Adapter
 * Provides a unified interface for storage operations
 * Automatically uses Turso when available, falls back to localStorage for compatibility
 */
import { getDrizzleClient } from './database/drizzle';
import type { KVNamespace } from './database/schemas/key-value-store';
import { kvService, KV_NAMESPACES } from './database/services/key-value-service';
import { logger } from './logging/logger';

/**
 * Storage adapter that uses Turso with localStorage fallback
 */
export class StorageAdapter {
  /**
   * Check if Turso is available
   */
  private useTurso(): boolean {
    return getDrizzleClient() !== null;
  }

  /**
   * Get a value from storage
   */
  async get<T = unknown>(namespace: KVNamespace, key: string, userId?: string): Promise<T | null> {
    if (this.useTurso()) {
      return kvService.get<T>(namespace, key, userId);
    }

    // Fallback to localStorage
    if (typeof window === 'undefined') return null;

    try {
      const storageKey = userId
        ? `novelist_${namespace}_${key}_${userId}`
        : `novelist_${namespace}_${key}`;
      const value = localStorage.getItem(storageKey);
      if (value === null) return null;

      try {
        return JSON.parse(value) as T;
      } catch {
        return value as T;
      }
    } catch (error) {
      logger.error(
        'Failed to get value from localStorage fallback',
        { component: 'storage-adapter', namespace, key },
        error instanceof Error ? error : undefined,
      );
      return null;
    }
  }

  /**
   * Set a value in storage
   */
  async set<T = unknown>(
    namespace: KVNamespace,
    key: string,
    value: T,
    userId?: string,
    expiresAt?: Date,
  ): Promise<void> {
    if (this.useTurso()) {
      return kvService.set<T>(namespace, key, value, userId, expiresAt);
    }

    // Fallback to localStorage
    if (typeof window === 'undefined') return;

    try {
      const storageKey = userId
        ? `novelist_${namespace}_${key}_${userId}`
        : `novelist_${namespace}_${key}`;
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch (error) {
      logger.error(
        'Failed to set value in localStorage fallback',
        { component: 'storage-adapter', namespace, key },
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Delete a value from storage
   */
  async delete(namespace: KVNamespace, key: string, userId?: string): Promise<void> {
    if (this.useTurso()) {
      return kvService.delete(namespace, key, userId);
    }

    // Fallback to localStorage
    if (typeof window === 'undefined') return;

    try {
      const storageKey = userId
        ? `novelist_${namespace}_${key}_${userId}`
        : `novelist_${namespace}_${key}`;
      localStorage.removeItem(storageKey);
    } catch (error) {
      logger.error(
        'Failed to delete value from localStorage fallback',
        { component: 'storage-adapter', namespace, key },
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Get all values in a namespace
   */
  async getAll<T = unknown>(namespace: KVNamespace, userId?: string): Promise<Record<string, T>> {
    if (this.useTurso()) {
      return kvService.getAll<T>(namespace, userId);
    }

    // Fallback to localStorage
    if (typeof window === 'undefined') return {};

    try {
      const prefix = userId ? `novelist_${namespace}_` : `novelist_${namespace}_`;
      const data: Record<string, T> = {};

      for (let i = 0; i < localStorage.length; i++) {
        const storageKey = localStorage.key(i);
        if (storageKey && storageKey.startsWith(prefix)) {
          const value = localStorage.getItem(storageKey);
          if (value) {
            // Extract the key name
            const key = storageKey.substring(prefix.length);
            try {
              data[key] = JSON.parse(value) as T;
            } catch {
              data[key] = value as T;
            }
          }
        }
      }

      return data;
    } catch (error) {
      logger.error(
        'Failed to get all values from localStorage fallback',
        { component: 'storage-adapter', namespace },
        error instanceof Error ? error : undefined,
      );
      return {};
    }
  }

  /**
   * Clear all values in a namespace
   */
  async clearNamespace(namespace: KVNamespace, userId?: string): Promise<void> {
    if (this.useTurso()) {
      return kvService.clearNamespace(namespace, userId);
    }

    // Fallback to localStorage
    if (typeof window === 'undefined') return;

    try {
      const prefix = userId ? `novelist_${namespace}_` : `novelist_${namespace}_`;
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const storageKey = localStorage.key(i);
        if (storageKey && storageKey.startsWith(prefix)) {
          keysToRemove.push(storageKey);
        }
      }

      for (const key of keysToRemove) {
        localStorage.removeItem(key);
      }
    } catch (error) {
      logger.error(
        'Failed to clear namespace in localStorage fallback',
        { component: 'storage-adapter', namespace },
        error instanceof Error ? error : undefined,
      );
    }
  }
}

/**
 * Singleton instance
 */
export const storageAdapter = new StorageAdapter();

/**
 * Export namespace constants for convenience
 */
export { KV_NAMESPACES };
