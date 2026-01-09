/**
 * World-Building Service for Turso Database
 * Handles all world-building data persistence using Drizzle ORM
 */
import { eq } from 'drizzle-orm';

import type {
  Location,
  Culture,
  Timeline,
  LoreEntry,
  ResearchSource,
  WorldMap,
  TimelineEvent,
} from '@/features/world-building/types';
import { getDrizzleClient } from '@/lib/database/drizzle';
import {
  worldBuildingProjects,
  locations,
  cultures,
  timelines,
  loreEntries,
  researchSources,
  worldMaps,
  type WorldBuildingProjectRow,
  type NewWorldBuildingProjectRow,
  type LocationRow,
  type NewLocationRow,
  type CultureRow,
  type NewCultureRow,
  type TimelineRow,
  type NewTimelineRow,
  type LoreEntryRow,
  type NewLoreEntryRow,
  type ResearchSourceRow,
  type NewResearchSourceRow,
  type WorldMapRow,
  type NewWorldMapRow,
} from '@/lib/database/schemas';
import { logger } from '@/lib/logging/logger';
import { generateSecureId } from '@/lib/secure-random';

class WorldBuildingService {
  public async init(): Promise<void> {
    logger.info('World-building service initialized', { component: 'WorldBuildingService' });
  }

  // ==================== Mappers ====================

  private mapRowToLocation(row: LocationRow): Location {
    return {
      id: row.id,
      projectId: row.worldBuildingProjectId,
      name: row.name,
      type: row.type as Location['type'],
      description: row.description || '',
      geography: row.geography || undefined,
      climate: row.climate || undefined,
      naturalResources: [],
      population: row.population || undefined,
      primaryCultures: [],
      languages: [],
      government: row.government || undefined,
      ruler: '',
      allies: [],
      enemies: [],
      primaryIndustries: [],
      tradingPartners: [],
      currency: '',
      parentLocationId: row.parentLocationId || undefined,
      childLocationIds: [],
      coordinates: row.coordinates || undefined,
      imageUrl: row.imageUrl || undefined,
      mapImageUrl: undefined,
      tags: row.tags || [],
      notes: undefined,
      createdAt: new Date(row.createdAt).getTime(),
      updatedAt: new Date(row.updatedAt).getTime(),
    };
  }

  private mapRowToCulture(row: CultureRow): Culture {
    return {
      id: row.id,
      projectId: row.worldBuildingProjectId,
      name: row.name,
      type: 'civilization',
      description: row.description || '',
      values: row.values || [],
      beliefs: row.beliefs || [],
      traditions: row.traditions || [],
      socialStructure: row.socialStructure || undefined,
      leadership: '',
      caste: [],
      language: row.language || undefined,
      religion: '',
      art: row.arts || undefined,
      music: '',
      cuisine: '',
      clothing: '',
      architecture: '',
      allies: [],
      enemies: [],
      tradingPartners: [],
      territories: row.locationIds || [],
      originLocation: undefined,
      imageUrl: undefined,
      tags: row.tags || [],
      notes: undefined,
      createdAt: new Date(row.createdAt).getTime(),
      updatedAt: new Date(row.updatedAt).getTime(),
    };
  }

  private mapRowToTimeline(row: TimelineRow): Timeline {
    return {
      id: row.id,
      projectId: row.worldBuildingProjectId,
      name: row.name,
      description: row.description || undefined,
      events: (row.events || []).map(event => {
        const e = event as Record<string, unknown>;
        return {
          id: String(e.id || crypto.randomUUID()),
          title: String(e.title || 'Untitled Event'),
          description: String(e.description || ''),
          date: String(e.date || new Date().toISOString()),
          type:
            typeof e.type === 'string' &&
            ['political', 'cultural', 'natural', 'technological', 'religious', 'personal'].includes(
              e.type,
            )
              ? (e.type as TimelineEvent['type'])
              : 'personal',
          importance: Number(e.importance || 5),
          involvedCultures: Array.isArray(e.involvedCultures) ? e.involvedCultures.map(String) : [],
          involvedLocations: Array.isArray(e.involvedLocations)
            ? e.involvedLocations.map(String)
            : [],
          involvedCharacters: Array.isArray(e.involvedCharacters)
            ? e.involvedCharacters.map(String)
            : [],
          consequences: Array.isArray(e.consequences)
            ? e.consequences.map(String)
            : e.consequences
              ? [String(e.consequences)]
              : [],
          tags: Array.isArray(e.tags) ? e.tags.map(String) : [],
          notes: e.notes ? String(e.notes) : undefined,
          createdAt: Number(e.createdAt || Date.now()),
          updatedAt: Number(e.updatedAt || Date.now()),
        };
      }),
      tags: row.tags || [],
      createdAt: new Date(row.createdAt).getTime(),
      updatedAt: new Date(row.updatedAt).getTime(),
    };
  }

