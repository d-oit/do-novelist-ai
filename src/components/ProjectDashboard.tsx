import { Settings } from 'lucide-react';
import React from 'react';

import BookViewer from '../features/editor/components/BookViewerRefactored';
import { GoapEngine } from '../features/editor/hooks/useGoapEngine';
import { Project, Chapter } from '../types';

import ActionCard from './ActionCard';
import AgentConsole from './AgentConsole';
import GoapVisualizer from './GoapVisualizer';
import PlannerControl from './PlannerControl';
import ProjectStats from './ProjectStats';

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
  onSettingsClick,
}) => {
  return (
    <div className='animate-in fade-in mx-auto flex min-h-[calc(100dvh-4rem)] max-w-7xl flex-col gap-6 p-4 duration-500 md:flex-row'>
      {/* Left Column: Planner & Controls */}
      <div className='group/sidebar flex w-full flex-col gap-6 md:w-1/3'>
        <div className='flex flex-col gap-6 transition-opacity duration-300 md:sticky md:top-20'>
          <PlannerControl
            isPlannerRunning={engine.autoPilot}
            isGenerating={project.isGenerating}
            isStyleDefined={project.worldState.styleDefined}
            onTogglePlanner={() => engine.setAutoPilot(!engine.autoPilot)}
          />

          <GoapVisualizer project={project} currentAction={engine.currentAction} />

          <ProjectStats project={project} />

          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <h2 className='text-sm font-bold uppercase tracking-wider text-muted-foreground'>
                Manual Actions
              </h2>
              <Settings
                className='h-4 w-4 cursor-pointer text-muted-foreground hover:text-foreground'
                onClick={onSettingsClick}
              />
            </div>

            <div className='grid gap-3'>
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

          <div className='h-[300px] min-h-[300px]'>
            <AgentConsole logs={engine.logs} />
          </div>
        </div>
      </div>

      {/* Right Column: Book Viewer */}
      <div className='flex min-h-[600px] w-full flex-col md:w-2/3'>
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
