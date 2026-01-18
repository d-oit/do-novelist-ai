/**
 * User settings service
 * Handles user preferences and onboarding state using Turso database
 */
import { eq } from 'drizzle-orm';

import { getDrizzleClient } from '@/lib/database/drizzle';
import { userSettings } from '@/lib/database/schemas';
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
    const now = new Date();
    await db.insert(userSettings).values({
      id: crypto.randomUUID(),
      userId,
      theme: 'light',
      language: 'en',
      onboardingComplete: false,
      onboardingStep: 'welcome',
      createdAt: now,
      updatedAt: now,
    });

    return {
      theme: 'light',
      language: 'en',
      onboardingComplete: false,
      onboardingStep: 'welcome',
    };
  } catch (e) {
    logger.error('Failed to create user settings', {
      component: 'UserSettingsService',
      error: e,
    });
    return null;
  }
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
    const updateData: Record<string, unknown> = {};
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
          updatedAt: new Date(),
        })
        .where(eq(userSettings.userId, userId));
      return true;
    }

    return false;
  } catch (e) {
    logger.error('Failed to update user settings', {
      component: 'UserSettingsService',
      error: e,
    });
    return false;
  }
};

/**
 * Get user theme preference
 */
export const getTheme = async (userId: string): Promise<'light' | 'dark' | 'system'> => {
  const settings = await getUserSettings(userId);
  return settings?.theme ?? 'light';
};

/**
 * Set user theme preference
 */
export const setTheme = async (
  userId: string,
  theme: 'light' | 'dark' | 'system',
): Promise<void> => {
  await updateUserSettings(userId, { theme });
};

/**
 * Get or create user settings (used by UserContext on mount)
 */
export const getOrCreateUserSettings = async (userId: string): Promise<UserSettings> => {
  let settings = await getUserSettings(userId);
  if (!settings) {
    const created = await createUserSettings(userId);
    settings = created ?? {
      theme: 'light',
      language: 'en',
      onboardingComplete: false,
      onboardingStep: 'welcome',
    };
  }
  return (
    settings ?? {
      theme: 'light',
      language: 'en',
      onboardingComplete: false,
      onboardingStep: 'welcome',
    }
  );
};
