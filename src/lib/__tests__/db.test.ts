import { describe, it, expect, vi, beforeEach } from 'vitest';

import { db, getStoredConfig, saveStoredConfig } from '@/lib/db';
import type { Project } from '@/types';
import { PublishStatus, ChapterStatus } from '@/types';

import { createChapter } from '@shared/utils';

// Mock @libsql/client/web
const mocks = vi.hoisted(() => ({
  execute: vi.fn().mockResolvedValue({ rows: [] }),
  batch: vi.fn().mockResolvedValue([]),
  createClient: vi.fn(),
}));

vi.mock('@libsql/client/web', () => ({
  createClient: vi.fn(config => {
    mocks.createClient(config);
    return {
      execute: mocks.execute,
      batch: mocks.batch,
    };
  }),
}));

vi.mock('@/lib/database/drizzle', () => ({
  getDrizzleClient: vi.fn(() => ({
    execute: mocks.execute,
    batch: mocks.batch,
  })),
  getDrizzleConfig: vi.fn(() => ({
    url: '',
    authToken: '',
    useCloud: false,
  })),
  isCloudDbAvailable: vi.fn(() => false),
  resetDrizzleClient: vi.fn(),
}));

const { execute: mockExecute, batch: mockBatch, createClient: mockCreateClient } = mocks;

describe('Database Library', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecute.mockReset();
    mockBatch.mockReset();
    mockCreateClient.mockReset();
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
    it('should initialize with local storage when cloud is not configured', async () => {
      localStorage.setItem(
        'novelist_db_config',
        JSON.stringify({
          url: ':memory:',
          authToken: '',
          useCloud: false,
        }),
      );

      // Reset mock to track calls
      mockExecute.mockResolvedValue({ rows: [] });

      await db.init();

      // Should have created a client and executed table creation statements
      expect(mockExecute).toHaveBeenCalled();
    });

    it('should attempt cloud initialization when configured', async () => {
      // Clear localStorage so it uses the test environment defaults
      localStorage.clear();

      // Reset execute mock
      mockExecute.mockResolvedValue({ rows: [] });

      await db.init();

      // Should have executed table creation statements
      expect(mockExecute).toHaveBeenCalled();
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
      timeline: {
        id: 'test-timeline',
        projectId: 'p1',
        events: [],
        eras: [],
        settings: {
          viewMode: 'chronological',
          zoomLevel: 1,
          showCharacters: true,
          showImplicitEvents: false,
        },
      },
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

    describe('Database Operations', () => {
      beforeEach(async () => {
        // Set up in-memory database for testing
        localStorage.setItem(
          'novelist_db_config',
          JSON.stringify({
            url: ':memory:',
            authToken: '',
            useCloud: false,
          }),
        );

        // Reset mocks
        mockExecute.mockResolvedValue({ rows: [] });
        mockBatch.mockResolvedValue([]);

        // Initialize database
        await db.init();
      });

      it('should save project to database', async () => {
        mockExecute.mockResolvedValue({ rows: [] });

        await db.saveProject(mockProject);

        // Should have called execute for insert
        expect(mockExecute).toHaveBeenCalled();
        // Should have called batch for chapters
        expect(mockBatch).toHaveBeenCalled();
      });

      it('should load project from database', async () => {
        // Reset mock to clear all previous implementations from db.init()
        mockExecute.mockReset();

        // Mock project row with all required fields matching ProjectSchema
        mockExecute.mockResolvedValueOnce({
          rows: [
            {
              id: 'proj_1',
              title: 'Test Project',
              idea: 'Test Idea',
              style: 'Science Fiction',
              // cover_image omitted - will be undefined, which is valid for optional field
              world_state: JSON.stringify({
                hasOutline: true,
                hasTitle: true,
                chaptersCount: 0,
                chaptersCompleted: 0,
                styleDefined: true,
                isPublished: false,
                hasCharacters: false,
                hasWorldBuilding: false,
                hasThemes: false,
                plotStructureDefined: false,
                targetAudienceDefined: false,
              }),
              status: 'Draft', // Must match PublishStatus enum (capitalized)
              language: 'en',
              target_word_count: 50000,
              settings: JSON.stringify({
                enableDropCaps: true,
                autoSave: true,
                autoSaveInterval: 300, // Schema expects seconds (max 3600), not milliseconds
                showWordCount: true,
                enableSpellCheck: true,
                darkMode: true,
                fontSize: 'medium',
                lineHeight: 'relaxed',
                editorTheme: 'default',
              }),
              timeline: JSON.stringify({
                id: '550e8400-e29b-41d4-a716-446655440000',
                projectId: 'proj_1',
                events: [],
                eras: [],
                settings: {
                  viewMode: 'chronological',
                  zoomLevel: 1,
                  showCharacters: true,
                  showImplicitEvents: false,
                },
              }),
              updated_at: '2024-01-01T00:00:00.000Z',
            },
          ],
        });

        // Mock chapters rows (empty array is fine with chaptersCount: 0)
        mockExecute.mockResolvedValueOnce({
          rows: [],
        });

        const project = await db.loadProject('proj_1');

        expect(project).not.toBeNull();
        expect(project?.id).toBe('proj_1');
        expect(project?.title).toBe('Test Project');
      });

      it('should delete project from database', async () => {
        mockBatch.mockResolvedValue([]);

        await db.deleteProject('p1');

        // Should have called batch to delete chapters and project
        expect(mockBatch).toHaveBeenCalled();
      });
    });
  });
});
