/**
 * World-Building Service
 * Business logic layer for world-building operations
 */

import type {
  WorldBuildingProject,
  Location,
  Culture,
  Timeline,
  LoreEntry,
  WorldBuildingFilters,
  WorldBuildingValidationResult,
  ConsistencyIssue,
} from '../types';

import { worldBuildingDb } from './worldBuildingDb';

// Type for items that can be filtered by search and tags
type FilterableWorldElement = Location | Culture | Timeline | LoreEntry;

class WorldBuildingService {
  // ============================================================================
  // Project Management
  // ============================================================================

  public async initializeWorldBuilding(projectId: string): Promise<WorldBuildingProject> {
    const existing = await worldBuildingDb.getWorldBuildingProject(projectId);
    if (existing) {
      return existing;
    }
    return await worldBuildingDb.createWorldBuildingProject(projectId);
  }

  public async getWorldBuildingData(projectId: string): Promise<WorldBuildingProject | null> {
    return await worldBuildingDb.getWorldBuildingProject(projectId);
  }

  // ============================================================================
  // Location Management
  // ============================================================================

  public async createLocation(
    projectId: string,
    locationData: Partial<Location>,
  ): Promise<Location> {
    const location: Location = {
      id: crypto.randomUUID(),
      projectId,
      name: locationData.name ?? 'Untitled Location',
      type: locationData.type ?? 'city',
      description: locationData.description ?? '',
      tags: locationData.tags ?? [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...locationData,
    };

    await worldBuildingDb.saveLocation(location);
    return location;
  }

  public async updateLocation(id: string, updates: Partial<Location>): Promise<Location | null> {
    const existing = await worldBuildingDb.getLocation(id);
    if (!existing) return null;

    const updated = { ...existing, ...updates, updatedAt: Date.now() };
    await worldBuildingDb.saveLocation(updated);
    return updated;
  }

  public async deleteLocation(id: string): Promise<void> {
    await worldBuildingDb.deleteLocation(id);
  }

  public async getLocations(projectId: string): Promise<Location[]> {
    return await worldBuildingDb.getLocationsByProject(projectId);
  }

  // ============================================================================
  // Culture Management
  // ============================================================================

  public async createCulture(projectId: string, cultureData: Partial<Culture>): Promise<Culture> {
    const culture: Culture = {
      id: crypto.randomUUID(),
      projectId,
      name: cultureData.name ?? 'Untitled Culture',
      type: cultureData.type ?? 'civilization',
      description: cultureData.description ?? '',
      values: cultureData.values ?? [],
      tags: cultureData.tags ?? [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...cultureData,
    };

    await worldBuildingDb.saveCulture(culture);
    return culture;
  }

  public async updateCulture(id: string, updates: Partial<Culture>): Promise<Culture | null> {
    const existing = await worldBuildingDb.getCulture(id);
    if (!existing) return null;

    const updated = { ...existing, ...updates, updatedAt: Date.now() };
    await worldBuildingDb.saveCulture(updated);
    return updated;
  }

  public async deleteCulture(id: string): Promise<void> {
    await worldBuildingDb.deleteCulture(id);
  }

  public async getCultures(projectId: string): Promise<Culture[]> {
    return await worldBuildingDb.getCulturesByProject(projectId);
  }

  // ============================================================================
  // Search & Filtering
  // ============================================================================

  public async searchWorldElements(
    projectId: string,
    filters: WorldBuildingFilters,
  ): Promise<{
    locations: Location[];
    cultures: Culture[];
    timelines: Timeline[];
    lore: LoreEntry[];
  }> {
    const [locations, cultures, timelines, lore] = await Promise.all([
      this.getLocations(projectId),
      this.getCultures(projectId),
      worldBuildingDb.getTimelinesByProject(projectId),
      worldBuildingDb.getLoreByProject(projectId),
    ]);

    const filterBySearch = (
      items: FilterableWorldElement[],
      searchTerm: string,
    ): FilterableWorldElement[] => {
      if (searchTerm.length === 0) return items;
      const lower = searchTerm.toLowerCase();
      return items.filter((item: FilterableWorldElement): boolean => {
        const name = ('name' in item ? item.name : 'title' in item ? item.title : '') ?? '';
        const description =
          ('description' in item ? item.description : 'content' in item ? item.content : '') ?? '';
        const tags = item.tags ?? [];
        return (
          name.toLowerCase().includes(lower) ||
          description.toLowerCase().includes(lower) ||
          tags.some((tag: string) => tag.toLowerCase().includes(lower))
        );
      });
    };

    const filterByTags = (
      items: FilterableWorldElement[],
      tags: string[],
    ): FilterableWorldElement[] => {
      if (tags.length === 0) return items;
      return items.filter(item => tags.some(tag => (item.tags ?? []).includes(tag)));
    };

    const applyFilters = (items: FilterableWorldElement[]): FilterableWorldElement[] => {
      let filtered = filterBySearch(items, filters.search);
      filtered = filterByTags(filtered, filters.tags);
      return filtered;
    };

    return {
      locations: applyFilters(locations) as Location[],
      cultures: applyFilters(cultures) as Culture[],
      timelines: applyFilters(timelines) as Timeline[],
      lore: applyFilters(lore) as LoreEntry[],
    };
  }

  // ============================================================================
  // Validation & Consistency Checking
  // ============================================================================

  public async validateWorldBuilding(projectId: string): Promise<WorldBuildingValidationResult> {
    const [locations, cultures, timelines, lore] = await Promise.all([
      this.getLocations(projectId),
      this.getCultures(projectId),
      worldBuildingDb.getTimelinesByProject(projectId),
      worldBuildingDb.getLoreByProject(projectId),
    ]);

    const issues: ConsistencyIssue[] = [];

    // Check for orphaned references
    this.checkOrphanedReferences(locations, cultures, issues);

    // Check timeline consistency
    this.checkTimelineConsistency(timelines, issues);

    // Check geographic consistency
    this.checkGeographicConsistency(locations, issues);

    const score = Math.max(0, 100 - issues.length * 10);
    const isValid = issues.filter(i => i.type === 'error').length === 0;

    return {
      isValid,
      score,
      issues,
      strengths: this.identifyStrengths(locations, cultures, timelines, lore),
      completeness: {
        locations: locations.length,
        cultures: cultures.length,
        timeline: timelines.length,
        lore: lore.length,
      },
    };
  }

  private checkOrphanedReferences(
    locations: Location[],
    cultures: Culture[],
    issues: ConsistencyIssue[],
  ): void {
    const cultureIds = new Set(cultures.map(c => c.id));

    // Check culture references in locations
    locations.forEach(location => {
      location.primaryCultures?.forEach(cultureId => {
        if (!cultureIds.has(cultureId)) {
          issues.push({
            id: crypto.randomUUID(),
            type: 'error',
            category: 'reference',
            message: `Location "${location.name}" references non-existent culture`,
            affectedElements: [location.id],
            suggestion: 'Remove the invalid culture reference or create the referenced culture',
          });
        }
      });
    });
  }

  private checkTimelineConsistency(timelines: Timeline[], issues: ConsistencyIssue[]): void {
    timelines.forEach(timeline => {
      const events = timeline.events.sort((a, b) => a.date.localeCompare(b.date));

      for (let i = 1; i < events.length; i++) {
        const current = events[i];
        const previous = events[i - 1];

        if (
          current &&
          previous &&
          current.date === previous.date &&
          current.type === previous.type
        ) {
          issues.push({
            id: crypto.randomUUID(),
            type: 'warning',
            category: 'timeline',
            message: `Potential timeline conflict: "${current.title}" and "${previous.title}" occur on the same date`,
            affectedElements: [timeline.id],
            suggestion: 'Review the timing of these events for accuracy',
          });
        }
      }
    });
  }

  private checkGeographicConsistency(locations: Location[], issues: ConsistencyIssue[]): void {
    const locationMap = new Map(locations.map(l => [l.id, l]));

    locations.forEach(location => {
      if (location.parentLocationId != null && location.parentLocationId.length > 0) {
        const parent = locationMap.get(location.parentLocationId);
        if (!parent) {
          issues.push({
            id: crypto.randomUUID(),
            type: 'error',
            category: 'geography',
            message: `Location "${location.name}" has invalid parent reference`,
            affectedElements: [location.id],
            suggestion: 'Remove the invalid parent reference or create the referenced location',
          });
        }
      }
    });
  }

  private identifyStrengths(
    locations: Location[],
    cultures: Culture[],
    timelines: Timeline[],
    lore: LoreEntry[],
  ): string[] {
    const strengths: string[] = [];

    if (locations.length >= 5) strengths.push('Rich geographic diversity');
    if (cultures.length >= 3) strengths.push('Multiple cultural perspectives');
    if (timelines.length >= 1 && timelines[0] && timelines[0].events.length >= 10)
      strengths.push('Detailed historical timeline');
    if (lore.length >= 10) strengths.push('Comprehensive lore documentation');

    return strengths;
  }
}

export const worldBuildingService = new WorldBuildingService();
