import { z } from 'zod';

// ============================================================================
// Core World-Building Types
// ============================================================================

export const WorldElementTypeSchema = z.enum([
  'location',
  'culture',
  'organization',
  'religion',
  'language',
  'technology',
  'magic-system',
  'political-system',
  'economic-system',
  'historical-event',
  'artifact',
  'creature',
  'natural-phenomenon',
]);

export type WorldElementType = z.infer<typeof WorldElementTypeSchema>;

export const LocationTypeSchema = z.enum([
  'continent',
  'country',
  'region',
  'city',
  'town',
  'village',
  'building',
  'landmark',
  'natural-feature',
  'dungeon',
  'realm',
]);

export type LocationType = z.infer<typeof LocationTypeSchema>;

export const CultureTypeSchema = z.enum([
  'civilization',
  'tribe',
  'nomadic',
  'city-state',
  'empire',
  'federation',
  'clan',
  'guild',
  'religious-order',
]);

export type CultureType = z.infer<typeof CultureTypeSchema>;

// ============================================================================
// Location Schema
// ============================================================================

export const LocationSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  name: z.string().min(1).max(200),
  type: LocationTypeSchema,
  
  // Geographic Information
  description: z.string().max(5000),
  geography: z.string().max(2000).optional(),
  climate: z.string().max(1000).optional(),
  naturalResources: z.array(z.string()).max(50).optional(),
  
  // Cultural Information
  population: z.number().min(0).optional(),
  primaryCultures: z.array(z.string().uuid()).optional(),
  languages: z.array(z.string()).max(20).optional(),
  
  // Political Information
  government: z.string().max(1000).optional(),
  ruler: z.string().max(200).optional(),
  allies: z.array(z.string().uuid()).optional(),
  enemies: z.array(z.string().uuid()).optional(),
  
  // Economic Information
  primaryIndustries: z.array(z.string()).max(20).optional(),
  tradingPartners: z.array(z.string().uuid()).optional(),
  currency: z.string().max(100).optional(),
  
  // Hierarchical Relationships
  parentLocationId: z.string().uuid().optional(),
  childLocationIds: z.array(z.string().uuid()).optional(),
  
  // Map Information
  coordinates: z.object({
    x: z.number(),
    y: z.number(),
  }).optional(),
  
  // Metadata
  imageUrl: z.string().url().optional(),
  mapImageUrl: z.string().url().optional(),
  tags: z.array(z.string()).max(20),
  notes: z.string().max(5000).optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type Location = z.infer<typeof LocationSchema>;

// ============================================================================
// Culture Schema
// ============================================================================

export const CultureSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  name: z.string().min(1).max(200),
  type: CultureTypeSchema,
  
  // Core Identity
  description: z.string().max(5000),
  values: z.array(z.string()).max(20),
  beliefs: z.string().max(2000).optional(),
  traditions: z.array(z.string()).max(50).optional(),
  
  // Social Structure
  socialStructure: z.string().max(2000).optional(),
  leadership: z.string().max(1000).optional(),
  caste: z.array(z.string()).max(20).optional(),
  
  // Cultural Practices
  language: z.string().max(200).optional(),
  religion: z.string().max(1000).optional(),
  art: z.string().max(1000).optional(),
  music: z.string().max(1000).optional(),
  cuisine: z.string().max(1000).optional(),
  clothing: z.string().max(1000).optional(),
  architecture: z.string().max(1000).optional(),
  
  // Relationships
  allies: z.array(z.string().uuid()).optional(),
  enemies: z.array(z.string().uuid()).optional(),
  tradingPartners: z.array(z.string().uuid()).optional(),
  
  // Geographic Presence
  territories: z.array(z.string().uuid()).optional(),
  originLocation: z.string().uuid().optional(),
  
  // Metadata
  imageUrl: z.string().url().optional(),
  tags: z.array(z.string()).max(20),
  notes: z.string().max(5000).optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type Culture = z.infer<typeof CultureSchema>;

// ============================================================================
// Timeline & Events
// ============================================================================

export const TimelineEventSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(5000),
  date: z.string().max(100), // Flexible date format (could be fantasy calendar)
  type: z.enum(['political', 'cultural', 'natural', 'technological', 'religious', 'personal']),
  importance: z.number().min(1).max(10), // 1-10 scale
  
  // Related Elements
  involvedCultures: z.array(z.string().uuid()).optional(),
  involvedLocations: z.array(z.string().uuid()).optional(),
  involvedCharacters: z.array(z.string().uuid()).optional(),
  
  // Consequences
  consequences: z.array(z.string()).max(20).optional(),
  
  // Metadata
  tags: z.array(z.string()).max(20),
  notes: z.string().max(3000).optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type TimelineEvent = z.infer<typeof TimelineEventSchema>;

