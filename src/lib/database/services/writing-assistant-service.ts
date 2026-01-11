/**
 * Writing Assistant Service for Turso Database
 * Handles analysis history, user preferences, and suggestion feedback using Drizzle ORM
 */
import { eq, desc, and } from 'drizzle-orm';

import { getDrizzleClient } from '@/lib/database/drizzle';
import {
  analysisHistory,
  userWritingPreferences,
  suggestionFeedback,
  writingGoals,
  type AnalysisHistoryRow,
  type NewAnalysisHistoryRow,
  type SuggestionFeedbackRow,
  type WritingGoalRow,
} from '@/lib/database/schemas';
import { logger } from '@/lib/logging/logger';
import { generateSecureId } from '@/lib/secure-random';

class WritingAssistantService {
  public async init(): Promise<void> {
    logger.info('Writing assistant service initialized', { component: 'WritingAssistantService' });
  }

  private getUserId(): string {
    // In a real app, this would come from authentication
    // For now, use a consistent ID from localStorage
    let userId = localStorage.getItem('novelist_user_id');
    if (!userId) {
      userId = generateSecureId();
      localStorage.setItem('novelist_user_id', userId);
    }
    return userId;
  }

  private getDeviceId(): string {
    let deviceId = localStorage.getItem('novelist_device_id');
    if (!deviceId) {
      deviceId = generateSecureId();
      localStorage.setItem('novelist_device_id', deviceId);
    }
    return deviceId;
  }

  // ==================== Analysis History ====================

  public async saveAnalysis(
    chapterId: string,
    projectId: string,
    readabilityScore: number,
    engagementScore: number,
    sentimentScore: number,
    paceScore: number,
    suggestionCount: number,
    suggestionCategories: string[],
    analysisDepth: 'basic' | 'standard' | 'comprehensive',
    contentWordCount: number,
    acceptedSuggestions: number = 0,
    dismissedSuggestions: number = 0,
  ): Promise<void> {
    const db = getDrizzleClient();
    if (!db) throw new Error('Database not configured');

    try {
      const id = generateSecureId();
      const now = new Date().toISOString();

      const newAnalysis: NewAnalysisHistoryRow = {
        id,
        userId: this.getUserId(),
        chapterId,
        projectId,
        readabilityScore,
        engagementScore,
        sentimentScore,
        paceScore,
        suggestionCount,
        suggestionCategories,
        acceptedSuggestions,
        dismissedSuggestions,
        analysisDepth,
        contentWordCount,
        timestamp: now,
        createdAt: now,
      };

      await db.insert(analysisHistory).values(newAnalysis);

      logger.info('Analysis saved', { component: 'WritingAssistantService', chapterId });
    } catch (error) {
      logger.error(
        'Failed to save analysis',
        { component: 'WritingAssistantService' },
        error as Error,
      );
      throw error;
    }
  }

  public async getAnalysisHistory(
    projectId: string,
    chapterId?: string,
    limit: number = 50,
  ): Promise<AnalysisHistoryRow[]> {
    const db = getDrizzleClient();
    if (!db) return [];

    try {
      const userId = this.getUserId();
      let query;

      if (chapterId) {
        query = db
          .select()
          .from(analysisHistory)
          .where(
            and(
              eq(analysisHistory.userId, userId),
              eq(analysisHistory.projectId, projectId),
              eq(analysisHistory.chapterId, chapterId),
            ),
          );
      } else {
        query = db
          .select()
          .from(analysisHistory)
          .where(and(eq(analysisHistory.userId, userId), eq(analysisHistory.projectId, projectId)));
      }

      const rows = await query.orderBy(desc(analysisHistory.timestamp)).limit(limit);
      return rows as AnalysisHistoryRow[];
    } catch (error) {
      logger.error(
        'Failed to get analysis history',
        { component: 'WritingAssistantService' },
        error as Error,
      );
      return [];
    }
  }

  // ==================== User Writing Preferences ====================

  public async savePreferences(preferences: Record<string, unknown>): Promise<void> {
    const db = getDrizzleClient();
    if (!db) throw new Error('Database not configured');

    try {
      const userId = this.getUserId();
      const deviceId = this.getDeviceId();
      const now = new Date().toISOString();

      // Check if preferences exist
      const existing = await db
        .select()
        .from(userWritingPreferences)
        .where(
          and(
            eq(userWritingPreferences.userId, userId),
            eq(userWritingPreferences.deviceId, deviceId),
          ),
        );

      const firstExisting = existing[0];
      if (firstExisting) {
        // Update existing
        await db
          .update(userWritingPreferences)
          .set({
            preferences,
            lastSyncedAt: now,
            updatedAt: now,
          })
          .where(eq(userWritingPreferences.id, firstExisting.id));
      } else {
        // Create new
        const id = generateSecureId();
        await db.insert(userWritingPreferences).values({
          id,
          userId,
          preferences,
          lastSyncedAt: now,
          deviceId,
          createdAt: now,
          updatedAt: now,
        });
      }

      logger.info('Preferences saved', { component: 'WritingAssistantService' });
    } catch (error) {
      logger.error(
        'Failed to save preferences',
        { component: 'WritingAssistantService' },
        error as Error,
      );
      throw error;
    }
  }

