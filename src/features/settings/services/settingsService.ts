/**
 * Settings Service
 *
 * Handles localStorage persistence for application settings
 */

import { DEFAULT_SETTINGS, validateSettings } from '@/types';
import { type Settings } from '@/types';

const STORAGE_KEY = 'novelist-settings';

class SettingsService {
  /**
   * Load settings from localStorage
   */
  public load(): Settings {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);

      if (stored === null || stored.length === 0) {
        return DEFAULT_SETTINGS;
      }

      const parsed: unknown = JSON.parse(stored);
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
  public save(settings: Settings): void {
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
  public reset(): Settings {
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
  public export(): string {
    const settings = this.load();
    return JSON.stringify(settings, null, 2);
  }

  /**
   * Import settings from JSON
   */
  public import(json: string): Settings {
    try {
      const parsed: unknown = JSON.parse(json);
      const validation = validateSettings(parsed);

      if (!validation.isValid || !validation.data) {
        throw new Error('Invalid settings JSON');
      }

      this.save(validation.data);
      return validation.data;
    } catch (error) {
      console.error('Failed to import settings:', error);
      throw error;
    }
  }

  /**
   * Get a specific setting value
   */
  public get<K extends keyof Settings>(key: K): Settings[K] {
    const settings = this.load();
    return settings[key];
  }

  /**
   * Update a specific setting value
   */
  public set<K extends keyof Settings>(key: K, value: Settings[K]): void {
    const settings = this.load();
    const updated = { ...settings, [key]: value };
    this.save(updated);
  }
}

export const settingsService = new SettingsService();
