/**
 * World Map CRUD operations for world-building
 */
import { eq } from 'drizzle-orm';

import type { WorldMap } from '@/features/world-building/types';
import { getDrizzleClient } from '@/lib/database/drizzle';
import { worldMaps, type NewWorldMapRow, type WorldMapRow } from '@/lib/database/schemas';
import { logger } from '@/lib/logging/logger';
import { generateSecureId } from '@/lib/secure-random';

import { mapRowToWorldMap } from './mappers';

export async function createWorldMap(worldMap: Omit<WorldMap, 'id'>): Promise<WorldMap> {
  const db = getDrizzleClient();
  if (!db) throw new Error('Database not configured');

  try {
    const id = generateSecureId();
    const now = new Date().toISOString();

    const newMap: NewWorldMapRow = {
      id,
      worldBuildingProjectId: worldMap.projectId,
      name: worldMap.name,
      imageUrl: worldMap.imageUrl || null,
      scale: worldMap.scale || null,
      legend: worldMap.legend || null,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(worldMaps).values(newMap);
    return mapRowToWorldMap(newMap as WorldMapRow);
  } catch (error) {
    logger.error(
      'Failed to create world map',
      { component: 'WorldBuildingService' },
      error as Error,
    );
    throw error;
  }
}

export async function getWorldMapsByProjectId(worldBuildingProjectId: string): Promise<WorldMap[]> {
  const db = getDrizzleClient();
  if (!db) return [];

  try {
    const rows = await db
      .select()
      .from(worldMaps)
      .where(eq(worldMaps.worldBuildingProjectId, worldBuildingProjectId));
    return rows.map(row => mapRowToWorldMap(row));
  } catch (error) {
    logger.error('Failed to get world maps', { component: 'WorldBuildingService' }, error as Error);
    return [];
  }
}
