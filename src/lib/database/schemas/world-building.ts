/**
 * Drizzle ORM schema for world-building tables
 * Stores locations, cultures, timelines, lore, and research sources
 */
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

import { projects } from './projects';

/**
 * World-building projects table
 */
export const worldBuildingProjects = sqliteTable('world_building_projects', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

/**
 * Locations table
 */
export const locations = sqliteTable('locations', {
  id: text('id').primaryKey(),
  worldBuildingProjectId: text('world_building_project_id')
    .notNull()
    .references(() => worldBuildingProjects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'city' | 'region' | 'landmark' | 'building' | 'natural' | 'other'
  description: text('description'),
  climate: text('climate'),
  geography: text('geography'),
  population: integer('population'),
  government: text('government'),
  economy: text('economy'),
  culture: text('culture'),
  history: text('history'),
  significance: text('significance'),
  parentLocationId: text('parent_location_id'),
  coordinates: text('coordinates', { mode: 'json' }).$type<{ x: number; y: number }>(),
  tags: text('tags', { mode: 'json' }).$type<string[]>(),
  imageUrl: text('image_url'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

/**
 * Cultures table
 */
export const cultures = sqliteTable('cultures', {
  id: text('id').primaryKey(),
  worldBuildingProjectId: text('world_building_project_id')
    .notNull()
    .references(() => worldBuildingProjects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  values: text('values', { mode: 'json' }).$type<string[]>(),
  traditions: text('traditions', { mode: 'json' }).$type<string[]>(),
  beliefs: text('beliefs', { mode: 'json' }).$type<string[]>(),
  language: text('language'),
  socialStructure: text('social_structure'),
  customs: text('customs'),
  arts: text('arts'),
  technology: text('technology'),
  locationIds: text('location_ids', { mode: 'json' }).$type<string[]>(),
  tags: text('tags', { mode: 'json' }).$type<string[]>(),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

/**
 * Timelines table
 */
export const timelines = sqliteTable('timelines', {
  id: text('id').primaryKey(),
  worldBuildingProjectId: text('world_building_project_id')
    .notNull()
    .references(() => worldBuildingProjects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  events: text('events', { mode: 'json' }).$type<
    Array<{
      id: string;
      date: string;
      title: string;
      description: string;
      type: 'political' | 'cultural' | 'natural' | 'technological' | 'religious' | 'personal';
      importance: number;
      involvedCultures?: string[];
      involvedLocations?: string[];
      involvedCharacters?: string[];
      consequences?: string[];
      tags: string[];
      notes?: string;
      createdAt: number;
      updatedAt: number;
    }>
  >(),
  startDate: text('start_date'),
  endDate: text('end_date'),
  tags: text('tags', { mode: 'json' }).$type<string[]>(),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

/**
 * Lore entries table
 */
export const loreEntries = sqliteTable('lore_entries', {
  id: text('id').primaryKey(),
  worldBuildingProjectId: text('world_building_project_id')
    .notNull()
    .references(() => worldBuildingProjects.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  category: text('category').notNull(), // 'mythology' | 'history' | 'magic' | 'technology' | 'other'
  content: text('content').notNull(),
  relatedEntries: text('related_entries', { mode: 'json' }).$type<string[]>(),
  tags: text('tags', { mode: 'json' }).$type<string[]>(),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

/**
 * Research sources table
 */
export const researchSources = sqliteTable('research_sources', {
  id: text('id').primaryKey(),
  worldBuildingProjectId: text('world_building_project_id')
    .notNull()
    .references(() => worldBuildingProjects.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  type: text('type').notNull(), // 'book' | 'article' | 'website' | 'interview' | 'other'
  author: text('author'),
  url: text('url'),
  notes: text('notes'),
  tags: text('tags', { mode: 'json' }).$type<string[]>(),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

/**
 * World maps table
 */
export const worldMaps = sqliteTable('world_maps', {
  id: text('id').primaryKey(),
  worldBuildingProjectId: text('world_building_project_id')
    .notNull()
    .references(() => worldBuildingProjects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  imageUrl: text('image_url'),
  scale: text('scale'),
  legend: text('legend'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

/**
 * Type inference helpers
 */
export type WorldBuildingProjectRow = typeof worldBuildingProjects.$inferSelect;
export type NewWorldBuildingProjectRow = typeof worldBuildingProjects.$inferInsert;
export type LocationRow = typeof locations.$inferSelect;
export type NewLocationRow = typeof locations.$inferInsert;
export type CultureRow = typeof cultures.$inferSelect;
export type NewCultureRow = typeof cultures.$inferInsert;
export type TimelineRow = typeof timelines.$inferSelect;
export type NewTimelineRow = typeof timelines.$inferInsert;
export type LoreEntryRow = typeof loreEntries.$inferSelect;
export type NewLoreEntryRow = typeof loreEntries.$inferInsert;
export type ResearchSourceRow = typeof researchSources.$inferSelect;
export type NewResearchSourceRow = typeof researchSources.$inferInsert;
export type WorldMapRow = typeof worldMaps.$inferSelect;
export type NewWorldMapRow = typeof worldMaps.$inferInsert;
