/**
 * Database service using Drizzle ORM
 * Provides type-safe CRUD operations for projects and chapters
 *
 * This service wraps Drizzle queries with localStorage fallback
 * for offline-first functionality.
 */
import { eq } from 'drizzle-orm';

import { getDrizzleClient, schema } from '@/lib/database/drizzle';
import { logger } from '@/lib/logging/logger';
import { ChapterStatus, PublishStatus, type Chapter, type Project } from '@/types';
import { type WorldState, type ProjectSettings, ProjectSchema } from '@/types/schemas';

import { parseChapterStatus, parsePublishStatus } from '@shared/utils/validation';

const LOCAL_PROJECTS_KEY = 'novelist_local_projects';

/**
 * Map a database row to a Chapter object
 */
const mapChapterRow = (row: typeof schema.chapters.$inferSelect): Chapter => ({
  id: row.id,
  orderIndex: row.orderIndex,
  title: row.title,
  summary: row.summary ?? '',
  content: row.content ?? '',
  status: parseChapterStatus(row.status, ChapterStatus.PENDING),
  wordCount: 0,
  characterCount: 0,
  estimatedReadingTime: 0,
  tags: [],
  notes: '',
  createdAt: new Date(),
  updatedAt: new Date(),
});

/**
 * Map a database row to a Project object
 */
