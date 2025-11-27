
import { createClient, Client } from "@libsql/client/web";
import { Project, Chapter, PublishStatus, ProjectSettings } from "@shared/types";

const STORAGE_KEY = 'novelist_db_config';
const LOCAL_PROJECTS_KEY = 'novelist_local_projects';

export interface DbConfig {
  url: string;
  authToken: string;
  useCloud: boolean;
}

export const getStoredConfig = (): DbConfig => {
  // 1. Check LocalStorage (User overrides)
  const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
  if (stored) {
    const parsed = JSON.parse(stored);
    // If user has explicitly explicitly configured, return it
    return parsed;
  }

  // 2. Check Environment (System defaults)
  const envUrl = typeof process !== 'undefined' ? process.env.TURSO_DATABASE_URL : '';
  const envToken = typeof process !== 'undefined' ? process.env.TURSO_AUTH_TOKEN : '';

  return {
    url: envUrl || '',
    authToken: envToken || '',
    useCloud: !!(envUrl && envToken) // Default to cloud if env vars exist
  };
};

export const saveStoredConfig = (config: DbConfig) => {
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
    console.error("Failed to create Turso client", e);
    return null;
  }
};

export const db = {
  init: async () => {
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
        try { await client.execute("ALTER TABLE projects ADD COLUMN status TEXT DEFAULT 'Draft'"); } catch(e) {}
        try { await client.execute("ALTER TABLE projects ADD COLUMN language TEXT DEFAULT 'en'"); } catch(e) {}
        try { await client.execute("ALTER TABLE projects ADD COLUMN target_word_count INTEGER DEFAULT 50000"); } catch(e) {}
        try { await client.execute("ALTER TABLE projects ADD COLUMN settings TEXT"); } catch(e) {}

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
        console.log("Turso DB Connection Established");
      } catch (e) {
        console.error("Turso Init Error (Falling back to local):", e);
      }
    } else {
      console.log("Using LocalStorage Persistence");
    }
  },

  saveProject: async (project: Project) => {
    console.log(`[DB] Saving project: ${project.title} (${project.id})`);
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
            project.coverImage || '', 
            JSON.stringify(project.worldState),
            project.status,
            project.language,
            project.targetWordCount,
            JSON.stringify(project.settings || {})
          ]
        });

        // Upsert Chapters
        if (project.chapters.length > 0) {
          const stmts = project.chapters.map(c => ({
            sql: `INSERT INTO chapters (id, project_id, order_index, title, summary, content, status)
                  VALUES (?, ?, ?, ?, ?, ?, ?)
                  ON CONFLICT(id) DO UPDATE SET
                  title=excluded.title, summary=excluded.summary, content=excluded.content, status=excluded.status`,
            args: [c.id, project.id, c.orderIndex, c.title, c.summary, c.content, c.status]
          }));
          await client.batch(stmts, "write");
        }
        console.log(`[DB] Cloud save complete.`);
      } catch (e) {
        console.error("Failed to save to Cloud", e);
      }
    } else {
      // Local Save
      const projects = JSON.parse(localStorage.getItem(LOCAL_PROJECTS_KEY) || '{}');
      projects[project.id] = { ...project, updatedAt: new Date().toISOString() };
      localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(projects));
      console.log(`[DB] Local save complete.`);
    }
  },

  loadProject: async (projectId: string): Promise<Project | null> => {
    console.log(`[DB] Loading project: ${projectId}`);
    const client = getClient();
    if (client) {
      try {
        const pRes = await client.execute({ sql: "SELECT * FROM projects WHERE id = ?", args: [projectId] });
        if (pRes.rows.length === 0) return null;
        const pRow = pRes.rows[0];

        const cRes = await client.execute({ sql: "SELECT * FROM chapters WHERE project_id = ? ORDER BY order_index", args: [projectId] });
        
        const loadedProject: Project = {
          id: pRow.id as string,
          title: pRow.title as string,
          idea: pRow.idea as string,
          style: pRow.style as string,
          coverImage: pRow.cover_image as string,
          worldState: typeof pRow.world_state === 'string' ? JSON.parse(pRow.world_state) : pRow.world_state,
          isGenerating: false,
          status: (pRow.status as PublishStatus) || PublishStatus.DRAFT,
          language: (pRow.language as string) || 'en',
          targetWordCount: (pRow.target_word_count as number) || 50000,
          settings: typeof pRow.settings === 'string' ? JSON.parse(pRow.settings) : (pRow.settings || {}),
          chapters: cRes.rows.map(r => ({
            id: r.id as string,
            orderIndex: r.order_index as number,
            title: r.title as string,
            summary: r.summary as string,
            content: r.content as string,
            status: r.status as any
          }))
        };
        console.log(`[DB] Cloud load success: ${loadedProject.title}`);
        return loadedProject;
      } catch (e) {
        console.error("Failed to load from Cloud", e);
        return null;
      }
    } else {
      const projects = JSON.parse(localStorage.getItem(LOCAL_PROJECTS_KEY) || '{}');
      const p = projects[projectId];
      if (!p) return null;
      console.log(`[DB] Local load success: ${p.title}`);
      // Ensure structure matches Project type (handling legacy data if any)
      return { 
        status: PublishStatus.DRAFT, 
        language: 'en', 
        targetWordCount: 50000,
        settings: {}, // default fallback
        ...p, 
        isGenerating: false 
      };
    }
  },

  getAllProjects: async (): Promise<{id: string, title: string, style: string, updatedAt: string, coverImage?: string}[]> => {
    const client = getClient();
    if (client) {
      try {
        const res = await client.execute("SELECT id, title, style, cover_image, updated_at FROM projects ORDER BY updated_at DESC");
        return res.rows.map(r => ({
          id: r.id as string,
          title: r.title as string,
          style: r.style as string,
          updatedAt: r.updated_at as string,
          coverImage: r.cover_image as string
        }));
      } catch (e) {
        console.error("Failed to list projects from Cloud", e);
        return [];
      }
    } else {
      const projects = JSON.parse(localStorage.getItem(LOCAL_PROJECTS_KEY) || '{}');
      return Object.values(projects).map((p: any) => ({
        id: p.id,
        title: p.title,
        style: p.style,
        updatedAt: p.updatedAt || new Date().toISOString(),
        coverImage: p.coverImage
      })).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
  },
  
  deleteProject: async (projectId: string) => {
      console.log(`[DB] Deleting project: ${projectId}`);
      const client = getClient();
      if (client) {
          try {
            await client.batch([
                { sql: "DELETE FROM chapters WHERE project_id = ?", args: [projectId] },
                { sql: "DELETE FROM projects WHERE id = ?", args: [projectId] }
            ], "write");
          } catch (e) {
            console.error("Failed to delete from Cloud", e);
          }
      } else {
          const projects = JSON.parse(localStorage.getItem(LOCAL_PROJECTS_KEY) || '{}');
          delete projects[projectId];
          localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(projects));
      }
  }
};
