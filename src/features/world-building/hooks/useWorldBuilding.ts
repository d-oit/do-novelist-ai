/**
 * World-Building Hook
 * Main hook for managing world-building state and operations
 */

import { useState, useEffect, useCallback } from 'react';
import type {
  WorldBuildingProject,
  Location,
  Culture,
  Timeline,
  LoreEntry,
  WorldBuildingFilters,
  WorldBuildingValidationResult,
} from '../types';
import { worldBuildingService } from '../services/worldBuildingService';
import { worldBuildingDb } from '../services/worldBuildingDb';

interface UseWorldBuildingReturn {
  // State
  worldBuilding: WorldBuildingProject | null;
  locations: Location[];
  cultures: Culture[];
  timelines: Timeline[];
  lore: LoreEntry[];
  isLoading: boolean;
  error: string | null;
  validation: WorldBuildingValidationResult | null;

  // Actions
  initializeWorldBuilding: (projectId: string) => Promise<void>;
  refreshData: () => Promise<void>;

  // Location actions
  createLocation: (data: Partial<Location>) => Promise<Location | null>;
  updateLocation: (id: string, updates: Partial<Location>) => Promise<Location | null>;
  deleteLocation: (id: string) => Promise<void>;

  // Culture actions
  createCulture: (data: Partial<Culture>) => Promise<Culture | null>;
  updateCulture: (id: string, updates: Partial<Culture>) => Promise<Culture | null>;
  deleteCulture: (id: string) => Promise<void>;

  // Search and filtering
  searchElements: (filters: WorldBuildingFilters) => Promise<void>;

  // Validation
  validateWorldBuilding: () => Promise<void>;
}

