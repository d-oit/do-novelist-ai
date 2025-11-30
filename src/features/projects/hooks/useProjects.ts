/**
 * Projects Management Hook
 *
 * Manages project CRUD operations and state
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { ChapterStatus, PublishStatus } from '../../../types';
import { type Project } from '../../../types';
import { projectService } from '../services/projectService';
import {
  type ProjectFilters,
  type ProjectStats,
  type ProjectCreationData,
  type ProjectUpdateData,
} from '../types';

interface ProjectsState {
  // Data
  projects: Project[];
  selectedProject: Project | null;
  stats: ProjectStats | null;

  // UI State
  filters: ProjectFilters;
  isLoading: boolean;
  error: string | null;

  // Actions
  init: () => Promise<void>;
  loadAll: () => Promise<void>;
  loadStats: () => Promise<void>;
  create: (data: ProjectCreationData) => Promise<Project>;
  update: (id: string, data: ProjectUpdateData) => Promise<void>;
  delete: (id: string) => Promise<void>;
  select: (id: string) => void;
  setFilters: (filters: Partial<ProjectFilters>) => void;
  clearError: () => void;
}

export const useProjects = create<ProjectsState>()(
  devtools(
    (set, get) => ({
      // Initial state
      projects: [],
      selectedProject: null,
      stats: null,
      filters: {
        search: '',
        status: 'all',
        sortBy: 'updatedAt',
        sortOrder: 'desc',
      },
      isLoading: false,
      error: null,

      // Initialize
      init: async (): Promise<void> => {
        try {
          await projectService.init();
          await get().loadAll();
          await get().loadStats();
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to initialize projects' });
        }
      },

      // Load all projects
      loadAll: async (): Promise<void> => {
        set({ isLoading: true, error: null });
        try {
          const projects = await projectService.getAll();
          set({ projects, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to load projects',
            isLoading: false,
          });
        }
      },

      // Load project statistics
      loadStats: async (): Promise<void> => {
        try {
          const { projects } = get();
          const stats: ProjectStats = {
            totalProjects: projects.length,
            activeProjects: projects.filter(
              p => p.status === PublishStatus.EDITING || p.status === PublishStatus.DRAFT,
            ).length,
            completedProjects: projects.filter(p => p.status === PublishStatus.PUBLISHED).length,
            totalWords: projects.reduce(
              (sum, p) =>
                sum + p.chapters.reduce((chSum, ch) => chSum + ch.content.split(' ').length, 0),
              0,
            ),
            totalChapters: projects.reduce((sum, p) => sum + p.chapters.length, 0),
            averageProgress:
              projects.length > 0
                ? projects.reduce((sum, p) => {
                    const completed = p.chapters.filter(
                      ch => ch.status === ChapterStatus.COMPLETE,
                    ).length;
                    return (
                      sum + (p.chapters.length > 0 ? (completed / p.chapters.length) * 100 : 0)
                    );
                  }, 0) / projects.length
                : 0,
          };
          set({ stats });
        } catch (error) {
          console.error('Failed to calculate stats:', error);
        }
      },

      // Create new project
      create: async (data: ProjectCreationData): Promise<Project> => {
        set({ isLoading: true, error: null });
        try {
          const project = await projectService.create(data);
          set(state => ({
            projects: [project, ...state.projects],
            selectedProject: project,
            isLoading: false,
          }));
          await get().loadStats();
          return project;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to create project',
            isLoading: false,
          });
          throw error;
        }
      },

      // Update project
      update: async (id: string, data: ProjectUpdateData): Promise<void> => {
        set({ isLoading: true, error: null });
        try {
          await projectService.update(id, data);
          set(state => ({
            projects: state.projects.map(p =>
              p.id === id ? ({ ...p, ...data, updatedAt: Date.now() } as unknown as Project) : p,
            ),
            selectedProject:
              state.selectedProject?.id === id
                ? ({
                    ...state.selectedProject,
                    ...data,
                    updatedAt: Date.now(),
                  } as unknown as Project)
                : state.selectedProject,
            isLoading: false,
          }));
          await get().loadStats();
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update project',
            isLoading: false,
          });
          throw error;
        }
      },

      // Delete project
      delete: async (id: string): Promise<void> => {
        set({ isLoading: true, error: null });
        try {
          await projectService.delete(id);
          set(state => ({
            projects: state.projects.filter(p => p.id !== id),
            selectedProject: state.selectedProject?.id === id ? null : state.selectedProject,
            isLoading: false,
          }));
          await get().loadStats();
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to delete project',
            isLoading: false,
          });
          throw error;
        }
      },

      // Select project
      select: (id: string): void => {
        const project = get().projects.find(p => p.id === id);
        set({ selectedProject: project ?? null });
      },

      // Update filters
      setFilters: (newFilters: Partial<ProjectFilters>): void => {
        set(state => ({
          filters: { ...state.filters, ...newFilters },
        }));
      },

      // Clear error
      clearError: (): void => {
        set({ error: null });
      },
    }),
    { name: 'ProjectsStore' },
  ),
);

/**
 * Selector: Get filtered and sorted projects
 */
export const selectFilteredProjects = (state: ProjectsState): Project[] => {
  let filtered = [...state.projects];

  // Apply search filter
  if (state.filters.search) {
    const search = state.filters.search.toLowerCase();
    filtered = filtered.filter(
      p => p.title.toLowerCase().includes(search) || p.idea.toLowerCase().includes(search),
    );
  }

  // Apply status filter
  if (state.filters.status !== 'all') {
    const statusMap: Record<string, PublishStatus> = {
      active: PublishStatus.EDITING,
      draft: PublishStatus.DRAFT,
      completed: PublishStatus.PUBLISHED,
    };
    const targetStatus = statusMap[state.filters.status];
    if (targetStatus != null) {
      filtered = filtered.filter(p => p.status === targetStatus);
    }
  }

  // Apply sorting
  filtered.sort((a, b) => {
    const { sortBy, sortOrder } = state.filters;
    let comparison = 0;

    switch (sortBy) {
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'createdAt':
        comparison = a.createdAt.getTime() - b.createdAt.getTime();
        break;
      case 'updatedAt':
        comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
        break;
      case 'progress':
        const progressA =
          a.chapters.length > 0
            ? a.chapters.filter(ch => ch.status === ChapterStatus.COMPLETE).length /
              a.chapters.length
            : 0;
        const progressB =
          b.chapters.length > 0
            ? b.chapters.filter(ch => ch.status === ChapterStatus.COMPLETE).length /
              b.chapters.length
            : 0;
        comparison = progressA - progressB;
        break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return filtered;
};
