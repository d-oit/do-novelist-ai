/**
 * Settings Service
 *
 * Handles localStorage persistence for application settings
 */

import { DEFAULT_SETTINGS, validateSettings } from '../types';
import { type Settings } from '../types';

const STORAGE_KEY = 'novelist-settings';

class SettingsService {
  /**
   * Load settings from localStorage
   */
  async load(): Promise<Settings> {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);

      if (!stored) {
        return DEFAULT_SETTINGS;
      }

      const parsed = JSON.parse(stored);
      const validation = validateSettings(parsed);

      if (!validation.isValid || !validation.data) {
        console.warn('Invalid settings in storage, using defaults');
        return DEFAULT_SETTINGS;
      }

      // Merge with defaults to handle new settings added in updates
      return {
        ...DEFAULT_SETTINGS,
        ...validation.data,
      };
    } catch (error) {
      console.error('Failed to load settings:', error);
      return DEFAULT_SETTINGS;
    }
  }

  /**
   * Save settings to localStorage
   */
  async save(settings: Settings): Promise<void> {
    try {
      const validation = validateSettings(settings);

      if (!validation.isValid) {
        throw new Error('Invalid settings data');
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }

  /**
   * Reset settings to defaults
   */
  async reset(): Promise<Settings> {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return DEFAULT_SETTINGS;
    } catch (error) {
      console.error('Failed to reset settings:', error);
      throw error;
    }
  }

  /**
   * Export settings as JSON
   */
  async export(): Promise<string> {
    const settings = await this.load();
    return JSON.stringify(settings, null, 2);
  }

  /**
   * Import settings from JSON
   */
  async import(json: string): Promise<Settings> {
    try {
      const parsed = JSON.parse(json);
      const validation = validateSettings(parsed);

      if (!validation.isValid || !validation.data) {
        throw new Error('Invalid settings JSON');
      }

      await this.save(validation.data);
      return validation.data;
    } catch (error) {
      console.error('Failed to import settings:', error);
      throw error;
    }
  }

  /**
   * Get a specific setting value
   */
  async get<K extends keyof Settings>(key: K): Promise<Settings[K]> {
    const settings = await this.load();
    return settings[key];
  }

  /**
   * Update a specific setting value
   */
  async set<K extends keyof Settings>(key: K, value: Settings[K]): Promise<void> {
    const settings = await this.load();
    const updated = { ...settings, [key]: value };
    await this.save(updated);
  }
}

export const settingsService = new SettingsService();
