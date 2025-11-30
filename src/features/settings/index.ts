/**
 * Settings Feature - Public API
 *
 * This is the public export boundary for the settings feature.
 * Only import from this file when using the settings feature from other parts of the app.
 */

// Components
export { default as SettingsView } from './components/SettingsView';

// Hooks
export { useSettings, selectCategorySettings } from './hooks/useSettings';

// Services
export { settingsService } from './services/settingsService';

// Types
export type { Settings, Theme, AIModel, SettingsCategory, SettingsValidationResult } from './types';

export { SettingsSchema, DEFAULT_SETTINGS, validateSettings, isTheme, isAIModel } from './types';
