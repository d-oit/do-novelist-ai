import { Loader2, Settings } from 'lucide-react';
import React, { useEffect, useState, Suspense, lazy } from 'react';

import { ProjectsErrorBoundary } from '@/components/error-boundary';
import { ActionCard, BookViewer, PlannerControl } from '@/features/generation/components';
import { useGoapEngine } from '@/features/generation/hooks';
import { ProjectStats, ProjectWizard } from '@/features/projects/components';
import { db } from '@/features/projects/services';
import { SearchModal } from '@/features/semantic-search';
import { logger } from '@/lib/logging/logger';
import { offlineManager } from '@/lib/pwa';
import { performanceMonitor } from '@/performance';
import { MainLayout, Header as Navbar } from '@/shared/components/layout';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { Toaster } from '@/shared/components/ui/Toaster';
import { ChapterStatus, PublishStatus } from '@/shared/types';
import type { Chapter, Project, RefineOptions } from '@/shared/types';

import { createChapter } from '@shared/utils';

// Lazy load heavy components for better performance
const ProjectsView = lazy(() =>
  import('@/features/projects/components').then(module => ({ default: module.ProjectsView })),
);
const SettingsView = lazy(() =>
  import('@/features/settings/components').then(module => ({ default: module.SettingsView })),
);
const MetricsPage = lazy(() =>
  import('@/pages/MetricsPage').then(module => ({ default: module.MetricsPage })),
);
const AgentConsole = lazy(() =>
  import('@/features/generation/components').then(module => ({ default: module.AgentConsole })),
);

// Loading components for Suspense boundaries
const ProjectsLoader = () => (
  <div className='flex min-h-[calc(100vh-4rem)] flex-col gap-6 bg-background p-8'>
    <div className='mb-8 text-center'>
      <Skeleton className='mx-auto h-12 w-64' />
      <Skeleton className='mx-auto mt-3 h-6 w-96' />
    </div>
    <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} className='h-48 w-full' />
      ))}
    </div>
  </div>
);

const SettingsLoader = () => (
  <div className='container mx-auto max-w-4xl space-y-8 p-8'>
    <Skeleton className='h-10 w-48' />
    <div className='space-y-4'>
      <Skeleton className='h-32 w-full' />
      <Skeleton className='h-32 w-full' />
      <Skeleton className='h-32 w-full' />
    </div>
  </div>
);

const MetricsLoader = () => (
  <div className='container mx-auto space-y-6 p-6'>
    <div>
      <Skeleton className='h-10 w-48' />
      <Skeleton className='mt-2 h-6 w-96' />
    </div>
    <div className='space-y-4'>
      <Skeleton className='h-64 w-full' />
      <Skeleton className='h-48 w-full' />
    </div>
  </div>
);

const ConsoleLoader = () => (
  <div className='h-[300px] w-full rounded-lg border border-border bg-muted/20 p-4'>
    <div className='space-y-2'>
      <Skeleton className='h-4 w-3/4' />
      <Skeleton className='h-4 w-1/2' />
      <Skeleton className='h-4 w-2/3' />
      <Skeleton className='h-4 w-1/3' />
    </div>
  </div>
);

// Error boundary for lazy loading failures
class LazyLoadErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): { hasError: boolean; error: Error } {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    logger.error('Lazy loading error', {
      component: 'LazyLoadErrorBoundary',
      error,
      errorInfo,
    });
  }

  override render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className='flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-background p-8 text-foreground'>
            <div className='max-w-md text-center'>
              <h2 className='mb-2 text-xl font-semibold text-destructive'>
                Failed to Load Component
              </h2>
              <p className='mb-4 text-muted-foreground'>
                {this.state.error?.message ||
                  'An unexpected error occurred while loading this component.'}
              </p>
              <button
                onClick={() => window.location.reload()}
                className='rounded-md bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90'
              >
                Reload Page
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

// --- Initial Data ---

