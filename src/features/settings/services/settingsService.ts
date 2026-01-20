/**
 * Settings Service
 *
 * Handles localStorage persistence for application settings
 */

import { logger } from '@/lib/logging/logger';
import { storageAdapter, KV_NAMESPACES } from '@/lib/storage-adapter';
import { DEFAULT_SETTINGS, validateSettings } from '@/types';
import { type Settings } from '@/types';

class SettingsService {
  /**
   * Load settings from storage
   */
  public async load(): Promise<Settings> {
    try {
      const parsed = await storageAdapter.get<Settings>(KV_NAMESPACES.SETTINGS, 'general');

      if (!parsed) {
        return DEFAULT_SETTINGS;
      }
      const validation = validateSettings(parsed);

      if (!validation.isValid || !validation.data) {
        logger.warn('Invalid settings in storage, using defaults', {
          component: 'SettingsService',
        });
        return DEFAULT_SETTINGS;
      }

      // Merge with defaults to handle new settings added in updates
      return {
        ...DEFAULT_SETTINGS,
        ...validation.data,
      };
    } catch (error) {
      logger.error('Failed to load settings', {
        component: 'SettingsService',
        error,
      });
      return DEFAULT_SETTINGS;
    }
  }

  /**
   * Save settings to storage
   */
  public async save(settings: Settings): Promise<void> {
    try {
      const validation = validateSettings(settings);

      if (!validation.isValid) {
        throw new Error('Invalid settings data');
      }

      await storageAdapter.set(KV_NAMESPACES.SETTINGS, 'general', settings);
    } catch (error) {
      logger.error('Failed to save settings', {
        component: 'SettingsService',
        error,
      });
      throw error;
    }
  }

  /**
   * Reset settings to defaults
   */
  public async reset(): Promise<Settings> {
    try {
      await storageAdapter.delete(KV_NAMESPACES.SETTINGS, 'general');
      return DEFAULT_SETTINGS;
    } catch (error) {
      logger.error('Failed to reset settings', {
        component: 'SettingsService',
        error,
      });
      throw error;
    }
  }

  /**
   * Export settings as JSON
   */
  public async export(): Promise<string> {
    const settings = await this.load();
    return JSON.stringify(settings, null, 2);
  }

  /**
   * Import settings from JSON
   */
  public async import(json: string): Promise<Settings> {
    try {
      const parsed: unknown = JSON.parse(json);
      const validation = validateSettings(parsed);

      if (!validation.isValid || !validation.data) {
        throw new Error('Invalid settings JSON');
      }

      await this.save(validation.data);
      return validation.data;
    } catch (error) {
      logger.error('Failed to import settings', {
        component: 'SettingsService',
        error,
      });
      throw error;
    }
  }

  /**
   * Get a specific setting value
   */
  public async get<K extends keyof Settings>(key: K): Promise<Settings[K]> {
    const settings = await this.load();
    return settings[key];
  }

  /**
   * Update a specific setting value
   */
  public async set<K extends keyof Settings>(key: K, value: Settings[K]): Promise<void> {
    const settings = await this.load();
    const updated = { ...settings, [key]: value };
    await this.save(updated);
  }
}

export const settingsService = new SettingsService();
