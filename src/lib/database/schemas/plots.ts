/**
 * Drizzle ORM schema for plot-related tables
 * Stores plot structures, holes, character graphs, analysis results, and suggestions
 */

import { sqliteTable, text, real } from 'drizzle-orm/sqlite-core';

import type { PlotHoleType, PlotHoleSeverity, PlotSuggestionType } from '@/features/plot-engine';

import { projects } from './projects';

// ============================================================================
// Plot Structures Table
// ============================================================================

/**
 * Plot structures table - stores story plot structures with acts and plot points
 */
export const plotStructures = sqliteTable('plot_structures', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  acts: text('acts', { mode: 'json' }).$type<
    Array<{
      id: string;
      actNumber: number;
      name: string;
      description?: string;
      plotPoints: Array<{
        id: string;
        type: string;
        title: string;
        description: string;
        chapterId?: string;
        characterIds: string[];
        importance: 'major' | 'minor';
        position?: number;
        timestamp?: string;
      }>;
      chapters: string[];
      duration?: number;
    }>
  >(),
  climax: text('climax', { mode: 'json' }).$type<{
    id: string;
    type: string;
    title: string;
    description: string;
    chapterId?: string;
    characterIds: string[];
    importance: 'major' | 'minor';
    position?: number;
    timestamp?: string;
  } | null>(),
  resolution: text('resolution', { mode: 'json' }).$type<{
    id: string;
    type: string;
    title: string;
    description: string;
    chapterId?: string;
    characterIds: string[];
    importance: 'major' | 'minor';
    position?: number;
    timestamp?: string;
  } | null>(),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// ============================================================================
// Plot Holes Table
// ============================================================================

/**
 * Plot holes table - stores detected plot inconsistencies and issues
 */
export const plotHoles = sqliteTable('plot_holes', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  type: text('type', {
    enum: [
      'continuity',
      'logic',
      'character_inconsistency',
      'timeline',
      'unresolved_thread',
      'contradictory_facts',
      'missing_motivation',
    ],
  })
    .notNull()
    .$type<PlotHoleType>(),
  severity: text('severity', { enum: ['minor', 'moderate', 'major', 'critical'] })
    .notNull()
    .$type<PlotHoleSeverity>(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  affectedChapters: text('affected_chapters', { mode: 'json' }).$type<string[]>(),
  affectedCharacters: text('affected_characters', { mode: 'json' }).$type<string[]>(),
  suggestedFix: text('suggested_fix'),
  confidence: real('confidence').notNull(),
  detected: text('detected').notNull(),
});

// ============================================================================
// Character Graphs Table
// ============================================================================

/**
 * Character graphs table - stores character relationship networks
 */
export const characterGraphs = sqliteTable('character_graphs', {
  projectId: text('project_id')
    .primaryKey()
    .references(() => projects.id, { onDelete: 'cascade' }),
  nodes: text('nodes', { mode: 'json' })
    .$type<
      Array<{
        id: string;
        name: string;
        role: string;
        importance: number;
        connectionCount: number;
      }>
    >()
    .notNull(),
  relationships: text('relationships', { mode: 'json' })
    .$type<
      Array<{
        id: string;
        projectId: string;
        character1Id: string;
        character2Id: string;
        type: string;
        strength: number;
        evolution: Array<{
          chapterId: string;
          chapterNumber: number;
          type: string;
          strength: number;
          notes?: string;
          event?: string;
        }>;
        description?: string;
        isReciprocal: boolean;
      }>
    >()
    .notNull(),
  analyzedAt: text('analyzed_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// ============================================================================
// Analysis Results Table
// ============================================================================

/**
 * Analysis results table - stores cached analysis results with TTL
 */
export const analysisResults = sqliteTable('analysis_results', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  analysisType: text('analysis_type').notNull(),
  resultData: text('result_data', { mode: 'json' }).notNull(),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// ============================================================================
// Plot Suggestions Table
// ============================================================================

/**
 * Plot suggestions table - stores AI-generated plot suggestions
 */
export const plotSuggestions = sqliteTable('plot_suggestions', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  type: text('type', {
    enum: [
      'plot_twist',
      'character_arc',
      'subplot',
      'conflict_escalation',
      'resolution_path',
      'theme_development',
    ],
  })
    .notNull()
    .$type<PlotSuggestionType>(),
  title: text('title').notNull(),
  description: text('description'),
  placement: text('placement', { enum: ['early', 'middle', 'late', 'anywhere'] }).$type<
    'early' | 'middle' | 'late' | 'anywhere'
  >(),
  impact: text('impact', { enum: ['low', 'medium', 'high'] }).$type<'low' | 'medium' | 'high'>(),
  relatedCharacters: text('related_characters', { mode: 'json' }).$type<string[]>(),
  prerequisites: text('prerequisites', { mode: 'json' }).$type<string[]>(),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// ============================================================================
// Story Arc Table
// ============================================================================

/**
 * Story arcs table - stores story structure and pacing analysis
 */
export const storyArcs = sqliteTable('story_arcs', {
  projectId: text('project_id')
    .primaryKey()
    .references(() => projects.id, { onDelete: 'cascade' }),
  structure: text('structure', {
    enum: ['3-act', '5-act', 'hero-journey', 'kishotenketsu', 'custom'],
  })
    .notNull()
    .$type<'3-act' | '5-act' | 'hero-journey' | 'kishotenketsu' | 'custom'>(),
  pacing: text('pacing', { mode: 'json' })
    .$type<{
      overall: 'slow' | 'moderate' | 'fast';
      score: number;
      byChapter: Array<{
        chapterId: string;
        chapterNumber: number;
        pace: number;
        wordCount: number;
        tensionLevel: number;
        issues?: string[];
      }>;
      recommendations: string[];
    }>()
    .notNull(),
  tension: text('tension', { mode: 'json' })
    .$type<
      Array<{
        chapterId: string;
        chapterNumber: number;
        tensionLevel: number;
        emotional: 'calm' | 'tense' | 'climactic' | 'resolution';
        events: string[];
      }>
    >()
    .notNull(),
  coherence: real('coherence').notNull(),
  recommendations: text('recommendations', { mode: 'json' }).$type<string[]>().notNull(),
  analyzedAt: text('analyzed_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// ============================================================================
// Type Inference Helpers
// ============================================================================

export type PlotStructureRow = typeof plotStructures.$inferSelect;
export type NewPlotStructureRow = typeof plotStructures.$inferInsert;

export type PlotHoleRow = typeof plotHoles.$inferSelect;
export type NewPlotHoleRow = typeof plotHoles.$inferInsert;

export type CharacterGraphRow = typeof characterGraphs.$inferSelect;
export type NewCharacterGraphRow = typeof characterGraphs.$inferInsert;

export type AnalysisResultRow = typeof analysisResults.$inferSelect;
export type NewAnalysisResultRow = typeof analysisResults.$inferInsert;

export type PlotSuggestionRow = typeof plotSuggestions.$inferSelect;
export type NewPlotSuggestionRow = typeof plotSuggestions.$inferInsert;

export type StoryArcRow = typeof storyArcs.$inferSelect;
export type NewStoryArcRow = typeof storyArcs.$inferInsert;