const INITIAL_PROJECT: Project = {
  id: 'new_session',
  title: 'Untitled Project',
  idea: '',
  style: 'General Fiction',
  chapters: [],
  worldState: {
    hasTitle: false,
    hasOutline: false,
    chaptersCount: 0,
    chaptersCompleted: 0,
    styleDefined: false,
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
    enableDropCaps: true,
  },
  genre: [],
  targetAudience: 'adult',
  contentWarnings: [],
  keywords: [],
  synopsis: '',
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
    id: crypto.randomUUID(),
    projectId: 'new_session',
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

type ViewMode = 'dashboard' | 'projects' | 'settings' | 'world-building' | 'metrics';

// ... existing imports ...

const App: React.FC = () => {
  const [project, setProject] = useState<Project>(INITIAL_PROJECT);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>('overview');
  const [showWizard, setShowWizard] = useState(false);
  const [currentView, setCurrentView] = useState<ViewMode>('projects');
  const [isLoading, setIsLoading] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Track performance for view changes
  useEffect(() => {
    const timerName = `route-${currentView}`;
    performanceMonitor.startTiming(timerName);

    return () => {
      performanceMonitor.endTiming(timerName);
    };
  }, [currentView]);

  // Initialize Engine Hook
  const engine = useGoapEngine(project, setProject, setSelectedChapterId);

  // App Initialization
  useEffect(() => {
    const initApp = async (): Promise<void> => {
      performanceMonitor.startTiming('app-initialization');

      // Initialize PWA offline manager
      offlineManager.initialize();

      // Set a hard timeout to ensure app renders in CI environments
      const forceRenderTimeout = setTimeout(() => {
        logger.warn('Forcing app render after timeout', {
          component: 'App',
          note: 'database initialization may still be running',
        });
        setIsLoading(false);
      }, 2000);

      try {
        // Add timeout to prevent infinite loading
        const initPromise = db.init();
        const timeoutPromise = new Promise<void>((_, reject) =>
          setTimeout(() => reject(new Error('Database initialization timeout')), 15000),
        );

        await Promise.race([initPromise, timeoutPromise]);
      } catch (error) {
        logger.warn('Database initialization failed or timed out', {
          component: 'App',
          error,
          note: 'continuing with local storage',
        });
        // Continue with local storage - don't block app
      } finally {
        performanceMonitor.endTiming('app-initialization');
        clearTimeout(forceRenderTimeout);
        setIsLoading(false);
      }
    };
    void initApp();
  }, []);

  // Auto-save Logic
  useEffect((): (() => void) | undefined => {
    if (project.id !== 'new_session' && !isLoading) {
      const saveTimer = setTimeout(() => {
        void db.saveProject(project);
      }, 2000); // Debounced save
      return () => clearTimeout(saveTimer);
    }
    return undefined;
  }, [project, isLoading]);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ... existing code ...

  const handleCreateProject = (
    title: string,
    style: string,
    idea: string,
    targetWordCount: number,
  ): void => {
    const newId = `proj_${Date.now()}`;
    const newProject: Project = {
      ...INITIAL_PROJECT,
      id: newId,
      title,
      style: style as Project['style'],
      idea,
      targetWordCount: targetWordCount || 50000,
      worldState: {
        ...INITIAL_PROJECT.worldState,
        hasTitle: true,
        styleDefined: true,
      },
    };

    setProject(newProject);
    void db.saveProject(newProject);

    // Analytics
    void import('@/lib/analytics').then(({ featureTracking }) => {
      featureTracking.trackFeatureUsage('projects', 'create_project', {
        style,
        targetWordCount,
        hasIdea: !!idea,
      });
    });

    engine.addLog('System', 'Project Initialized.', 'info');
    engine.addLog('System', `Idea registered: ${idea.substring(0, 50)}...`, 'thought');
    engine.addLog('System', `Target Word Count set to ${targetWordCount}.`, 'info');

    setShowWizard(false);
    setCurrentView('dashboard');
    setSelectedChapterId('overview');
  };

  const handleLoadProject = async (id: string): Promise<void> => {
    setIsLoading(true);
    const loaded = await db.loadProject(id);
    if (loaded) {
      // Merge with default properties for backward compatibility
      setProject({
        ...INITIAL_PROJECT,
        ...loaded,
        // Ensure deep merge for settings if they are missing in DB but present in initial
        settings: { ...INITIAL_PROJECT.settings, ...(loaded.settings ?? {}) },
      });
      setCurrentView('dashboard');
      setSelectedChapterId('overview');
      engine.addLog('System', `Loaded project: ${loaded.title}`, 'info');
    } else {
      alert('Failed to load project.');
    }
    setIsLoading(false);
  };

  const handleUpdateChapter = (chapterId: string, updates: Partial<Chapter>): void => {
    setProject(prev => ({
      ...prev,
      chapters: prev.chapters.map(c => (c.id === chapterId ? { ...c, ...updates } : c)),
    }));
  };

  const handleUpdateProject = (updates: Partial<Project>): void => {
    setProject(prev => ({ ...prev, ...updates }));
  };

  const handleAddChapter = (): void => {
    setProject(prev => {
      const nextIndex =
        prev.chapters.length > 0 ? Math.max(...prev.chapters.map(c => c.orderIndex)) + 1 : 1;

      const newChapter = createChapter({
        id: `${prev.id}_ch_manual_${Date.now()}`,
        orderIndex: nextIndex,
        title: `Chapter ${nextIndex}`,
        summary: '',
        content: '',
        status: ChapterStatus.PENDING,
      });

      const updatedChapters = [...prev.chapters, newChapter];
      return {
        ...prev,
        chapters: updatedChapters,
        worldState: {
          ...prev.worldState,
          chaptersCount: updatedChapters.length,
        },
      };
    });
    // Log the action
    engine.addLog('System', 'New chapter added manually.', 'info');
  };

  if (isLoading) {
    return (
      <div className='flex min-h-screen flex-col items-center justify-center bg-background text-foreground'>
        <Loader2 className='mb-4 h-12 w-12 animate-spin text-primary' />
        <h2 className='font-serif text-xl font-bold'>Initializing GOAP Engine...</h2>
        <p className='text-muted-foreground'>Connecting to database...</p>
      </div>
    );
  }

  return (
    <MainLayout currentView={currentView} onNavigate={setCurrentView}>
      <ProjectWizard
        isOpen={showWizard}
        onCreate={handleCreateProject}
        onCancel={() => setShowWizard(false)}
      />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        projectId={project.id}
        onResultSelect={result => {
          if (result.entityType === 'chapter') {
            setSelectedChapterId(result.entityId);
            setCurrentView('dashboard');
            setIsSearchOpen(false);
          } else if (result.entityType === 'project') {
            setCurrentView('dashboard');
            setSelectedChapterId('overview');
            setIsSearchOpen(false);
          } else {
            // For other types, ideally show in a sidebar or modal.
            // For now, we'll keep the semantic search open
            // OR close it if the user explicit action was assumed.
            // Let's close it for now as per minimal viable implementation.
            setIsSearchOpen(false);
          }
        }}
      />

      <Navbar
        projectTitle={project?.title ?? 'No Project'}
        onNewProject={() => setShowWizard(true)}
        currentView={currentView}
        onNavigate={setCurrentView}
      />

      <main id='main-content' role='main' className='relative flex-1 pb-16 md:pb-0'>
        {/* Page Title - Hidden visually but available to screen readers */}
        <h1 className='sr-only'>
          {currentView === 'dashboard' && project.title !== 'Untitled Project'
            ? `${project.title} - Novelist.ai Dashboard`
            : currentView === 'projects'
              ? 'Projects - Novelist.ai'
              : currentView === 'settings'
                ? 'Settings - Novelist.ai'
                : currentView === 'metrics'
                  ? 'System Metrics - Novelist.ai'
                  : 'Novelist.ai Dashboard'}
        </h1>
        {currentView === 'dashboard' && (
          <div className='animate-in fade-in mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col gap-6 p-4 duration-500 md:flex-row'>
            {/* Left Column: Planner & Controls */}
            <div className='group/sidebar flex w-full flex-col gap-6 md:w-1/3'>
              <div className='flex flex-col gap-6 transition-opacity duration-300 md:sticky md:top-20'>
                <PlannerControl
                  isPlannerRunning={engine.autoPilot}
                  isGenerating={project.isGenerating}
                  isStyleDefined={project.worldState.styleDefined}
                  onTogglePlanner={() => engine.setAutoPilot(!engine.autoPilot)}
                />

                <ProjectStats project={project} />

                <div className='space-y-3'>
                  <div className='flex items-center justify-between'>
                    <h2 className='text-sm font-bold uppercase tracking-wider text-muted-foreground'>
                      Manual Actions
                    </h2>
                    <Settings
                      className='h-4 w-4 cursor-pointer text-muted-foreground hover:text-foreground'
                      onClick={() => setCurrentView('settings')}
                    />
                  </div>

                  <div className='grid gap-3'>
                    {engine.availableActions.map(action => (
                      <ActionCard
                        key={action.name}
                        action={action}
                        isActive={engine.currentAction?.name === action.name}
                        disabled={!engine.isActionAvailable(action) || project.isGenerating}
                        onClick={(): void => {
                          void engine.executeAction(action);
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className='h-[300px] min-h-[300px]'>
                  <LazyLoadErrorBoundary>
                    <Suspense fallback={<ConsoleLoader />}>
                      <AgentConsole logs={engine.logs} />
                    </Suspense>
                  </LazyLoadErrorBoundary>
                </div>
              </div>
            </div>

            {/* Right Column: Book Viewer */}
            <div className='flex min-h-[600px] w-full flex-col md:w-2/3'>
              <BookViewer
                project={project}
                selectedChapterId={selectedChapterId}
                onSelectChapter={setSelectedChapterId}
                onRefineChapter={(chapterId: string, options: RefineOptions): void => {
                  void engine.handleRefineChapter(chapterId, options);
                }}
                onUpdateChapter={handleUpdateChapter}
                onUpdateProject={handleUpdateProject}
                onAddChapter={handleAddChapter}
                onContinueChapter={(chapterId: string): void => {
                  void engine.handleContinueChapter(chapterId);
                }}
              />
            </div>
          </div>
        )}

        {currentView === 'projects' && (
          <div className='animate-in fade-in slide-in-from-bottom-4 duration-500'>
            <ProjectsErrorBoundary>
              <LazyLoadErrorBoundary>
                <Suspense fallback={<ProjectsLoader />}>
                  <ProjectsView
                    currentProject={project}
                    onNewProject={() => setShowWizard(true)}
                    onLoadProject={(id: string): void => {
                      void handleLoadProject(id);
                    }}
                    onNavigate={setCurrentView}
                  />
                </Suspense>
              </LazyLoadErrorBoundary>
            </ProjectsErrorBoundary>
          </div>
        )}

        {currentView === 'settings' && (
          <div className='animate-in fade-in slide-in-from-bottom-4 duration-500'>
            <LazyLoadErrorBoundary>
              <Suspense fallback={<SettingsLoader />}>
                <SettingsView />
              </Suspense>
            </LazyLoadErrorBoundary>
          </div>
        )}

        {currentView === 'metrics' && (
          <div className='animate-in fade-in slide-in-from-bottom-4 duration-500'>
            <LazyLoadErrorBoundary>
              <Suspense fallback={<MetricsLoader />}>
                <MetricsPage />
              </Suspense>
            </LazyLoadErrorBoundary>
          </div>
        )}
      </main>

      <Toaster />
    </MainLayout>
  );
};

export default App;
