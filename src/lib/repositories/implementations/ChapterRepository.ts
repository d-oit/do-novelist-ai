/**
 * Chapter Repository Implementation
 * Implements IChapterRepository interface using Drizzle ORM
 * Provides CRUD operations, queries, and aggregations for chapters
 */

import { eq, and, asc, desc, sql, or, lte, gte } from 'drizzle-orm';

import { getDrizzleClient } from '@/lib/database/drizzle';
import { chapters } from '@/lib/database/schemas/chapters';
import { toAppError } from '@/lib/errors/error-types';
import { ok, err } from '@/lib/errors/result';
import type { Result } from '@/lib/errors/result';
import { logger } from '@/lib/logging/logger';
import type {
  IChapterRepository,
  ChapterQueryOptions,
} from '@/lib/repositories/interfaces/IChapterRepository';
import { RepositoryError } from '@/lib/repositories/interfaces/IRepository';
import type { Chapter, ChapterStatus } from '@/types';

/**
 * Chapter Repository Implementation
 * Manages chapter data access with type-safe operations
 */
export class ChapterRepository implements IChapterRepository {
  private db;

  constructor() {
    this.db = getDrizzleClient();
    if (!this.db) {
      logger.warn('ChapterRepository initialized without database connection', {
        component: 'ChapterRepository',
      });
    }
  }

  // ==================== CRUD Operations ====================

  async findById(id: string): Promise<Chapter | null> {
    try {
      const client = this.db;
      if (!client) {
        return null;
      }

      const result = await client.select().from(chapters).where(eq(chapters.id, id)).limit(1);

      if (result.length === 0) {
        return null;
      }

      return this.mapRowToChapter(result[0]!);
    } catch (error) {
      logger.error(
        'Failed to find chapter by ID',
        { component: 'ChapterRepository', chapterId: id },
        error instanceof Error ? error : undefined,
      );
      return null;
    }
  }

  async findAll(): Promise<Chapter[]> {
    try {
      const client = this.db;
      if (!client) {
        return [];
      }

      const result = await client.select().from(chapters).orderBy(desc(chapters.orderIndex));

      return result.map(row => this.mapRowToChapter(row));
    } catch (error) {
      logger.error(
        'Failed to find all chapters',
        { component: 'ChapterRepository' },
        error instanceof Error ? error : undefined,
      );
      return [];
    }
  }

  async findWhere(predicate: (entity: Chapter) => boolean): Promise<Chapter[]> {
    try {
      const all = await this.findAll();
      return all.filter(predicate);
    } catch (error) {
      logger.error(
        'Failed to find chapters by predicate',
        { component: 'ChapterRepository' },
        error instanceof Error ? error : undefined,
      );
      return [];
    }
  }

  async create(entity: Omit<Chapter, 'id'>): Promise<Chapter> {
    try {
      const client = this.db;
      if (!client) {
        throw new RepositoryError('Database connection not available', 'DB_CONNECTION_ERROR');
      }

      // projectId must be provided when creating a chapter
      if (!entity.projectId) {
        throw new RepositoryError('Project ID is required to create a chapter', 'VALIDATION_ERROR');
      }

      // Auto-generate order index for new chapters in project
      const maxOrderIndex = await this.getMaxOrderIndexForProject(entity.projectId);
      const nextOrderIndex = (maxOrderIndex ?? -1) + 1;

      const chapterData = {
        id: `chap_${Date.now()}`,
        projectId: entity.projectId,
        orderIndex: nextOrderIndex,
        title: entity.title,
        summary: entity.summary ?? '',
        content: entity.content ?? '',
        status: entity.status ?? 'pending',
      };

      await client.insert(chapters).values(chapterData);

      const created = await this.findById(chapterData.id);
      if (!created) {
        throw new RepositoryError('Failed to retrieve created chapter', 'CREATE_FAILED');
      }

      logger.info('Chapter created', {
        component: 'ChapterRepository',
        chapterId: chapterData.id,
        projectId: entity.projectId,
      });

      return created;
    } catch (error) {
      const appError =
        error instanceof RepositoryError ? error : toAppError(error, 'Failed to create chapter');
      logger.error(
        'Failed to create chapter',
        { component: 'ChapterRepository', title: entity.title },
        appError,
      );
      throw appError;
    }
  }

