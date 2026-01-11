/**
 * World-Building Database Service
 * Handles persistence and retrieval of world-building data using Turso
 */

import type {
  WorldBuildingProject,
  Location,
  Culture,
  Timeline,
  LoreEntry,
  ResearchSource,
  WorldMap,
} from '@/features/world-building/types';
import { worldBuildingService as tursoWorldBuildingService } from '@/lib/database/services';

class WorldBuildingDatabase {
  public async init(): Promise<void> {
    // Delegate to Turso service
    await tursoWorldBuildingService.init();
  }

  // ============================================================================
  // World-Building Project Operations
  // ============================================================================

  public async saveWorldBuildingProject(project: WorldBuildingProject): Promise<void> {
    const projects = await tursoWorldBuildingService.getProjectsByProjectId(project.projectId);
    if (projects.length === 0) {
      // Only create the project metadata if it doesn't exist
      // The project itself is just metadata - individual entities are stored separately
      await tursoWorldBuildingService.createProject('World Building', project.projectId);
    }
    // Note: Individual locations, cultures, timelines, etc. are saved via their respective methods
  }

  public async getWorldBuildingProject(projectId: string): Promise<WorldBuildingProject | null> {
    const projects = await tursoWorldBuildingService.getProjectsByProjectId(projectId);
    if (projects.length === 0 || !projects[0]) return null;

    const wbProjectRow = projects[0];

    // Fetch all related data
    const [locations, cultures, timelines, lore, researchSources, maps] = await Promise.all([
      tursoWorldBuildingService.getLocationsByProjectId(wbProjectRow.id),
      tursoWorldBuildingService.getCulturesByProjectId(wbProjectRow.id),
      tursoWorldBuildingService.getTimelinesByProjectId(wbProjectRow.id),
      tursoWorldBuildingService.getLoreByProjectId(wbProjectRow.id),
      tursoWorldBuildingService.getResearchSourcesByProjectId(wbProjectRow.id),
      tursoWorldBuildingService.getWorldMapsByProjectId(wbProjectRow.id),
    ]);

    // Construct the full WorldBuildingProject
    const worldBuildingProject: WorldBuildingProject = {
      id: wbProjectRow.id,
      projectId: wbProjectRow.projectId,
      locations,
      cultures,
      timelines,
      lore,
      researchSources,
      maps,
      settings: {
        consistencyCheckEnabled: true,
        autoLinkElements: true,
      },
      createdAt: new Date(wbProjectRow.createdAt).getTime(),
      updatedAt: new Date(wbProjectRow.updatedAt).getTime(),
    };

    return worldBuildingProject;
  }

  public async createWorldBuildingProject(projectId: string): Promise<WorldBuildingProject> {
    // Create the project metadata in the database
    const wbProjectRow = await tursoWorldBuildingService.createProject('World Building', projectId);

    // Return a complete WorldBuildingProject with empty collections
    const newProject: WorldBuildingProject = {
      id: wbProjectRow.id,
      projectId: wbProjectRow.projectId,
      locations: [],
      cultures: [],
      timelines: [],
      lore: [],
      researchSources: [],
      maps: [],
      settings: {
        consistencyCheckEnabled: true,
        autoLinkElements: true,
      },
      createdAt: new Date(wbProjectRow.createdAt).getTime(),
      updatedAt: new Date(wbProjectRow.updatedAt).getTime(),
    };

    return newProject;
  }

  // ============================================================================
  // Location Operations
  // ============================================================================

  public async saveLocation(location: Location): Promise<void> {
    // Get the world building project ID from the main project ID
    const worldBuildingProjectId =
      await tursoWorldBuildingService.getWorldBuildingProjectIdByMainId(location.projectId);

    const existing =
      await tursoWorldBuildingService.getLocationsByProjectId(worldBuildingProjectId);
    const found = existing.find(l => l.id === location.id);

    if (found) {
      await tursoWorldBuildingService.updateLocation(location.id, location);
    } else {
      await tursoWorldBuildingService.createLocation(location);
    }
  }

  public async getLocationsByProject(projectId: string): Promise<Location[]> {
    const wbProjects = await tursoWorldBuildingService.getProjectsByProjectId(projectId);
    if (wbProjects.length === 0 || !wbProjects[0]) return [];

    return tursoWorldBuildingService.getLocationsByProjectId(wbProjects[0].id);
  }

  public async getLocation(id: string): Promise<Location | null> {
    const location = await tursoWorldBuildingService.getLocationById(id);
    return location || null;
  }

  public async deleteLocation(id: string): Promise<void> {
    await tursoWorldBuildingService.deleteLocation(id);
  }

  // ============================================================================
  // Culture Operations
  // ============================================================================

  public async saveCulture(culture: Culture): Promise<void> {
    // Get the world building project ID from the main project ID
    const worldBuildingProjectId =
      await tursoWorldBuildingService.getWorldBuildingProjectIdByMainId(culture.projectId);

    const existing = await tursoWorldBuildingService.getCulturesByProjectId(worldBuildingProjectId);
    const found = existing.find(c => c.id === culture.id);

    if (found) {
      await tursoWorldBuildingService.updateCulture(culture.id, culture);
    } else {
      await tursoWorldBuildingService.createCulture(culture);
    }
  }

  public async getCulturesByProject(projectId: string): Promise<Culture[]> {
    const wbProjects = await tursoWorldBuildingService.getProjectsByProjectId(projectId);
    if (wbProjects.length === 0 || !wbProjects[0]) return [];

    return tursoWorldBuildingService.getCulturesByProjectId(wbProjects[0].id);
  }

  public async getCulture(id: string): Promise<Culture | null> {
    const culture = await tursoWorldBuildingService.getCultureById(id);
    return culture || null;
  }

  public async deleteCulture(id: string): Promise<void> {
    await tursoWorldBuildingService.deleteCulture(id);
  }

  // ============================================================================
  // Timeline, Lore, Research, and Map Operations
  // ============================================================================

  public async getTimelinesByProject(projectId: string): Promise<Timeline[]> {
    const wbProjects = await tursoWorldBuildingService.getProjectsByProjectId(projectId);
    if (wbProjects.length === 0 || !wbProjects[0]) return [];

    return tursoWorldBuildingService.getTimelinesByProjectId(wbProjects[0].id);
  }

  public async getLoreByProject(projectId: string): Promise<LoreEntry[]> {
    const wbProjects = await tursoWorldBuildingService.getProjectsByProjectId(projectId);
    if (wbProjects.length === 0 || !wbProjects[0]) return [];

    return tursoWorldBuildingService.getLoreByProjectId(wbProjects[0].id);
  }

  public async getResearchSourcesByProject(projectId: string): Promise<ResearchSource[]> {
    const wbProjects = await tursoWorldBuildingService.getProjectsByProjectId(projectId);
    if (wbProjects.length === 0 || !wbProjects[0]) return [];

    return tursoWorldBuildingService.getResearchSourcesByProjectId(wbProjects[0].id);
  }

  public async getWorldMapsByProject(projectId: string): Promise<WorldMap[]> {
    const wbProjects = await tursoWorldBuildingService.getProjectsByProjectId(projectId);
    if (wbProjects.length === 0 || !wbProjects[0]) return [];

    return tursoWorldBuildingService.getWorldMapsByProjectId(wbProjects[0].id);
  }
}

export const worldBuildingDb = new WorldBuildingDatabase();
