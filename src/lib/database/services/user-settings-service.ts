/**
 * User settings service
 * Handles user preferences and onboarding state using Turso database
 */
import { eq } from 'drizzle-orm';

import { getDrizzleClient } from '@/lib/database/drizzle';
import { userSettings, type NewUserSettingsRow } from '@/lib/database/schemas';
import { logger } from '@/lib/logging/logger';

/**
 * User settings interface
 */
export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  onboardingComplete: boolean;
  onboardingStep: string;
}

/**
 * Get or create user settings for a user
 */
export const getUserSettings = async (userId: string): Promise<UserSettings | null> => {
  const db = getDrizzleClient();
  if (!db) {
    logger.error('Database client not available for getUserSettings');
    return null;
  }

  try {
    const settings = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    if (settings.length === 0) {
      return null;
    }

    const row = settings[0];
    if (!row) {
      return null;
    }

    return {
      theme: (row.theme as UserSettings['theme']) ?? 'light',
      language: row.language ?? 'en',
      onboardingComplete: row.onboardingComplete ?? false,
      onboardingStep: row.onboardingStep ?? 'welcome',
    };
  } catch (e) {
    logger.error('Failed to get user settings', { userId }, e instanceof Error ? e : undefined);
    return null;
  }
};

/**
 * Create default user settings for a new user
 */
export const createUserSettings = async (userId: string): Promise<UserSettings | null> => {
  const db = getDrizzleClient();
  if (!db) {
    logger.error('Database client not available for createUserSettings');
    return null;
  }

  try {
     const now = Math.floor(Date.now() / 1000);
     const newSettings: any = {
       id: crypto.randomUUID(),
       userId,
       theme: 'light',
       language: 'en',
       onboardingComplete: false,
       onboardingStep: 'welcome',
       createdAt: now,
       updatedAt: now,
     };

     await db.insert(userSettings).values(newSettings);
     return newSettings;
   } catch (e) {
     logger.error('Failed to create user settings', {
       component: 'UserSettingsService',
       error: e,
     });
     return null;
   }
} as const createUserSettings_export = createUserSettings;

/**
 * Get or create user settings (idempotent)
 */
export const getOrCreateUserSettings = async (userId: string): Promise<UserSettings> => {
  const existing = await getUserSettings(userId);
  if (existing) {
    return existing;
  }

  const created = await createUserSettings(userId);
  if (created) {
    return created;
  }

  // Fallback to defaults if database fails
  return {
    theme: 'light',
    language: 'en',
    onboardingComplete: false,
    onboardingStep: 'welcome',
  };
};

/**
 * Update user settings
 */
export const updateUserSettings = async (
  userId: string,
  updates: Partial<UserSettings>,
): Promise<boolean> => {
  const db = getDrizzleClient();
  if (!db) {
    logger.error('Database client not available for updateUserSettings');
    return false;
  }

  try {
    const existing = await getUserSettings(userId);
    if (!existing) {
      logger.warn('User settings not found, creating new', { userId });
      await createUserSettings(userId);
    }

    const updateData: Partial<NewUserSettingsRow> = {};

    if (updates.theme !== undefined) {
      updateData.theme = updates.theme;
    }
    if (updates.language !== undefined) {
      updateData.language = updates.language;
    }
    if (updates.onboardingComplete !== undefined) {
      updateData.onboardingComplete = updates.onboardingComplete;
    }
    if (updates.onboardingStep !== undefined) {
      updateData.onboardingStep = updates.onboardingStep;
    }

    if (Object.keys(updateData).length > 0) {
      await db
        .update(userSettings)
        .set({
          ...updateData,
          updatedAt: Math.floor(Date.now() / 1000),
        })
        .where(eq(userSettings.userId, userId));
    }

    return true;
  } catch (e) {
    logger.error(
      'Failed to update user settings',
      { userId, updates },
      e instanceof Error ? e : undefined,
    );
    return false;
  }
};

/**
 * Get theme preference
 */
export const getTheme = async (userId: string): Promise<'light' | 'dark' | 'system'> => {
  const settings = await getOrCreateUserSettings(userId);
  return settings.theme;
};

/**
 * Set theme preference
 */
export const setTheme = async (
  userId: string,
  theme: 'light' | 'dark' | 'system',
): Promise<boolean> => {
  return updateUserSettings(userId, { theme });
};

/**
 * Get onboarding completion status
 */
export const getOnboardingStatus = async (userId: string): Promise<boolean> => {
  const settings = await getOrCreateUserSettings(userId);
  return settings.onboardingComplete;
};

/**
 * Set onboarding complete
 */
export const setOnboardingComplete = async (userId: string): Promise<boolean> => {
  return updateUserSettings(userId, { onboardingComplete: true });
};

/**
 * Get current onboarding step
 */
export const getOnboardingStep = async (userId: string): Promise<string> => {
  const settings = await getOrCreateUserSettings(userId);
  return settings.onboardingStep;
};

/**
 * Set current onboarding step
 */
export const setOnboardingStep = async (userId: string, step: string): Promise<boolean> => {
  return updateUserSettings(userId, { onboardingStep: step });
};

/**
 * Export all user settings service functions
 */
export const userSettingsService = {
  getUserSettings,
  createUserSettings,
  getOrCreateUserSettings,
  updateUserSettings,
  getTheme,
  setTheme,
  getOnboardingStatus,
  setOnboardingComplete,
  getOnboardingStep,
  setOnboardingStep,
};