  async update(id: string, data: Partial<Chapter>): Promise<Chapter | null> {
    try {
      const client = this.db;
      if (!client) {
        throw new RepositoryError('Database connection not available', 'DB_CONNECTION_ERROR');
      }

      const existing = await this.findById(id);
      if (!existing) {
        return null;
      }

      const updateData: Record<string, unknown> = {
        updatedAt: new Date().toISOString(),
      };

      if (data.title !== undefined) updateData.title = data.title;
      if (data.summary !== undefined) updateData.summary = data.summary;
      if (data.content !== undefined) updateData.content = data.content;
      if (data.status !== undefined) updateData.status = data.status;

      await client.update(chapters).set(updateData).where(eq(chapters.id, id));

      const updated = await this.findById(id);
      if (!updated) {
        throw new RepositoryError('Failed to retrieve updated chapter', 'UPDATE_FAILED');
      }

      logger.info('Chapter updated', {
        component: 'ChapterRepository',
        chapterId: id,
        title: data.title,
      });

      return updated;
    } catch (error) {
      const appError =
        error instanceof RepositoryError ? error : toAppError(error, 'Failed to update chapter');
      logger.error(
        'Failed to update chapter',
        { component: 'ChapterRepository', chapterId: id },
        appError,
      );
      throw appError;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const client = this.db;
      if (!client) {
        return false;
      }

      await client.delete(chapters).where(eq(chapters.id, id));

      logger.info('Chapter deleted', {
        component: 'ChapterRepository',
        chapterId: id,
      });

      // Assume success if no error was thrown
      return true;
    } catch (error) {
      logger.error(
        'Failed to delete chapter',
        { component: 'ChapterRepository', chapterId: id },
        error instanceof Error ? error : undefined,
      );
      return false;
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const chapter = await this.findById(id);
      return chapter !== null;
    } catch (error) {
      logger.error(
        'Failed to check chapter existence',
        { component: 'ChapterRepository', chapterId: id },
        error instanceof Error ? error : undefined,
      );
      return false;
    }
  }

  async count(): Promise<number> {
    try {
      const client = this.db;
      if (!client) {
        return 0;
      }

      const result = await client.select({ count: sql<number>`count(*)` }).from(chapters);

      return result[0]?.count ?? 0;
    } catch (error) {
      logger.error(
        'Failed to count chapters',
        { component: 'ChapterRepository' },
        error instanceof Error ? error : undefined,
      );
      return 0;
    }
  }

  async transaction<T>(operations: () => Promise<T>): Promise<T> {
    // Turso doesn't support explicit transactions in web client
    // We'll execute operations sequentially
    return operations();
  }

  // ==================== Query Methods ====================

  async findByProjectId(projectId: string): Promise<Chapter[]> {
    try {
      const client = this.db;
      if (!client) {
        return [];
      }

      const result = await client
        .select()
        .from(chapters)
        .where(eq(chapters.projectId, projectId))
        .orderBy(desc(chapters.orderIndex));

      return result.map(row => this.mapRowToChapter(row));
    } catch (error) {
      logger.error(
        'Failed to find chapters by project',
        { component: 'ChapterRepository', projectId },
        error instanceof Error ? error : undefined,
      );
      return [];
    }
  }

  async findByStatus(status: ChapterStatus): Promise<Chapter[]> {
    try {
      const client = this.db;
      if (!client) {
        return [];
      }

      const result = await client
        .select()
        .from(chapters)
        .where(eq(chapters.status, status))
        .orderBy(desc(chapters.orderIndex));

      return result.map(row => this.mapRowToChapter(row));
    } catch (error) {
      logger.error(
        'Failed to find chapters by status',
        { component: 'ChapterRepository', status },
        error instanceof Error ? error : undefined,
      );
      return [];
    }
  }

  async findByProjectIdAndStatus(projectId: string, status: ChapterStatus): Promise<Chapter[]> {
    try {
      const client = this.db;
      if (!client) {
        return [];
      }

      const result = await client
        .select()
        .from(chapters)
        .where(and(eq(chapters.projectId, projectId), eq(chapters.status, status)))
        .orderBy(desc(chapters.orderIndex));

      return result.map(row => this.mapRowToChapter(row));
    } catch (error) {
      logger.error(
        'Failed to find chapters by project and status',
        { component: 'ChapterRepository', projectId, status },
        error instanceof Error ? error : undefined,
      );
      return [];
    }
  }

  async findByOrderIndex(projectId: string, orderIndex: number): Promise<Chapter | null> {
    try {
      const client = this.db;
      if (!client) {
        return null;
      }

      const result = await client
        .select()
        .from(chapters)
        .where(and(eq(chapters.projectId, projectId), eq(chapters.orderIndex, orderIndex)))
        .limit(1);

      if (result.length === 0) {
        return null;
      }

      return this.mapRowToChapter(result[0]!);
    } catch (error) {
      logger.error(
        'Failed to find chapter by order index',
        { component: 'ChapterRepository', projectId, orderIndex },
        error instanceof Error ? error : undefined,
      );
      return null;
    }
  }

