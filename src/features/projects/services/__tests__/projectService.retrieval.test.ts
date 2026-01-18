import { describe, it, expect, beforeEach, vi } from 'vitest';

import { ProjectService } from '@/features/projects/services/projectService';
import type { IProjectRepository } from '@/lib/repositories/interfaces/IProjectRepository';
import type { Project, type ProjectCreationData } from '@/types';
import { PublishStatus } from '@/types';

describe('ProjectService - Retrieval', () => {
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

  it('should retrieve all projects', async () => {
    const data: ProjectCreationData = {
      title: 'Test Project 1',
      idea: 'Test idea 1',
      style: 'Fantasy',
    };

    const data2: ProjectCreationData = {
      title: 'Test Project 2',
      idea: 'Test idea 2',
      style: 'Fantasy',
    };

    await serviceInstance.create(data);
    await serviceInstance.create(data2);

    const projects = await serviceInstance.getAll();
    expect(projects).toHaveLength(2);
  });

  it('should retrieve project by ID', async () => {
    const data: ProjectCreationData = {
      title: 'Test Project',
      idea: 'Test idea',
      style: 'Fantasy',
    };

    const project = await serviceInstance.create(data);
    const retrieved = await serviceInstance.getById(project.id);

    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(project.id);
  });

  it('should return null for non-existent project', async () => {
    const retrieved = await serviceInstance.getById('non-existent-id');
    expect(retrieved).toBeNull();
  });

  it('should retrieve projects by status', async () => {
    const data: ProjectCreationData = {
      title: 'Test Project',
      idea: 'Test idea',
      style: 'Fantasy',
    };

    const project = await serviceInstance.create(data);
    await serviceInstance.update(project.id, { status: PublishStatus.REVIEW });

    const projects = await serviceInstance.getByStatus(PublishStatus.REVIEW);
    expect(projects).toHaveLength(1);
    expect(projects[0]?.status).toBe(PublishStatus.REVIEW);
  });
});
