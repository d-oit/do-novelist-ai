/**
 * Project Dashboard - Optimized with Code Splitting
 * Uses dynamic imports for better bundle optimization
 */

import { Settings } from 'lucide-react';
import React, { useCallback, useMemo } from 'react';

import type { GoapEngine } from '../features/editor/hooks/useGoapEngine';
import type { Project, Chapter, RefineOptions } from '../types';

import ActionCard from './ActionCard';
import AgentConsole from './AgentConsole';
import GoapVisualizer from './GoapVisualizer';
import PlannerControl from './PlannerControl';
import ProjectStats from './ProjectStats';

// Import BookViewer directly to avoid lazy loading issues in tests
import BookViewer from '../features/editor/components/BookViewer';

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

const ProjectDashboardOptimized: React.FC<ProjectDashboardProps> = React.memo(
  ({
    project,
    engine,
    selectedChapterId,
    onSelectChapter,
    onUpdateChapter,
    onUpdateProject,
    onAddChapter,
    onSettingsClick,
  }) => {
    // Memoize callback handlers
    const handleTogglePlanner = useCallback(() => {
      engine.setAutoPilot(!engine.autoPilot);
    }, [engine]);

    const handleRefineChapter = useCallback(
      (chapterId: string, options: RefineOptions) => {
        void engine.handleRefineChapter(chapterId, options);
      },
      [engine],
    );

    const handleContinueChapter = useCallback(
      (chapterId: string) => {
        void engine.handleContinueChapter(chapterId);
      },
      [engine],
    );

    // Memoize action availability check
    const actionItems = useMemo(() => {
      return engine.availableActions.map(action => ({
        action,
        isActive: engine.currentAction?.name === action.name,
        disabled: !engine.isActionAvailable(action) || project.isGenerating,
      }));
    }, [
      engine.availableActions,
      engine.currentAction,
      engine.isActionAvailable,
      engine,
      project.isGenerating,
    ]);

    return (
      <div className='animate-in fade-in mx-auto flex min-h-[calc(100dvh-4rem)] max-w-7xl flex-col gap-6 p-4 duration-500 md:flex-row'>
        {/* Left Column: Planner & Controls */}
        <div className='group/sidebar flex w-full flex-col gap-6 md:w-1/3'>
          <div className='flex flex-col gap-6 transition-opacity duration-300 md:sticky md:top-20'>
            <PlannerControl
              isPlannerRunning={engine.autoPilot}
              isGenerating={project.isGenerating}
              isStyleDefined={project.worldState.styleDefined}
              onTogglePlanner={handleTogglePlanner}
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
                {actionItems.map(({ action, isActive, disabled }) => (
                  <ActionCard
                    key={action.name}
                    action={action}
                    isActive={isActive}
                    disabled={disabled}
                    onClick={() => void engine.executeAction(action)}
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
            onRefineChapter={handleRefineChapter}
            onUpdateChapter={onUpdateChapter}
            onUpdateProject={onUpdateProject}
            onAddChapter={onAddChapter}
            onContinueChapter={handleContinueChapter}
          />
        </div>
      </div>
    );
  },
);

ProjectDashboardOptimized.displayName = 'ProjectDashboardOptimized';

export default ProjectDashboardOptimized;