  public async getPreferences(): Promise<Record<string, unknown> | null> {
    const db = getDrizzleClient();
    if (!db) return null;

    try {
      const userId = this.getUserId();
      const deviceId = this.getDeviceId();

      const rows = await db
        .select()
        .from(userWritingPreferences)
        .where(
          and(
            eq(userWritingPreferences.userId, userId),
            eq(userWritingPreferences.deviceId, deviceId),
          ),
        );

      const firstRow = rows[0];
      return firstRow ? (firstRow.preferences as Record<string, unknown>) : null;
    } catch (error) {
      logger.error(
        'Failed to get preferences',
        { component: 'WritingAssistantService' },
        error as Error,
      );
      return null;
    }
  }

  // ==================== Suggestion Feedback ====================

  public async recordSuggestionFeedback(
    suggestionType: string,
    suggestionCategory: string,
    action: 'accepted' | 'dismissed' | 'ignored',
    context?: string,
    chapterId?: string,
    projectId?: string,
  ): Promise<void> {
    const db = getDrizzleClient();
    if (!db) throw new Error('Database not configured');

    try {
      const id = generateSecureId();
      const now = new Date().toISOString();

      await db.insert(suggestionFeedback).values({
        id,
        userId: this.getUserId(),
        suggestionType,
        suggestionCategory,
        action,
        context: context || null,
        chapterId: chapterId || null,
        projectId: projectId || null,
        timestamp: now,
        createdAt: now,
      });

      logger.info('Suggestion feedback recorded', { component: 'WritingAssistantService', action });
    } catch (error) {
      logger.error(
        'Failed to record suggestion feedback',
        { component: 'WritingAssistantService' },
        error as Error,
      );
      throw error;
    }
  }

  public async getSuggestionFeedback(
    projectId?: string,
    limit: number = 100,
  ): Promise<SuggestionFeedbackRow[]> {
    const db = getDrizzleClient();
    if (!db) return [];

    try {
      const userId = this.getUserId();
      let query;

      if (projectId) {
        query = db
          .select()
          .from(suggestionFeedback)
          .where(
            and(eq(suggestionFeedback.userId, userId), eq(suggestionFeedback.projectId, projectId)),
          );
      } else {
        query = db.select().from(suggestionFeedback).where(eq(suggestionFeedback.userId, userId));
      }

      const rows = await query.orderBy(desc(suggestionFeedback.timestamp)).limit(limit);
      return rows as SuggestionFeedbackRow[];
    } catch (error) {
      logger.error(
        'Failed to get suggestion feedback',
        { component: 'WritingAssistantService' },
        error as Error,
      );
      return [];
    }
  }

  // ==================== Writing Goals ====================

  public async createGoal(
    goalType: 'daily' | 'weekly' | 'monthly' | 'project',
    targetValue: number,
    unit: 'words' | 'chapters' | 'hours',
    startDate: string,
    endDate?: string,
    projectId?: string,
    metadata?: Record<string, unknown>,
  ): Promise<string> {
    const db = getDrizzleClient();
    if (!db) throw new Error('Database not configured');

    try {
      const id = generateSecureId();
      const now = new Date().toISOString();

      await db.insert(writingGoals).values({
        id,
        userId: this.getUserId(),
        projectId: projectId || null,
        goalType,
        targetValue,
        currentValue: 0,
        unit,
        startDate,
        endDate: endDate || null,
        isActive: true,
        metadata: metadata || null,
        createdAt: now,
        updatedAt: now,
      });

      logger.info('Writing goal created', { component: 'WritingAssistantService', goalType });
      return id;
    } catch (error) {
      logger.error(
        'Failed to create goal',
        { component: 'WritingAssistantService' },
        error as Error,
      );
      throw error;
    }
  }

  public async updateGoalProgress(goalId: string, currentValue: number): Promise<void> {
    const db = getDrizzleClient();
    if (!db) throw new Error('Database not configured');

    try {
      await db
        .update(writingGoals)
        .set({
          currentValue,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(writingGoals.id, goalId));

      logger.info('Goal progress updated', { component: 'WritingAssistantService', goalId });
    } catch (error) {
      logger.error(
        'Failed to update goal progress',
        { component: 'WritingAssistantService' },
        error as Error,
      );
      throw error;
    }
  }

  public async getActiveGoals(projectId?: string): Promise<WritingGoalRow[]> {
    const db = getDrizzleClient();
    if (!db) return [];

    try {
      const userId = this.getUserId();
      let query;

      if (projectId) {
        query = db
          .select()
          .from(writingGoals)
          .where(
            and(
              eq(writingGoals.userId, userId),
              eq(writingGoals.projectId, projectId),
              eq(writingGoals.isActive, true),
            ),
          );
      } else {
        query = db
          .select()
          .from(writingGoals)
          .where(and(eq(writingGoals.userId, userId), eq(writingGoals.isActive, true)));
      }

      const rows = await query;
      return rows as WritingGoalRow[];
    } catch (error) {
      logger.error(
        'Failed to get active goals',
        { component: 'WritingAssistantService' },
        error as Error,
      );
      return [];
    }
  }
}

export const writingAssistantService = new WritingAssistantService();