export function useWorldBuilding(projectId?: string): UseWorldBuildingReturn {
  const [worldBuilding, setWorldBuilding] = useState<WorldBuildingProject | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [cultures, setCultures] = useState<Culture[]>([]);
  const [timelines, setTimelines] = useState<Timeline[]>([]);
  const [lore, setLore] = useState<LoreEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validation, setValidation] = useState<WorldBuildingValidationResult | null>(null);

  const refreshData = useCallback(async (): Promise<void> => {
    if ((projectId?.length ?? 0) === 0 && (worldBuilding?.projectId?.length ?? 0) === 0) return;

    const targetProjectId = projectId ?? worldBuilding?.projectId;
    if ((targetProjectId?.length ?? 0) === 0) return;

    setIsLoading(true);

    try {
      const [locationsData, culturesData, timelinesData, loreData] = await Promise.all([
        worldBuildingService.getLocations(targetProjectId as string),
        worldBuildingService.getCultures(targetProjectId as string),
        worldBuildingDb.getTimelinesByProject(targetProjectId as string),
        worldBuildingDb.getLoreByProject(targetProjectId as string),
      ]);

      setLocations(locationsData);
      setCultures(culturesData);
      setTimelines(timelinesData);
      setLore(loreData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load world-building data';
      console.error('World-building data loading error:', err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, worldBuilding?.projectId]);

  const initializeWorldBuilding = useCallback(
    async (targetProjectId: string): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        // Initialize database
        await worldBuildingDb.init();

        // Initialize or get world-building project
        const wb = await worldBuildingService.initializeWorldBuilding(targetProjectId);
        setWorldBuilding(wb);

        // Load all data
        await refreshData();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to initialize world-building';
        console.error('World-building initialization error:', err);
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [refreshData],
  );

  // ============================================================================
  // Location Actions
  // ============================================================================

  const createLocation = useCallback(
    async (data: Partial<Location>): Promise<Location | null> => {
      if ((projectId?.length ?? 0) === 0 && (worldBuilding?.projectId?.length ?? 0) === 0)
        return null;

      const targetProjectId = projectId ?? worldBuilding?.projectId;
      if ((targetProjectId?.length ?? 0) === 0) return null;

      try {
        const location = await worldBuildingService.createLocation(targetProjectId as string, data);
        setLocations(prev => [...prev, location]);
        return location;
      } catch (err) {
        console.error('Failed to create location:', err);
        setError('Failed to create location');
        return null;
      }
    },
    [projectId, worldBuilding?.projectId],
  );

  const updateLocation = useCallback(
    async (id: string, updates: Partial<Location>): Promise<Location | null> => {
      try {
        const updated = await worldBuildingService.updateLocation(id, updates);
        if (updated) {
          setLocations(prev => prev.map(loc => (loc.id === id ? updated : loc)));
        }
        return updated;
      } catch (err) {
        console.error('Failed to update location:', err);
        setError('Failed to update location');
        return null;
      }
    },
    [],
  );

  const deleteLocation = useCallback(async (id: string): Promise<void> => {
    try {
      await worldBuildingService.deleteLocation(id);
      setLocations(prev => prev.filter(loc => loc.id !== id));
    } catch (err) {
      console.error('Failed to delete location:', err);
      setError('Failed to delete location');
    }
  }, []);

  // ============================================================================
  // Culture Actions
  // ============================================================================

  const createCulture = useCallback(
    async (data: Partial<Culture>): Promise<Culture | null> => {
      if ((projectId?.length ?? 0) === 0 && (worldBuilding?.projectId?.length ?? 0) === 0)
        return null;

      const targetProjectId = projectId ?? worldBuilding?.projectId;
      if ((targetProjectId?.length ?? 0) === 0) return null;

      try {
        const culture = await worldBuildingService.createCulture(targetProjectId as string, data);
        setCultures(prev => [...prev, culture]);
        return culture;
      } catch (err) {
        console.error('Failed to create culture:', err);
        setError('Failed to create culture');
        return null;
      }
    },
    [projectId, worldBuilding?.projectId],
  );

  const updateCulture = useCallback(
    async (id: string, updates: Partial<Culture>): Promise<Culture | null> => {
      try {
        const updated = await worldBuildingService.updateCulture(id, updates);
        if (updated) {
          setCultures(prev => prev.map(cult => (cult.id === id ? updated : cult)));
        }
        return updated;
      } catch (err) {
        console.error('Failed to update culture:', err);
        setError('Failed to update culture');
        return null;
      }
    },
    [],
  );

  const deleteCulture = useCallback(async (id: string): Promise<void> => {
    try {
      await worldBuildingService.deleteCulture(id);
      setCultures(prev => prev.filter(cult => cult.id !== id));
    } catch (err) {
      console.error('Failed to delete culture:', err);
      setError('Failed to delete culture');
    }
  }, []);

  // ============================================================================
  // Search & Validation
  // ============================================================================

  const searchElements = useCallback(
    async (filters: WorldBuildingFilters): Promise<void> => {
      if ((projectId?.length ?? 0) === 0 && (worldBuilding?.projectId?.length ?? 0) === 0) return;

      const targetProjectId = projectId ?? worldBuilding?.projectId;
      if ((targetProjectId?.length ?? 0) === 0) return;

      try {
        const results = await worldBuildingService.searchWorldElements(
          targetProjectId as string,
          filters,
        );
        setLocations(results.locations);
        setCultures(results.cultures);
        setTimelines(results.timelines);
        setLore(results.lore);
      } catch (err) {
        console.error('Failed to search world elements:', err);
        setError('Failed to search world elements');
      }
    },
    [projectId, worldBuilding?.projectId],
  );

  const validateWorldBuilding = useCallback(async (): Promise<void> => {
    if ((projectId?.length ?? 0) === 0 && (worldBuilding?.projectId?.length ?? 0) === 0) return;

    const targetProjectId = projectId ?? worldBuilding?.projectId;
    if ((targetProjectId?.length ?? 0) === 0) return;

    try {
      const result = await worldBuildingService.validateWorldBuilding(targetProjectId as string);
      setValidation(result);
    } catch (err) {
      console.error('Failed to validate world-building:', err);
      setError('Failed to validate world-building');
    }
  }, [projectId, worldBuilding?.projectId]);

  // ============================================================================
  // Effects
  // ============================================================================

  useEffect(() => {
    if ((projectId?.length ?? 0) > 0) {
      void initializeWorldBuilding(projectId as string);
    }
  }, [projectId, initializeWorldBuilding]);

  return {
    worldBuilding,
    locations,
    cultures,
    timelines,
    lore,
    isLoading,
    error,
    validation,
    initializeWorldBuilding,
    refreshData,
    createLocation,
    updateLocation,
    deleteLocation,
    createCulture,
    updateCulture,
    deleteCulture,
    searchElements,
    validateWorldBuilding,
  };
}
