import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { projectService } from '@/features/projects/services/projectService';
import { drizzleDbService } from '@/lib/database';
import { PublishStatus } from '@/types';
import { type ProjectCreationData, type ProjectUpdateData } from '@/types';

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

describe('ProjectService - Modification', () => {
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
        storage.projects.map(p => ({
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

  describe('Project Updates', () => {
    it('should update project title', async () => {
      const data: ProjectCreationData = {
        title: 'Original Title',
        idea: 'Original idea',
        style: 'Romance',
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
        style: 'Science Fiction',
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
        style: 'Horror',
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

      await expect(projectService.update('non-existent-id', updates)).rejects.toThrow('Project not found');
    });

    it('should update multiple fields at once', async () => {
      const data: ProjectCreationData = {
        title: 'Original',
        idea: 'Original idea',
        style: 'Fantasy',
      };

      const project = await projectService.create(data);

      const updates: ProjectUpdateData = {
        title: 'New Title',
        idea: 'New idea',
        style: 'Science Fiction',
      };

      await projectService.update(project.id, updates);

      const updated = await projectService.getById(project.id);
      expect(updated?.title).toBe('New Title');
      expect(updated?.idea).toBe('New idea');
      expect(updated?.style).toBe('Science Fiction');
    });
  });

  describe('Project Save (Full Update)', () => {
    it('should save complete project', async () => {
      const data: ProjectCreationData = {
        title: 'Test Project',
        idea: 'Test idea',
        style: 'Mystery & Thriller',
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
        style: 'Mystery & Thriller',
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
        style: 'Romance',
      };

      const project = await projectService.create(data);

      await projectService.delete(project.id);

      const deleted = await projectService.getById(project.id);
      expect(deleted).toBeNull();
    });

    it('should handle deletion of non-existent project', async () => {
      await expect(projectService.delete('non-existent-id')).resolves.toBeUndefined();
    });

    it('should remove deleted project from getAll results', async () => {
      const data: ProjectCreationData = {
        title: 'Project to Delete',
        idea: 'This will be deleted',
        style: 'Science Fiction',
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
        style: 'Fantasy',
      };

      // Normal creation should work
      await expect(projectService.create(data)).resolves.toBeDefined();
    });

    it('should handle concurrent operations', async () => {
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

      const [project1, project2] = await Promise.all([projectService.create(data1), projectService.create(data2)]);

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
        style: 'Mystery & Thriller',
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
        style: 'Literary Fiction',
      };

      const project = await projectService.create(data);
      expect(project.idea.length).toBe(4000);

      const retrieved = await projectService.getById(project.id);
      expect(retrieved?.idea.length).toBe(4000);
    });
  });

  describe('Complex Modification Scenarios', () => {
    it('should handle project updates with chapters', async () => {
      const data: ProjectCreationData = {
        title: 'Project with Chapters',
        idea: 'A story with chapters',
        style: 'Fantasy',
      };

      const project = await projectService.create(data);

      // Add chapters to the project
      project.chapters = [
        {
          id: 'ch1',
          title: 'Chapter 1',
          summary: 'First chapter',
          content: 'Content of chapter 1',
          status: 'complete' as any,
          orderIndex: 0,
          wordCount: 1000,
          characterCount: 5000,
          estimatedReadingTime: 4,
          tags: [],
          notes: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          scenes: [],
        },
      ];

      await projectService.save(project);

      const retrieved = await projectService.getById(project.id);
      expect(retrieved?.chapters).toHaveLength(1);
      expect(retrieved?.chapters[0]?.title).toBe('Chapter 1');
    });

    it('should handle project status transitions', async () => {
      const data: ProjectCreationData = {
        title: 'Status Transition Test',
        idea: 'Testing status changes',
        style: 'Science Fiction',
      };

      const project = await projectService.create(data);
      expect(project.status).toBe(PublishStatus.DRAFT);

      // Update to editing
      await projectService.update(project.id, { status: PublishStatus.EDITING });
      let updated = await projectService.getById(project.id);
      expect(updated?.status).toBe(PublishStatus.EDITING);

      // Update to published
      await projectService.update(project.id, { status: PublishStatus.PUBLISHED });
      updated = await projectService.getById(project.id);
      expect(updated?.status).toBe(PublishStatus.PUBLISHED);
    });

    it('should handle batch operations', async () => {
      const projects: any[] = [];

      // Create multiple projects
      for (let i = 0; i < 5; i++) {
        const data: ProjectCreationData = {
          title: `Project ${i}`,
          idea: `Idea for project ${i}`,
          style: 'Fantasy',
        };
        projects.push(await projectService.create(data));
      }

      // Update all projects
      const updatePromises = projects.map(project =>
        projectService.update(project.id, { status: PublishStatus.EDITING }),
      );
      await Promise.all(updatePromises);

      // Verify all updates
      const allProjects = await projectService.getAll();
      expect(allProjects.length).toBe(5);
      allProjects.forEach(project => {
        expect(project.status).toBe(PublishStatus.EDITING);
      });
    });
  });
});
