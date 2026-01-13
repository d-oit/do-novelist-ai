/**
 * React Query Hooks for Projects
 *
 * Modern data fetching with caching, background updates, and optimistic updates
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { projectService } from '@/features/projects/services/projectService';
import {
  type ProjectCreationData,
  type ProjectUpdateData,
  type ProjectStats,
} from '@/features/projects/types';
import { logger } from '@/lib/logging/logger';
import { queryKeys } from '@/lib/react-query';
import type { Project } from '@/types';

/**
 * Fetch all projects with caching
 */
export function useProjectsQuery() {
  return useQuery({
    queryKey: queryKeys.projects.lists(),
    queryFn: async () => {
      logger.debug('Fetching all projects', { component: 'useProjectsQuery' });
      return await projectService.getAll();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Fetch a single project by ID
 */
export function useProjectQuery(projectId: string | null) {
  return useQuery({
    queryKey: queryKeys.projects.detail(projectId || ''),
    queryFn: async () => {
      if (!projectId) return null;
      logger.debug('Fetching project by ID', { component: 'useProjectQuery', projectId });
      return await projectService.getById(projectId);
    },
    enabled: !!projectId, // Only run query if projectId exists
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Fetch project statistics
 */
export function useProjectStatsQuery() {
  return useQuery({
    queryKey: queryKeys.projects.stats(),
    queryFn: async (): Promise<ProjectStats> => {
      logger.debug('Fetching project stats', { component: 'useProjectStatsQuery' });
      const projects = await projectService.getAll();

      const totalProjects = projects.length;
      const totalChapters = projects.reduce((sum, p) => sum + (p.chapters?.length || 0), 0);
      const totalWords = projects.reduce((sum, p) => {
        const words = p.chapters?.reduce(
          (chapterSum, ch) => chapterSum + (ch.content?.split(/\s+/).length || 0),
          0,
        );
        return sum + (words || 0);
      }, 0);

      const activeProjects = projects.filter(p => p.status === 'Draft').length;
      const completedProjects = projects.filter(p => p.status === 'Published').length;
      const averageProgress =
        totalProjects > 0
          ? projects.reduce((sum, p) => {
              const chaptersCompleted =
                p.chapters?.filter(ch => ch.status === 'complete').length || 0;
              const totalChapters = p.chapters?.length || 0;
              return sum + (totalChapters > 0 ? (chaptersCompleted / totalChapters) * 100 : 0);
            }, 0) / totalProjects
          : 0;

      return {
        totalProjects,
        totalChapters,
        totalWords,
        activeProjects,
        completedProjects,
        averageProgress,
      };
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Create a new project with optimistic updates
 */
export function useCreateProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ProjectCreationData) => {
      logger.debug('Creating project', { component: 'useCreateProjectMutation', data });
      return await projectService.create(data);
    },
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.projects.lists() });

      // Snapshot previous value
      const previousProjects = queryClient.getQueryData<Project[]>(queryKeys.projects.lists());

      // Optimistically update to the new value (optional - can be complex)
      // We'll skip this for now and just show loading state

      return { previousProjects };
    },
    onError: (err, _newProject, context) => {
      // Rollback on error
      if (context?.previousProjects) {
        queryClient.setQueryData(queryKeys.projects.lists(), context.previousProjects);
      }
      logger.error('Failed to create project', {
        component: 'useCreateProjectMutation',
        error: err,
      });
    },
    onSuccess: data => {
      logger.info('Project created successfully', {
        component: 'useCreateProjectMutation',
        projectId: data.id,
      });
      // Invalidate and refetch
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects.stats() });
    },
  });
}

/**
 * Update an existing project with optimistic updates
 */
export function useUpdateProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ProjectUpdateData }) => {
      logger.debug('Updating project', { component: 'useUpdateProjectMutation', projectId: id });
      await projectService.update(id, data);
      return { id, data };
    },
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.projects.detail(id) });
      await queryClient.cancelQueries({ queryKey: queryKeys.projects.lists() });

      // Snapshot previous values
      const previousProject = queryClient.getQueryData<Project>(queryKeys.projects.detail(id));
      const previousProjects = queryClient.getQueryData<Project[]>(queryKeys.projects.lists());

      // Optimistically update the cache
      if (previousProject) {
        queryClient.setQueryData<Project>(queryKeys.projects.detail(id), {
          ...previousProject,
          ...data,
        });
      }

      if (previousProjects) {
        queryClient.setQueryData<Project[]>(
          queryKeys.projects.lists(),
          previousProjects.map(p => (p.id === id ? { ...p, ...data } : p)),
        );
      }

      return { previousProject, previousProjects };
    },
    onError: (err, { id }, context) => {
      // Rollback on error
      if (context?.previousProject) {
        queryClient.setQueryData(queryKeys.projects.detail(id), context.previousProject);
      }
      if (context?.previousProjects) {
        queryClient.setQueryData(queryKeys.projects.lists(), context.previousProjects);
      }
      logger.error('Failed to update project', {
        component: 'useUpdateProjectMutation',
        error: err,
      });
    },
    onSuccess: ({ id }) => {
      logger.info('Project updated successfully', {
        component: 'useUpdateProjectMutation',
        projectId: id,
      });
      // Invalidate to ensure consistency
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects.stats() });
    },
  });
}

/**
 * Delete a project
 */
export function useDeleteProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      logger.debug('Deleting project', { component: 'useDeleteProjectMutation', projectId });
      await projectService.delete(projectId);
      return projectId;
    },
    onMutate: async projectId => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.projects.lists() });

      // Snapshot previous value
      const previousProjects = queryClient.getQueryData<Project[]>(queryKeys.projects.lists());

      // Optimistically update - remove the project
      if (previousProjects) {
        queryClient.setQueryData<Project[]>(
          queryKeys.projects.lists(),
          previousProjects.filter(p => p.id !== projectId),
        );
      }

      return { previousProjects };
    },
    onError: (err, _projectId, context) => {
      // Rollback on error
      if (context?.previousProjects) {
        queryClient.setQueryData(queryKeys.projects.lists(), context.previousProjects);
      }
      logger.error('Failed to delete project', {
        component: 'useDeleteProjectMutation',
        error: err,
      });
    },
    onSuccess: projectId => {
      logger.info('Project deleted successfully', {
        component: 'useDeleteProjectMutation',
        projectId,
      });
      // Clean up cache
      void queryClient.removeQueries({ queryKey: queryKeys.projects.detail(projectId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects.stats() });
    },
  });
}
