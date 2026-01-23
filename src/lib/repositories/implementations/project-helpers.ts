/**
 * Project Repository - Helper Functions
 *
 * Helper functions for project data manipulation and calculations
 */

import { sql } from 'drizzle-orm';

import { getDrizzleClient } from '@/lib/database/drizzle';
import { projects } from '@/lib/database/schemas/projects';
import { logger } from '@/lib/logging/logger';
import type { Project, PublishStatus } from '@/types';

import type { ProjectStats, ProjectRow } from './project-types';

/**
 * Calculate project statistics from a list of projects
 * @param allProjects - Array of all projects
 * @returns Project statistics including totals and breakdowns
 */
export function calculateStats(allProjects: Project[]): ProjectStats {
  try {
    const totalProjects = allProjects.length;

    const projectsByStatus = {
      Draft: 0,
      Editing: 0,
      Review: 0,
      Published: 0,
    } as Record<PublishStatus, number>;

    let totalWordCount = 0;

    for (const project of allProjects) {
      if (projectsByStatus[project.status] !== undefined) {
        projectsByStatus[project.status]++;
      }
      // Sum chapter word counts
      for (const chapter of project.chapters) {
        totalWordCount += chapter.wordCount;
      }
    }

    const averageWordCount = totalProjects > 0 ? Math.round(totalWordCount / totalProjects) : 0;

    return {
      totalProjects,
      projectsByStatus,
      totalWordCount,
      averageWordCount,
    };
  } catch (error) {
    logger.error(
      'Failed to calculate project statistics',
      { component: 'ProjectRepository' },
      error instanceof Error ? error : undefined,
    );
    return {
      totalProjects: 0,
      projectsByStatus: {
        Draft: 0,
        Editing: 0,
        Review: 0,
        Published: 0,
      } as Record<PublishStatus, number>,
      totalWordCount: 0,
      averageWordCount: 0,
    };
  }
}

/**
 * Map database row to Project type
 * @param row - Database row data
 * @returns Project object
 */
export function mapRowToProject(row: unknown): Project {
  const r = row as ProjectRow;

  return {
    id: r.id,
    title: r.title,
    idea: r.idea,
    style: r.style as Project['style'],
    coverImage: r.coverImage ?? undefined,
    worldState: r.worldState as Project['worldState'],
    status: r.status as PublishStatus,
    language: r.language as Project['language'],
    targetWordCount: r.targetWordCount,
    settings: (r.settings as Project['settings']) ?? {},
    timeline: (r.timeline as Project['timeline']) ?? undefined,
    chapters: [],
    isGenerating: false,
    genre: [],
    targetAudience: 'adult',
    contentWarnings: [],
    keywords: [],
    synopsis: '',
    createdAt: new Date(),
    updatedAt: new Date(r.updatedAt),
    authors: [],
    analytics: {
      totalWordCount: 0,
      averageChapterLength: 0,
      estimatedReadingTime: 0,
      generationCost: 0,
      editingRounds: 0,
    },
    version: '1.0.0',
    changeLog: [],
  };
}

/**
 * Count total number of projects
 * @returns Total project count
 */
export async function countProjects(): Promise<number> {
  try {
    const db = getDrizzleClient();
    if (!db) {
      return 0;
    }

    const result = await db.select({ count: sql<number>`count(*)` }).from(projects);

    return result[0]?.count ?? 0;
  } catch (error) {
    logger.error(
      'Failed to count projects',
      { component: 'ProjectRepository' },
      error instanceof Error ? error : undefined,
    );
    return 0;
  }
}