  async getNextChapter(projectId: string, currentOrderIndex: number): Promise<Chapter | null> {
    try {
      const client = this.db;
      if (!client) {
        return null;
      }

      const result = await client
        .select()
        .from(chapters)
        .where(
          and(eq(chapters.projectId, projectId), gte(chapters.orderIndex, currentOrderIndex + 1)),
        )
        .orderBy(asc(chapters.orderIndex))
        .limit(1);

      if (result.length === 0) {
        return null;
      }

      return this.mapRowToChapter(result[0]!);
    } catch (error) {
      logger.error(
        'Failed to find next chapter',
        { component: 'ChapterRepository', projectId, currentOrderIndex },
        error instanceof Error ? error : undefined,
      );
      return null;
    }
  }

  async getPreviousChapter(projectId: string, currentOrderIndex: number): Promise<Chapter | null> {
    try {
      const client = this.db;
      if (!client) {
        return null;
      }

      const result = await client
        .select()
        .from(chapters)
        .where(
          and(eq(chapters.projectId, projectId), lte(chapters.orderIndex, currentOrderIndex - 1)),
        )
        .orderBy(desc(chapters.orderIndex))
        .limit(1);

      if (result.length === 0) {
        return null;
      }

      return this.mapRowToChapter(result[0]!);
    } catch (error) {
      logger.error(
        'Failed to find previous chapter',
        { component: 'ChapterRepository', projectId, currentOrderIndex },
        error instanceof Error ? error : undefined,
      );
      return null;
    }
  }

  async findByQuery(options: ChapterQueryOptions): Promise<Chapter[]> {
    try {
      const client = this.db;
      if (!client) {
        return [];
      }

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

      const orderByClause =
        options.orderBy === 'title'
          ? [asc(chapters.title)]
          : options.orderBy === 'wordCount'
            ? [desc(sql`length(${chapters.content})`)]
            : options.orderBy === 'createdAt'
              ? [desc(chapters.createdAt)]
              : [desc(chapters.orderIndex)];

      const result = await client
        .select()
        .from(chapters)
        .where(conditions.length > 0 ? and(...(conditions as [])) : undefined)
        .orderBy(...orderByClause);

      return result.map(row => this.mapRowToChapter(row));
    } catch (error) {
      logger.error(
        'Failed to find chapters by query',
        { component: 'ChapterRepository', options },
        error instanceof Error ? error : undefined,
      );
      return [];
    }
  }

  async reorderChapters(projectId: string, chapterIds: string[]): Promise<Chapter[]> {
    try {
      const client = this.db;
      if (!client) {
        return [];
      }

      // Get all chapters for the project
      const projectChapters = await this.findByProjectId(projectId);

      // Create a map of chapter ID to chapter
      const chapterMap = new Map(projectChapters.map(ch => [ch.id, ch]));

      // Update each chapter with its new order index
      for (let i = 0; i < chapterIds.length; i++) {
        const chapterId = chapterIds[i];
        if (chapterId == null) continue; // Skip undefined values
        const chapter = chapterMap.get(chapterId);
        if (chapter) {
          await client.update(chapters).set({ orderIndex: i }).where(eq(chapters.id, chapterId));
        }
      }

      // Return all chapters with updated order
      return await this.findByProjectId(projectId);
    } catch (error) {
      logger.error(
        'Failed to reorder chapters',
        { component: 'ChapterRepository', projectId, chapterIds },
        error instanceof Error ? error : undefined,
      );
      return [];
    }
  }

  async bulkUpdateOrder(
    updateData: Array<{ id: string; orderIndex: number; projectId?: string }>,
  ): Promise<Chapter[]> {
    try {
      const client = this.db;
      if (!client) {
        return [];
      }

      // Update each chapter in batch
      for (const { id, orderIndex } of updateData) {
        await client
          .update(chapters)
          .set({ orderIndex, updatedAt: new Date().toISOString() })
          .where(eq(chapters.id, id));
      }

      // Return all chapters for the affected projects
      // Get unique project IDs from chapters that have projectId specified
      const projectIds = Array.from(
        new Set(
          updateData
            .filter(
              (ch): ch is { id: string; orderIndex: number; projectId: string } => !!ch.projectId,
            )
            .map(ch => ch.projectId),
        ),
      );

      const allChapters: Chapter[] = [];
      for (const pid of projectIds) {
        const projectChapters = await this.findByProjectId(pid);
        allChapters.push(...projectChapters);
      }

      return allChapters;
    } catch (error) {
      logger.error(
        'Failed to bulk update chapter order',
        { component: 'ChapterRepository', chapters: updateData },
        error instanceof Error ? error : undefined,
      );
      return [];
    }
  }

