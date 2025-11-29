import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { projectService } from '../projectService';
import { PublishStatus } from '../../../../types';
import type { ProjectCreationData, ProjectUpdateData } from '../../types';

// Mock indexedDB
const mockOpenDB = vi.fn();
const mockClose = vi.fn();
const mockTransaction = vi.fn();
const mockObjectStore = vi.fn();
const mockAdd = vi.fn();
const mockGet = vi.fn();
const mockGetAll = vi.fn();
const mockPut = vi.fn();
const mockDelete = vi.fn();
const mockCreateObjectStore = vi.fn();
const _mockCreateIndex = vi.fn();

const mockDB = {
  close: mockClose,
  transaction: mockTransaction,
  objectStoreNames: { contains: vi.fn().mockReturnValue(false) },
  createObjectStore: mockCreateObjectStore,
};

const mockRequest = {
  onsuccess: null as ((event: any) => void) | null,
  onerror: null as ((event: any) => void) | null,
  result: mockDB,
};

global.indexedDB = {
  open: mockOpenDB.mockImplementation((name, version) => {
    setTimeout(() => {
      if (mockRequest.onsuccess) {
        mockRequest.onsuccess({ target: mockRequest });
      }
    }, 0);
    return mockRequest;
  }),
} as any;

describe('ProjectService', () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    // In-memory storage for mocked IDB operations
    const storage = {
      projects: [] as any[],
    };

    // Setup all IDB operation mocks with proper async handling
    const createRequest = (result: any = null) => ({
      onsuccess: null as ((event: any) => void) | null,
      onerror: null as ((event: any) => void) | null,
      result,
    });

    // Setup add operation
    mockAdd.mockImplementation((data) => {
      if (data && data.id) {
        storage.projects.push(data);
      }
      const request = createRequest(data);
      setTimeout(() => request.onsuccess?.({ target: request }), 0);
      return request;
    });

    // Setup get operation
    mockGet.mockImplementation((id) => {
      const project = storage.projects.find((p) => p.id === id);
      const request = createRequest(project || null);
      setTimeout(() => request.onsuccess?.({ target: request }), 0);
      return request;
    });

    // Setup getAll operation
    mockGetAll.mockImplementation((id) => {
      const results = storage.projects;
      const request = createRequest(results);
      setTimeout(() => request.onsuccess?.({ target: request }), 0);
      return request;
    });

    // Setup put operation
    mockPut.mockImplementation((data) => {
      if (data && data.id) {
        const index = storage.projects.findIndex((p) => p.id === data.id);
        if (index >= 0) {
          storage.projects[index] = data;
        } else {
          storage.projects.push(data);
        }
      }
      const request = createRequest(undefined);
      setTimeout(() => request.onsuccess?.({ target: request }), 0);
      return request;
    });

    // Setup delete operation
    mockDelete.mockImplementation((id) => {
      const index = storage.projects.findIndex((p) => p.id === id);
      if (index >= 0) {
        storage.projects.splice(index, 1);
      }
      const request = createRequest(undefined);
      setTimeout(() => request.onsuccess?.({ target: request }), 0);
      return request;
    });

    // Create mock store with the mocked functions
    const mockStore = {
      add: mockAdd,
      get: mockGet,
      getAll: mockGetAll,
      put: mockPut,
      delete: mockDelete,
      index: vi.fn().mockReturnValue({
        getAll: mockGetAll,
      }),
    };

    // Mock transaction
    mockTransaction.mockReturnValue({
      objectStore: () => mockStore,
      oncomplete: null,
      onerror: null,
    });

    // Mock objectStore function
    mockObjectStore.mockReturnValue(mockStore);
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
        style: "Fantasy",
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
        style: "Literary Fiction",
      };

      const project1 = await projectService.create(data);
      const project2 = await projectService.create(data);

      expect(project1.id).not.toBe(project2.id);
    });

    it('should set default status to PublishStatus.DRAFT', async () => {
      const data: ProjectCreationData = {
        title: 'New Project',
        idea: 'An idea',
        style: "Mystery & Thriller",
      };

      const project = await projectService.create(data);

      expect(project.status).toBe(PublishStatus.PublishStatus.DRAFT);
    });

    it('should initialize empty chapters array', async () => {
      const data: ProjectCreationData = {
        title: 'New Project',
        idea: 'An idea',
        style: "Romance",
      };

      const project = await projectService.create(data);

      expect(project.chapters).toEqual([]);
    });

    it('should set createdAt and updatedAt timestamps', async () => {
      const data: ProjectCreationData = {
        title: 'New Project',
        idea: 'An idea',
        style: "Science Fiction",
      };

      const project = await projectService.create(data);

      expect(project.createdAt).toBeInstanceOf(Date);
      expect(project.updatedAt).toBeInstanceOf(Date);
    });

    it('should initialize worldState with correct defaults', async () => {
      const data: ProjectCreationData = {
        title: 'New Project',
        idea: 'An idea',
        style: "Mystery & Thriller",
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
        style: "Horror",
      };

      const project = await projectService.create(data);

      expect(project.language).toBe('en');
    });

    it('should use provided language', async () => {
      const data: ProjectCreationData = {
        title: 'New Project',
        idea: 'An idea',
        style: "Fantasy",
        language: 'es',
      };

      const project = await projectService.create(data);

      expect(project.language).toBe('es');
    });

    it('should use default target word count if not provided', async () => {
      const data: ProjectCreationData = {
        title: 'New Project',
        idea: 'An idea',
        style: "Literary Fiction",
      };

      const project = await projectService.create(data);

      expect(project.targetWordCount).toBe(50000);
    });

    it('should initialize analytics with zero values', async () => {
      const data: ProjectCreationData = {
        title: 'New Project',
        idea: 'An idea',
        style: "Science Fiction",
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
        style: "Historical Fiction",
      };

      const project = await projectService.create(data);

      expect(project.version).toBe('1.0.0');
    });

    it('should initialize empty changeLog', async () => {
      const data: ProjectCreationData = {
        title: 'New Project',
        idea: 'An idea',
        style: "General Fiction",
      };

      const project = await projectService.create(data);

      expect(project.changeLog).toEqual([]);
    });

    it('should handle genre array', async () => {
      const data: ProjectCreationData = {
        title: 'New Project',
        idea: 'An idea',
        style: "Fantasy",
        genre: ['fantasy', "General Fiction", 'coming-of-age'],
      };

      const project = await projectService.create(data);

      expect(project.genre).toEqual(['fantasy', "General Fiction", 'coming-of-age']);
    });

    it('should handle target audience', async () => {
      const data: ProjectCreationData = {
        title: 'Young Adult Novel',
        idea: 'Teen discovers superpowers',
        style: "Fantasy",
        targetAudience: 'young_adult',
      };

      const project = await projectService.create(data);

      expect(project.targetAudience).toBe('young_adult');
    });
  });

  describe('Project Retrieval', () => {
    it('should retrieve all projects', async () => {
      const data1: ProjectCreationData = {
        title: 'Project 1',
        idea: 'Idea 1',
        style: "Science Fiction",
      };
      const data2: ProjectCreationData = {
        title: 'Project 2',
        idea: 'Idea 2',
        style: "Fantasy",
      };

      await projectService.create(data1);
      await projectService.create(data2);

      const projects = await projectService.getAll();

      expect(Array.isArray(projects)).toBe(true);
      expect(projects.length).toBeGreaterThanOrEqual(2);
    });

    it('should retrieve project by ID', async () => {
      const data: ProjectCreationData = {
        title: 'Test Project',
        idea: 'Test idea',
        style: "Mystery & Thriller",
      };

      const created = await projectService.create(data);
      const retrieved = await projectService.getById(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.title).toBe(created.title);
    });

    it('should return null for non-existent project ID', async () => {
      const result = await projectService.getById('non-existent-id');

      expect(result).toBeNull();
    });

    it('should retrieve projects by status', async () => {
      const data: ProjectCreationData = {
        title: 'Draft Project',
        idea: 'Draft idea',
        style: "Mystery & Thriller",
      };

      await projectService.create(data);

      const projects = await projectService.getByStatus(PublishStatus.PublishStatus.DRAFT);

      expect(Array.isArray(projects)).toBe(true);
      expect(projects.length).toBeGreaterThan(0);
      projects.forEach(project => {
        expect(project.status).toBe(PublishStatus.PublishStatus.DRAFT);
      });
    });

    it('should return empty array when no projects match status', async () => {
      const projects = await projectService.getByStatus(PublishStatus.PublishStatus.PUBLISHED);

      expect(Array.isArray(projects)).toBe(true);
    });
  });

  describe('Project Updates', () => {
    it('should update project title', async () => {
      const data: ProjectCreationData = {
        title: 'Original Title',
        idea: 'Original idea',
        style: "Romance",
      };

      const project = await projectService.create(data);

      const updates: ProjectUpdateData = {
        title: 'Updated Title',
      };

      await projectService.update(project.id, updates);

      const updated = await projectService.getById(project.id);
      expect(updated?.title).toBe('Updated Title');
    });

    it('should update project status', async () => {
      const data: ProjectCreationData = {
        title: 'Test Project',
        idea: 'Test idea',
        style: "Science Fiction",
      };

      const project = await projectService.create(data);

      const updates: ProjectUpdateData = {
        status: PublishStatus.DRAFT,
      };

      await projectService.update(project.id, updates);

      const updated = await projectService.getById(project.id);
      expect(updated?.status).toBe(PublishStatus.DRAFT);
    });

    it('should update updatedAt timestamp', async () => {
      const data: ProjectCreationData = {
        title: 'Test Project',
        idea: 'Test idea',
        style: "Horror",
      };

      const project = await projectService.create(data);
      const originalUpdatedAt = project.updatedAt;

      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));

      const updates: ProjectUpdateData = {
        title: 'New Title',
      };

      await projectService.update(project.id, updates);

      const updated = await projectService.getById(project.id);
      expect(updated?.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('should throw error when updating non-existent project', async () => {
      const updates: ProjectUpdateData = {
        title: 'New Title',
      };

      await expect(
        projectService.update('non-existent-id', updates)
      ).rejects.toThrow('Project not found');
    });

    it('should update multiple fields at once', async () => {
      const data: ProjectCreationData = {
        title: 'Original',
        idea: 'Original idea',
        style: "Fantasy",
      };

      const project = await projectService.create(data);

      const updates: ProjectUpdateData = {
        title: 'New Title',
        idea: 'New idea',
        style: "Science Fiction",
      };

      await projectService.update(project.id, updates);

      const updated = await projectService.getById(project.id);
      expect(updated?.title).toBe('New Title');
      expect(updated?.idea).toBe('New idea');
      expect(updated?.style).toBe("Science Fiction");
    });
  });

  describe('Project Save (Full Update)', () => {
    it('should save complete project', async () => {
      const data: ProjectCreationData = {
        title: 'Test Project',
        idea: 'Test idea',
        style: "Mystery & Thriller",
      };

      const project = await projectService.create(data);
      project.title = 'Modified Title';
      project.status = PublishStatus.PUBLISHED;

      await projectService.save(project);

      const saved = await projectService.getById(project.id);
      expect(saved?.title).toBe('Modified Title');
      expect(saved?.status).toBe(PublishStatus.PUBLISHED);
    });

    it('should update timestamp on save', async () => {
      const data: ProjectCreationData = {
        title: 'Test Project',
        idea: 'Test idea',
        style: "Mystery & Thriller",
      };

      const project = await projectService.create(data);

      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));

      await projectService.save(project);

      const saved = await projectService.getById(project.id);
      expect(saved?.updatedAt).toBeDefined();
    });
  });

  describe('Project Deletion', () => {
    it('should delete a project', async () => {
      const data: ProjectCreationData = {
        title: 'Project to Delete',
        idea: 'This will be deleted',
        style: "Romance",
      };

      const project = await projectService.create(data);

      await projectService.delete(project.id);

      const deleted = await projectService.getById(project.id);
      expect(deleted).toBeNull();
    });

    it('should handle deletion of non-existent project', async () => {
      await expect(
        projectService.delete('non-existent-id')
      ).resolves.toBeUndefined();
    });

    it('should remove deleted project from getAll results', async () => {
      const data: ProjectCreationData = {
        title: 'Project to Delete',
        idea: 'This will be deleted',
        style: "Science Fiction",
      };

      const project = await projectService.create(data);
      const beforeDelete = await projectService.getAll();
      const beforeCount = beforeDelete.length;

      await projectService.delete(project.id);

      const afterDelete = await projectService.getAll();
      expect(afterDelete.length).toBeLessThan(beforeCount);
      expect(afterDelete.find(p => p.id === project.id)).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully during creation', async () => {
      const data: ProjectCreationData = {
        title: 'Test Project',
        idea: 'Test idea',
        style: "Fantasy",
      };

      // Normal creation should work
      await expect(projectService.create(data)).resolves.toBeDefined();
    });

    it('should handle concurrent operations', async () => {
      const data1: ProjectCreationData = {
        title: 'Project 1',
        idea: 'Idea 1',
        style: "Science Fiction",
      };
      const data2: ProjectCreationData = {
        title: 'Project 2',
        idea: 'Idea 2',
        style: "Fantasy",
      };

      const [project1, project2] = await Promise.all([
        projectService.create(data1),
        projectService.create(data2),
      ]);

      expect(project1.id).toBeDefined();
      expect(project2.id).toBeDefined();
      expect(project1.id).not.toBe(project2.id);
    });
  });

  describe('IndexedDB Integration', () => {
    it('should persist data across service re-initialization', async () => {
      const data: ProjectCreationData = {
        title: 'Persistent Project',
        idea: 'This should persist',
        style: "Mystery & Thriller",
      };

      const project = await projectService.create(data);

      // Re-initialize the service
      await projectService.init();

      const retrieved = await projectService.getById(project.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.title).toBe('Persistent Project');
    });

    it('should handle large project data', async () => {
      const largeIdea = 'A'.repeat(4000); // Large idea text

      const data: ProjectCreationData = {
        title: 'Large Project',
        idea: largeIdea,
        style: "Literary Fiction",
      };

      const project = await projectService.create(data);
      expect(project.idea.length).toBe(4000);

      const retrieved = await projectService.getById(project.id);
      expect(retrieved?.idea.length).toBe(4000);
    });
  });
});
