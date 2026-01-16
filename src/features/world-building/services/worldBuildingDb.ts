import type {
  WorldBuildingProject,
  Location,
  Culture,
  Timeline,
  LoreEntry,
  ResearchSource,
  WorldMap,
} from '@/features/world-building/types';
import { isCloudDbAvailable } from '@/lib/database/drizzle';
import { worldBuildingService as tursoWorldBuildingService } from '@/lib/database/services';
import { logger } from '@/lib/logging/logger';

const STORAGE_KEYS = {
  PROJECTS: 'novelist_wb_projects',
  LOCATIONS: 'novelist_wb_locations',
  CULTURES: 'novelist_wb_cultures',
  TIMELINES: 'novelist_wb_timelines',
  LORE: 'novelist_wb_lore',
  RESEARCH: 'novelist_wb_research',
  MAPS: 'novelist_wb_maps',
};

interface LocalProjectRow {
  id: string;
  projectId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

class WorldBuildingDatabase {
  public async init(): Promise<void> {
    if (isCloudDbAvailable()) {
      try {
        await tursoWorldBuildingService.init();
      } catch (error) {
        logger.warn('Failed to initialize Turso World Building service, falling back to local', {
          error,
        });
      }
    }
  }

  // ============================================================================
  // Helpers
  // ============================================================================

  private getLocal<T>(key: string): T[] {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T[]) : [];
  }

  private saveLocal<T>(key: string, data: T[]): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // ============================================================================
  // World-Building Project Operations
  // ============================================================================

  public async saveWorldBuildingProject(project: WorldBuildingProject): Promise<void> {
    if (isCloudDbAvailable()) {
      try {
        const projects = await tursoWorldBuildingService.getProjectsByProjectId(project.projectId);
        if (projects.length === 0) {
          await tursoWorldBuildingService.createProject('World Building', project.projectId);
        }
        return;
      } catch (error) {
        logger.error('Failed to save project to cloud', { error });
      }
    }

    const projects = this.getLocal<LocalProjectRow>(STORAGE_KEYS.PROJECTS);
    const existingIndex = projects.findIndex(
      (p: LocalProjectRow) => p.projectId === project.projectId,
    );
    if (existingIndex === -1) {
      projects.push({
        id: project.id,
        projectId: project.projectId,
        name: 'World Building',
        createdAt: new Date(project.createdAt).toISOString(),
        updatedAt: new Date(project.updatedAt).toISOString(),
      });
      this.saveLocal(STORAGE_KEYS.PROJECTS, projects);
    }
  }

  public async getWorldBuildingProject(projectId: string): Promise<WorldBuildingProject | null> {
    if (isCloudDbAvailable()) {
      try {
        const projects = await tursoWorldBuildingService.getProjectsByProjectId(projectId);
        if (projects.length > 0 && projects[0]) {
          const wbProjectRow = projects[0];
          const [locations, cultures, timelines, lore, researchSources, maps] = await Promise.all([
            tursoWorldBuildingService.getLocationsByProjectId(wbProjectRow.id),
            tursoWorldBuildingService.getCulturesByProjectId(wbProjectRow.id),
            tursoWorldBuildingService.getTimelinesByProjectId(wbProjectRow.id),
            tursoWorldBuildingService.getLoreByProjectId(wbProjectRow.id),
            tursoWorldBuildingService.getResearchSourcesByProjectId(wbProjectRow.id),
            tursoWorldBuildingService.getWorldMapsByProjectId(wbProjectRow.id),
          ]);

          return {
            id: wbProjectRow.id,
            projectId: wbProjectRow.projectId,
            locations,
            cultures,
            timelines,
            lore,
            researchSources,
            maps,
            settings: { consistencyCheckEnabled: true, autoLinkElements: true },
            createdAt: new Date(wbProjectRow.createdAt).getTime(),
            updatedAt: new Date(wbProjectRow.updatedAt).getTime(),
          };
        }
      } catch (error) {
        logger.error('Failed to get project from cloud', { error });
      }
    }

    const projects = this.getLocal<LocalProjectRow>(STORAGE_KEYS.PROJECTS);
    const wbProjectRow = projects.find((p: LocalProjectRow) => p.projectId === projectId);
    if (!wbProjectRow) return null;

    const filterById = <T extends { projectId: string; worldBuildingProjectId?: string }>(
      items: T[],
      id: string,
    ): T[] =>
      items.filter((item: T) => item.projectId === projectId || item.worldBuildingProjectId === id);

    return {
      id: wbProjectRow.id,
      projectId: wbProjectRow.projectId,
      locations: filterById(this.getLocal<Location>(STORAGE_KEYS.LOCATIONS), wbProjectRow.id),
      cultures: filterById(this.getLocal<Culture>(STORAGE_KEYS.CULTURES), wbProjectRow.id),
      timelines: filterById(this.getLocal<Timeline>(STORAGE_KEYS.TIMELINES), wbProjectRow.id),
      lore: filterById(this.getLocal<LoreEntry>(STORAGE_KEYS.LORE), wbProjectRow.id),
      researchSources: filterById(
        this.getLocal<ResearchSource>(STORAGE_KEYS.RESEARCH),
        wbProjectRow.id,
      ),
      maps: filterById(this.getLocal<WorldMap>(STORAGE_KEYS.MAPS), wbProjectRow.id),
      settings: { consistencyCheckEnabled: true, autoLinkElements: true },
      createdAt: new Date(wbProjectRow.createdAt).getTime(),
      updatedAt: new Date(wbProjectRow.updatedAt).getTime(),
    };
  }

