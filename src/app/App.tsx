
import React, { useState, useEffect } from 'react';
import { Project, Chapter, ChapterStatus, PublishStatus } from '../shared/types';
import { ActionCard, AgentConsole, BookViewer, PlannerControl } from '../features/generation/components';
import { Navbar, ProjectStats, ProjectWizard, ProjectsView } from '../features/projects/components';
import { SettingsView } from '../features/settings/components';
import { useGoapEngine } from '../features/generation/hooks';
import { Settings, Loader2 } from 'lucide-react';
import { db } from '../features/projects/services';
import { createChapter } from '../shared/utils';

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
    isPublished: false
  },
  isGenerating: false,
  status: PublishStatus.DRAFT,
  language: 'en',
  targetWordCount: 50000,
  settings: {
    enableDropCaps: true
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
    editingRounds: 0
  },
  version: '1.0.0',
  changeLog: []
};

type ViewMode = 'dashboard' | 'projects' | 'settings';

const App: React.FC = () => {
  const [project, setProject] = useState<Project>(INITIAL_PROJECT);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>('overview'); 
  const [showWizard, setShowWizard] = useState(false); 
  const [currentView, setCurrentView] = useState<ViewMode>('projects'); 
  const [isLoading, setIsLoading] = useState(true);

  // Initialize Engine Hook
  const engine = useGoapEngine(project, setProject, setSelectedChapterId);

  // App Initialization
  useEffect(() => {
    const initApp = async () => {
      await db.init();
      setIsLoading(false);
    };
    initApp();
  }, []);

  // Auto-save Logic
  useEffect(() => {
    if (project.id !== 'new_session' && !isLoading) {
       const saveTimer = setTimeout(() => {
         db.saveProject(project);
       }, 2000); // Debounced save
       return () => clearTimeout(saveTimer);
    }
  }, [project, isLoading]);

  const handleCreateProject = (title: string, style: string, idea: string, targetWordCount: number) => {
    const newId = `proj_${Date.now()}`;
    const newProject: Project = {
      ...INITIAL_PROJECT,
      id: newId,
      title,
      style,
      idea,
      targetWordCount: targetWordCount || 50000,
      worldState: {
        ...INITIAL_PROJECT.worldState,
        hasTitle: true,
        styleDefined: true
      }
    };
    
    setProject(newProject);
    db.saveProject(newProject);
    
    engine.addLog('System', 'Project Initialized.', 'info');
    engine.addLog('System', `Idea registered: ${idea.substring(0, 50)}...`, 'thought');
    engine.addLog('System', `Target Word Count set to ${targetWordCount}.`, 'info');
    
    setShowWizard(false);
    setCurrentView('dashboard');
    setSelectedChapterId('overview');
  };

  const handleLoadProject = async (id: string) => {
    setIsLoading(true);
    const loaded = await db.loadProject(id);
    if (loaded) {
      // Merge with default properties for backward compatibility
      setProject({ 
        ...INITIAL_PROJECT, 
        ...loaded,
        // Ensure deep merge for settings if they are missing in DB but present in initial
        settings: { ...INITIAL_PROJECT.settings, ...(loaded.settings || {}) }
      });
      setCurrentView('dashboard');
      setSelectedChapterId('overview');
      engine.addLog('System', `Loaded project: ${loaded.title}`, 'info');
    } else {
      alert("Failed to load project.");
    }
    setIsLoading(false);
  };

  const handleUpdateChapter = (chapterId: string, updates: Partial<Chapter>) => {
    setProject(prev => ({
      ...prev,
      chapters: prev.chapters.map(c => c.id === chapterId ? { ...c, ...updates } : c)
    }));
  };

  const handleUpdateProject = (updates: Partial<Project>) => {
    setProject(prev => ({ ...prev, ...updates }));
  };

  const handleAddChapter = () => {
    setProject(prev => {
        const nextIndex = prev.chapters.length > 0
            ? Math.max(...prev.chapters.map(c => c.orderIndex)) + 1
            : 1;

        const newChapter = createChapter({
            id: `${prev.id}_ch_manual_${Date.now()}`,
            orderIndex: nextIndex,
            title: `Chapter ${nextIndex}`,
            summary: '',
            content: '',
            status: ChapterStatus.PENDING
        });

        const updatedChapters = [...prev.chapters, newChapter];
        return {
            ...prev,
            chapters: updatedChapters,
            worldState: {
                ...prev.worldState,
                chaptersCount: updatedChapters.length
            }
        };
    });
    // Log the action
    engine.addLog('System', 'New chapter added manually.', 'info');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <h2 className="text-xl font-serif font-bold">Initializing GOAP Engine...</h2>
        <p className="text-muted-foreground">Connecting to database...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 flex flex-col">
      
      <ProjectWizard 
        isOpen={showWizard} 
        onCreate={handleCreateProject}
        onCancel={() => setShowWizard(false)}
      />

      <Navbar 
        projectTitle={project.title}
        onNewProject={() => setShowWizard(true)}
        currentView={currentView}
        onNavigate={setCurrentView}
      />

      <main className="flex-1 relative">
        {currentView === 'dashboard' && (
          <div className="max-w-7xl mx-auto p-4 min-h-[calc(100vh-4rem)] flex flex-col md:flex-row gap-6 animate-in fade-in duration-500">
            
            {/* Left Column: Planner & Controls */}
            <div className="w-full md:w-1/3 flex flex-col gap-6 group/sidebar">
              
              <div className="md:sticky md:top-20 flex flex-col gap-6 transition-opacity duration-300">
                <PlannerControl 
                  isPlannerRunning={engine.autoPilot}
                  isGenerating={project.isGenerating}
                  isStyleDefined={project.worldState.styleDefined}
                  onTogglePlanner={() => engine.setAutoPilot(!engine.autoPilot)}
                />

                <ProjectStats project={project} />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Manual Actions</h2>
                    <Settings className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => setCurrentView('settings')} />
                  </div>
                  
                  <div className="grid gap-3">
                    {engine.availableActions.map(action => (
                      <ActionCard 
                        key={action.name}
                        action={action}
                        isActive={engine.currentAction?.name === action.name}
                        disabled={!engine.isActionAvailable(action) || project.isGenerating}
                        onClick={() => engine.executeAction(action)}
                      />
                    ))}
                  </div>
                </div>

                <div className="min-h-[300px] h-[300px]">
                   <AgentConsole logs={engine.logs} />
                </div>
              </div>
            </div>

            {/* Right Column: Book Viewer */}
            <div className="w-full md:w-2/3 flex flex-col min-h-[600px]">
              <BookViewer 
                project={project} 
                selectedChapterId={selectedChapterId}
                onSelectChapter={setSelectedChapterId}
                onRefineChapter={engine.handleRefineChapter}
                onUpdateChapter={handleUpdateChapter}
                onUpdateProject={handleUpdateProject}
                onAddChapter={handleAddChapter}
                onContinueChapter={engine.handleContinueChapter}
              />
            </div>
          </div>
        )}

        {currentView === 'projects' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ProjectsView 
              currentProject={project}
              onNewProject={() => setShowWizard(true)}
              onLoadProject={handleLoadProject}
              onNavigate={setCurrentView}
            />
          </div>
        )}

        {currentView === 'settings' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SettingsView />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
