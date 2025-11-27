
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Project, Chapter, ChapterStatus, PublishStatus } from './types/index';
import { MainLayout, Header } from './components/layout';
import { Loader2 } from 'lucide-react';
import { db } from './lib/db';

const ProjectDashboard = lazy(() => import('./components/ProjectDashboardOptimized'));
const ProjectWizard = lazy(() => import('./features/projects/components/ProjectWizard'));
const ProjectsView = lazy(() => import('./features/projects/components/ProjectsView'));
const SettingsView = lazy(() => import('./features/settings/components/SettingsView'));

import { useGoapEngine } from './features/editor/hooks/useGoapEngine';

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
    targetAudienceDefined: false
  },
  isGenerating: false,
  status: PublishStatus.DRAFT,
  language: 'en',
  targetWordCount: 50000,
  settings: {
    enableDropCaps: true,
    autoSave: true,
    autoSaveInterval: 120,
    showWordCount: true,
    enableSpellCheck: true,
    darkMode: false,
    fontSize: 'medium',
    lineHeight: 'normal',
    editorTheme: 'default'
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

  const engine = useGoapEngine(project, setProject, setSelectedChapterId);

  useEffect(() => {
    const initApp = async () => {
      try {
        await db.init();
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setIsLoading(false);
      }
    };
    initApp();
  }, []);

  useEffect(() => {
    if (project.id !== 'new_session' && !isLoading) {
       const saveTimer = setTimeout(() => {
         db.saveProject(project);
       }, 2000);
       return () => clearTimeout(saveTimer);
    }
    return undefined;
  }, [project, isLoading]);

  const handleCreateProject = (title: string, style: string, idea: string, targetWordCount: number) => {
    const newId = `proj_${Date.now()}`;
    const newProject: Project = {
      ...INITIAL_PROJECT,
      id: newId,
      title,
      style: style as any,
      idea,
      targetWordCount: targetWordCount || 50000,
      genre: [],
      targetAudience: 'adult',
      createdAt: new Date(),
      updatedAt: new Date(),
      worldState: {
        ...INITIAL_PROJECT.worldState,
        hasTitle: true,
        styleDefined: true,
        hasCharacters: false,
        hasWorldBuilding: false,
        hasThemes: false,
        plotStructureDefined: false,
        targetAudienceDefined: false
      }
    };
    
    setProject(newProject);
    db.saveProject(newProject);
    engine.addLog('System', 'Project Initialized.', 'info');
    setShowWizard(false);
    setCurrentView('dashboard');
    setSelectedChapterId('overview');
  };

  const handleLoadProject = async (id: string) => {
    setIsLoading(true);
    try {
      const loaded = await db.loadProject(id);
      if (loaded) {
        setProject({
          ...INITIAL_PROJECT,
          ...loaded,
          settings: { ...INITIAL_PROJECT.settings, ...(loaded.settings || {}) }
        });
        setCurrentView('dashboard');
        setSelectedChapterId('overview');
        engine.addLog('System', `Loaded project: ${loaded.title}`, 'info');
      } else {
        alert("Failed to load project.");
      }
    } catch (error) {
      console.error('Failed to load project:', error);
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
        const newChapter: Chapter = {
            id: `${prev.id}_ch_manual_${Date.now()}`,
            orderIndex: nextIndex,
            title: `Chapter ${nextIndex}`,
            summary: '',
            content: '',
            status: ChapterStatus.PENDING,
            wordCount: 0,
            characterCount: 0,
            estimatedReadingTime: 0,
            tags: [],
            notes: '',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        return {
            ...prev,
            chapters: [...prev.chapters, newChapter],
            worldState: { ...prev.worldState, chaptersCount: prev.chapters.length + 1 }
        };
    });
    engine.addLog('System', 'New chapter added manually.', 'info');
  };

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <h2 className="text-xl font-serif font-bold">Initializing GOAP Engine...</h2>
      </div>
    );
  }

  return (
    <MainLayout>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
        <ProjectWizard isOpen={showWizard} onCreate={handleCreateProject} onCancel={() => setShowWizard(false)} />
      </Suspense>
      
      <Header 
        projectTitle={project.title} 
        onNewProject={() => setShowWizard(true)} 
        currentView={currentView} 
        onNavigate={setCurrentView} 
      />
      
      <main className="flex-1 relative pt-0">
        <Suspense fallback={<div className="flex items-center justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
          {currentView === 'dashboard' && (
            <ProjectDashboard project={project} engine={engine} selectedChapterId={selectedChapterId} onSelectChapter={setSelectedChapterId} onUpdateChapter={handleUpdateChapter} onUpdateProject={handleUpdateProject} onAddChapter={handleAddChapter} onSettingsClick={() => setCurrentView('settings')} />
          )}
          {currentView === 'projects' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <ProjectsView currentProject={project} onNewProject={() => setShowWizard(true)} onLoadProject={handleLoadProject} onNavigate={setCurrentView} />
            </div>
          )}
          {currentView === 'settings' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <SettingsView />
            </div>
          )}
        </Suspense>
      </main>
    </MainLayout>
  );
};
export default App;
