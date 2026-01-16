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
} from '@/features/world-building/types';
import { getDrizzleClient } from '@/lib/database/drizzle';
import {
  worldBuildingProjects,
  type WorldBuildingProjectRow,
  type NewWorldBuildingProjectRow,
} from '@/lib/database/schemas';
import { logger } from '@/lib/logging/logger';
import { generateSecureId } from '@/lib/secure-random';

import * as cultureOps from './world-building/culture-operations';
import * as locationOps from './world-building/location-operations';
import * as loreResearchOps from './world-building/lore-research-operations';
import * as mapOps from './world-building/map-operations';
import * as timelineOps from './world-building/timeline-operations';

class WorldBuildingService {
  public async init(): Promise<void> {
    logger.info('World-building service initialized', { component: 'WorldBuildingService' });
  }

  // ==================== Helper Methods ====================

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
    if (!db) {
      logger.warn('Database not configured, returning local row', {
        component: 'WorldBuildingService',
      });
      const id = generateSecureId();
      const now = new Date().toISOString();
      return {
        id,
        projectId,
        name,
        description: description || null,
        createdAt: now,
        updatedAt: now,
      } as WorldBuildingProjectRow;
    }

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
    return locationOps.createLocation(location);
  }

  public async getLocationsByProjectId(worldBuildingProjectId: string): Promise<Location[]> {
    return locationOps.getLocationsByProjectId(worldBuildingProjectId);
  }

  public async updateLocation(id: string, updates: Partial<Location>): Promise<void> {
    return locationOps.updateLocation(id, updates);
  }

  public async getLocationById(id: string): Promise<Location | null> {
    return locationOps.getLocationById(id);
  }

  public async deleteLocation(id: string): Promise<void> {
    return locationOps.deleteLocation(id);
  }

  // ==================== Cultures ====================

  public async createCulture(culture: Omit<Culture, 'id'>): Promise<Culture> {
    return cultureOps.createCulture(culture);
  }

  public async getCulturesByProjectId(worldBuildingProjectId: string): Promise<Culture[]> {
    return cultureOps.getCulturesByProjectId(worldBuildingProjectId);
  }

  public async updateCulture(id: string, updates: Partial<Culture>): Promise<void> {
    return cultureOps.updateCulture(id, updates);
  }

  public async getCultureById(id: string): Promise<Culture | null> {
    return cultureOps.getCultureById(id);
  }

  public async deleteCulture(id: string): Promise<void> {
    return cultureOps.deleteCulture(id);
  }

  // ==================== Timelines ====================

  public async createTimeline(timeline: Omit<Timeline, 'id'>): Promise<Timeline> {
    return timelineOps.createTimeline(timeline);
  }

  public async getTimelinesByProjectId(worldBuildingProjectId: string): Promise<Timeline[]> {
    return timelineOps.getTimelinesByProjectId(worldBuildingProjectId);
  }

  public async updateTimeline(id: string, updates: Partial<Timeline>): Promise<void> {
    return timelineOps.updateTimeline(id, updates);
  }

  public async deleteTimeline(id: string): Promise<void> {
    return timelineOps.deleteTimeline(id);
  }

  // ==================== Lore Entries ====================

  public async createLoreEntry(loreEntry: Omit<LoreEntry, 'id'>): Promise<LoreEntry> {
    return loreResearchOps.createLoreEntry(loreEntry);
  }

  public async getLoreByProjectId(worldBuildingProjectId: string): Promise<LoreEntry[]> {
    return loreResearchOps.getLoreByProjectId(worldBuildingProjectId);
  }

  // ==================== Research Sources ====================

  public async createResearchSource(source: Omit<ResearchSource, 'id'>): Promise<ResearchSource> {
    return loreResearchOps.createResearchSource(source);
  }

  public async getResearchSourcesByProjectId(
    worldBuildingProjectId: string,
  ): Promise<ResearchSource[]> {
    return loreResearchOps.getResearchSourcesByProjectId(worldBuildingProjectId);
  }

  // ==================== World Maps ====================

  public async createWorldMap(worldMap: Omit<WorldMap, 'id'>): Promise<WorldMap> {
    return mapOps.createWorldMap(worldMap);
  }

  public async getWorldMapsByProjectId(worldBuildingProjectId: string): Promise<WorldMap[]> {
    return mapOps.getWorldMapsByProjectId(worldBuildingProjectId);
  }
}

export const worldBuildingService = new WorldBuildingService();