  private mapRowToLoreEntry(row: LoreEntryRow): LoreEntry {
    return {
      id: row.id,
      projectId: row.worldBuildingProjectId,
      title: row.title,
      category: row.category as LoreEntry['category'],
      content: row.content,
      relatedLocations: [],
      relatedCultures: [],
      relatedCharacters: [],
      relatedEvents: [],
      sources: [],
      tags: row.tags || [],
      isSecret: false,
      createdAt: new Date(row.createdAt).getTime(),
      updatedAt: new Date(row.updatedAt).getTime(),
    };
  }

  private mapRowToResearchSource(row: ResearchSourceRow): ResearchSource {
    return {
      id: row.id,
      projectId: row.worldBuildingProjectId,
      title: row.title,
      type: row.type as ResearchSource['type'],
      url: row.url || undefined,
      notes: row.notes || undefined,
      author: row.author || undefined,
      publication: undefined,
      publishedDate: undefined,
      tags: row.tags || [],
      createdAt: new Date(row.createdAt).getTime(),
      updatedAt: Date.now(),
    };
  }

  private mapRowToWorldMap(row: WorldMapRow): WorldMap {
    return {
      id: row.id,
      projectId: row.worldBuildingProjectId,
      name: row.name,
      description: undefined,
      imageUrl: row.imageUrl || undefined,
      locations: [],
      scale: row.scale || undefined,
      legend: row.legend || undefined,
      tags: [],
      createdAt: new Date(row.createdAt).getTime(),
      updatedAt: new Date(row.updatedAt).getTime(),
    };
  }

  // ==================== Helpers ====================

  public async getWorldBuildingProjectIdByMainId(projectId: string): Promise<string> {
    const projectsList = await this.getProjectsByProjectId(projectId);
    const existingProject = projectsList[0];
    if (!existingProject) {
      const newProject = await this.createProject('World Building', projectId);
      return newProject.id;
    }
    return existingProject.id;
  }

  // ==================== Projects ====================

  public async createProject(
    name: string,
    projectId: string,
    description?: string,
  ): Promise<WorldBuildingProjectRow> {
    const db = getDrizzleClient();
    if (!db) throw new Error('Database not configured');

    try {
      const id = generateSecureId();
      const now = new Date().toISOString();

      const newProject: NewWorldBuildingProjectRow = {
        id,
        projectId,
        name,
        description: description || null,
        createdAt: now,
        updatedAt: now,
      };

      await db.insert(worldBuildingProjects).values(newProject);
      return newProject as WorldBuildingProjectRow;
    } catch (error) {
      logger.error(
        'Failed to create world-building project',
        { component: 'WorldBuildingService' },
        error as Error,
      );
      throw error;
    }
  }

  public async getProjectsByProjectId(projectId: string): Promise<WorldBuildingProjectRow[]> {
    const db = getDrizzleClient();
    if (!db) return [];

    try {
      const rows = await db
        .select()
        .from(worldBuildingProjects)
        .where(eq(worldBuildingProjects.projectId, projectId));
      return rows;
    } catch (error) {
      logger.error(
        'Failed to get world-building projects',
        { component: 'WorldBuildingService' },
        error as Error,
      );
      return [];
    }
  }

  public async deleteProject(id: string): Promise<void> {
    const db = getDrizzleClient();
    if (!db) throw new Error('Database not configured');

    try {
      await db.delete(worldBuildingProjects).where(eq(worldBuildingProjects.id, id));
    } catch (error) {
      logger.error(
        'Failed to delete world-building project',
        { component: 'WorldBuildingService' },
        error as Error,
      );
      throw error;
    }
  }

  // ==================== Locations ====================

