/**
 * Settings Feature Type Definitions
 *
 * Feature-local types for application settings
 */

import { z } from 'zod';

/**
 * Theme options
 */
export type Theme = 'light' | 'dark' | 'system';

/**
 * AI Model options
 * Note: This conflicts with AIModel in ./ai-config and ../features/editor/types
 * Use the one from ./ai-config for consistency
 */
// export type AIModel = 'gemini-pro' | 'gemini-flash' | 'gpt-4' | 'claude-3';

/**
 * Application settings schema
 */
export const SettingsSchema = z.object({
  // Appearance
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  fontSize: z.number().min(12).max(24).default(16),
  fontFamily: z.enum(['system', 'serif', 'mono']).default('system'),
  compactMode: z.boolean().default(false),

  // AI Settings
  aiModel: z.enum(['gemini-pro', 'gemini-flash', 'gpt-4', 'claude-3']).default('gemini-pro'),
  aiTemperature: z.number().min(0).max(2).default(0.7),
  aiMaxTokens: z.number().min(100).max(4096).default(2048),
  enableAIAssistance: z.boolean().default(true),

  // Context Injection (RAG Phase 1)
  enableContextInjection: z.boolean().default(true),
  contextTokenLimit: z.number().min(1000).max(10000).default(6000),
  contextIncludeCharacters: z.boolean().default(true),
  contextIncludeWorldBuilding: z.boolean().default(true),
  contextIncludeTimeline: z.boolean().default(true),
  contextIncludeChapters: z.boolean().default(true),

  // Editor Preferences
  autoSave: z.boolean().default(true),
  autoSaveInterval: z.number().min(30).max(600).default(60), // seconds
  spellCheck: z.boolean().default(true),
  wordWrap: z.boolean().default(true),
  showWordCount: z.boolean().default(true),
  showReadingTime: z.boolean().default(true),

  // Writing Goals
  dailyWordGoal: z.number().min(0).max(10000).default(500),
  enableGoalNotifications: z.boolean().default(false),
  goalStreakTracking: z.boolean().default(true),

  // Privacy & Data
  analyticsEnabled: z.boolean().default(true),
  crashReporting: z.boolean().default(true),
  dataBackupEnabled: z.boolean().default(true),
  backupFrequency: z.enum(['daily', 'weekly', 'monthly']).default('weekly'),

  // Experimental Features
  enableBetaFeatures: z.boolean().default(false),
  enableDevMode: z.boolean().default(false),
});

export type Settings = z.infer<typeof SettingsSchema>;

/**
 * Settings category for UI organization
 */
export type SettingsCategory =
  | 'appearance'
  | 'ai'
  | 'editor'
  | 'goals'
  | 'privacy'
  | 'experimental';

/**
 * Settings validation result
 */
export interface SettingsValidationResult {
  isValid: boolean;
  errors?: z.ZodError;
  data?: Settings;
}

/**
 * Default settings
 */
export const DEFAULT_SETTINGS: Settings = {
  // Appearance
  theme: 'system',
  fontSize: 16,
  fontFamily: 'system',
  compactMode: false,

  // AI Settings
  aiModel: 'gemini-pro',
  aiTemperature: 0.7,
  aiMaxTokens: 2048,
  enableAIAssistance: true,

  // Context Injection (RAG Phase 1)
  enableContextInjection: true,
  contextTokenLimit: 6000,
  contextIncludeCharacters: true,
  contextIncludeWorldBuilding: true,
  contextIncludeTimeline: true,
  contextIncludeChapters: true,

  // Editor Preferences
  autoSave: true,
  autoSaveInterval: 60,
  spellCheck: true,
  wordWrap: true,
  showWordCount: true,
  showReadingTime: true,

  // Writing Goals
  dailyWordGoal: 500,
  enableGoalNotifications: false,
  goalStreakTracking: true,

  // Privacy & Data
  analyticsEnabled: true,
  crashReporting: true,
  dataBackupEnabled: true,
  backupFrequency: 'weekly',

  // Experimental Features
  enableBetaFeatures: false,
  enableDevMode: false,
};

/**
 * Type guards and validators
 */
export function validateSettings(data: unknown): SettingsValidationResult {
  try {
    const validated = SettingsSchema.parse(data);
    return {
      isValid: true,
      data: validated,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error,
      };
    }
    throw error;
  }
}

export function isTheme(value: string): value is Theme {
  return ['light', 'dark', 'system'].includes(value);
}

// export function isAIModel(value: string): value is AIModel {
//   return ['gemini-pro', 'gemini-flash', 'gpt-4', 'claude-3'].includes(value);
// }
