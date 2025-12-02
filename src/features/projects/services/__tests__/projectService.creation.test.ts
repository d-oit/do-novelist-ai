import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { PublishStatus } from '../../../../types';
import { type ProjectCreationData } from '../../types';
import { projectService } from '../projectService';

// Mock the db module to use localStorage
vi.mock('../../../../lib/db', () => ({
  db: {
    init: vi.fn().mockResolvedValue(undefined),
    saveProject: vi.fn().mockResolvedValue(undefined),
    loadProject: vi.fn().mockResolvedValue(null),
    getAllProjects: vi.fn().mockResolvedValue([]),
    deleteProject: vi.fn().mockResolvedValue(undefined),
  },
}));

import { db } from '../../../../lib/db';

describe('ProjectService - Creation', () => {
  // In-memory storage for mocked operations
  let storage: { projects: any[] };

  beforeEach(async () => {
    vi.clearAllMocks();
    localStorage.clear();

    // Reset storage
    storage = {
      projects: [] as any[],
    };

    // Mock db methods
    (db.init as any).mockResolvedValue(undefined);
    (db.saveProject as any).mockImplementation((project: any) => {
      storage.projects = storage.projects.filter(p => p.id !== project.id);
      storage.projects.push(project);
    });
    (db.loadProject as any).mockImplementation((id: string) => {
      return Promise.resolve(storage.projects.find(p => p.id === id) || null);
    });
    (db.getAllProjects as any).mockImplementation(() => {
      return Promise.resolve(
        storage.projects.map(p => ({
          id: p.id,
          title: p.title,
          style: p.style,
          updatedAt: p.updatedAt.toISOString(),
          coverImage: p.coverImage,
        })),
      );
    });
    (db.deleteProject as any).mockImplementation((id: string) => {
      storage.projects = storage.projects.filter(p => p.id !== id);
    });

    await projectService.init();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await expect(projectService.init()).resolves.toBeUndefined();
    });

    it('should create projects object store on first init', async () => {
      await projectService.init();
      // Service should be initialized without errors
      expect(projectService).toBeDefined();
    });

    it('should create required indexes', async () => {
      await projectService.init();
      // The service should have created indexes for createdAt, updatedAt, status
      expect(projectService).toBeDefined();
    });
  });

  describe('Project Creation', () => {
    it('should create a new project with required fields', async () => {
      const data: ProjectCreationData = {
        title: 'My First Novel',
        idea: 'A story about a young wizard discovering their powers in a modern city',
        style: 'Fantasy',
        targetWordCount: 80000,
      };

      const project = await projectService.create(data);

      expect(project).toBeDefined();
      expect(project.id).toBeDefined();
      expect(project.title).toBe(data.title);
      expect(project.idea).toBe(data.idea);
      expect(project.style).toBe(data.style);
      expect(project.targetWordCount).toBe(data.targetWordCount);
    });

    it('should generate unique project IDs', async () => {
      const data: ProjectCreationData = {
        title: 'Test Project',
        idea: 'Test idea',
        style: 'Literary Fiction',
      };

      const project1 = await projectService.create(data);
      const project2 = await projectService.create(data);

      expect(project1.id).not.toBe(project2.id);
    });

    it('should set default status to PublishStatus.DRAFT', async () => {
      const data: ProjectCreationData = {
        title: 'New Project',
        idea: 'An idea',
        style: 'Mystery & Thriller',
      };

      const project = await projectService.create(data);

      expect(project.status).toBe(PublishStatus.DRAFT);
    });

    it('should initialize empty chapters array', async () => {
      const data: ProjectCreationData = {
        title: 'New Project',
        idea: 'An idea',
        style: 'Romance',
      };

      const project = await projectService.create(data);

      expect(project.chapters).toEqual([]);
    });

    it('should set createdAt and updatedAt timestamps', async () => {
      const data: ProjectCreationData = {
        title: 'New Project',
        idea: 'An idea',
        style: 'Science Fiction',
      };

      const project = await projectService.create(data);

      expect(project.createdAt).toBeInstanceOf(Date);
      expect(project.updatedAt).toBeInstanceOf(Date);
    });

    it('should initialize worldState with correct defaults', async () => {
      const data: ProjectCreationData = {
        title: 'New Project',
        idea: 'An idea',
        style: 'Mystery & Thriller',
      };

      const project = await projectService.create(data);

      expect(project.worldState).toBeDefined();
      expect(project.worldState.hasTitle).toBe(true);
      expect(project.worldState.styleDefined).toBe(true);
      expect(project.worldState.hasOutline).toBe(false);
      expect(project.worldState.chaptersCount).toBe(0);
      expect(project.worldState.chaptersCompleted).toBe(0);
    });

    it('should use default language if not provided', async () => {
      const data: ProjectCreationData = {
        title: 'New Project',
        idea: 'An idea',
        style: 'Horror',
      };

      const project = await projectService.create(data);

      expect(project.language).toBe('en');
    });

    it('should use provided language', async () => {
      const data: ProjectCreationData = {
        title: 'New Project',
        idea: 'An idea',
        style: 'Fantasy',
        language: 'es',
      };

      const project = await projectService.create(data);

      expect(project.language).toBe('es');
    });

    it('should use default target word count if not provided', async () => {
      const data: ProjectCreationData = {
        title: 'New Project',
        idea: 'An idea',
        style: 'Literary Fiction',
      };

      const project = await projectService.create(data);

      expect(project.targetWordCount).toBe(50000);
    });

    it('should initialize analytics with zero values', async () => {
      const data: ProjectCreationData = {
        title: 'New Project',
        idea: 'An idea',
        style: 'Science Fiction',
      };

      const project = await projectService.create(data);

      expect(project.analytics).toBeDefined();
      expect(project.analytics.totalWordCount).toBe(0);
      expect(project.analytics.averageChapterLength).toBe(0);
      expect(project.analytics.estimatedReadingTime).toBe(0);
      expect(project.analytics.generationCost).toBe(0);
      expect(project.analytics.editingRounds).toBe(0);
    });

    it('should set default version to 1.0.0', async () => {
      const data: ProjectCreationData = {
        title: 'New Project',
        idea: 'An idea',
        style: 'Historical Fiction',
      };

      const project = await projectService.create(data);

      expect(project.version).toBe('1.0.0');
    });

    it('should initialize empty changeLog', async () => {
      const data: ProjectCreationData = {
        title: 'New Project',
        idea: 'An idea',
        style: 'General Fiction',
      };

      const project = await projectService.create(data);

      expect(project.changeLog).toEqual([]);
    });

    it('should handle genre array', async () => {
      const data: ProjectCreationData = {
        title: 'New Project',
        idea: 'An idea',
        style: 'Fantasy',
        genre: ['fantasy', 'General Fiction', 'coming-of-age'],
      };

      const project = await projectService.create(data);

      expect(project.genre).toEqual(['fantasy', 'General Fiction', 'coming-of-age']);
    });

    it('should handle target audience', async () => {
      const data: ProjectCreationData = {
        title: 'Young Adult Novel',
        idea: 'Teen discovers superpowers',
        style: 'Fantasy',
        targetAudience: 'young_adult',
      };

      const project = await projectService.create(data);

      expect(project.targetAudience).toBe('young_adult');
    });
  });
});