  public async createLocation(location: Omit<Location, 'id'>): Promise<Location> {
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
      return this.mapRowToLocation(newLocation as LocationRow);
    } catch (error) {
      logger.error(
        'Failed to create location',
        { component: 'WorldBuildingService' },
        error as Error,
      );
      throw error;
    }
  }

  public async getLocationsByProjectId(worldBuildingProjectId: string): Promise<Location[]> {
    const db = getDrizzleClient();
    if (!db) return [];

    try {
      const rows = await db
        .select()
        .from(locations)
        .where(eq(locations.worldBuildingProjectId, worldBuildingProjectId));
      return rows.map(row => this.mapRowToLocation(row));
    } catch (error) {
      logger.error(
        'Failed to get locations',
        { component: 'WorldBuildingService' },
        error as Error,
      );
      return [];
    }
  }

  public async updateLocation(id: string, updates: Partial<Location>): Promise<void> {
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

  public async deleteLocation(id: string): Promise<void> {
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

  // ==================== Cultures ====================

  public async createCulture(culture: Omit<Culture, 'id'>): Promise<Culture> {
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
      return this.mapRowToCulture(newCulture as CultureRow);
    } catch (error) {
      logger.error(
        'Failed to create culture',
        { component: 'WorldBuildingService' },
        error as Error,
      );
      throw error;
    }
  }

  public async getCulturesByProjectId(worldBuildingProjectId: string): Promise<Culture[]> {
    const db = getDrizzleClient();
    if (!db) return [];

    try {
      const rows = await db
        .select()
        .from(cultures)
        .where(eq(cultures.worldBuildingProjectId, worldBuildingProjectId));
      return rows.map(row => this.mapRowToCulture(row));
    } catch (error) {
      logger.error('Failed to get cultures', { component: 'WorldBuildingService' }, error as Error);
      return [];
    }
  }

  public async updateCulture(id: string, updates: Partial<Culture>): Promise<void> {
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
      if (updates.socialStructure !== undefined)
        updateData.socialStructure = updates.socialStructure;
      if (updates.art !== undefined) updateData.arts = updates.art;
      if (updates.territories !== undefined) updateData.locationIds = updates.territories;
      if (updates.tags !== undefined) updateData.tags = updates.tags;

      await db.update(cultures).set(updateData).where(eq(cultures.id, id));
    } catch (error) {
      logger.error(
        'Failed to update culture',
        { component: 'WorldBuildingService' },
        error as Error,
      );
      throw error;
    }
  }

  public async deleteCulture(id: string): Promise<void> {
    const db = getDrizzleClient();
    if (!db) throw new Error('Database not configured');

    try {
      await db.delete(cultures).where(eq(cultures.id, id));
    } catch (error) {
      logger.error(
        'Failed to delete culture',
        { component: 'WorldBuildingService' },
        error as Error,
      );
      throw error;
    }
  }

  // ==================== Timelines ====================

  public async createTimeline(timeline: Omit<Timeline, 'id'>): Promise<Timeline> {
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
      return this.mapRowToTimeline(newTimeline as TimelineRow);
    } catch (error) {
      logger.error(
        'Failed to create timeline',
        { component: 'WorldBuildingService' },
        error as Error,
      );
      throw error;
    }
  }

  public async getTimelinesByProjectId(worldBuildingProjectId: string): Promise<Timeline[]> {
    const db = getDrizzleClient();
    if (!db) return [];

    try {
      const rows = await db
        .select()
        .from(timelines)
        .where(eq(timelines.worldBuildingProjectId, worldBuildingProjectId));
      return rows.map(row => this.mapRowToTimeline(row));
    } catch (error) {
      logger.error(
        'Failed to get timelines',
        { component: 'WorldBuildingService' },
        error as Error,
      );
      return [];
    }
  }

  public async updateTimeline(id: string, updates: Partial<Timeline>): Promise<void> {
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

  public async deleteTimeline(id: string): Promise<void> {
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

  // ==================== Lore Entries ====================

  public async createLoreEntry(loreEntry: Omit<LoreEntry, 'id'>): Promise<LoreEntry> {
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
      return this.mapRowToLoreEntry(newEntry as LoreEntryRow);
    } catch (error) {
      logger.error(
        'Failed to create lore entry',
        { component: 'WorldBuildingService' },
        error as Error,
      );
      throw error;
    }
  }

  public async getLoreByProjectId(worldBuildingProjectId: string): Promise<LoreEntry[]> {
    const db = getDrizzleClient();
    if (!db) return [];

    try {
      const rows = await db
        .select()
        .from(loreEntries)
        .where(eq(loreEntries.worldBuildingProjectId, worldBuildingProjectId));
      return rows.map(row => this.mapRowToLoreEntry(row));
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

  public async createResearchSource(source: Omit<ResearchSource, 'id'>): Promise<ResearchSource> {
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
      return this.mapRowToResearchSource(newSource as ResearchSourceRow);
    } catch (error) {
      logger.error(
        'Failed to create research source',
        { component: 'WorldBuildingService' },
        error as Error,
      );
      throw error;
    }
  }

  public async getResearchSourcesByProjectId(
    worldBuildingProjectId: string,
  ): Promise<ResearchSource[]> {
    const db = getDrizzleClient();
    if (!db) return [];

    try {
      const rows = await db
        .select()
        .from(researchSources)
        .where(eq(researchSources.worldBuildingProjectId, worldBuildingProjectId));
      return rows.map(row => this.mapRowToResearchSource(row));
    } catch (error) {
      logger.error(
        'Failed to get research sources',
        { component: 'WorldBuildingService' },
        error as Error,
      );
      return [];
    }
  }

  // ==================== World Maps ====================

  public async createWorldMap(worldMap: Omit<WorldMap, 'id'>): Promise<WorldMap> {
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
      return this.mapRowToWorldMap(newMap as WorldMapRow);
    } catch (error) {
      logger.error(
        'Failed to create world map',
        { component: 'WorldBuildingService' },
        error as Error,
      );
      throw error;
    }
  }

  public async getWorldMapsByProjectId(worldBuildingProjectId: string): Promise<WorldMap[]> {
    const db = getDrizzleClient();
    if (!db) return [];

    try {
      const rows = await db
        .select()
        .from(worldMaps)
        .where(eq(worldMaps.worldBuildingProjectId, worldBuildingProjectId));
      return rows.map(row => this.mapRowToWorldMap(row));
    } catch (error) {
      logger.error(
        'Failed to get world maps',
        { component: 'WorldBuildingService' },
        error as Error,
      );
      return [];
    }
  }
}

export const worldBuildingService = new WorldBuildingService();
