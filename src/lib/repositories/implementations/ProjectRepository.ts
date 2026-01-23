/**
 * Project Repository Implementation
 *
 * Implements IProjectRepository interface using Drizzle ORM
 * Provides CRUD operations, queries, and aggregations for projects
 *
 * @fileoverview LOC Budget: Keep under 600 lines (Current: 567 LOC - warning zone)
 * If approaching limit, extract analytics methods to ProjectRepository.analytics.ts
 */

import { eq, and, desc, sql } from 'drizzle-orm';

import { getDrizzleClient } from '@/lib/database/drizzle';
import { projects } from '@/lib/database/schemas/projects';
import { toAppError } from '@/lib/errors/error-types';
import { ok, err } from '@/lib/errors/result';
import type { Result } from '@/lib/errors/result';
import { logger } from '@/lib/logging/logger';
import type {
  IProjectRepository,
  ProjectQueryOptions,
  ProjectStats,
} from '@/lib/repositories/interfaces/IProjectRepository';
import { RepositoryError } from '@/lib/repositories/interfaces/IRepository';
import type { Project, PublishStatus } from '@/types';

/**
 * ProjectRepository Implementation
 * Manages project data access with type-safe operations
 */
export class ProjectRepository implements IProjectRepository {
  private db;

  constructor() {
    this.db = getDrizzleClient();
    if (!this.db) {
      logger.warn('ProjectRepository initialized without database connection', {
        component: 'ProjectRepository',
      });
    }
  }

  // ==================== CRUD Operations ====================

  async findById(id: string): Promise<Project | null> {
    try {
      const client = this.db;
      if (!client) {
        return null;
      }

      const result = await client.select().from(projects).where(eq(projects.id, id)).limit(1);

      if (result.length === 0) {
        return null;
      }

      return this.mapRowToProject(result[0]!);
    } catch (error) {
      logger.error(
        'Failed to find project by ID',
        { component: 'ProjectRepository', projectId: id },
        error instanceof Error ? error : undefined,
      );
      return null;
    }
  }

  async findAll(): Promise<Project[]> {
    try {
      const client = this.db;
      if (!client) {
        return [];
      }

      const result = await client.select().from(projects).orderBy(desc(projects.updatedAt));

      return result.map(row => this.mapRowToProject(row));
    } catch (error) {
      logger.error(
        'Failed to find all projects',
        { component: 'ProjectRepository' },
        error instanceof Error ? error : undefined,
      );
      return [];
    }
  }

  async findWhere(predicate: (entity: Project) => boolean): Promise<Project[]> {
    try {
      const all = await this.findAll();
      return all.filter(predicate);
    } catch (error) {
      logger.error(
        'Failed to find projects by predicate',
        { component: 'ProjectRepository' },
        error instanceof Error ? error : undefined,
      );
      return [];
    }
  }

  async create(entity: Omit<Project, 'id'>): Promise<Project> {
    try {
      const client = this.db;
      if (!client) {
        throw new RepositoryError('Database connection not available', 'DB_CONNECTION_ERROR');
      }

      // Check for duplicate title
      const titleExists = await this.titleExists(entity.title);
      if (titleExists) {
        throw new RepositoryError(
          `Project with title "${entity.title}" already exists`,
          'DUPLICATE_TITLE',
        );
      }

      // Generate new ID
      const newId = `proj_${Date.now()}`;
      const now = new Date().toISOString();

      const projectData = {
        id: newId,
        title: entity.title,
        idea: entity.idea ?? '',
        style: entity.style,
        coverImage: entity.coverImage,
        worldState: entity.worldState,
        status: entity.status ?? 'Draft',
        language: entity.language ?? 'en',
        targetWordCount: entity.targetWordCount ?? 50000,
        settings: entity.settings ?? {},
        timeline: entity.timeline,
        updatedAt: now,
      };

      await client.insert(projects).values(projectData);

      const created = await this.findById(newId);
      if (!created) {
        throw new RepositoryError('Failed to retrieve created project', 'CREATE_FAILED');
      }

      logger.info('Project created', {
        component: 'ProjectRepository',
        projectId: newId,
        title: entity.title,
      });

      return created;
    } catch (error) {
      const appError =
        error instanceof RepositoryError ? error : toAppError(error, 'Failed to create project');
      logger.error(
        'Failed to create project',
        { component: 'ProjectRepository', title: entity.title },
        appError,
      );
      throw appError;
    }
  }

