/**
 * Plot Storage Mappers
 * Database row to domain object conversion functions
 */

import type {
  PlotStructure,
  PlotHole,
  CharacterGraph,
  PlotSuggestion,
} from '@/features/plot-engine';

/**
 * Convert database row to PlotStructure
 */
export function rowToPlotStructure(row: Record<string, unknown>): PlotStructure {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    acts: JSON.parse(row.acts as string),
    climax: row.climax ? JSON.parse(row.climax as string) : undefined,
    resolution: row.resolution ? JSON.parse(row.resolution as string) : undefined,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

/**
 * Convert database row to PlotHole
 */
export function rowToPlotHole(row: Record<string, unknown>): PlotHole {
  return {
    id: row.id as string,
    type: row.type as PlotHole['type'],
    severity: row.severity as PlotHole['severity'],
    title: row.title as string,
    description: row.description as string,
    affectedChapters: JSON.parse(row.affected_chapters as string),
    affectedCharacters: JSON.parse(row.affected_characters as string),
    suggestedFix: row.suggested_fix as string | undefined,
    confidence: row.confidence as number,
    detected: new Date(row.detected as string),
  };
}

/**
 * Convert database row to CharacterGraph
 */
export function rowToCharacterGraph(row: Record<string, unknown>): CharacterGraph {
  return {
    projectId: row.project_id as string,
    nodes: JSON.parse(row.nodes as string),
    relationships: JSON.parse(row.relationships as string),
    analyzedAt: new Date(row.analyzed_at as string),
  };
}

/**
 * Convert database row to PlotSuggestion
 */
export function rowToPlotSuggestion(row: Record<string, unknown>): PlotSuggestion {
  return {
    id: row.id as string,
    type: row.type as PlotSuggestion['type'],
    title: row.title as string,
    description: row.description as string,
    placement: row.placement as PlotSuggestion['placement'],
    impact: row.impact as PlotSuggestion['impact'],
    relatedCharacters: row.related_characters
      ? JSON.parse(row.related_characters as string)
      : undefined,
    prerequisites: row.prerequisites ? JSON.parse(row.prerequisites as string) : undefined,
  };
}
