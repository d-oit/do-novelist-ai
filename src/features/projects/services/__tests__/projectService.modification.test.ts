import { describe, it, expect, beforeEach, vi } from 'vitest';

import { ProjectService } from '@/features/projects/services/projectService';
import type { IProjectRepository } from '@/lib/repositories/interfaces/IProjectRepository';
import type { Project, type ProjectCreationData } from '@/types';
import { PublishStatus } from '@/types';

describe('ProjectService - Modification', () => {
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

  it('should update project fields', async () => {
    const data: ProjectCreationData = {
      title: 'Test Project',
      idea: 'Test idea',
      style: 'Fantasy',
    };

    const project = await serviceInstance.create(data);

    await serviceInstance.update(project.id, {
      title: 'Updated Title',
    });

    const updated = await serviceInstance.getById(project.id);
    expect(updated?.title).toBe('Updated Title');
  });

  it('should update project status', async () => {
    const data: ProjectCreationData = {
      title: 'Test Project',
      idea: 'Test idea',
      style: 'Fantasy',
    };

    const project = await serviceInstance.create(data);

    await serviceInstance.update(project.id, {
      status: PublishStatus.REVIEW,
    });

    const updated = await serviceInstance.getById(project.id);
    expect(updated?.status).toBe(PublishStatus.REVIEW);
  });

  it('should delete a project', async () => {
    const data: ProjectCreationData = {
      title: 'Test Project',
      idea: 'Test idea',
      style: 'Fantasy',
    };

    const project = await serviceInstance.create(data);
    await serviceInstance.delete(project.id);

    const retrieved = await serviceInstance.getById(project.id);
    expect(retrieved).toBeNull();
  });

  it('should save full project', async () => {
    const data: ProjectCreationData = {
      title: 'Test Project',
      idea: 'Test idea',
      style: 'Fantasy',
    };

    const project = await serviceInstance.create(data);
    project.idea = 'Updated idea';

    await serviceInstance.save(project);

    const updated = await serviceInstance.getById(project.id);
    expect(updated?.idea).toBe('Updated idea');
  });

  it('should handle non-existent project update', async () => {
    await expect(serviceInstance.update('non-existent-id', { title: 'New Title' })).rejects.toThrow();
  });

  it('should handle non-existent project save', async () => {
    const data: Omit<Project, 'id'> = {
      title: 'Test Project',
      idea: 'Test idea',
      style: 'Fantasy',
      status: PublishStatus.DRAFT,
      chapters: [],
      coverImage: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      worldState: {
        hasTitle: true,
        hasOutline: false,
        chaptersCount: 0,
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
      language: 'en',
      targetWordCount: 50000,
      settings: {
        enableDropCaps: true,
      },
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
      timeline: {
        id: crypto.randomUUID(),
        projectId: crypto.randomUUID(),
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

    await expect(serviceInstance.save(data as Project)).rejects.toThrow();
  });
});