  async countByProject(projectId: string): Promise<number> {
    try {
      const client = this.db;
      if (!client) {
        return 0;
      }

      const result = await client
        .select({ count: sql<number>`count(*)` })
        .from(chapters)
        .where(eq(chapters.projectId, projectId));

      return result[0]?.count ?? 0;
    } catch (error) {
      logger.error(
        'Failed to count chapters by project',
        { component: 'ChapterRepository', projectId },
        error instanceof Error ? error : undefined,
      );
      return 0;
    }
  }

  async getTotalWordCount(projectId: string): Promise<number> {
    try {
      const client = this.db;
      if (!client) {
        return 0;
      }

      const projectChapters = await this.findByProjectId(projectId);

      let totalWordCount = 0;
      for (const chapter of projectChapters) {
        totalWordCount += chapter.content.length;
      }

      return totalWordCount;
    } catch (error) {
      logger.error(
        'Failed to get total word count for project',
        { component: 'ChapterRepository', projectId },
        error instanceof Error ? error : undefined,
      );
      return 0;
    }
  }

  // ==================== Private Helper Methods ====================

  private async getMaxOrderIndexForProject(projectId: string): Promise<number | null> {
    try {
      const client = this.db;
      if (!client) {
        return null;
      }

      const result = await client
        .select({ maxOrderIndex: sql<number>`max(${chapters.orderIndex})` })
        .from(chapters)
        .where(eq(chapters.projectId, projectId));

      return result[0]?.maxOrderIndex ?? null;
    } catch (error) {
      logger.error(
        'Failed to get max order index for project',
        { component: 'ChapterRepository', projectId },
        error instanceof Error ? error : undefined,
      );
      return null;
    }
  }

  private mapRowToChapter(row: unknown): Chapter {
    const r = row as {
      id: string;
      project_id: string;
      order_index: number;
      title: string;
      summary: string | null;
      content: string;
      status: string;
      word_count?: number;
      character_count?: number;
      estimated_reading_time?: number;
      tags?: string;
      notes?: string | null;
      created_at: string;
      updated_at: string;
      generation_prompt?: string | null;
      ai_model?: string | null;
    };

    return {
      id: r.id,
      projectId: r.project_id,
      orderIndex: r.order_index,
      title: r.title,
      summary: r.summary ?? '',
      content: r.content ?? '',
      status: r.status as ChapterStatus,
      wordCount: r.word_count ?? 0,
      characterCount: r.character_count ?? 0,
      estimatedReadingTime: r.estimated_reading_time ?? 0,
      tags: r.tags ? JSON.parse(r.tags) : [],
      notes: r.notes ?? '',
      createdAt: new Date(r.created_at),
      updatedAt: new Date(r.updated_at),
      generationPrompt: r.generation_prompt ?? undefined,
      aiModel: r.ai_model ?? undefined,
      generationSettings: undefined,
      illustration: undefined,
      plotPoints: undefined,
      characters: undefined,
      locations: undefined,
      scenes: undefined,
    };
  }

  // ==================== Result Type Methods ====================

  async createWithResult(entity: Omit<Chapter, 'id'>): Promise<Result<Chapter, RepositoryError>> {
    try {
      const chapter = await this.create(entity);
      return ok(chapter);
    } catch (error) {
      if (error instanceof RepositoryError) {
        return err(error);
      }
      return err(
        new RepositoryError(
          'Failed to create chapter',
          'CREATE_ERROR',
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  async updateWithResult(
    id: string,
    data: Partial<Chapter>,
  ): Promise<Result<Chapter, RepositoryError>> {
    try {
      const chapter = await this.update(id, data);
      if (!chapter) {
        return err(new RepositoryError('Chapter not found', 'NOT_FOUND'));
      }
      return ok(chapter);
    } catch (error) {
      if (error instanceof RepositoryError) {
        return err(error);
      }
      return err(
        new RepositoryError(
          'Failed to update chapter',
          'UPDATE_ERROR',
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  async deleteWithResult(id: string): Promise<Result<boolean, RepositoryError>> {
    try {
      const deleted = await this.delete(id);
      return ok(deleted);
    } catch (error) {
      if (error instanceof RepositoryError) {
        return err(error);
      }
      return err(
        new RepositoryError(
          'Failed to delete chapter',
          'DELETE_ERROR',
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }
}
