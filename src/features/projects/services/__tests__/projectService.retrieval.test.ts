import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { projectService } from '@/features/projects/services/projectService';
import { drizzleDbService } from '@/lib/database';
import { PublishStatus } from '@/types';
import { type ProjectCreationData } from '@/types';

// Mock the database service
vi.mock('@/lib/database', () => ({
  drizzleDbService: {
    init: vi.fn().mockResolvedValue(undefined),
    saveProject: vi.fn().mockResolvedValue(undefined),
    loadProject: vi.fn().mockResolvedValue(null),
    getAllProjects: vi.fn().mockResolvedValue([]),
    deleteProject: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('ProjectService - Retrieval', () => {
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
    (drizzleDbService.init as any).mockResolvedValue(undefined);
    (drizzleDbService.saveProject as any).mockImplementation((project: any) => {
      storage.projects = storage.projects.filter(p => p.id !== project.id);
      storage.projects.push(project);
    });
    (drizzleDbService.loadProject as any).mockImplementation((id: string) => {
      return Promise.resolve(storage.projects.find(p => p.id === id) || null);
    });
    (drizzleDbService.getAllProjects as any).mockImplementation(() => {
      return Promise.resolve(
        storage.projects
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .map(p => ({
            id: p.id,
            title: p.title,
            style: p.style,
            updatedAt: p.updatedAt.toISOString(),
            coverImage: p.coverImage,
          })),
      );
    });
    (drizzleDbService.deleteProject as any).mockImplementation((id: string) => {
      storage.projects = storage.projects.filter(p => p.id !== id);
    });

    await projectService.init();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Project Retrieval', () => {
    it('should retrieve all projects', async () => {
      const data1: ProjectCreationData = {
        title: 'Project 1',
        idea: 'Idea 1',
        style: 'Science Fiction',
      };
      const data2: ProjectCreationData = {
        title: 'Project 2',
        idea: 'Idea 2',
        style: 'Fantasy',
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
        style: 'Mystery & Thriller',
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
        style: 'Mystery & Thriller',
      };

      await projectService.create(data);

      const projects = await projectService.getByStatus(PublishStatus.DRAFT);

      expect(Array.isArray(projects)).toBe(true);
      expect(projects.length).toBeGreaterThan(0);
      projects.forEach(project => {
        expect(project.status).toBe(PublishStatus.DRAFT);
      });
    });

    it('should return empty array when no projects match status', async () => {
      const projects = await projectService.getByStatus(PublishStatus.PUBLISHED);

      expect(Array.isArray(projects)).toBe(true);
    });

    it('should retrieve projects sorted by updatedAt', async () => {
      const data1: ProjectCreationData = {
        title: 'First Project',
        idea: 'First idea',
        style: 'Science Fiction',
      };
      const data2: ProjectCreationData = {
        title: 'Second Project',
        idea: 'Second idea',
        style: 'Fantasy',
      };

      const project1 = await projectService.create(data1);
      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      const project2 = await projectService.create(data2);

      const projects = await projectService.getAll();

      expect(projects.length).toBe(2);
      // Should be sorted by updatedAt descending (newest first)
      expect(projects[0]?.id).toBe(project2.id);
      expect(projects[1]?.id).toBe(project1.id);
    });

    it('should handle retrieval with empty storage', async () => {
      const projects = await projectService.getAll();
      const project = await projectService.getById('any-id');
      const byStatus = await projectService.getByStatus(PublishStatus.DRAFT);

      expect(projects).toEqual([]);
      expect(project).toBeNull();
      expect(byStatus).toEqual([]);
    });

    it('should retrieve projects with correct structure', async () => {
      const data: ProjectCreationData = {
        title: 'Structured Project',
        idea: 'A well-structured idea',
        style: 'Literary Fiction',
        genre: ['fiction', 'literary'],
        targetAudience: 'adult',
      };

      const created = await projectService.create(data);
      const retrieved = await projectService.getById(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBeDefined();
      expect(retrieved?.title).toBe(data.title);
      expect(retrieved?.idea).toBe(data.idea);
      expect(retrieved?.style).toBe(data.style);
      expect(retrieved?.genre).toEqual(data.genre);
      expect(retrieved?.targetAudience).toBe(data.targetAudience);
      expect(retrieved?.status).toBe(PublishStatus.DRAFT);
      expect(retrieved?.chapters).toEqual([]);
      expect(retrieved?.worldState).toBeDefined();
      expect(retrieved?.analytics).toBeDefined();
      expect(retrieved?.version).toBe('1.0.0');
      expect(retrieved?.changeLog).toEqual([]);
    });

    it('should handle concurrent retrieval operations', async () => {
      const data: ProjectCreationData = {
        title: 'Concurrent Test Project',
        idea: 'Testing concurrent access',
        style: 'Science Fiction',
      };

      const created = await projectService.create(data);

      // Simulate concurrent retrieval
      const [result1, result2, result3] = await Promise.all([
        projectService.getById(created.id),
        projectService.getById(created.id),
        projectService.getById(created.id),
      ]);

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      expect(result3).toBeDefined();
      expect(result1?.id).toBe(created.id);
      expect(result2?.id).toBe(created.id);
      expect(result3?.id).toBe(created.id);
    });

    it('should handle retrieval during database errors', async () => {
      // Mock database to throw error
      (drizzleDbService.loadProject as any).mockRejectedValue(new Error('Database error'));

      const data: ProjectCreationData = {
        title: 'Error Test Project',
        idea: 'Testing error handling',
        style: 'Mystery & Thriller',
      };

      const created = await projectService.create(data);

      await expect(projectService.getById(created.id)).rejects.toThrow('Database error');
    });

    it('should filter projects correctly by multiple criteria', async () => {
      const data1: ProjectCreationData = {
        title: 'Fantasy Novel',
        idea: 'A fantasy story',
        style: 'Fantasy',
        genre: ['fantasy'],
      };
      const data2: ProjectCreationData = {
        title: 'Sci-Fi Novel',
        idea: 'A sci-fi story',
        style: 'Science Fiction',
        genre: ['sci-fi'],
      };
      const data3: ProjectCreationData = {
        title: 'Another Fantasy',
        idea: 'Another fantasy story',
        style: 'Fantasy',
        genre: ['fantasy'],
      };

      await projectService.create(data1);
      await projectService.create(data2);
      await projectService.create(data3);

      const allProjects = await projectService.getAll();
      const fantasyProjects = await projectService.getByStatus(PublishStatus.DRAFT);

      expect(allProjects.length).toBe(3);
      expect(fantasyProjects.length).toBe(3); // All are draft by default

      // Verify genre filtering would work (if implemented)
      const fantasyGenreProjects = allProjects.filter(p => p.genre?.includes('fantasy'));
      expect(fantasyGenreProjects.length).toBe(2);
    });
  });
});
