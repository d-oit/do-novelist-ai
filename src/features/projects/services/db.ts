import type { Client } from '@libsql/client/web';
import { createClient } from '@libsql/client/web';

import { logger } from '@/lib/logging/logger';
import { isLanguage } from '@/types/guards';
import { ProjectSchema } from '@/types/schemas';

import type { Project, ProjectSettings, WorldState, WritingStyle } from '@shared/types';
import { ChapterStatus, PublishStatus } from '@shared/types';

import { parseChapterStatus, parsePublishStatus } from '../../../shared/utils/validation';

const STORAGE_KEY = 'novelist_db_config';
const LOCAL_PROJECTS_KEY = 'novelist_local_projects';

export interface DbConfig {
  url: string;
  authToken: string;
  useCloud: boolean;
}

interface DbProjectRow {
  id: string;
  title: string;
  idea: string;
  style: string; // JSON string
  cover_image: string;
  world_state: string; // JSON string
  status: string;
  language: string;
  target_word_count: number;
  settings: string; // JSON string
  updated_at: string;
}

interface DbChapterRow {
  id: string;
  project_id: string;
  order_index: number;
  title: string;
  summary: string;
  content: string;
  status: string;
}

/**
 * Check if a URL is valid for Turso database connection
 * Turso URLs must be proper libsql:// or https:// URLs
 */
const isValidTursoUrl = (url: string): boolean => {
  if (!url || url.length < 10) return false;
  // Skip test placeholder URLs
  if (url === 'test-url' || url.startsWith('test-')) return false;
  // Must be a proper URL format
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === 'libsql:' || parsed.protocol === 'https:' || parsed.protocol === 'http:'
    );
  } catch {
    return false;
  }
};

/**
 * Check if running in test environment
 */
const isTestEnvironment = (): boolean => {
  // Check browser environment flags
  if (typeof window !== 'undefined') {
    const env = import.meta.env;
    return (
      env?.PLAYWRIGHT_TEST === 'true' ||
      env?.PLAYWRIGHT === 'true' ||
      env?.NODE_ENV === 'test' ||
      env?.CI === 'true'
    );
  }
  // Check Node.js environment
  if (typeof process !== 'undefined' && process.env) {
    return (
      process.env.PLAYWRIGHT_TEST === 'true' ||
      process.env.PLAYWRIGHT === 'true' ||
      process.env.NODE_ENV === 'test' ||
      process.env.CI === 'true'
    );
  }
  return false;
};

export const getStoredConfig = (): DbConfig => {
  // In test environment, always use localStorage for reliability
  if (isTestEnvironment()) {
    return {
      url: '',
      authToken: '',
      useCloud: false,
    };
  }

  // 1. Check LocalStorage (User overrides)
  const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
  if (stored != null) {
    const parsed = JSON.parse(stored) as DbConfig;
    // If user has explicitly configured, return it
    return parsed;
  }

  // 2. Check Environment (System defaults)
  const envUrl = import.meta.env?.VITE_TURSO_DATABASE_URL || '';
  const envToken = import.meta.env?.VITE_TURSO_AUTH_TOKEN || '';

  // Only use cloud if URL is valid and token exists
  const validUrl = isValidTursoUrl(envUrl);
  const hasToken = (envToken?.length ?? 0) > 0;

  return {
    url: validUrl ? envUrl : '',
    authToken: hasToken ? envToken : '',
    useCloud: validUrl && hasToken,
  };
};

export const saveStoredConfig = (config: DbConfig): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  // Force client refresh
  dbClient = null;
};

let dbClient: Client | null = null;

const getClient = (): Client | null => {
  if (dbClient) return dbClient;

  const config = getStoredConfig();
  if (!config.useCloud || !config.url) return null;

  try {
    dbClient = createClient({
      url: config.url,
      authToken: config.authToken,
    });
    return dbClient;
  } catch (e) {
    console.error('Failed to create Turso client', e);
    return null;
  }
};

