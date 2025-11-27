
import React, { useEffect, useState } from 'react';
import { Project } from '../../../types';
import { Folder, Clock, MoreVertical, FileText, Star, Trash2, Loader2, Plus } from 'lucide-react';
import { iconButtonTarget } from '../../../lib/utils';
import { db } from '../../../lib/db';

interface ProjectsViewProps {
  currentProject: Project;
  onNewProject: () => void;
  onLoadProject: (id: string) => void;
  onNavigate: (view: 'dashboard' | 'projects' | 'settings') => void;
}

const ProjectsView: React.FC<ProjectsViewProps> = ({ currentProject, onNewProject, onLoadProject, onNavigate }) => {
  const [projects, setProjects] = useState<{id: string, title: string, style: string, updatedAt: string, coverImage?: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, [currentProject.id]);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const list = await db.getAllProjects();
      setProjects(list);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this project? This cannot be undone.')) {
      try {
        await db.deleteProject(id);
        loadProjects();
      } catch (error) {
        console.error('Failed to delete project:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Header/Navbar */}
      <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Novelist.ai</h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <button
                onClick={() => onNavigate('dashboard')}
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white px-3 py-2 text-sm font-medium"
              >
                Dashboard
              </button>
              <button
                onClick={() => onNavigate('projects')}
                className="text-gray-900 dark:text-white px-3 py-2 text-sm font-medium border-b-2 border-blue-500"
              >
                Projects
              </button>
              <button
                onClick={() => onNavigate('settings')}
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white px-3 py-2 text-sm font-medium"
              >
                Settings
              </button>
            </nav>
            <button
              onClick={onNewProject}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl">
            My Projects
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 dark:text-gray-400">
            Manage your ongoing manuscripts and generated ebooks.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            {/* Current Active Project */}
            {currentProject.worldState.hasTitle && (
              <section className="mb-12">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Active Session</h2>
                <div
                  onClick={() => onNavigate('dashboard')}
                  className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 mb-2">
                        <Star className="w-3 h-3 mr-1" />
                        Open in Editor
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {currentProject.title}
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 mt-1">
                        {currentProject.idea || "No description provided."}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {currentProject.worldState.chaptersCompleted} / {currentProject.worldState.chaptersCount}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Chapters</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 mr-1" />
                      {currentProject.style}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      Last edited just now
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Project List */}
            <section>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Library ({projects.length})
              </h2>

              {projects.length === 0 ? (
                <div className="text-center py-12">
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12">
                    <Folder className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No projects</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by creating a new project.</p>
                    <div className="mt-6">
                      <button
                        onClick={onNewProject}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all hover:scale-105 active:scale-95"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create New Project
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.filter(p => p.id !== currentProject.id).map(p => (
                    <div
                      key={p.id}
                      onClick={() => onLoadProject(p.id)}
                      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-all cursor-pointer group"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <Folder className="w-6 h-6 text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                        <button
                          onClick={(e) => handleDelete(e, p.id)}
                          className={iconButtonTarget("text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors")}
                          aria-label="Delete project"
                          title="Delete Project"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1 truncate" title={p.title}>
                        {p.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 truncate">{p.style}</p>
                      <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-4">
                        <span>{new Date(p.updatedAt).toLocaleDateString()}</span>
                        <span className="flex items-center group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          Open <MoreVertical className="w-3 h-3 ml-1" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default ProjectsView;