const mapProjectRow = (row: typeof schema.projects.$inferSelect, chapters: Chapter[]): Project => {
  const worldState = row.worldState as WorldState;
  const settings = (row.settings as ProjectSettings) ?? { enableDropCaps: true };
  const timeline = row.timeline as Project['timeline'];

  return {
    id: row.id,
    title: row.title,
    idea: row.idea,
    style: row.style as Project['style'],
    coverImage: row.coverImage ?? undefined,
    worldState,
    isGenerating: false,
    status: parsePublishStatus(row.status, PublishStatus.DRAFT),
    language: (row.language ?? 'en') as Project['language'],
    targetWordCount: row.targetWordCount,
    settings,
    timeline: timeline ?? {
      id: crypto.randomUUID(),
      projectId: row.id,
      events: [],
      eras: [],
      settings: {
        viewMode: 'chronological',
        zoomLevel: 1,
        showCharacters: true,
        showImplicitEvents: false,
      },
    },
    chapters,
    genre: [],
    targetAudience: 'adult',
    contentWarnings: [],
    keywords: [],
    synopsis: '',
    createdAt: new Date(),
    updatedAt: new Date(),
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
};

/**
 * Database service with Drizzle ORM
 */
export const drizzleDbService = {
  /**
   * Initialize database tables
   */
  init: async (): Promise<void> => {
    const db = getDrizzleClient();
    if (db) {
      // Drizzle handles table creation via migrations
      // For runtime, we just verify connectivity
      try {
        await db.select().from(schema.projects).limit(1);
        logger.info('Drizzle DB initialized', { component: 'drizzle-service' });
      } catch (e) {
        logger.warn('Drizzle DB check failed, tables may need migration', {
          component: 'drizzle-service',
          error: e instanceof Error ? e.message : String(e),
        });
      }
    } else {
      logger.info('Using localStorage persistence', { component: 'drizzle-service' });
    }
  },

  /**
   * Save a project and its chapters
   */
  saveProject: async (project: Project): Promise<void> => {
    logger.info(`[Drizzle] Saving project: ${project.title} (${project.id})`);

    const db = getDrizzleClient();
    if (db) {
      try {
        // Upsert project
        await db
          .insert(schema.projects)
          .values({
            id: project.id,
            title: project.title,
            idea: project.idea,
            style: project.style,
            coverImage: project.coverImage ?? null,
            worldState: project.worldState,
            status: project.status,
            language: project.language,
            targetWordCount: project.targetWordCount,
            settings: project.settings,
            timeline: project.timeline,
            updatedAt: new Date().toISOString(),
          })
          .onConflictDoUpdate({
            target: schema.projects.id,
            set: {
              title: project.title,
              idea: project.idea,
              style: project.style,
              coverImage: project.coverImage ?? null,
              worldState: project.worldState,
              status: project.status,
              language: project.language,
              targetWordCount: project.targetWordCount,
              settings: project.settings,
              timeline: project.timeline,
              updatedAt: new Date().toISOString(),
            },
          });

        // Upsert chapters
        for (const chapter of project.chapters) {
          await db
            .insert(schema.chapters)
            .values({
              id: chapter.id,
              projectId: project.id,
              orderIndex: chapter.orderIndex,
              title: chapter.title,
              summary: chapter.summary,
              content: chapter.content,
              status: chapter.status,
            })
            .onConflictDoUpdate({
              target: schema.chapters.id,
              set: {
                title: chapter.title,
                summary: chapter.summary,
                content: chapter.content,
                status: chapter.status,
                orderIndex: chapter.orderIndex,
              },
            });
        }

        logger.info('[Drizzle] Cloud save complete');
      } catch (e) {
        logger.error(
          'Failed to save to cloud',
          { component: 'drizzle-service' },
          e instanceof Error ? e : undefined,
        );
      }
    } else {
      // LocalStorage fallback
      const projects = JSON.parse(localStorage.getItem(LOCAL_PROJECTS_KEY) ?? '{}') as Record<
        string,
        Project
      >;
      projects[project.id] = { ...project, updatedAt: new Date() };
      localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(projects));
      logger.info('[Drizzle] Local save complete');
    }
  },

  /**
   * Load a project by ID
   */
  loadProject: async (projectId: string): Promise<Project | null> => {
    logger.info(`[Drizzle] Loading project: ${projectId}`);

    const db = getDrizzleClient();
    if (db) {
      try {
        // Load project
        const projectRows = await db
          .select()
          .from(schema.projects)
          .where(eq(schema.projects.id, projectId));

        if (projectRows.length === 0) return null;
        const projectRow = projectRows[0];
        if (!projectRow) return null;

        // Load chapters
        const chapterRows = await db
          .select()
          .from(schema.chapters)
          .where(eq(schema.chapters.projectId, projectId));

        const chapters = chapterRows.map(mapChapterRow);
        const loadedProject = mapProjectRow(projectRow, chapters);

        // Validate
        const result = ProjectSchema.safeParse(loadedProject);
        if (result.success) {
          logger.info(`[Drizzle] Cloud load success: ${loadedProject.title}`);
          return result.data;
        } else {
          logger.error('Failed to validate loaded project', {
            component: 'drizzle-service',
            error: result.error,
          });
          return null;
        }
      } catch (e) {
        logger.error(
          'Failed to load from cloud',
          { component: 'drizzle-service' },
          e instanceof Error ? e : undefined,
        );
        return null;
      }
    } else {
      // LocalStorage fallback
      const projects = JSON.parse(localStorage.getItem(LOCAL_PROJECTS_KEY) ?? '{}') as Record<
        string,
        Project
      >;
      const p = projects[projectId];
      if (!p) return null;

      logger.info(`[Drizzle] Local load success: ${p.title}`);
      return {
        ...p,
        status: p.status ?? PublishStatus.DRAFT,
        language: p.language ?? 'en',
        targetWordCount: p.targetWordCount ?? 50000,
        settings: p.settings ?? { enableDropCaps: true },
        timeline: p.timeline ?? {
          id: crypto.randomUUID(),
          projectId: p.id,
          events: [],
          eras: [],
          settings: {
            viewMode: 'chronological',
            zoomLevel: 1,
            showCharacters: true,
            showImplicitEvents: false,
          },
        },
        isGenerating: false,
      };
    }
  },

  /**
   * Get all projects (summary only)
   */
  getAllProjects: async (): Promise<
    { id: string; title: string; style: string; updatedAt: string; coverImage?: string }[]
  > => {
    const db = getDrizzleClient();
    if (db) {
      try {
        const rows = await db
          .select({
            id: schema.projects.id,
            title: schema.projects.title,
            style: schema.projects.style,
            updatedAt: schema.projects.updatedAt,
            coverImage: schema.projects.coverImage,
          })
          .from(schema.projects);

        return rows.map(r => ({
          id: r.id,
          title: r.title,
          style: r.style,
          updatedAt: r.updatedAt,
          coverImage: r.coverImage ?? undefined,
        }));
      } catch (e) {
        logger.error(
          'Failed to list projects',
          { component: 'drizzle-service' },
          e instanceof Error ? e : undefined,
        );
        return [];
      }
    } else {
      // LocalStorage fallback
      const projects = JSON.parse(localStorage.getItem(LOCAL_PROJECTS_KEY) ?? '{}') as Record<
        string,
        Project
      >;
      return Object.values(projects)
        .map(p => ({
          id: p.id,
          title: p.title,
          style: p.style as string,
          updatedAt: p.updatedAt?.toString() ?? new Date().toISOString(),
          coverImage: p.coverImage,
        }))
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
  },

  /**
   * Delete a project and its chapters
   */
  deleteProject: async (projectId: string): Promise<void> => {
    logger.info(`[Drizzle] Deleting project: ${projectId}`);

    const db = getDrizzleClient();
    if (db) {
      try {
        // Delete chapters first (foreign key constraint)
        await db.delete(schema.chapters).where(eq(schema.chapters.projectId, projectId));
        // Delete project
        await db.delete(schema.projects).where(eq(schema.projects.id, projectId));
        logger.info('[Drizzle] Cloud delete complete');
      } catch (e) {
        logger.error(
          'Failed to delete from cloud',
          { component: 'drizzle-service' },
          e instanceof Error ? e : undefined,
        );
      }
    } else {
      // LocalStorage fallback
      const projects = JSON.parse(localStorage.getItem(LOCAL_PROJECTS_KEY) ?? '{}') as Record<
        string,
        Project
      >;
      delete projects[projectId];
      localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(projects));
      logger.info('[Drizzle] Local delete complete');
    }
  },
};
