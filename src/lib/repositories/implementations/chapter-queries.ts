/**
 * Chapter Query Builders
 * Helper functions for building complex chapter queries
 */

import { eq, and, or, sql, asc, desc } from 'drizzle-orm';

import { chapters } from '@/lib/database/schemas/chapters';

import type { ChapterQueryOptions } from './chapter-types';

/**
 * Build where clause for chapter queries
 */
export function buildChapterWhereClause(
  options: ChapterQueryOptions,
): ReturnType<typeof and> | undefined {
  const conditions: unknown[] = [];

  if (options.projectId) {
    conditions.push(eq(chapters.projectId, options.projectId));
  }

  if (options.status) {
    conditions.push(eq(chapters.status, options.status));
  }

  if (options.minWordCount) {
    const contentLen = sql`length(${chapters.content})`;
    conditions.push(sql`${contentLen} >= ${options.minWordCount}`);
  }

  if (options.maxWordCount) {
    const contentLen = sql`length(${chapters.content})`;
    conditions.push(sql`${contentLen} <= ${options.maxWordCount}`);
  }

  if (options.searchQuery) {
    const searchLower = `%${options.searchQuery.toLowerCase()}%`;
    conditions.push(
      or(
        sql`lower(${chapters.title}) LIKE ${searchLower}`,
        sql`lower(${chapters.summary}) LIKE ${searchLower}`,
        sql`lower(${chapters.content}) LIKE ${searchLower}`,
      ),
    );
  }

  return conditions.length > 0 ? (and(...(conditions as [])) as ReturnType<typeof and>) : undefined;
}

/**
 * Build order by clause for chapter queries
 */
export function buildChapterOrderByClause(orderBy: NonNullable<ChapterQueryOptions['orderBy']>) {
  switch (orderBy) {
    case 'title':
      return [asc(chapters.title)];
    case 'wordCount':
      return [desc(sql`length(${chapters.content})`)];
    case 'createdAt':
      return [desc(chapters.createdAt)];
    default:
      return [desc(chapters.orderIndex)];
  }
}

/**
 * Build pagination clause
 */
export interface PaginationClause {
  limit?: number;
  offset?: number;
}

export function buildPaginationClause(options: PaginationClause): PaginationClause {
  const clause: PaginationClause = {};

  if (options.limit) {
    clause.limit = options.limit;
  }

  if (options.offset) {
    clause.offset = options.offset;
  }

  return clause;
}
