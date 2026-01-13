/**
 * Plot Storage CRUD Operations
 * All database operations for plot-related entities
 */

import type {
  PlotStructure,
  PlotHole,
  CharacterGraph,
  PlotSuggestion,
} from '@/features/plot-engine';
import { logger } from '@/lib/logging/logger';

import type { Client } from './plot-db-config';
import {
  rowToPlotStructure,
  rowToPlotHole,
  rowToCharacterGraph,
  rowToPlotSuggestion,
} from './plot-mappers';

// ==================== Plot Structures ====================

/**
 * Save a plot structure
 */
export async function savePlotStructure(client: Client, structure: PlotStructure): Promise<void> {
  try {
    await client.execute({
      sql: `INSERT INTO plot_structures (id, project_id, acts, climax, resolution, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
            acts=excluded.acts, climax=excluded.climax, resolution=excluded.resolution, updated_at=CURRENT_TIMESTAMP`,
      args: [
        structure.id,
        structure.projectId,
        JSON.stringify(structure.acts),
        structure.climax ? JSON.stringify(structure.climax) : null,
        structure.resolution ? JSON.stringify(structure.resolution) : null,
        structure.createdAt.toISOString(),
        structure.updatedAt.toISOString(),
      ],
    });

    logger.info('Plot structure saved', { id: structure.id, projectId: structure.projectId });
  } catch (error) {
    logger.error('Failed to save plot structure', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Get plot structure by ID
 */
export async function getPlotStructure(client: Client, id: string): Promise<PlotStructure | null> {
  try {
    const result = await client.execute({
      sql: 'SELECT * FROM plot_structures WHERE id = ?',
      args: [id],
    });

    if (result.rows.length === 0) return null;

    const row = result.rows[0] as Record<string, unknown>;
    return rowToPlotStructure(row);
  } catch (error) {
    logger.error('Failed to get plot structure', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Get all plot structures for a project
 */
export async function getPlotStructuresByProject(
  client: Client,
  projectId: string,
): Promise<PlotStructure[]> {
  try {
    const result = await client.execute({
      sql: 'SELECT * FROM plot_structures WHERE project_id = ? ORDER BY created_at DESC',
      args: [projectId],
    });

    return result.rows.map(row => rowToPlotStructure(row as Record<string, unknown>));
  } catch (error) {
    logger.error('Failed to get plot structures by project', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Delete a plot structure
 */
export async function deletePlotStructure(client: Client, id: string): Promise<void> {
  try {
    await client.execute({
      sql: 'DELETE FROM plot_structures WHERE id = ?',
      args: [id],
    });

    logger.info('Plot structure deleted', { id });
  } catch (error) {
    logger.error('Failed to delete plot structure', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

// ==================== Plot Holes ====================

/**
 * Save plot holes
 */
export async function savePlotHoles(
  client: Client,
  projectId: string,
  holes: PlotHole[],
): Promise<void> {
  try {
    // Delete existing holes for this project
    await client.execute({
      sql: 'DELETE FROM plot_holes WHERE project_id = ?',
      args: [projectId],
    });

    // Insert new holes
    if (holes.length > 0) {
      const statements = holes.map(hole => ({
        sql: `INSERT INTO plot_holes (id, project_id, type, severity, title, description, affected_chapters, affected_characters, suggested_fix, confidence, detected)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          hole.id,
          projectId,
          hole.type,
          hole.severity,
          hole.title,
          hole.description,
          JSON.stringify(hole.affectedChapters),
          JSON.stringify(hole.affectedCharacters),
          hole.suggestedFix || null,
          hole.confidence,
          hole.detected.toISOString(),
        ],
      }));

      await client.batch(statements, 'write');
    }

    logger.info('Plot holes saved', { projectId, count: holes.length });
  } catch (error) {
    logger.error('Failed to save plot holes', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Get all plot holes for a project
 */
export async function getPlotHolesByProject(
  client: Client,
  projectId: string,
): Promise<PlotHole[]> {
  try {
    const result = await client.execute({
      sql: 'SELECT * FROM plot_holes WHERE project_id = ? ORDER BY severity DESC, created_at DESC',
      args: [projectId],
    });

    return result.rows.map(row => rowToPlotHole(row as Record<string, unknown>));
  } catch (error) {
    logger.error('Failed to get plot holes by project', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

// ==================== Character Graphs ====================

/**
 * Save a character graph
 */
export async function saveCharacterGraph(client: Client, graph: CharacterGraph): Promise<void> {
  try {
    await client.execute({
      sql: `INSERT INTO character_graphs (project_id, nodes, relationships, analyzed_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(project_id) DO UPDATE SET
            nodes=excluded.nodes, relationships=excluded.relationships, analyzed_at=CURRENT_TIMESTAMP`,
      args: [
        graph.projectId,
        JSON.stringify(graph.nodes),
        JSON.stringify(graph.relationships),
        graph.analyzedAt.toISOString(),
      ],
    });

    logger.info('Character graph saved', { projectId: graph.projectId });
  } catch (error) {
    logger.error('Failed to save character graph', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Get character graph for a project
 */
export async function getCharacterGraphByProject(
  client: Client,
  projectId: string,
): Promise<CharacterGraph | null> {
  try {
    const result = await client.execute({
      sql: 'SELECT * FROM character_graphs WHERE project_id = ?',
      args: [projectId],
    });

    if (result.rows.length === 0) return null;

    const row = result.rows[0] as Record<string, unknown>;
    return rowToCharacterGraph(row);
  } catch (error) {
    logger.error('Failed to get character graph by project', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

// ==================== Analysis Results (with TTL) ====================

/**
 * Save analysis result with TTL
 */
export async function saveAnalysisResult(
  client: Client,
  projectId: string,
  analysisType: string,
  resultData: unknown,
  ttlMinutes: number = 5,
): Promise<void> {
  try {
    const id = `analysis-${projectId}-${analysisType}-${Date.now()}`;
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    await client.execute({
      sql: `INSERT INTO analysis_results (id, project_id, analysis_type, result_data, expires_at, created_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        projectId,
        analysisType,
        JSON.stringify(resultData),
        expiresAt.toISOString(),
        new Date().toISOString(),
      ],
    });

    logger.info('Analysis result saved', { projectId, analysisType, ttlMinutes });
  } catch (error) {
    logger.error('Failed to save analysis result', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Get cached analysis result (if not expired)
 */
export async function getAnalysisResult(
  client: Client,
  projectId: string,
  analysisType: string,
): Promise<unknown | null> {
  try {
    const result = await client.execute({
      sql: `SELECT * FROM analysis_results
            WHERE project_id = ? AND analysis_type = ? AND expires_at > datetime('now')
            ORDER BY created_at DESC LIMIT 1`,
      args: [projectId, analysisType],
    });

    if (result.rows.length === 0) return null;

    const row = result.rows[0] as Record<string, unknown>;
    return JSON.parse(row.result_data as string);
  } catch (error) {
    logger.error('Failed to get analysis result', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Cleanup expired analysis results
 */
export async function cleanupExpiredAnalysis(client: Client): Promise<number> {
  try {
    const result = await client.execute({
      sql: "DELETE FROM analysis_results WHERE expires_at < datetime('now')",
      args: [],
    });

    const deleted = result.rowsAffected;
    if (deleted > 0) {
      logger.info('Expired analysis results cleaned up', { count: deleted });
    }

    return deleted;
  } catch (error) {
    logger.error('Failed to cleanup expired analysis', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

// ==================== Plot Suggestions ====================

/**
 * Save plot suggestions
 */
export async function savePlotSuggestions(
  client: Client,
  projectId: string,
  suggestions: PlotSuggestion[],
): Promise<void> {
  try {
    // Delete existing suggestions for this project
    await client.execute({
      sql: 'DELETE FROM plot_suggestions WHERE project_id = ?',
      args: [projectId],
    });

    // Insert new suggestions
    if (suggestions.length > 0) {
      const statements = suggestions.map(suggestion => ({
        sql: `INSERT INTO plot_suggestions (id, project_id, type, title, description, placement, impact, related_characters, prerequisites, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          suggestion.id,
          projectId,
          suggestion.type,
          suggestion.title,
          suggestion.description,
          suggestion.placement,
          suggestion.impact,
          suggestion.relatedCharacters ? JSON.stringify(suggestion.relatedCharacters) : null,
          suggestion.prerequisites ? JSON.stringify(suggestion.prerequisites) : null,
          new Date().toISOString(),
        ],
      }));

      await client.batch(statements, 'write');
    }

    logger.info('Plot suggestions saved', { projectId, count: suggestions.length });
  } catch (error) {
    logger.error('Failed to save plot suggestions', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Get plot suggestions for a project
 */
export async function getPlotSuggestionsByProject(
  client: Client,
  projectId: string,
): Promise<PlotSuggestion[]> {
  try {
    const result = await client.execute({
      sql: 'SELECT * FROM plot_suggestions WHERE project_id = ? ORDER BY created_at DESC',
      args: [projectId],
    });

    return result.rows.map(row => rowToPlotSuggestion(row as Record<string, unknown>));
  } catch (error) {
    logger.error('Failed to get plot suggestions by project', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

// ==================== Cleanup ====================

/**
 * Delete all data for a project
 */
export async function deleteProjectData(client: Client, projectId: string): Promise<void> {
  try {
    await client.batch(
      [
        { sql: 'DELETE FROM plot_structures WHERE project_id = ?', args: [projectId] },
        { sql: 'DELETE FROM plot_holes WHERE project_id = ?', args: [projectId] },
        { sql: 'DELETE FROM character_graphs WHERE project_id = ?', args: [projectId] },
        { sql: 'DELETE FROM analysis_results WHERE project_id = ?', args: [projectId] },
        { sql: 'DELETE FROM plot_suggestions WHERE project_id = ?', args: [projectId] },
      ],
      'write',
    );

    logger.info('Project data deleted', { projectId });
  } catch (error) {
    logger.error('Failed to delete project data', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
