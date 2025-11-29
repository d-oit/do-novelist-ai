import { describe, it, expect, vi, beforeEach } from 'vitest';

import { createChapter } from '../../shared/utils';
import { Project, PublishStatus, ChapterStatus } from '../../types';
import { db, getStoredConfig, saveStoredConfig } from '../db';

// Mock @libsql/client/web
const mocks = vi.hoisted(() => ({
  execute: vi.fn(),
  batch: vi.fn(),
  createClient: vi.fn(),
}));

vi.mock('@libsql/client/web', () => ({
  createClient: mocks.createClient.mockReturnValue({
    execute: mocks.execute,
    batch: mocks.batch,
  }),
}));

const { execute: mockExecute, batch: mockBatch, createClient: mockCreateClient } = mocks;

describe('Database Library', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Configuration', () => {
    it('should get stored config from localStorage', () => {
      const config = { url: 'libsql://test.db', authToken: 'token', useCloud: true };
      localStorage.setItem('novelist_db_config', JSON.stringify(config));
      expect(getStoredConfig()).toEqual(config);
    });

    it('should fallback to environment variables if no local config', () => {
      const config = getStoredConfig();
      expect(config).toHaveProperty('url');
      expect(config).toHaveProperty('authToken');
    });

    it('should save config to localStorage', () => {
      const config = { url: 'new-url', authToken: 'new-token', useCloud: true };
      saveStoredConfig(config);
      expect(localStorage.getItem('novelist_db_config')).toBe(JSON.stringify(config));
    });
  });

  describe('Initialization', () => {
    it('should initialize cloud client if configured', async () => {
      localStorage.setItem(
        'novelist_db_config',
        JSON.stringify({
          url: 'libsql://test.db',
          authToken: 'token',
          useCloud: true,
        })
      );

      await db.init();
      expect(mockCreateClient).toHaveBeenCalled();
      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS projects')
      );
    });

    it('should fallback to local storage if cloud init fails', async () => {
      localStorage.setItem(
        'novelist_db_config',
        JSON.stringify({
          url: 'libsql://test.db',
          authToken: 'token',
          useCloud: true,
        })
      );

      mockExecute.mockRejectedValueOnce(new Error('Connection failed'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      await db.init();
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('Project Operations', () => {
    const mockProject: Project = {
      id: 'p1',
      title: 'Test Project',
      idea: 'Test Idea',
      style: 'Science Fiction',
      coverImage: 'cover.png',
      worldState: {
        hasOutline: true,
        hasTitle: true,
        chaptersCount: 1,
        chaptersCompleted: 0,
        styleDefined: true,
        isPublished: false,
        hasCharacters: false,
        hasWorldBuilding: false,
        hasThemes: false,
        plotStructureDefined: false,
        targetAudienceDefined: false,
      },
      isGenerating: false,
      status: PublishStatus.DRAFT,
      language: 'en',
      targetWordCount: 50000,
      settings: {
        enableDropCaps: true,
        autoSave: true,
        autoSaveInterval: 30000,
        showWordCount: true,
        enableSpellCheck: true,
        darkMode: true,
        fontSize: 'medium',
        lineHeight: 'relaxed',
        editorTheme: 'default',
      },
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
      chapters: [
        createChapter({
          id: 'c1',
          orderIndex: 1,
          title: 'Chapter 1',
          summary: 'Summary 1',
          content: 'Content 1',
          status: ChapterStatus.PENDING,
        }),
      ],
    };

    describe('Cloud Operations', () => {
      beforeEach(() => {
        localStorage.setItem(
          'novelist_db_config',
          JSON.stringify({
            url: 'libsql://test.db',
            authToken: 'token',
            useCloud: true,
          })
        );
        // Ensure client is recreated
        saveStoredConfig({ url: 'libsql://test.db', authToken: 'token', useCloud: true });
      });

      it('should save project to cloud', async () => {
        await db.saveProject(mockProject);
        expect(mockExecute).toHaveBeenCalledWith(
          expect.objectContaining({
            sql: expect.stringContaining('INSERT INTO projects'),
          })
        );
        expect(mockBatch).toHaveBeenCalled();
      });

      it('should load project from cloud', async () => {
        mockExecute
          .mockResolvedValueOnce({
            rows: [
              {
                id: mockProject.id,
                title: mockProject.title,
                idea: mockProject.idea,
                style: mockProject.style,
                cover_image: mockProject.coverImage,
                world_state: JSON.stringify(mockProject.worldState),
                status: mockProject.status,
                language: mockProject.language,
                target_word_count: mockProject.targetWordCount,
                settings: JSON.stringify(mockProject.settings),
              },
            ],
          }) // Project query
          .mockResolvedValueOnce({
            rows: [
              {
                id: 'c1',
                project_id: 'p1',
                order_index: 1,
                title: 'Chapter 1',
                summary: 'Summary 1',
                content: 'Content 1',
                status: 'Pending',
              },
            ],
          }); // Chapters query

        const project = await db.loadProject('p1');
        expect(project).toBeDefined();
        expect(project?.id).toBe('p1');
        expect(project?.chapters).toHaveLength(1);
      });

      it('should delete project from cloud', async () => {
        await db.deleteProject('p1');
        expect(mockBatch).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({ sql: expect.stringContaining('DELETE FROM chapters') }),
            expect.objectContaining({ sql: expect.stringContaining('DELETE FROM projects') }),
          ]),
          'write'
        );
      });
    });

    describe('Local Storage Operations', () => {
      beforeEach(() => {
        localStorage.setItem(
          'novelist_db_config',
          JSON.stringify({
            url: '',
            authToken: '',
            useCloud: false,
          })
        );
        saveStoredConfig({ url: '', authToken: '', useCloud: false });
      });

      it('should save project to localStorage', async () => {
        await db.saveProject(mockProject);
        const stored = JSON.parse(localStorage.getItem('novelist_local_projects') || '{}');
        expect(stored.p1).toBeDefined();
        expect(stored.p1.title).toBe('Test Project');
      });

      it('should load project from localStorage', async () => {
        const projects = { p1: mockProject };
        localStorage.setItem('novelist_local_projects', JSON.stringify(projects));

        const project = await db.loadProject('p1');
        expect(project).toBeDefined();
        expect(project?.id).toBe('p1');
      });

      it('should delete project from localStorage', async () => {
        const projects = { p1: mockProject };
        localStorage.setItem('novelist_local_projects', JSON.stringify(projects));

        await db.deleteProject('p1');
        const stored = JSON.parse(localStorage.getItem('novelist_local_projects') || '{}');
        expect(stored.p1).toBeUndefined();
      });
    });
  });
});
