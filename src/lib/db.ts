import { createClient } from '@libsql/client/web';

import { type Project, PublishStatus, ChapterStatus } from '../types';
import { parseChapterStatus, parsePublishStatus } from '../shared/utils/validation';
import { ProjectSchema, type WorldState, type ProjectSettings } from '../types/schemas';
import { logger } from './logging/logger';

const STORAGE_KEY = 'novelist_db_config';
const LOCAL_PROJECTS_KEY = 'novelist_local_projects';

export interface DbConfig {
  url: string;
  authToken: string;
  useCloud: boolean;
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

// Removed local validation - using shared validation utilities

// Helper type since Client isn't explicitly exported in all versions
type Client = ReturnType<typeof createClient>;

export const getStoredConfig = (): DbConfig => {
  // 1. Check LocalStorage first (works in all environments including tests)
  const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
  if (stored != null) {
    const parsed = JSON.parse(stored) as DbConfig;
    // If user has explicitly configured, return it
    return parsed;
  }

  // In test environment without localStorage config, use local storage
  if (isTestEnvironment()) {
    return {
      url: '',
      authToken: '',
      useCloud: false,
    };
  }

  // 2. Check Environment (System defaults)
  const envUrl = (import.meta.env.VITE_TURSO_DATABASE_URL as string | undefined) ?? '';
  const envToken = (import.meta.env.VITE_TURSO_AUTH_TOKEN as string | undefined) ?? '';

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
            timeline TEXT,
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
        try {
          await client.execute('ALTER TABLE projects ADD COLUMN timeline TEXT');
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
          sql: `INSERT INTO projects (id, title, idea, style, cover_image, world_state, status, language, target_word_count, settings, timeline, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP) 
                ON CONFLICT(id) DO UPDATE SET 
                title=excluded.title, idea=excluded.idea, style=excluded.style, cover_image=excluded.cover_image, world_state=excluded.world_state, 
                status=excluded.status, language=excluded.language, target_word_count=excluded.target_word_count, settings=excluded.settings, timeline=excluded.timeline, updated_at=CURRENT_TIMESTAMP`,
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
            JSON.stringify(project.timeline ?? {}),
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
        const pRow = pRes.rows[0];
        if (!pRow) return null;

        const cRes = await client.execute({
          sql: 'SELECT * FROM chapters WHERE project_id = ? ORDER BY order_index',
          args: [projectId],
        });

        // Parse worldState and settings safely

        const ws = (pRow as Record<string, unknown>).world_state;

        const worldStateParsed: WorldState =
          typeof ws === 'string' ? (JSON.parse(ws) as WorldState) : (ws as WorldState);

        const s = (pRow as Record<string, unknown>).settings;

        const settingsParsed: ProjectSettings =
          typeof s === 'string'
            ? (JSON.parse(s) as ProjectSettings)
            : ((s as ProjectSettings) ?? { enableDropCaps: true });

        const t = (pRow as Record<string, unknown>).timeline;
        const timelineParsed: Project['timeline'] =
          typeof t === 'string'
            ? JSON.parse(t)
            : ((t as Project['timeline']) ?? {
                id: crypto.randomUUID(),
                projectId: (pRow.id as string) ?? '',
                events: [],
                eras: [],
                settings: {
                  viewMode: 'chronological',
                  zoomLevel: 1,
                  showCharacters: true,
                  showImplicitEvents: false,
                },
              });

        const loadedProject: Project = {
          id: (pRow.id as string) ?? '',
          title: (pRow.title as string) ?? '',
          idea: (pRow.idea as string) ?? '',
          style: ((pRow.style as string) ?? 'General Fiction') as Project['style'],
          coverImage: (pRow.cover_image as string) ?? undefined,

          worldState: worldStateParsed,
          isGenerating: false,
          status: parsePublishStatus((pRow.status as string) ?? 'draft', PublishStatus.DRAFT),
          language: ((pRow.language as string) ?? 'en') as
            | 'en'
            | 'es'
            | 'fr'
            | 'de'
            | 'it'
            | 'pt'
            | 'ja'
            | 'ko'
            | 'zh',
          targetWordCount: (pRow.target_word_count as number) ?? 50000,

          settings: settingsParsed,
          timeline: timelineParsed,
          chapters: cRes.rows.map(r => ({
            id: (r.id as string) ?? '',
            orderIndex: (r.order_index as number) ?? 0,
            title: (r.title as string) ?? '',
            summary: (r.summary as string) ?? '',
            content: (r.content as string) ?? '',
            status: parseChapterStatus((r.status as string) ?? 'pending', ChapterStatus.PENDING),
            wordCount: 0,
            characterCount: 0,
            estimatedReadingTime: 0,
            tags: [],
            lastEdited: new Date().toISOString(),
            notes: '',
            createdAt: new Date(),
            updatedAt: new Date(),
          })),
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
        Project
      >;
      const p = projects[projectId];
      if (p == null) return null;
      logger.info(`[DB] Local load success: ${(p as { title?: string }).title ?? 'Unknown'}`);
      // Ensure structure matches Project type (handling legacy data if any)
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
        Project
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
    logger.info('Deleting project', { projectId });
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
        Project
      >;
      delete projects[projectId];
      localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(projects));
    }
  },
};
