/**
 * Location CRUD operations for world-building
 */
import { eq } from 'drizzle-orm';

import type { Location } from '@/features/world-building/types';
import { getDrizzleClient } from '@/lib/database/drizzle';
import { locations, type NewLocationRow, type LocationRow } from '@/lib/database/schemas';
import { logger } from '@/lib/logging/logger';
import { generateSecureId } from '@/lib/secure-random';

import { mapRowToLocation } from './mappers';

export async function createLocation(location: Omit<Location, 'id'>): Promise<Location> {
  const db = getDrizzleClient();
  if (!db) throw new Error('Database not configured');

  try {
    const id = generateSecureId();
    const now = new Date().toISOString();

    const newLocation: NewLocationRow = {
      id,
      worldBuildingProjectId: location.projectId,
      name: location.name,
      type: location.type,
      description: location.description || null,
      climate: location.climate || null,
      geography: location.geography || null,
      population: location.population || null,
      government: location.government || null,
      coordinates: location.coordinates || null,
      tags: location.tags || null,
      imageUrl: location.imageUrl || null,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(locations).values(newLocation);
    return mapRowToLocation(newLocation as LocationRow);
  } catch (error) {
    logger.error(
      'Failed to create location',
      { component: 'WorldBuildingService' },
      error as Error,
    );
    throw error;
  }
}

export async function getLocationsByProjectId(worldBuildingProjectId: string): Promise<Location[]> {
  const db = getDrizzleClient();
  if (!db) return [];

  try {
    const rows = await db
      .select()
      .from(locations)
      .where(eq(locations.worldBuildingProjectId, worldBuildingProjectId));
    return rows.map(row => mapRowToLocation(row));
  } catch (error) {
    logger.error('Failed to get locations', { component: 'WorldBuildingService' }, error as Error);
    return [];
  }
}

export async function updateLocation(id: string, updates: Partial<Location>): Promise<void> {
  const db = getDrizzleClient();
  if (!db) throw new Error('Database not configured');

  try {
    const updateData: Partial<NewLocationRow> = {
      updatedAt: new Date().toISOString(),
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.climate !== undefined) updateData.climate = updates.climate;
    if (updates.geography !== undefined) updateData.geography = updates.geography;
    if (updates.population !== undefined) updateData.population = updates.population;
    if (updates.government !== undefined) updateData.government = updates.government;
    if (updates.coordinates !== undefined) updateData.coordinates = updates.coordinates;
    if (updates.tags !== undefined) updateData.tags = updates.tags;
    if (updates.imageUrl !== undefined) updateData.imageUrl = updates.imageUrl;

    await db.update(locations).set(updateData).where(eq(locations.id, id));
  } catch (error) {
    logger.error(
      'Failed to update location',
      { component: 'WorldBuildingService' },
      error as Error,
    );
    throw error;
  }
}

export async function getLocationById(id: string): Promise<Location | null> {
  const db = getDrizzleClient();
  if (!db) return null;

  try {
    const rows = await db.select().from(locations).where(eq(locations.id, id));
    return rows.length > 0 && rows[0] ? mapRowToLocation(rows[0]) : null;
  } catch (error) {
    logger.error(
      'Failed to get location by ID',
      { component: 'WorldBuildingService' },
      error as Error,
    );
    return null;
  }
}

export async function deleteLocation(id: string): Promise<void> {
  const db = getDrizzleClient();
  if (!db) throw new Error('Database not configured');

  try {
    await db.delete(locations).where(eq(locations.id, id));
  } catch (error) {
    logger.error(
      'Failed to delete location',
      { component: 'WorldBuildingService' },
      error as Error,
    );
    throw error;
  }
}
