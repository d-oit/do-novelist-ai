import { Check, Circle, Loader2, Zap } from 'lucide-react';
import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';

import type { Project, AgentAction } from '../types';
import { PublishStatus } from '../shared/types';

interface GoapVisualizerProps {
  project: Project;
  currentAction: AgentAction | null;
}

const GoapVisualizer: React.FC<GoapVisualizerProps> = React.memo(({ project, currentAction }) => {
  const { worldState } = project;

  // Memoize active stage calculation
  const activeStage = useMemo(() => {
    if (project.status === PublishStatus.PUBLISHED) return 4;
    if (worldState.chaptersCompleted === worldState.chaptersCount && worldState.chaptersCount > 0)
      return 3;
    if (worldState.hasOutline && worldState.chaptersCompleted > 0) return 2;
    if (worldState.hasOutline) return 1;
    return 0;
  }, [
    worldState.hasOutline,
    worldState.chaptersCompleted,
    worldState.chaptersCount,
    project.status,
  ]);

  const stages = useMemo(
    () => [
      { id: 0, label: 'Concept', icon: Zap },
      { id: 1, label: 'Outline', icon: Circle },
      { id: 2, label: 'Drafting', icon: Circle },
      { id: 3, label: 'Refining', icon: Circle },
      { id: 4, label: 'Publish', icon: Check },
    ],
    [],
  );

  return (
    <div className='mb-4 rounded-lg border border-border bg-card p-4 shadow-sm'>
      <h3 className='mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground'>
        <Zap className='h-3 w-3 text-primary' />
        Engine State
      </h3>

      {/* Pipeline Visualizer */}
      <div className='relative flex items-center justify-between'>
        {/* Connecting Line */}
        <div className='absolute left-0 top-1/2 -z-10 h-0.5 w-full bg-border' />

        {stages.map((stage, index) => {
          const isActive = index === activeStage;
          const isCompleted = index < activeStage;

          return (
            <div key={stage.id} className='z-10 flex flex-col items-center gap-2 bg-card px-1'>
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-500',
                  isActive
                    ? 'scale-110 border-primary bg-background text-primary shadow-[0_0_15px_rgba(59,130,246,0.4)]'
                    : isCompleted
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-secondary text-muted-foreground',
                )}
              >
                {isActive && currentAction ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : isCompleted ? (
                  <Check className='h-4 w-4' />
                ) : (
                  <div className='h-2 w-2 rounded-full bg-current opacity-50' />
                )}
              </div>
              <span
                className={cn(
                  'text-[10px] font-bold uppercase tracking-wide',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Current Action Detail */}
      {currentAction && (
        <div className='animate-in fade-in slide-in-from-top-2 mt-6 flex items-center gap-3 rounded-md border border-primary/20 bg-secondary/20 p-2'>
          <div className='rounded bg-primary/10 p-1.5 text-primary'>
            <Loader2 className='h-3 w-3 animate-spin' />
          </div>
          <div className='min-w-0 flex-1'>
            <div className='text-[10px] font-bold uppercase text-muted-foreground'>
              Executing Plan
            </div>
            <div className='truncate text-xs font-medium text-primary'>{currentAction.label}</div>
          </div>
          <div className='rounded border border-border bg-background px-2 py-1 font-mono text-[10px]'>
            {currentAction.agentMode}
          </div>
        </div>
      )}
    </div>
  );
});

GoapVisualizer.displayName = 'GoapVisualizer';

export default GoapVisualizer;