export const db = {
  init: async (): Promise<void> => {
    const client = getClient();
    if (client) {
      try {
        // Projects Table
        await client.execute(`
          CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            title TEXT,
            idea TEXT,
            style TEXT,
            cover_image TEXT,
            world_state TEXT,
            status TEXT DEFAULT 'Draft',
            language TEXT DEFAULT 'en',
            target_word_count INTEGER DEFAULT 50000,
            settings TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Attempt to add columns for existing tables (ignoring errors if they exist)
        try {
          await client.execute("ALTER TABLE projects ADD COLUMN status TEXT DEFAULT 'Draft'");
        } catch {
          // Column already exists
        }
        try {
          await client.execute("ALTER TABLE projects ADD COLUMN language TEXT DEFAULT 'en'");
        } catch {
          // Column already exists
        }
        try {
          await client.execute(
            'ALTER TABLE projects ADD COLUMN target_word_count INTEGER DEFAULT 50000',
          );
        } catch {
          // Column already exists
        }
        try {
          await client.execute('ALTER TABLE projects ADD COLUMN settings TEXT');
        } catch {
          // Column already exists
        }

        // Chapters Table
        await client.execute(`
          CREATE TABLE IF NOT EXISTS chapters (
            id TEXT PRIMARY KEY,
            project_id TEXT,
            order_index INTEGER,
            title TEXT,
            summary TEXT,
            content TEXT,
            status TEXT
          )
        `);
        logger.info('Turso DB Connection Established');
      } catch (e) {
        console.error('Turso Init Error (Falling back to local):', e);
      }
    } else {
      logger.info('Using LocalStorage Persistence');
    }
  },

  saveProject: async (project: Project): Promise<void> => {
    logger.info(`[DB] Saving project: ${project.title} (${project.id})`);
    const client = getClient();
    if (client) {
      try {
        // Upsert Project
        await client.execute({
          sql: `INSERT INTO projects (id, title, idea, style, cover_image, world_state, status, language, target_word_count, settings, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP) 
                ON CONFLICT(id) DO UPDATE SET 
                title=excluded.title, idea=excluded.idea, style=excluded.style, cover_image=excluded.cover_image, world_state=excluded.world_state, 
                status=excluded.status, language=excluded.language, target_word_count=excluded.target_word_count, settings=excluded.settings, updated_at=CURRENT_TIMESTAMP`,
          args: [
            project.id,
            project.title,
            project.idea,
            project.style,
            project.coverImage ?? '',
            JSON.stringify(project.worldState),
            project.status,
            project.language,
            project.targetWordCount,
            JSON.stringify(project.settings ?? {}),
          ],
        });

        // Upsert Chapters
        if (project.chapters.length > 0) {
          const stmts = project.chapters.map(c => ({
            sql: `INSERT INTO chapters (id, project_id, order_index, title, summary, content, status)
                  VALUES (?, ?, ?, ?, ?, ?, ?)
                  ON CONFLICT(id) DO UPDATE SET
                  title=excluded.title, summary=excluded.summary, content=excluded.content, status=excluded.status`,
            args: [c.id, project.id, c.orderIndex, c.title, c.summary, c.content, c.status],
          }));
          await client.batch(stmts, 'write');
        }
        logger.info(`[DB] Cloud save complete.`);
      } catch (e) {
        console.error('Failed to save to Cloud', e);
      }
    } else {
      // Local Save
      const projects = JSON.parse(localStorage.getItem(LOCAL_PROJECTS_KEY) ?? '{}') as Record<
        string,
        Project
      >;
      projects[project.id] = { ...project, updatedAt: new Date() };
      localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(projects));
      logger.info(`[DB] Local save complete.`);
    }
  },

  loadProject: async (projectId: string): Promise<Project | null> => {
    logger.info(`[DB] Loading project: ${projectId}`);
    const client = getClient();
    if (client) {
      try {
        const pRes = await client.execute({
          sql: 'SELECT * FROM projects WHERE id = ?',
          args: [projectId],
        });
        if (pRes.rows.length === 0) return null;
        const pRow = pRes.rows[0] as unknown as DbProjectRow;

        const cRes = await client.execute({
          sql: 'SELECT * FROM chapters WHERE project_id = ? ORDER BY order_index',
          args: [projectId],
        });

        const loadedProject: Project = {
          id: pRow.id,
          title: pRow.title,
          idea: pRow.idea,
          style: JSON.parse(pRow.style || '{}') as WritingStyle,
          coverImage: pRow.cover_image,

          worldState: JSON.parse(pRow.world_state || '{}') as WorldState,
          isGenerating: false,
          status: parsePublishStatus(pRow.status, PublishStatus.DRAFT),
          language: isLanguage(pRow.language) ? pRow.language : 'en',
          targetWordCount: pRow.target_word_count,

          settings: JSON.parse(pRow.settings || '{}') as ProjectSettings,
          genre: [],
          targetAudience: 'adult',
          contentWarnings: [],
          keywords: [],
          synopsis: '',
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
          createdAt: new Date(),
          updatedAt: new Date(),
          chapters: cRes.rows.map(r => {
            const cRow = r as unknown as DbChapterRow;
            return {
              id: cRow.id ?? '',
              orderIndex: cRow.order_index ?? 0,
              title: cRow.title ?? '',
              summary: cRow.summary ?? '',
              content: cRow.content ?? '',
              status: parseChapterStatus(cRow.status ?? 'pending', ChapterStatus.PENDING),
              wordCount: 0,
              characterCount: 0,
              estimatedReadingTime: 0,
              tags: [],
              notes: '',
              createdAt: new Date(),
              updatedAt: new Date(),
              illustration: undefined,
            };
          }),
          timeline: {
            id: crypto.randomUUID(),
            projectId: pRow.id,
            events: [],
            eras: [],
            settings: {
              viewMode: 'chronological',
              zoomLevel: 1,
              showCharacters: true,
              showImplicitEvents: false,
            },
          },
        };
        // Validate the loaded project data
        const validationResult = ProjectSchema.safeParse(loadedProject);
        if (validationResult.success) {
          logger.info(`[DB] Cloud load success: ${loadedProject.title}`);
          return validationResult.data;
        } else {
          console.error('Failed to validate loaded project:', validationResult.error);
          return null;
        }
      } catch (e) {
        console.error('Failed to load from Cloud', e);
        return null;
      }
    } else {
      const projects = JSON.parse(localStorage.getItem(LOCAL_PROJECTS_KEY) ?? '{}') as Record<
        string,
        Partial<Project>
      >;
      const p = projects[projectId];
      if (!p) return null;
      logger.info(`[DB] Local load success: ${p.title}`);
      // Ensure structure matches Project type (handling legacy data if any)
      const loadedProject = {
        status: PublishStatus.DRAFT,
        language: 'en',
        targetWordCount: 50000,
        settings: {} as ProjectSettings, // default fallback
        ...p,
        isGenerating: false,
      };
      // Validate the loaded project data
      const validationResult = ProjectSchema.safeParse(loadedProject);
      return validationResult.success ? validationResult.data : null;
    }
  },

  getAllProjects: async (): Promise<
    { id: string; title: string; style: string; updatedAt: string; coverImage?: string }[]
  > => {
    const client = getClient();
    if (client) {
      try {
        const res = await client.execute(
          'SELECT id, title, style, cover_image, updated_at FROM projects ORDER BY updated_at DESC',
        );
        return res.rows.map(r => ({
          id: r.id as string,
          title: r.title as string,
          style: r.style as string,
          updatedAt: r.updated_at as string,
          coverImage: r.cover_image as string,
        }));
      } catch (e) {
        console.error('Failed to list projects from Cloud', e);
        return [];
      }
    } else {
      const projects = JSON.parse(localStorage.getItem(LOCAL_PROJECTS_KEY) ?? '{}') as Record<
        string,
        Record<string, unknown>
      >;
      return Object.values(projects)
        .map((p: Record<string, unknown>) => ({
          id: p.id as string,
          title: p.title as string,
          style: p.style as string,
          updatedAt: (p.updatedAt as string) ?? new Date().toISOString(),
          coverImage: p.coverImage as string | undefined,
        }))
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
  },

  deleteProject: async (projectId: string): Promise<void> => {
    logger.info(`[DB] Deleting project: ${projectId}`);
    const client = getClient();
    if (client) {
      try {
        await client.batch(
          [
            { sql: 'DELETE FROM chapters WHERE project_id = ?', args: [projectId] },
            { sql: 'DELETE FROM projects WHERE id = ?', args: [projectId] },
          ],
          'write',
        );
      } catch (e) {
        console.error('Failed to delete from Cloud', e);
      }
    } else {
      const projects = JSON.parse(localStorage.getItem(LOCAL_PROJECTS_KEY) ?? '{}') as Record<
        string,
        unknown
      >;
      delete projects[projectId];
      localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(projects));
    }
  },
};
