/**
 * Data mappers for World-Building entities
 * Converts database rows to domain types
 */
import type {
  Location,
  Culture,
  Timeline,
  LoreEntry,
  ResearchSource,
  WorldMap,
  TimelineEvent,
} from '@/features/world-building/types';
import type {
  LocationRow,
  CultureRow,
  TimelineRow,
  LoreEntryRow,
  ResearchSourceRow,
  WorldMapRow,
} from '@/lib/database/schemas';

export function mapRowToLocation(row: LocationRow): Location {
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

export function mapRowToCulture(row: CultureRow): Culture {
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

export function mapRowToTimeline(row: TimelineRow): Timeline {
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

export function mapRowToLoreEntry(row: LoreEntryRow): LoreEntry {
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

export function mapRowToResearchSource(row: ResearchSourceRow): ResearchSource {
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

export function mapRowToWorldMap(row: WorldMapRow): WorldMap {
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
