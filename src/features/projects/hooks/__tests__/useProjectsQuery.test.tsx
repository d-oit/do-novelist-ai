/**
 * Tests for React Query Projects Hooks
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { FC, ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  useProjectsQuery,
  useProjectQuery,
  useProjectStatsQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
} from '@/features/projects/hooks/useProjectsQuery';
import { projectService } from '@/features/projects/services/projectService';
import type { Project } from '@/types';
import { PublishStatus } from '@/types';

// Mock the project service
vi.mock('@/features/projects/services/projectService', () => ({
  projectService: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock logger
vi.mock('@/lib/logging/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

const mockProject: Project = {
  id: 'test-project-1',
  title: 'Test Project',
  idea: 'A test project idea',
  style: 'General Fiction',
  chapters: [],
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
  status: PublishStatus.DRAFT,
  language: 'en',
  targetWordCount: 50000,
  settings: {
    autoSave: true,
    fontSize: 'medium',
  },
  genre: ['Fiction'],
  targetAudience: 'adult',
  contentWarnings: [],
  keywords: [],
  synopsis: 'A test project synopsis',
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
    id: 'timeline-1',
    projectId: 'test-project-1',
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

describe('React Query Projects Hooks', () => {
  let queryClient: QueryClient;
  let wrapper: FC<{ children: ReactNode }>;

  beforeEach(() => {
    // Create a new QueryClient for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Create wrapper with QueryClientProvider
    wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('useProjectsQuery', () => {
    it('should fetch all projects successfully', async () => {
      const mockProjects = [mockProject];
      vi.mocked(projectService.getAll).mockResolvedValue(mockProjects);

      const { result } = renderHook(() => useProjectsQuery(), { wrapper });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockProjects);
      expect(projectService.getAll).toHaveBeenCalledTimes(1);
    });

    it('should handle fetch errors', async () => {
      const error = new Error('Failed to fetch projects');
      vi.mocked(projectService.getAll).mockRejectedValue(error);

      const { result } = renderHook(() => useProjectsQuery(), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });

    it('should cache results', async () => {
      const mockProjects = [mockProject];
      vi.mocked(projectService.getAll).mockResolvedValue(mockProjects);

      const { result: result1 } = renderHook(() => useProjectsQuery(), { wrapper });
      await waitFor(() => expect(result1.current.isSuccess).toBe(true));

      // Second render should use cache
      const { result: result2 } = renderHook(() => useProjectsQuery(), { wrapper });
      expect(result2.current.data).toEqual(mockProjects);
      expect(result2.current.isLoading).toBe(false);

      // Service should only be called once due to caching
      expect(projectService.getAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('useProjectQuery', () => {
    it('should fetch single project by ID', async () => {
      vi.mocked(projectService.getById).mockResolvedValue(mockProject);

      const { result } = renderHook(() => useProjectQuery('test-project-1'), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockProject);
      expect(projectService.getById).toHaveBeenCalledWith('test-project-1');
    });

    it('should not fetch if projectId is null', async () => {
      const { result } = renderHook(() => useProjectQuery(null), { wrapper });

      expect(result.current.isLoading).toBe(false);
      expect(projectService.getById).not.toHaveBeenCalled();
    });
  });

  describe('useProjectStatsQuery', () => {
    it('should calculate project statistics', async () => {
      const mockProjects = [
        { ...mockProject, status: PublishStatus.DRAFT, chapters: [{ status: 'complete' }] },
        { ...mockProject, id: 'project-2', status: PublishStatus.PUBLISHED, chapters: [] },
      ] as Project[];

      vi.mocked(projectService.getAll).mockResolvedValue(mockProjects);

      const { result } = renderHook(() => useProjectStatsQuery(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toMatchObject({
        totalProjects: 2,
        activeProjects: 1,
        completedProjects: 1,
      });
    });
  });

  describe('useCreateProjectMutation', () => {
    it('should create project and invalidate cache', async () => {
      const newProject = { ...mockProject, id: 'new-project' };
      vi.mocked(projectService.create).mockResolvedValue(newProject);

      const { result } = renderHook(() => useCreateProjectMutation(), { wrapper });

      await result.current.mutateAsync({
        title: 'New Project',
        idea: 'A new project idea',
        style: 'General Fiction',
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(projectService.create).toHaveBeenCalled();
    });

    it('should handle creation errors', async () => {
      const error = new Error('Failed to create project');
      vi.mocked(projectService.create).mockRejectedValue(error);

      const { result } = renderHook(() => useCreateProjectMutation(), { wrapper });

      await expect(
        result.current.mutateAsync({
          title: 'New Project',
          idea: 'A new project idea',
          style: 'General Fiction',
        }),
      ).rejects.toThrow('Failed to create project');
    });
  });

  describe('useUpdateProjectMutation', () => {
    it('should update project with optimistic updates', async () => {
      // First, populate cache with project
      vi.mocked(projectService.getById).mockResolvedValue(mockProject);
      const { result: queryResult } = renderHook(() => useProjectQuery('test-project-1'), {
        wrapper,
      });
      await waitFor(() => expect(queryResult.current.isSuccess).toBe(true));

      // Mock update
      vi.mocked(projectService.update).mockResolvedValue();

      const { result: mutationResult } = renderHook(() => useUpdateProjectMutation(), { wrapper });

      await mutationResult.current.mutateAsync({
        id: 'test-project-1',
        data: { title: 'Updated Title' },
      });

      await waitFor(() => expect(mutationResult.current.isSuccess).toBe(true));

      expect(projectService.update).toHaveBeenCalledWith('test-project-1', { title: 'Updated Title' });
    });
  });

  describe('useDeleteProjectMutation', () => {
    it('should delete project and update cache', async () => {
      // First, populate cache
      vi.mocked(projectService.getAll).mockResolvedValue([mockProject]);
      const { result: queryResult } = renderHook(() => useProjectsQuery(), { wrapper });
      await waitFor(() => expect(queryResult.current.isSuccess).toBe(true));

      // Mock delete
      vi.mocked(projectService.delete).mockResolvedValue();

      const { result: mutationResult } = renderHook(() => useDeleteProjectMutation(), { wrapper });

      await mutationResult.current.mutateAsync('test-project-1');

      await waitFor(() => expect(mutationResult.current.isSuccess).toBe(true));

      expect(projectService.delete).toHaveBeenCalledWith('test-project-1');
    });

    it('should rollback on error', async () => {
      // First, populate cache
      vi.mocked(projectService.getAll).mockResolvedValue([mockProject]);
      const { result: queryResult } = renderHook(() => useProjectsQuery(), { wrapper });
      await waitFor(() => expect(queryResult.current.isSuccess).toBe(true));

      // Mock delete failure
      const error = new Error('Failed to delete');
      vi.mocked(projectService.delete).mockRejectedValue(error);

      const { result: mutationResult } = renderHook(() => useDeleteProjectMutation(), { wrapper });

      await expect(mutationResult.current.mutateAsync('test-project-1')).rejects.toThrow('Failed to delete');

      // Cache should still have the project after rollback
      expect(queryResult.current.data).toEqual([mockProject]);
    });
  });
});