  async update(id: string, data: Partial<Project>): Promise<Project | null> {
    try {
      const client = this.db;
      if (!client) {
        throw new RepositoryError('Database connection not available', 'DB_CONNECTION_ERROR');
      }

      // Check if project exists
      const existing = await this.findById(id);
      if (!existing) {
        return null;
      }

      // Check for duplicate title if updating title
      if (data.title && data.title !== existing.title) {
        const titleExists = await this.titleExists(data.title, id);
        if (titleExists) {
          throw new RepositoryError(
            `Project with title "${data.title}" already exists`,
            'DUPLICATE_TITLE',
          );
        }
      }

      const updateData: Record<string, unknown> = {
        updatedAt: new Date().toISOString(),
      };

      if (data.title !== undefined) updateData.title = data.title;
      if (data.idea !== undefined) updateData.idea = data.idea;
      if (data.style !== undefined) updateData.style = data.style;
      if (data.coverImage !== undefined) updateData.coverImage = data.coverImage;
      if (data.worldState !== undefined) updateData.worldState = data.worldState;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.language !== undefined) updateData.language = data.language;
      if (data.targetWordCount !== undefined) updateData.targetWordCount = data.targetWordCount;
      if (data.settings !== undefined) updateData.settings = data.settings;
      if (data.timeline !== undefined) updateData.timeline = data.timeline;

      await client.update(projects).set(updateData).where(eq(projects.id, id));

      const updated = await this.findById(id);
      if (!updated) {
        throw new RepositoryError('Failed to retrieve updated project', 'UPDATE_FAILED');
      }

      logger.info('Project updated', {
        component: 'ProjectRepository',
        projectId: id,
      });

      return updated;
    } catch (error) {
      const appError =
        error instanceof RepositoryError ? error : toAppError(error, 'Failed to update project');
      logger.error(
        'Failed to update project',
        { component: 'ProjectRepository', projectId: id },
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

      await client.delete(projects).where(eq(projects.id, id));

      logger.info('Project deleted', {
        component: 'ProjectRepository',
        projectId: id,
      });

      // Assume success if no error was thrown
      return true;
    } catch (error) {
      logger.error(
        'Failed to delete project',
        { component: 'ProjectRepository', projectId: id },
        error instanceof Error ? error : undefined,
      );
      return false;
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const project = await this.findById(id);
      return project !== null;
    } catch (error) {
      logger.error(
        'Failed to check project existence',
        { component: 'ProjectRepository', projectId: id },
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

      const result = await client.select({ count: sql<number>`count(*)` }).from(projects);

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

  async transaction<T>(operations: () => Promise<T>): Promise<T> {
    // Turso doesn't support explicit transactions in web client
    // We'll just execute operations sequentially
    return operations();
  }

  // ==================== Query Methods ====================

  async findByStatus(status: PublishStatus): Promise<Project[]> {
    try {
      const client = this.db;
      if (!client) {
        return [];
      }

      const result = await client
        .select()
        .from(projects)
        .where(eq(projects.status, status))
        .orderBy(desc(projects.updatedAt));

      return result.map(row => this.mapRowToProject(row));
    } catch (error) {
      logger.error(
        'Failed to find projects by status',
        { component: 'ProjectRepository', status },
        error instanceof Error ? error : undefined,
      );
      return [];
    }
  }

  async findByStyle(style: Project['style']): Promise<Project[]> {
    try {
      const client = this.db;
      if (!client) {
        return [];
      }

      const result = await client
        .select()
        .from(projects)
        .where(eq(projects.style, style))
        .orderBy(desc(projects.updatedAt));

      return result.map(row => this.mapRowToProject(row));
    } catch (error) {
      logger.error(
        'Failed to find projects by style',
        { component: 'ProjectRepository', style },
        error instanceof Error ? error : undefined,
      );
      return [];
    }
  }

  async findByLanguage(language: Project['language']): Promise<Project[]> {
    try {
      const client = this.db;
      if (!client) {
        return [];
      }

      const result = await client
        .select()
        .from(projects)
        .where(eq(projects.language, language))
        .orderBy(desc(projects.updatedAt));

      return result.map(row => this.mapRowToProject(row));
    } catch (error) {
      logger.error(
        'Failed to find projects by language',
        { component: 'ProjectRepository', language },
        error instanceof Error ? error : undefined,
      );
      return [];
    }
  }

  async findByQuery(options: ProjectQueryOptions): Promise<Project[]> {
    try {
      const client = this.db;
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

      const mapped = result.map(row => this.mapRowToProject(row));

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

  async getSummaries(): Promise<
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
      const client = this.db;
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

  async getStats(): Promise<ProjectStats> {
    try {
      const all = await this.findAll();

      const totalProjects = all.length;

      const projectsByStatus = {
        Draft: 0,
        Editing: 0,
        Review: 0,
        Published: 0,
      } as Record<PublishStatus, number>;

      let totalWordCount = 0;

      for (const project of all) {
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
        'Failed to get project statistics',
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

  async titleExists(title: string, excludeId?: string): Promise<boolean> {
    try {
      const client = this.db;
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

  // ==================== Result Type Methods ====================

  async createWithResult(entity: Omit<Project, 'id'>): Promise<Result<Project, RepositoryError>> {
    try {
      const project = await this.create(entity);
      return ok(project);
    } catch (error) {
      if (error instanceof RepositoryError) {
        return err(error);
      }
      return err(
        new RepositoryError(
          'Failed to create project',
          'CREATE_ERROR',
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  async updateWithResult(
    id: string,
    data: Partial<Project>,
  ): Promise<Result<Project, RepositoryError>> {
    try {
      const project = await this.update(id, data);
      if (!project) {
        return err(new RepositoryError('Project not found', 'NOT_FOUND'));
      }
      return ok(project);
    } catch (error) {
      if (error instanceof RepositoryError) {
        return err(error);
      }
      return err(
        new RepositoryError(
          'Failed to update project',
          'UPDATE_ERROR',
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  async deleteWithResult(id: string): Promise<Result<boolean, RepositoryError>> {
    try {
      await this.delete(id);
      return ok(true);
    } catch (error) {
      return err(
        new RepositoryError(
          'Failed to delete project',
          'DELETE_ERROR',
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  // ==================== Private Helper Methods ====================

  private mapRowToProject(row: unknown): Project {
    const r = row as {
      id: string;
      title: string;
      idea: string;
      style: string;
      coverImage: string | null;
      worldState: unknown;
      status: string;
      language: string;
      targetWordCount: number;
      settings: unknown;
      timeline: unknown;
      updatedAt: string;
    };

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
}
