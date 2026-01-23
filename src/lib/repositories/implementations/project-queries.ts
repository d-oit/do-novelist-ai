/**
 * Project Repository - Query Builders
 *
 * Helper functions for building complex database queries for projects
 */

import { eq, and, sql, desc } from 'drizzle-orm';

import type { getDrizzleClient } from '@/lib/database/drizzle';
import { projects } from '@/lib/database/schemas/projects';
import { logger } from '@/lib/logging/logger';
import type { ProjectQueryOptions } from '@/lib/repositories/interfaces/IProjectRepository';
import type { Project, PublishStatus } from '@/types';

/**
 * Database client type
 */
type DbClient = Awaited<ReturnType<typeof getDrizzleClient>>;

/**
 * Mapper function type
 */
type RowMapper = (row: unknown) => Project;

/**
 * Find projects by status
 * @param db - Database client
 * @param status - Publish status to filter by
 * @param mapRow - Function to map database row to Project
 * @returns Array of projects with specified status
 */
export async function findByStatusQuery(
  db: DbClient,
  status: PublishStatus,
  mapRow: RowMapper,
): Promise<Project[]> {
  try {
    const client = db;
    if (!client) {
      return [];
    }

    const result = await client
      .select()
      .from(projects)
      .where(eq(projects.status, status))
      .orderBy(desc(projects.updatedAt));

    return result.map(mapRow);
  } catch (error) {
    logger.error(
      'Failed to find projects by status',
      { component: 'ProjectRepository', status },
      error instanceof Error ? error : undefined,
    );
    return [];
  }
}

/**
 * Find projects by style
 * @param db - Database client
 * @param style - Project style to filter by
 * @param mapRow - Function to map database row to Project
 * @returns Array of projects with specified style
 */
export async function findByStyleQuery(
  db: DbClient,
  style: Project['style'],
  mapRow: RowMapper,
): Promise<Project[]> {
  try {
    const client = db;
    if (!client) {
      return [];
    }

    const result = await client
      .select()
      .from(projects)
      .where(eq(projects.style, style))
      .orderBy(desc(projects.updatedAt));

    return result.map(mapRow);
  } catch (error) {
    logger.error(
      'Failed to find projects by style',
      { component: 'ProjectRepository', style },
      error instanceof Error ? error : undefined,
    );
    return [];
  }
}

/**
 * Find projects by language
 * @param db - Database client
 * @param language - Project language to filter by
 * @param mapRow - Function to map database row to Project
 * @returns Array of projects with specified language
 */
export async function findByLanguageQuery(
  db: DbClient,
  language: Project['language'],
  mapRow: RowMapper,
): Promise<Project[]> {
  try {
    const client = db;
    if (!client) {
      return [];
    }

    const result = await client
      .select()
      .from(projects)
      .where(eq(projects.language, language))
      .orderBy(desc(projects.updatedAt));

    return result.map(mapRow);
  } catch (error) {
    logger.error(
      'Failed to find projects by language',
      { component: 'ProjectRepository', language },
      error instanceof Error ? error : undefined,
    );
    return [];
  }
}

/**
 * Find projects by complex query options
 * @param db - Database client
 * @param options - Query options including filters
 * @param mapRow - Function to map database row to Project
 * @returns Array of projects matching query options
 */
export async function findByQueryComplex(
  db: DbClient,
  options: ProjectQueryOptions,
  mapRow: RowMapper,
): Promise<Project[]> {
  try {
    const client = db;
    if (!client) {
      return [];
    }

    const conditions: unknown[] = [];

    if (options.status) {
      conditions.push(eq(projects.status, options.status));
    }
    if (options.style) {
      conditions.push(eq(projects.style, options.style));
    }
    if (options.language) {
      conditions.push(eq(projects.language, options.language));
    }
    if (options.minTargetWordCount) {
      conditions.push(sql`${projects.targetWordCount} >= ${options.minTargetWordCount}`);
    }
    if (options.maxTargetWordCount) {
      conditions.push(sql`${projects.targetWordCount} <= ${options.maxTargetWordCount}`);
    }
    if (options.searchQuery) {
      conditions.push(
        sql`(${projects.title} LIKE ${`%${options.searchQuery}%`} OR ${projects.idea} LIKE ${`%${options.searchQuery}%`})`,
      );
    }

    const result = await client
      .select()
      .from(projects)
      .where(conditions.length > 0 ? and(...(conditions as [])) : undefined)
      .orderBy(desc(projects.updatedAt));

    const mapped = result.map(mapRow);

    // Filter hasChapters (can't do in SQL without joins)
    if (options.hasChapters !== undefined) {
      return mapped.filter(p =>
        options.hasChapters ? p.chapters.length > 0 : p.chapters.length === 0,
      );
    }

    return mapped;
  } catch (error) {
    logger.error(
      'Failed to find projects by query',
      { component: 'ProjectRepository', options },
      error instanceof Error ? error : undefined,
    );
    return [];
  }
}

/**
 * Get project summaries
 * @param db - Database client
 * @returns Array of project summary data
 */
export async function getSummariesQuery(db: DbClient): Promise<
  Array<{
    id: string;
    title: string;
    style: string;
    status: PublishStatus;
    language: Project['language'];
    targetWordCount: number;
    updatedAt: string;
    coverImage?: string;
  }>
> {
  try {
    const client = db;
    if (!client) {
      return [];
    }

    const result = await client
      .select({
        id: projects.id,
        title: projects.title,
        style: projects.style,
        status: projects.status,
        language: projects.language,
        targetWordCount: projects.targetWordCount,
        updatedAt: projects.updatedAt,
        coverImage: projects.coverImage,
      })
      .from(projects)
      .orderBy(desc(projects.updatedAt));

    return result.map(row => ({
      id: row.id,
      title: row.title,
      style: row.style,
      status: row.status as PublishStatus,
      language: row.language as Project['language'],
      targetWordCount: row.targetWordCount,
      updatedAt: row.updatedAt,
      coverImage: row.coverImage ?? undefined,
    }));
  } catch (error) {
    logger.error(
      'Failed to get project summaries',
      { component: 'ProjectRepository' },
      error instanceof Error ? error : undefined,
    );
    return [];
  }
}

/**
 * Check if project title exists
 * @param db - Database client
 * @param title - Title to check
 * @param excludeId - Optional project ID to exclude from check
 * @returns True if title exists
 */
export async function titleExistsQuery(
  db: DbClient,
  title: string,
  excludeId?: string,
): Promise<boolean> {
  try {
    const client = db;
    if (!client) {
      return false;
    }

    const conditions: unknown[] = [eq(projects.title, title)];
    if (excludeId) {
      conditions.push(sql`${projects.id} != ${excludeId}`);
    }

    const result = await client
      .select({ id: projects.id })
      .from(projects)
      .where(and(...(conditions as [])))
      .limit(1);

    return result.length > 0;
  } catch (error) {
    logger.error(
      'Failed to check if title exists',
      { component: 'ProjectRepository', title, excludeId },
      error instanceof Error ? error : undefined,
    );
    return false;
  }
}
