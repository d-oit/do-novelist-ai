/**
 * World-Building Assistant Feature
 *
 * Comprehensive world-building tools for authors to create and manage
 * fictional worlds, locations, cultures, timelines, and lore consistency.
 */

// Types
export type {
  WorldElement,
  WorldElementType,
  Location,
  Culture,
  Timeline,
  TimelineEvent,
  LoreEntry,
  WorldBuildingProject,
  WorldBuildingFilters,
  ResearchSource,
  WorldMap,
  LocationType,
  CultureType,
  WorldBuildingValidationResult,
} from './types';

// Hooks
export { useWorldBuilding } from './hooks/useWorldBuilding';
export { useWorldBuildingValidation } from './hooks/useWorldBuildingValidation';

// Services
export { worldBuildingService } from './services/worldBuildingService';
export { worldBuildingDb } from './services/worldBuildingDb';

// Components
export { WorldBuildingDashboard } from './components/WorldBuildingDashboard';
export { WorldElementEditor } from './components/WorldElementEditor';
export { LocationManager } from './components/LocationManager';
export { CultureManager } from './components/CultureManager';
export { TimelineEditor } from './components/TimelineEditor';
export { LoreLibrary } from './components/LoreLibrary';
export { ResearchPanel } from './components/ResearchPanel';
export { WorldMap as WorldMapComponent } from './components/WorldMap';
export { ConsistencyChecker } from './components/ConsistencyChecker';