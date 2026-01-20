/**
 * Settings Management Hook
 *
 * Manages application settings with Zustand and localStorage persistence
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

import { settingsService } from '@/features/settings/services/settingsService';
import {
  DEFAULT_SETTINGS,
  validateSettings,
  type Settings,
  type SettingsCategory,
} from '@/features/settings/types';

interface SettingsState {
  // Data
  settings: Settings;

  // UI State
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  activeCategory: SettingsCategory;

  // Actions
  init: () => void;
  update: (updates: Partial<Settings>) => void;
  reset: () => void;
  resetCategory: (category: SettingsCategory) => void;
  setActiveCategory: (category: SettingsCategory) => void;
  clearError: () => void;
}

export const useSettings = create<SettingsState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        settings: DEFAULT_SETTINGS,
        isLoading: false,
        isSaving: false,
        error: null,
        activeCategory: 'appearance',

        // Initialize
        init: (): void => {
          set({ isLoading: true, error: null });
          void (async (): Promise<void> => {
            try {
              const settings = await settingsService.load();
              set({ settings, isLoading: false });

              // Apply theme immediately
              applyTheme(settings.theme);
            } catch (error) {
              set({
                error: error instanceof Error ? error.message : 'Failed to load settings',
                isLoading: false,
              });
            }
          })();
        },

        // Update settings
        update: (updates: Partial<Settings>): void => {
          set({ isSaving: true, error: null });
          try {
            const current = get().settings;
            const newSettings = { ...current, ...updates };

            // Validate before saving
            const validation = validateSettings(newSettings);
            if (!validation.isValid) {
              throw new Error('Invalid settings data');
            }

            void settingsService.save(newSettings);
            set({ settings: newSettings, isSaving: false });

            // Apply theme if changed
            if (updates.theme) {
              applyTheme(updates.theme);
            }

            // Apply font size if changed
            if (updates.fontSize != null && !isNaN(updates.fontSize) && updates.fontSize > 0) {
              applyFontSize(updates.fontSize);
            }
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to save settings',
              isSaving: false,
            });
          }
        },

        // Reset all settings to defaults
        reset: (): void => {
          set({ isSaving: true, error: null });
          try {
            void settingsService.save(DEFAULT_SETTINGS);
            set({ settings: DEFAULT_SETTINGS, isSaving: false });

            // Reapply defaults
            applyTheme(DEFAULT_SETTINGS.theme);
            applyFontSize(DEFAULT_SETTINGS.fontSize);
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to reset settings',
              isSaving: false,
            });
            throw error;
          }
        },

        // Reset specific category
        resetCategory: (category: SettingsCategory): void => {
          const categoryDefaults = getCategoryDefaults(category);
          get().update(categoryDefaults);
        },

        // Set active category for UI
        setActiveCategory: (category: SettingsCategory): void => {
          set({ activeCategory: category });
        },

        // Clear error
        clearError: (): void => {
          set({ error: null });
        },
      }),
      {
        name: 'settings-storage',
        partialize: state => ({
          settings: state.settings,
        }),
      },
    ),
    { name: 'SettingsStore' },
  ),
);

/**
 * Apply theme to document
 */
function applyTheme(theme: Settings['theme']): void {
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', prefersDark);
  } else {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }
}

/**
 * Apply font size to document
 */
function applyFontSize(fontSize: number): void {
  document.documentElement.style.fontSize = `${fontSize}px`;
}

/**
 * Get default values for a specific category
 */
function getCategoryDefaults(category: SettingsCategory): Partial<Settings> {
  switch (category) {
    case 'appearance':
      return {
        theme: DEFAULT_SETTINGS.theme,
        fontSize: DEFAULT_SETTINGS.fontSize,
        fontFamily: DEFAULT_SETTINGS.fontFamily,
        compactMode: DEFAULT_SETTINGS.compactMode,
      };
    case 'ai':
      return {
        aiModel: DEFAULT_SETTINGS.aiModel,
        aiTemperature: DEFAULT_SETTINGS.aiTemperature,
        aiMaxTokens: DEFAULT_SETTINGS.aiMaxTokens,
        enableAIAssistance: DEFAULT_SETTINGS.enableAIAssistance,
        enableContextInjection: DEFAULT_SETTINGS.enableContextInjection,
        contextTokenLimit: DEFAULT_SETTINGS.contextTokenLimit,
        contextIncludeCharacters: DEFAULT_SETTINGS.contextIncludeCharacters,
        contextIncludeWorldBuilding: DEFAULT_SETTINGS.contextIncludeWorldBuilding,
        contextIncludeTimeline: DEFAULT_SETTINGS.contextIncludeTimeline,
        contextIncludeChapters: DEFAULT_SETTINGS.contextIncludeChapters,
      };
    case 'editor':
      return {
        autoSave: DEFAULT_SETTINGS.autoSave,
        autoSaveInterval: DEFAULT_SETTINGS.autoSaveInterval,
        spellCheck: DEFAULT_SETTINGS.spellCheck,
        wordWrap: DEFAULT_SETTINGS.wordWrap,
        showWordCount: DEFAULT_SETTINGS.showWordCount,
        showReadingTime: DEFAULT_SETTINGS.showReadingTime,
      };
    case 'goals':
      return {
        dailyWordGoal: DEFAULT_SETTINGS.dailyWordGoal,
        enableGoalNotifications: DEFAULT_SETTINGS.enableGoalNotifications,
        goalStreakTracking: DEFAULT_SETTINGS.goalStreakTracking,
      };
    case 'privacy':
      return {
        analyticsEnabled: DEFAULT_SETTINGS.analyticsEnabled,
        crashReporting: DEFAULT_SETTINGS.crashReporting,
        dataBackupEnabled: DEFAULT_SETTINGS.dataBackupEnabled,
        backupFrequency: DEFAULT_SETTINGS.backupFrequency,
      };
    case 'experimental':
      return {
        enableBetaFeatures: DEFAULT_SETTINGS.enableBetaFeatures,
        enableDevMode: DEFAULT_SETTINGS.enableDevMode,
      };
    default:
      return {};
  }
}

/**
 * Selector: Get settings for a specific category
 */
export const selectCategorySettings = (
  _state: SettingsState,
  category: SettingsCategory,
): Partial<Settings> => {
  return getCategoryDefaults(category);
};
