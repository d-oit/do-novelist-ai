import { Clock, FileText, Folder, MoreVertical, Plus, Star, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { drizzleDbService } from '@/lib/database';
import { logger } from '@/lib/logging/logger';
import { iconButtonTarget } from '@/lib/utils';
import { Skeleton } from '@/shared/components/ui/Skeleton';

import type { Project } from '@shared/types';

interface ProjectsViewProps {
  currentProject: Project;
  onNewProject: () => void;
  onLoadProject: (id: string) => void;
  onNavigate: (view: 'dashboard' | 'projects' | 'settings') => void;
}

const ProjectsView: React.FC<ProjectsViewProps> = ({
  currentProject,
  onNewProject,
  onLoadProject,
  onNavigate,
}) => {
  const [projects, setProjects] = useState<
    { id: string; title: string; style: string; updatedAt: string; coverImage?: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void loadProjects();
  }, [currentProject.id]);

  const loadProjects = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const list = await drizzleDbService.getAllProjects();
      setProjects(list);
    } catch (error) {
      logger.error('Failed to load projects', { component: 'ProjectsView', error });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string): Promise<void> => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this project? This cannot be undone.')) {
      try {
        await drizzleDbService.deleteProject(id);

        // Analytics
        void import('@/lib/analytics').then(({ featureTracking }) => {
          featureTracking.trackFeatureUsage('projects', 'delete_project', { projectId: id });
        });

        await loadProjects();
      } catch (error) {
        logger.error('Failed to delete project', {
          component: 'ProjectsView',
          error,
          projectId: id,
        });
      }
    }
  };

  return (
    <div className='min-h-screen bg-white dark:bg-gray-950'>
      <div className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
        {/* Hero Section */}
        <div className='mb-12 text-center'>
          <h2 className='text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl'>
            My Projects
          </h2>
          <p className='mx-auto mt-3 max-w-2xl text-xl text-gray-500 dark:text-gray-400'>
            Manage your ongoing manuscripts and generated ebooks.
          </p>
        </div>

        {isLoading ? (
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className='h-48 w-full' />
            ))}
          </div>
        ) : (
          <>
            {/* Current Active Project */}
            {currentProject.worldState.hasTitle && (
              <section className='mb-12'>
                <h2 className='mb-4 text-lg font-medium text-gray-900 dark:text-white'>
                  Active Session
                </h2>
                <div
                  onClick={() => onNavigate('dashboard')}
                  className='group cursor-pointer rounded-lg border border-gray-200 bg-white p-6 transition-all hover:shadow-lg dark:border-gray-700 dark:bg-gray-900'
                >
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <div className='mb-2 inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary'>
                        <Star className='mr-1 h-3 w-3' />
                        Open in Editor
                      </div>
                      <h3 className='text-xl font-semibold text-gray-900 transition-colors group-hover:text-primary dark:text-white dark:group-hover:text-primary'>
                        {currentProject.title}
                      </h3>
                      <p className='mt-1 text-gray-500 dark:text-gray-400'>
                        {currentProject.idea ?? 'No description provided.'}
                      </p>
                    </div>
                    <div className='text-right'>
                      <div className='text-2xl font-bold text-gray-900 dark:text-white'>
                        {currentProject.worldState.chaptersCompleted} /{' '}
                        {currentProject.worldState.chaptersCount}
                      </div>
                      <div className='text-sm text-gray-500 dark:text-gray-400'>Chapters</div>
                    </div>
                  </div>
                  <div className='mt-4 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400'>
                    <div className='flex items-center'>
                      <FileText className='mr-1 h-4 w-4' />
                      {currentProject.style}
                    </div>
                    <div className='flex items-center'>
                      <Clock className='mr-1 h-4 w-4' />
                      Last edited just now
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Project List */}
            <section>
              <h2 className='mb-4 text-lg font-medium text-gray-900 dark:text-white'>
                Library ({projects.length})
              </h2>

              {projects.length === 0 ? (
                <div className='py-12 text-center'>
                  <div className='rounded-lg border-2 border-dashed border-gray-300 p-12 dark:border-gray-600'>
                    <Folder className='mx-auto h-12 w-12 text-gray-400 dark:text-gray-500' />
                    <h3 className='mt-2 text-sm font-medium text-gray-900 dark:text-white'>
                      No projects
                    </h3>
                    <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
                      Get started by creating a new project.
                    </p>
                    <div className='mt-6'>
                      <button
                        onClick={onNewProject}
                        className='inline-flex items-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:scale-105 hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 active:scale-95'
                      >
                        <Plus className='mr-2 h-4 w-4' />
                        Create New Project
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
                  {projects
                    .filter(p => p.id !== currentProject.id)
                    .map(p => (
                      <div
                        key={p.id}
                        onClick={() => onLoadProject(p.id)}
                        className='group cursor-pointer rounded-lg border border-gray-200 bg-white p-6 transition-all hover:shadow-lg dark:border-gray-700 dark:bg-gray-900'
                      >
                        <div className='mb-4 flex items-start justify-between'>
                          <Folder className='h-6 w-6 text-gray-400 transition-colors group-hover:text-primary dark:text-gray-500 dark:group-hover:text-primary' />
                          <button
                            onClick={e => void handleDelete(e, p.id)}
                            className={iconButtonTarget(
                              'rounded text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-600 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-red-400',
                            )}
                            aria-label='Delete project'
                            title='Delete Project'
                          >
                            <Trash2 className='h-4 w-4' />
                          </button>
                        </div>
                        <h3
                          className='mb-1 truncate text-lg font-medium text-gray-900 dark:text-white'
                          title={p.title}
                        >
                          {p.title}
                        </h3>
                        <p className='mb-4 truncate text-sm text-gray-500 dark:text-gray-400'>
                          {p.style}
                        </p>
                        <div className='flex items-center justify-between border-t border-gray-200 pt-4 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400'>
                          <span>{new Date(p.updatedAt).toLocaleDateString()}</span>
                          <span className='flex items-center transition-colors group-hover:text-primary dark:group-hover:text-primary'>
                            Open <MoreVertical className='ml-1 h-3 w-3' />
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default ProjectsView;
