/**
 * Plot engine feedback service
 * Handles plot engine feedback using Turso database
 */
import { eq } from 'drizzle-orm';


import { getDrizzleClient } from '@/lib/database/drizzle';
import {
  plotEngineFeedback,
  type PlotEngineFeedbackRow,
  type NewPlotEngineFeedbackRow,
  type FeedbackContent,
} from '@/lib/database/schemas';
import { logger } from '@/lib/logging/logger';

/**
 * Feedback type
 */
export type FeedbackType = 'suggestion' | 'correction' | 'enhancement' | 'question';

/**
 * Save plot engine feedback
 */
export const saveFeedback = async (
  userId: string,
  feedbackType: FeedbackType,
  content: FeedbackContent,
  projectId?: string,
): Promise<boolean> => {
  const db = getDrizzleClient();
  if (!db) {
    logger.error('Database client not available for saveFeedback');
    return false;
  }

  try {
    const feedback: NewPlotEngineFeedbackRow = {
      id: crypto.randomUUID(),
      userId,
      projectId: projectId ?? null,
      feedbackType,
      content,
      createdAt: new Date().toISOString(),
    };

    await db.insert(plotEngineFeedback).values(feedback);

    logger.info('Plot engine feedback saved', { userId, feedbackType });
    return true;
  } catch (e) {
    logger.error(
      'Failed to save feedback',
      { userId, feedbackType },
      e instanceof Error ? e : undefined,
    );
    return false;
  }
};

/**
 * Get user feedback
 */
export const getUserFeedback = async (userId: string): Promise<PlotEngineFeedbackRow[]> => {
  const db = getDrizzleClient();
  if (!db) {
    logger.error('Database client not available for getUserFeedback');
    return [];
  }

  try {
    const feedback = await db
      .select()
      .from(plotEngineFeedback)
      .where(eq(plotEngineFeedback.userId, userId))
      .limit(100);

    return feedback;
  } catch (e) {
    logger.error('Failed to get user feedback', { userId }, e instanceof Error ? e : undefined);
    return [];
  }
};

/**
 * Get project feedback
 */
export const getProjectFeedback = async (projectId: string): Promise<PlotEngineFeedbackRow[]> => {
  const db = getDrizzleClient();
  if (!db) {
    logger.error('Database client not available for getProjectFeedback');
    return [];
  }

  try {
    const feedback = await db
      .select()
      .from(plotEngineFeedback)
      .where(eq(plotEngineFeedback.projectId, projectId))
      .limit(100);

    return feedback;
  } catch (e) {
    logger.error(
      'Failed to get project feedback',
      { projectId },
      e instanceof Error ? e : undefined,
    );
    return [];
  }
};

/**
 * Delete feedback
 */
export const deleteFeedback = async (feedbackId: string): Promise<boolean> => {
  const db = getDrizzleClient();
  if (!db) {
    logger.error('Database client not available for deleteFeedback');
    return false;
  }

  try {
    await db.delete(plotEngineFeedback).where(eq(plotEngineFeedback.id, feedbackId));

    logger.info('Plot engine feedback deleted', { feedbackId });
    return true;
  } catch (e) {
    logger.error('Failed to delete feedback', { feedbackId }, e instanceof Error ? e : undefined);
    return false;
  }
};

/**
 * Export all feedback service functions
 */
export const feedbackService = {
  saveFeedback,
  getUserFeedback,
  getProjectFeedback,
  deleteFeedback,
};
