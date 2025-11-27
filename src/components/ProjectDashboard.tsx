
import React from 'react';
import { Project, Chapter } from '../types';

import PlannerControl from './PlannerControl';
import ProjectStats from './ProjectStats';
import ActionCard from './ActionCard';
import AgentConsole from './AgentConsole';
import BookViewer from '../features/editor/components/BookViewerRefactored';
import GoapVisualizer from './GoapVisualizer';
import { GoapEngine } from '../features/editor/hooks/useGoapEngine';
import { Settings } from 'lucide-react';

interface ProjectDashboardProps {
    project: Project;
    engine: GoapEngine;
    selectedChapterId: string | null;
    onSelectChapter: (id: string) => void;
    onUpdateChapter: (chapterId: string, updates: Partial<Chapter>) => void;
    onUpdateProject: (updates: Partial<Project>) => void;
    onAddChapter: () => void;
    onSettingsClick: () => void;
}

const ProjectDashboard: React.FC<ProjectDashboardProps> = ({
    project,
    engine,
    selectedChapterId,
    onSelectChapter,
    onUpdateChapter,
    onUpdateProject,
    onAddChapter,
    onSettingsClick
}) => {
    return (
        <div className="max-w-7xl mx-auto p-4 min-h-[calc(100dvh-4rem)] flex flex-col md:flex-row gap-6 animate-in fade-in duration-500">
            
            {/* Left Column: Planner & Controls */}
            <div className="w-full md:w-1/3 flex flex-col gap-6 group/sidebar">
              
              <div className="md:sticky md:top-20 flex flex-col gap-6 transition-opacity duration-300">
                <PlannerControl 
                  isPlannerRunning={engine.autoPilot}
                  isGenerating={project.isGenerating}
                  isStyleDefined={project.worldState.styleDefined}
                  onTogglePlanner={() => engine.setAutoPilot(!engine.autoPilot)}
                />

                <GoapVisualizer project={project} currentAction={engine.currentAction} />

                <ProjectStats project={project} />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Manual Actions</h2>
                    <Settings className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-foreground" onClick={onSettingsClick} />
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
                onSelectChapter={onSelectChapter}
                onRefineChapter={engine.handleRefineChapter}
                onUpdateChapter={onUpdateChapter}
                onUpdateProject={onUpdateProject}
                onAddChapter={onAddChapter}
                onContinueChapter={engine.handleContinueChapter}
              />
            </div>
          </div>
    );
};

export default ProjectDashboard;
