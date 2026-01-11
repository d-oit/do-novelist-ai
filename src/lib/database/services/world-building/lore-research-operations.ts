/**
 * Lore and Research Source CRUD operations for world-building
 */
import { eq } from 'drizzle-orm';

import type { LoreEntry, ResearchSource } from '@/features/world-building/types';
import { getDrizzleClient } from '@/lib/database/drizzle';
import {
  loreEntries,
  researchSources,
  type NewLoreEntryRow,
  type LoreEntryRow,
  type NewResearchSourceRow,
  type ResearchSourceRow,
} from '@/lib/database/schemas';
import { logger } from '@/lib/logging/logger';
import { generateSecureId } from '@/lib/secure-random';

import { mapRowToLoreEntry, mapRowToResearchSource } from './mappers';

// ==================== Lore Entries ====================

export async function createLoreEntry(loreEntry: Omit<LoreEntry, 'id'>): Promise<LoreEntry> {
  const db = getDrizzleClient();
  if (!db) throw new Error('Database not configured');

  try {
    const id = generateSecureId();
    const now = new Date().toISOString();

    const newEntry: NewLoreEntryRow = {
      id,
      worldBuildingProjectId: loreEntry.projectId,
      title: loreEntry.title,
      category: loreEntry.category,
      content: loreEntry.content,
      tags: loreEntry.tags || null,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(loreEntries).values(newEntry);
    return mapRowToLoreEntry(newEntry as LoreEntryRow);
  } catch (error) {
    logger.error(
      'Failed to create lore entry',
      { component: 'WorldBuildingService' },
      error as Error,
    );
    throw error;
  }
}

export async function getLoreByProjectId(worldBuildingProjectId: string): Promise<LoreEntry[]> {
  const db = getDrizzleClient();
  if (!db) return [];

  try {
    const rows = await db
      .select()
      .from(loreEntries)
      .where(eq(loreEntries.worldBuildingProjectId, worldBuildingProjectId));
    return rows.map(row => mapRowToLoreEntry(row));
  } catch (error) {
    logger.error(
      'Failed to get lore entries',
      { component: 'WorldBuildingService' },
      error as Error,
    );
    return [];
  }
}

// ==================== Research Sources ====================

export async function createResearchSource(
  source: Omit<ResearchSource, 'id'>,
): Promise<ResearchSource> {
  const db = getDrizzleClient();
  if (!db) throw new Error('Database not configured');

  try {
    const id = generateSecureId();
    const now = new Date().toISOString();

    const newSource: NewResearchSourceRow = {
      id,
      worldBuildingProjectId: source.projectId,
      title: source.title,
      type: source.type,
      author: source.author || null,
      url: source.url || null,
      notes: source.notes || null,
      tags: source.tags || null,
      createdAt: now,
    };

    await db.insert(researchSources).values(newSource);
    return mapRowToResearchSource(newSource as ResearchSourceRow);
  } catch (error) {
    logger.error(
      'Failed to create research source',
      { component: 'WorldBuildingService' },
      error as Error,
    );
    throw error;
  }
}

export async function getResearchSourcesByProjectId(
  worldBuildingProjectId: string,
): Promise<ResearchSource[]> {
  const db = getDrizzleClient();
  if (!db) return [];

  try {
    const rows = await db
      .select()
      .from(researchSources)
      .where(eq(researchSources.worldBuildingProjectId, worldBuildingProjectId));
    return rows.map(row => mapRowToResearchSource(row));
  } catch (error) {
    logger.error(
      'Failed to get research sources',
      { component: 'WorldBuildingService' },
      error as Error,
    );
    return [];
  }
}
