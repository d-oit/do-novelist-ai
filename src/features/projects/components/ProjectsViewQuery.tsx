/**
 * Projects View with React Query
 *
 * Modern implementation using React Query for data fetching
 * This demonstrates the migration from Zustand to React Query
 */

import { Loader2, Plus, Search } from 'lucide-react';
import React, { useState, useMemo } from 'react';

import {
  useProjectsQuery,
  useProjectStatsQuery,
  useDeleteProjectMutation,
} from '@/features/projects/hooks/useProjectsQuery';
import type { ProjectFilters } from '@/features/projects/types';
import { logger } from '@/lib/logging/logger';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import type { Project } from '@/types';

interface ProjectsViewQueryProps {
  onCreateProject: () => void;
  onSelectProject: (project: Project) => void;
}

export const ProjectsViewQuery: React.FC<ProjectsViewQueryProps> = ({
  onCreateProject,
  onSelectProject,
}) => {
  const [filters, setFilters] = useState<ProjectFilters>({
    search: '',
    status: 'all',
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  });

  // Fetch projects with React Query
  const { data: projects = [], isLoading, error, refetch } = useProjectsQuery();
  const { data: stats } = useProjectStatsQuery();
  const deleteProjectMutation = useDeleteProjectMutation();

  // Filter and sort projects client-side (can be moved to server-side later)
  const filteredProjects = useMemo(() => {
    let filtered = [...projects];

    // Search filter
    if (filters.search) {
      const query = filters.search.toLowerCase();
      filtered = filtered.filter(
        p =>
          p.title.toLowerCase().includes(query) ||
          p.idea?.toLowerCase().includes(query) ||
          p.style?.toLowerCase().includes(query),
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      // Map filter status to PublishStatus enum values
      const statusMap: Record<string, string> = {
        draft: 'Draft',
        active: 'Draft',
        completed: 'Published',
        archived: 'Review',
      };
      const mappedStatus = statusMap[filters.status] || filters.status;
      filtered = filtered.filter(p => p.status === mappedStatus);
    }

    // Sort
    filtered.sort((a, b) => {
      const aValue = a[filters.sortBy as keyof Project];
      const bValue = b[filters.sortBy as keyof Project];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return filters.sortOrder === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return filters.sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

    return filtered;
  }, [projects, filters]);

  const handleDeleteProject = async (projectId: string): Promise<void> => {
    if (!confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      await deleteProjectMutation.mutateAsync(projectId);
      logger.info('Project deleted successfully', { component: 'ProjectsViewQuery', projectId });
    } catch (error) {
      logger.error('Failed to delete project', { component: 'ProjectsViewQuery', error });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className='flex min-h-[calc(100vh-4rem)] flex-col gap-6 bg-background p-8'>
        <div className='mb-8 text-center'>
          <Skeleton className='mx-auto h-12 w-64' />
          <Skeleton className='mx-auto mt-3 h-6 w-96' />
        </div>
        <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className='h-64 w-full' />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className='flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-background p-8'>
        <div className='max-w-md text-center'>
          <h2 className='mb-2 text-xl font-semibold text-destructive'>Failed to Load Projects</h2>
          <p className='mb-4 text-muted-foreground'>
            {error instanceof Error ? error.message : 'An unexpected error occurred.'}
          </p>
          <Button onClick={() => void refetch()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className='flex min-h-[calc(100vh-4rem)] flex-col gap-6 bg-background p-8'>
      {/* Header */}
      <div className='mb-8 text-center'>
        <h1 className='mb-3 text-4xl font-bold tracking-tight text-foreground'>Your Projects</h1>
        <p className='text-lg text-muted-foreground'>
          Manage your writing projects powered by GOAP AI
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
          <Card className='p-4'>
            <div className='text-sm text-muted-foreground'>Total Projects</div>
            <div className='text-2xl font-bold'>{stats.totalProjects}</div>
          </Card>
          <Card className='p-4'>
            <div className='text-sm text-muted-foreground'>Active Projects</div>
            <div className='text-2xl font-bold'>{stats.activeProjects}</div>
          </Card>
          <Card className='p-4'>
            <div className='text-sm text-muted-foreground'>Total Chapters</div>
            <div className='text-2xl font-bold'>{stats.totalChapters}</div>
          </Card>
          <Card className='p-4'>
            <div className='text-sm text-muted-foreground'>Total Words</div>
            <div className='text-2xl font-bold'>{stats.totalWords.toLocaleString()}</div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
          <input
            type='text'
            placeholder='Search projects...'
            value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value })}
            className='w-full rounded-md border border-input bg-background py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'
          />
        </div>
        <Button onClick={onCreateProject} className='whitespace-nowrap'>
          <Plus className='mr-2 h-4 w-4' />
          New Project
        </Button>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className='flex flex-col items-center justify-center py-16 text-center'>
          <p className='mb-4 text-lg text-muted-foreground'>No projects found</p>
          <Button onClick={onCreateProject}>
            <Plus className='mr-2 h-4 w-4' />
            Create Your First Project
          </Button>
        </div>
      ) : (
        <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {filteredProjects.map(project => (
            <Card
              key={project.id}
              className='cursor-pointer transition-all hover:shadow-lg'
              onClick={() => onSelectProject(project)}
            >
              <div className='p-6'>
                <h3 className='mb-2 text-xl font-semibold text-foreground'>{project.title}</h3>
                <p className='mb-4 line-clamp-2 text-sm text-muted-foreground'>
                  {project.idea || 'No description'}
                </p>
                <div className='flex items-center justify-between text-xs text-muted-foreground'>
                  <span>{project.chapters?.length || 0} chapters</span>
                  <span className='capitalize'>{project.status}</span>
                </div>
                <div className='mt-4 flex gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={e => {
                      e.stopPropagation();
                      void handleDeleteProject(project.id);
                    }}
                    disabled={deleteProjectMutation.isPending}
                  >
                    {deleteProjectMutation.isPending ? (
                      <Loader2 className='h-4 w-4 animate-spin' />
                    ) : (
                      'Delete'
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
