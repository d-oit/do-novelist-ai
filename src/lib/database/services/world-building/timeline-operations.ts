/**
 * Timeline CRUD operations for world-building
 */
import { eq } from 'drizzle-orm';

import type { Timeline } from '@/features/world-building/types';
import { getDrizzleClient } from '@/lib/database/drizzle';
import { timelines, type NewTimelineRow, type TimelineRow } from '@/lib/database/schemas';
import { logger } from '@/lib/logging/logger';
import { generateSecureId } from '@/lib/secure-random';

import { mapRowToTimeline } from './mappers';

export async function createTimeline(timeline: Omit<Timeline, 'id'>): Promise<Timeline> {
  const db = getDrizzleClient();
  if (!db) throw new Error('Database not configured');

  try {
    const id = generateSecureId();
    const now = new Date().toISOString();

    const newTimeline: NewTimelineRow = {
      id,
      worldBuildingProjectId: timeline.projectId,
      name: timeline.name,
      description: timeline.description || null,
      events: timeline.events,
      tags: timeline.tags || null,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(timelines).values(newTimeline);
    return mapRowToTimeline(newTimeline as TimelineRow);
  } catch (error) {
    logger.error(
      'Failed to create timeline',
      { component: 'WorldBuildingService' },
      error as Error,
    );
    throw error;
  }
}

export async function getTimelinesByProjectId(worldBuildingProjectId: string): Promise<Timeline[]> {
  const db = getDrizzleClient();
  if (!db) return [];

  try {
    const rows = await db
      .select()
      .from(timelines)
      .where(eq(timelines.worldBuildingProjectId, worldBuildingProjectId));
    return rows.map(row => mapRowToTimeline(row));
  } catch (error) {
    logger.error('Failed to get timelines', { component: 'WorldBuildingService' }, error as Error);
    return [];
  }
}

export async function updateTimeline(id: string, updates: Partial<Timeline>): Promise<void> {
  const db = getDrizzleClient();
  if (!db) throw new Error('Database not configured');

  try {
    const updateData: Partial<NewTimelineRow> = {
      updatedAt: new Date().toISOString(),
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.events !== undefined) updateData.events = updates.events;
    if (updates.tags !== undefined) updateData.tags = updates.tags;

    await db.update(timelines).set(updateData).where(eq(timelines.id, id));
  } catch (error) {
    logger.error(
      'Failed to update timeline',
      { component: 'WorldBuildingService' },
      error as Error,
    );
    throw error;
  }
}

export async function deleteTimeline(id: string): Promise<void> {
  const db = getDrizzleClient();
  if (!db) throw new Error('Database not configured');

  try {
    await db.delete(timelines).where(eq(timelines.id, id));
  } catch (error) {
    logger.error(
      'Failed to delete timeline',
      { component: 'WorldBuildingService' },
      error as Error,
    );
    throw error;
  }
}
