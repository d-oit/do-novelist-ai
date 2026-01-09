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
    if (projects.length > 0) {
      await tursoWorldBuildingService.updateProject(projects[0].id, project);
    } else {
      await tursoWorldBuildingService.createProject(project);
    }
  }

  public async getWorldBuildingProject(projectId: string): Promise<WorldBuildingProject | null> {
    const projects = await tursoWorldBuildingService.getProjectsByProjectId(projectId);
    return projects.length > 0 ? projects[0] : null;
  }

  public async createWorldBuildingProject(projectId: string): Promise<WorldBuildingProject> {
    const newProject: WorldBuildingProject = {
      id: crypto.randomUUID(),
      projectId,
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
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await tursoWorldBuildingService.createProject(newProject);
    return newProject;
  }

  // ============================================================================
  // Location Operations
  // ============================================================================

  public async saveLocation(location: Location): Promise<void> {
    const existing = await tursoWorldBuildingService.getLocationsByProjectId(
      location.worldBuildingProjectId,
    );
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

  public async deleteLocation(id: string): Promise<void> {
    await tursoWorldBuildingService.deleteLocation(id);
  }

  // ============================================================================
  // Culture Operations
  // ============================================================================

  public async saveCulture(culture: Culture): Promise<void> {
    const existing = await tursoWorldBuildingService.getCulturesByProjectId(
      culture.worldBuildingProjectId,
    );
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
    
    return tursoWorldBuildingService.getLoreEntriesByProjectId(wbProjects[0].id);
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