export const TimelineSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  events: z.array(TimelineEventSchema),
  
  // Calendar System
  calendarSystem: z.string().max(1000).optional(),
  eras: z.array(z.object({
    name: z.string().max(100),
    startDate: z.string().max(100),
    endDate: z.string().max(100),
    description: z.string().max(1000),
  })).optional(),
  
  // Metadata
  tags: z.array(z.string()).max(20),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type Timeline = z.infer<typeof TimelineSchema>;

// ============================================================================
// Lore & Knowledge Base
// ============================================================================

export const LoreEntrySchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  title: z.string().min(1).max(200),
  category: z.enum([
    'mythology', 'history', 'technology', 'magic', 'science', 
    'philosophy', 'religion', 'legends', 'prophecies', 'customs'
  ]),
  content: z.string().max(10000),
  
  // Relationships
  relatedLocations: z.array(z.string().uuid()).optional(),
  relatedCultures: z.array(z.string().uuid()).optional(),
  relatedCharacters: z.array(z.string().uuid()).optional(),
  relatedEvents: z.array(z.string().uuid()).optional(),
  
  // Research Sources
  sources: z.array(z.string()).max(20).optional(),
  
  // Metadata
  tags: z.array(z.string()).max(20),
  isSecret: z.boolean().default(false), // Hidden from some characters
  reliability: z.number().min(1).max(10).optional(), // How reliable is this information
  notes: z.string().max(3000).optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type LoreEntry = z.infer<typeof LoreEntrySchema>;

// ============================================================================
// Research Sources
// ============================================================================

export const ResearchSourceSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  title: z.string().min(1).max(200),
  type: z.enum(['book', 'article', 'website', 'documentary', 'interview', 'personal-experience', 'other']),
  url: z.string().url().optional(),
  notes: z.string().max(5000).optional(),
  
  // Citation Information
  author: z.string().max(200).optional(),
  publication: z.string().max(200).optional(),
  publishedDate: z.string().max(100).optional(),
  
  // Metadata
  tags: z.array(z.string()).max(20),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type ResearchSource = z.infer<typeof ResearchSourceSchema>;

// ============================================================================
// World Map
// ============================================================================

export const WorldMapSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  imageUrl: z.string().url().optional(),
  
  // Map Data
  locations: z.array(z.object({
    locationId: z.string().uuid(),
    x: z.number(),
    y: z.number(),
    label: z.string().max(100),
  })),
  
  // Map Properties
  scale: z.string().max(100).optional(),
  legend: z.string().max(1000).optional(),
  
  // Metadata
  tags: z.array(z.string()).max(20),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type WorldMap = z.infer<typeof WorldMapSchema>;

// ============================================================================
// Generic World Element (Union Type)
// ============================================================================

export type WorldElement = Location | Culture | Timeline | LoreEntry | WorldMap;

// ============================================================================
// World-Building Project Container
// ============================================================================

export const WorldBuildingProjectSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(), // Links to main Project
  
  // Collections
  locations: z.array(LocationSchema),
  cultures: z.array(CultureSchema),
  timelines: z.array(TimelineSchema),
  lore: z.array(LoreEntrySchema),
  researchSources: z.array(ResearchSourceSchema),
  maps: z.array(WorldMapSchema),
  
  // Settings
  settings: z.object({
    defaultCalendarSystem: z.string().max(200).optional(),
    worldName: z.string().max(200).optional(),
    worldDescription: z.string().max(5000).optional(),
    consistencyCheckEnabled: z.boolean().default(true),
    autoLinkElements: z.boolean().default(true),
  }),
  
  // Metadata
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type WorldBuildingProject = z.infer<typeof WorldBuildingProjectSchema>;

// ============================================================================
// Filter & Search Types
// ============================================================================

export interface WorldBuildingFilters {
  search: string;
  types: WorldElementType[];
  tags: string[];
  dateRange?: {
    start: string;
    end: string;
  };
}

// ============================================================================
// Validation Results
// ============================================================================

export interface ConsistencyIssue {
  id: string;
  type: 'error' | 'warning' | 'suggestion';
  category: 'timeline' | 'geography' | 'culture' | 'relationship' | 'reference';
  message: string;
  affectedElements: string[]; // IDs of affected world elements
  suggestion?: string;
}

export interface WorldBuildingValidationResult {
  isValid: boolean;
  score: number; // 0-100
  issues: ConsistencyIssue[];
  strengths: string[];
  completeness: {
    locations: number;
    cultures: number;
    timeline: number;
    lore: number;
  };
}

// ============================================================================
// Type Guards
// ============================================================================

export function isLocation(value: unknown): value is Location {
  return LocationSchema.safeParse(value).success;
}

export function isCulture(value: unknown): value is Culture {
  return CultureSchema.safeParse(value).success;
}

export function isTimeline(value: unknown): value is Timeline {
  return TimelineSchema.safeParse(value).success;
}

export function isLoreEntry(value: unknown): value is LoreEntry {
  return LoreEntrySchema.safeParse(value).success;
}

export function isWorldMap(value: unknown): value is WorldMap {
  return WorldMapSchema.safeParse(value).success;
}