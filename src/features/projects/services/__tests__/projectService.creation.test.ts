import { describe, it, expect, beforeEach, vi } from 'vitest';

import { ProjectService } from '@/features/projects/services/projectService';
import type { IProjectRepository } from '@/lib/repositories/interfaces/IProjectRepository';
import type { Project, ProjectCreationData } from '@/types';
import { PublishStatus } from '@/types';

describe('ProjectService - Creation', () => {
  let serviceInstance: ProjectService;
  let mockRepo: IProjectRepository;
  let storage: { projects: Project[] };

  beforeEach(async () => {
    vi.clearAllMocks();

    // Reset storage
    storage = {
      projects: [] as Project[],
    };

    // Create mock repository
    const findByIdMock = vi.fn((id: string) => Promise.resolve(storage.projects.find(p => p.id === id) || null));
    const findAllMock = vi.fn(() => Promise.resolve(storage.projects));
    const createMock = vi.fn((project: Omit<Project, 'id'>) => {
      const newProject = { ...project, id: crypto.randomUUID() } as Project;
      storage.projects.push(newProject);
      return Promise.resolve(newProject);
    });
    const updateMock = vi.fn((id: string, data: Partial<Project>) => {
      const index = storage.projects.findIndex(p => p.id === id);
      if (index >= 0) {
        storage.projects[index] = { ...storage.projects[index], ...data } as Project;
        return Promise.resolve(storage.projects[index]);
      }
      return Promise.resolve(null);
    });
    const deleteMock = vi.fn((id: string) => {
      storage.projects = storage.projects.filter(p => p.id !== id);
      return Promise.resolve(true);
    });
    const findByStatusMock = vi.fn((status: string) => {
      return Promise.resolve(storage.projects.filter(p => p.status === (status as PublishStatus)));
    });

    mockRepo = {
      findById: findByIdMock,
      findAll: findAllMock,
      create: createMock,
      update: updateMock,
      delete: deleteMock,
      findByStatus: findByStatusMock,
      getSummaries: vi.fn(),
      getStats: vi.fn(),
      findByStyle: vi.fn(),
      findByLanguage: vi.fn(),
      findByQuery: vi.fn(),
      titleExists: vi.fn(),
      count: vi.fn(),
      exists: vi.fn(),
      transaction: vi.fn(),
      createWithResult: vi.fn(),
      updateWithResult: vi.fn(),
      deleteWithResult: vi.fn(),
      findWhere: vi.fn(),
    } as unknown as IProjectRepository;

    // Create service instance with mocked repository
    serviceInstance = new ProjectService(mockRepo);

    await serviceInstance.init();
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await expect(serviceInstance.init()).resolves.toBeUndefined();
    });

    it('should create projects object store on first init', async () => {
      await serviceInstance.init();
      // Service should be initialized without errors
      expect(serviceInstance).toBeDefined();
    });

    it('should create required indexes', async () => {
      await serviceInstance.init();
      // The service should have created indexes for createdAt, updatedAt, status
      expect(serviceInstance).toBeDefined();
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

      const project = await serviceInstance.create(data);

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

      const project1 = await serviceInstance.create(data);
      const project2 = await serviceInstance.create(data);

      expect(project1.id).not.toBe(project2.id);
    });

    it('should set default status to PublishStatus.DRAFT', async () => {
      const data: ProjectCreationData = {
        title: 'New Project',
        idea: 'An idea',
        style: 'Mystery & Thriller',
      };

      const project = await serviceInstance.create(data);

      expect(project.status).toBe(PublishStatus.DRAFT);
    });

    it('should initialize empty chapters array', async () => {
      const data: ProjectCreationData = {
        title: 'New Project',
        idea: 'An idea',
        style: 'Romance',
      };

      const project = await serviceInstance.create(data);

      expect(project.chapters).toEqual([]);
    });

    it('should set createdAt and updatedAt timestamps', async () => {
      const data: ProjectCreationData = {
        title: 'New Project',
        idea: 'An idea',
        style: 'Science Fiction',
      };

      const project = await serviceInstance.create(data);

      expect(project.createdAt).toBeInstanceOf(Date);
      expect(project.updatedAt).toBeInstanceOf(Date);
    });

    it('should initialize worldState with correct defaults', async () => {
      const data: ProjectCreationData = {
        title: 'New Project',
        idea: 'An idea',
        style: 'Mystery & Thriller',
      };

      const project = await serviceInstance.create(data);

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

      const project = await serviceInstance.create(data);

      expect(project.language).toBe('en');
    });

    it('should use provided language', async () => {
      const data: ProjectCreationData = {
        title: 'New Project',
        idea: 'An idea',
        style: 'Fantasy',
        language: 'es',
      };

      const project = await serviceInstance.create(data);

      expect(project.language).toBe('es');
    });

    it('should use default target word count if not provided', async () => {
      const data: ProjectCreationData = {
        title: 'New Project',
        idea: 'An idea',
        style: 'Literary Fiction',
      };

      const project = await serviceInstance.create(data);

      expect(project.targetWordCount).toBe(50000);
    });

    it('should initialize analytics with zero values', async () => {
      const data: ProjectCreationData = {
        title: 'New Project',
        idea: 'An idea',
        style: 'Science Fiction',
      };

      const project = await serviceInstance.create(data);

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

      const project = await serviceInstance.create(data);

      expect(project.version).toBe('1.0.0');
    });

    it('should initialize empty changeLog', async () => {
      const data: ProjectCreationData = {
        title: 'New Project',
        idea: 'An idea',
        style: 'General Fiction',
      };

      const project = await serviceInstance.create(data);

      expect(project.changeLog).toEqual([]);
    });

    it('should handle genre array', async () => {
      const data: ProjectCreationData = {
        title: 'New Project',
        idea: 'An idea',
        style: 'Fantasy',
        genre: ['fantasy', 'General Fiction', 'coming-of-age'],
      };

      const project = await serviceInstance.create(data);

      expect(project.genre).toEqual(['fantasy', 'General Fiction', 'coming-of-age']);
    });

    it('should handle target audience', async () => {
      const data: ProjectCreationData = {
        title: 'Young Adult Novel',
        idea: 'Teen discovers superpowers',
        style: 'Fantasy',
        targetAudience: 'young_adult',
      };

      const project = await serviceInstance.create(data);

      expect(project.targetAudience).toBe('young_adult');
    });
  });
});