  public async createWorldBuildingProject(projectId: string): Promise<WorldBuildingProject> {
    if (isCloudDbAvailable()) {
      try {
        const wbProjectRow = await tursoWorldBuildingService.createProject(
          'World Building',
          projectId,
        );
        return {
          id: wbProjectRow.id,
          projectId: wbProjectRow.projectId,
          locations: [],
          cultures: [],
          timelines: [],
          lore: [],
          researchSources: [],
          maps: [],
          settings: { consistencyCheckEnabled: true, autoLinkElements: true },
          createdAt: new Date(wbProjectRow.createdAt).getTime(),
          updatedAt: new Date(wbProjectRow.updatedAt).getTime(),
        };
      } catch (error) {
        logger.error('Failed to create project in cloud', { error });
      }
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const newProjectRow: LocalProjectRow = {
      id,
      projectId,
      name: 'World Building',
      createdAt: now,
      updatedAt: now,
    };

    const projects = this.getLocal<LocalProjectRow>(STORAGE_KEYS.PROJECTS);
    projects.push(newProjectRow);
    this.saveLocal(STORAGE_KEYS.PROJECTS, projects);

    return {
      id,
      projectId,
      locations: [],
      cultures: [],
      timelines: [],
      lore: [],
      researchSources: [],
      maps: [],
      settings: { consistencyCheckEnabled: true, autoLinkElements: true },
      createdAt: new Date(now).getTime(),
      updatedAt: new Date(now).getTime(),
    };
  }

  // ============================================================================
  // Location Operations
  // ============================================================================

  public async saveLocation(location: Location): Promise<void> {
    if (isCloudDbAvailable()) {
      try {
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
        return;
      } catch (error) {
        logger.error('Failed to save location to cloud', { error });
      }
    }

    const locations = this.getLocal<Location>(STORAGE_KEYS.LOCATIONS);
    const index = locations.findIndex((l: Location) => l.id === location.id);
    if (index > -1) {
      locations[index] = location;
    } else {
      locations.push(location);
    }
    this.saveLocal(STORAGE_KEYS.LOCATIONS, locations);
  }

  public async getLocationsByProject(projectId: string): Promise<Location[]> {
    if (isCloudDbAvailable()) {
      try {
        const wbProjects = await tursoWorldBuildingService.getProjectsByProjectId(projectId);
        if (wbProjects.length > 0 && wbProjects[0]) {
          return await tursoWorldBuildingService.getLocationsByProjectId(wbProjects[0].id);
        }
      } catch (error) {
        logger.error('Failed to get locations from cloud', { error });
      }
    }

    return this.getLocal<Location>(STORAGE_KEYS.LOCATIONS).filter(
      (l: Location) => l.projectId === projectId,
    );
  }

  public async getLocation(id: string): Promise<Location | null> {
    if (isCloudDbAvailable()) {
      try {
        const location = await tursoWorldBuildingService.getLocationById(id);
        if (location) return location;
      } catch (error) {
        logger.error('Failed to get location from cloud', { error });
      }
    }

    return (
      this.getLocal<Location>(STORAGE_KEYS.LOCATIONS).find((l: Location) => l.id === id) || null
    );
  }

  public async deleteLocation(id: string): Promise<void> {
    if (isCloudDbAvailable()) {
      try {
        await tursoWorldBuildingService.deleteLocation(id);
        return;
      } catch (error) {
        logger.error('Failed to delete location from cloud', { error });
      }
    }

    const locations = this.getLocal<Location>(STORAGE_KEYS.LOCATIONS);
    this.saveLocal(
      STORAGE_KEYS.LOCATIONS,
      locations.filter((l: Location) => l.id !== id),
    );
  }

  // ============================================================================
  // Culture Operations
  // ============================================================================

  public async saveCulture(culture: Culture): Promise<void> {
    if (isCloudDbAvailable()) {
      try {
        const worldBuildingProjectId =
          await tursoWorldBuildingService.getWorldBuildingProjectIdByMainId(culture.projectId);
        const existing =
          await tursoWorldBuildingService.getCulturesByProjectId(worldBuildingProjectId);
        const found = existing.find(c => c.id === culture.id);

        if (found) {
          await tursoWorldBuildingService.updateCulture(culture.id, culture);
        } else {
          await tursoWorldBuildingService.createCulture(culture);
        }
        return;
      } catch (error) {
        logger.error('Failed to save culture to cloud', { error });
      }
    }

    const cultures = this.getLocal<Culture>(STORAGE_KEYS.CULTURES);
    const index = cultures.findIndex((c: Culture) => c.id === culture.id);
    if (index > -1) {
      cultures[index] = culture;
    } else {
      cultures.push(culture);
    }
    this.saveLocal(STORAGE_KEYS.CULTURES, cultures);
  }

  public async getCulturesByProject(projectId: string): Promise<Culture[]> {
    if (isCloudDbAvailable()) {
      try {
        const wbProjects = await tursoWorldBuildingService.getProjectsByProjectId(projectId);
        if (wbProjects.length > 0 && wbProjects[0]) {
          return await tursoWorldBuildingService.getCulturesByProjectId(wbProjects[0].id);
        }
      } catch (error) {
        logger.error('Failed to get cultures from cloud', { error });
      }
    }

    return this.getLocal<Culture>(STORAGE_KEYS.CULTURES).filter(
      (c: Culture) => c.projectId === projectId,
    );
  }

  public async getCulture(id: string): Promise<Culture | null> {
    if (isCloudDbAvailable()) {
      try {
        const culture = await tursoWorldBuildingService.getCultureById(id);
        if (culture) return culture;
      } catch (error) {
        logger.error('Failed to get culture from cloud', { error });
      }
    }

    return this.getLocal<Culture>(STORAGE_KEYS.CULTURES).find((c: Culture) => c.id === id) || null;
  }

  public async deleteCulture(id: string): Promise<void> {
    if (isCloudDbAvailable()) {
      try {
        await tursoWorldBuildingService.deleteCulture(id);
        return;
      } catch (error) {
        logger.error('Failed to delete culture from cloud', { error });
      }
    }

    const cultures = this.getLocal<Culture>(STORAGE_KEYS.CULTURES);
    this.saveLocal(
      STORAGE_KEYS.CULTURES,
      cultures.filter((c: Culture) => c.id !== id),
    );
  }

  // ============================================================================
  // Timeline, Lore, Research, and Map Operations
  // ============================================================================

  public async getTimelinesByProject(projectId: string): Promise<Timeline[]> {
    if (isCloudDbAvailable()) {
      try {
        const wbProjects = await tursoWorldBuildingService.getProjectsByProjectId(projectId);
        if (wbProjects.length > 0 && wbProjects[0]) {
          return await tursoWorldBuildingService.getTimelinesByProjectId(wbProjects[0].id);
        }
      } catch (error) {
        logger.error('Failed to get timelines from cloud', { error });
      }
    }

    return this.getLocal<Timeline>(STORAGE_KEYS.TIMELINES).filter(
      (t: Timeline) => t.projectId === projectId,
    );
  }

  public async getLoreByProject(projectId: string): Promise<LoreEntry[]> {
    if (isCloudDbAvailable()) {
      try {
        const wbProjects = await tursoWorldBuildingService.getProjectsByProjectId(projectId);
        if (wbProjects.length > 0 && wbProjects[0]) {
          return await tursoWorldBuildingService.getLoreByProjectId(wbProjects[0].id);
        }
      } catch (error) {
        logger.error('Failed to get lore from cloud', { error });
      }
    }

    return this.getLocal<LoreEntry>(STORAGE_KEYS.LORE).filter(
      (l: LoreEntry) => l.projectId === projectId,
    );
  }

  public async getResearchSourcesByProject(projectId: string): Promise<ResearchSource[]> {
    if (isCloudDbAvailable()) {
      try {
        const wbProjects = await tursoWorldBuildingService.getProjectsByProjectId(projectId);
        if (wbProjects.length > 0 && wbProjects[0]) {
          return await tursoWorldBuildingService.getResearchSourcesByProjectId(wbProjects[0].id);
        }
      } catch (error) {
        logger.error('Failed to get research sources from cloud', { error });
      }
    }

    return this.getLocal<ResearchSource>(STORAGE_KEYS.RESEARCH).filter(
      (r: ResearchSource) => r.projectId === projectId,
    );
  }

  public async getWorldMapsByProject(projectId: string): Promise<WorldMap[]> {
    if (isCloudDbAvailable()) {
      try {
        const wbProjects = await tursoWorldBuildingService.getProjectsByProjectId(projectId);
        if (wbProjects.length > 0 && wbProjects[0]) {
          return await tursoWorldBuildingService.getWorldMapsByProjectId(wbProjects[0].id);
        }
      } catch (error) {
        logger.error('Failed to get maps from cloud', { error });
      }
    }

    return this.getLocal<WorldMap>(STORAGE_KEYS.MAPS).filter(
      (m: WorldMap) => m.projectId === projectId,
    );
  }
}

export const worldBuildingDb = new WorldBuildingDatabase();
