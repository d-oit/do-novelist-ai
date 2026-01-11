/**
 * Culture CRUD operations for world-building
 */
import { eq } from 'drizzle-orm';

import type { Culture } from '@/features/world-building/types';
import { getDrizzleClient } from '@/lib/database/drizzle';
import { cultures, type NewCultureRow, type CultureRow } from '@/lib/database/schemas';
import { logger } from '@/lib/logging/logger';
import { generateSecureId } from '@/lib/secure-random';

import { mapRowToCulture } from './mappers';

export async function createCulture(culture: Omit<Culture, 'id'>): Promise<Culture> {
  const db = getDrizzleClient();
  if (!db) throw new Error('Database not configured');

  try {
    const id = generateSecureId();
    const now = new Date().toISOString();

    const newCulture: NewCultureRow = {
      id,
      worldBuildingProjectId: culture.projectId,
      name: culture.name,
      description: culture.description || null,
      values: culture.values || null,
      traditions: culture.traditions || null,
      beliefs: culture.beliefs || null,
      language: culture.language || null,
      socialStructure: culture.socialStructure || null,
      arts: culture.art || null,
      locationIds: culture.territories || null,
      tags: culture.tags || null,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(cultures).values(newCulture);
    return mapRowToCulture(newCulture as CultureRow);
  } catch (error) {
    logger.error('Failed to create culture', { component: 'WorldBuildingService' }, error as Error);
    throw error;
  }
}

export async function getCulturesByProjectId(worldBuildingProjectId: string): Promise<Culture[]> {
  const db = getDrizzleClient();
  if (!db) return [];

  try {
    const rows = await db
      .select()
      .from(cultures)
      .where(eq(cultures.worldBuildingProjectId, worldBuildingProjectId));
    return rows.map(row => mapRowToCulture(row));
  } catch (error) {
    logger.error('Failed to get cultures', { component: 'WorldBuildingService' }, error as Error);
    return [];
  }
}

export async function updateCulture(id: string, updates: Partial<Culture>): Promise<void> {
  const db = getDrizzleClient();
  if (!db) throw new Error('Database not configured');

  try {
    const updateData: Partial<NewCultureRow> = {
      updatedAt: new Date().toISOString(),
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.values !== undefined) updateData.values = updates.values;
    if (updates.traditions !== undefined) updateData.traditions = updates.traditions;
    if (updates.beliefs !== undefined) updateData.beliefs = updates.beliefs;
    if (updates.language !== undefined) updateData.language = updates.language;
    if (updates.socialStructure !== undefined) updateData.socialStructure = updates.socialStructure;
    if (updates.art !== undefined) updateData.arts = updates.art;
    if (updates.territories !== undefined) updateData.locationIds = updates.territories;
    if (updates.tags !== undefined) updateData.tags = updates.tags;

    await db.update(cultures).set(updateData).where(eq(cultures.id, id));
  } catch (error) {
    logger.error('Failed to update culture', { component: 'WorldBuildingService' }, error as Error);
    throw error;
  }
}

export async function getCultureById(id: string): Promise<Culture | null> {
  const db = getDrizzleClient();
  if (!db) return null;

  try {
    const rows = await db.select().from(cultures).where(eq(cultures.id, id));
    return rows.length > 0 && rows[0] ? mapRowToCulture(rows[0]) : null;
  } catch (error) {
    logger.error(
      'Failed to get culture by ID',
      { component: 'WorldBuildingService' },
      error as Error,
    );
    return null;
  }
}

export async function deleteCulture(id: string): Promise<void> {
  const db = getDrizzleClient();
  if (!db) throw new Error('Database not configured');

  try {
    await db.delete(cultures).where(eq(cultures.id, id));
  } catch (error) {
    logger.error('Failed to delete culture', { component: 'WorldBuildingService' }, error as Error);
    throw error;
  }
}
