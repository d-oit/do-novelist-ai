import { Play, Pause, Loader2, BrainCircuit } from 'lucide-react';
import React from 'react';

import { cn } from '../lib/utils';

interface PlannerControlProps {
  isPlannerRunning: boolean;
  isGenerating: boolean;
  isStyleDefined: boolean;
  onTogglePlanner: () => void;
}

const PlannerControl: React.FC<PlannerControlProps> = React.memo(
  ({ isPlannerRunning, isGenerating, isStyleDefined, onTogglePlanner }) => {
    return (
      <div className='animate-in fade-in slide-in-from-top-2 mb-4 rounded-xl border border-border bg-card p-4 shadow-sm'>
        <div className='flex items-center justify-between gap-4'>
          {/* Status Text */}
          <div className='flex-1'>
            <h3 className='flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground'>
              <BrainCircuit
                className={cn(
                  'h-4 w-4',
                  isPlannerRunning ? 'animate-pulse text-primary' : 'text-muted-foreground',
                )}
              />
              GOAP Engine
            </h3>
            <p className='mt-1 text-xs font-medium text-foreground'>
              {isGenerating ? (
                <span className='text-primary'>Agents Active...</span>
              ) : isPlannerRunning ? (
                <span className='text-green-500'>Autopilot Online</span>
              ) : (
                <span className='text-muted-foreground'>Standby Mode</span>
              )}
            </p>
          </div>

          {/* Primary Action Button */}
          <button
            onClick={onTogglePlanner}
            disabled={isGenerating || !isStyleDefined}
            className={cn(
              'group relative flex items-center justify-center gap-3 overflow-hidden rounded-lg px-6 py-3 text-sm font-bold shadow-md transition-all',
              isPlannerRunning
                ? 'border border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500/20'
                : 'bg-primary text-primary-foreground hover:scale-[1.02] hover:shadow-primary/25',
              'disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-50',
            )}
            data-testid='planner-control-btn'
          >
            {isGenerating ? (
              <Loader2 className='h-5 w-5 animate-spin' />
            ) : isPlannerRunning ? (
              <Pause className='h-5 w-5 fill-current' />
            ) : (
              <Play className='h-5 w-5 fill-current' />
            )}

            <span>{isPlannerRunning ? 'PAUSE ENGINE' : 'START AUTOPILOT'}</span>

            {/* Button Glow Effect */}
            {!isPlannerRunning && !isGenerating && isStyleDefined && (
              <div className='absolute inset-0 -z-10 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-[shimmer_1.5s_infinite]' />
            )}
          </button>
        </div>

        {/* Progress Bar (Visual Feedback) */}
        <div className='mt-3 h-1 w-full overflow-hidden rounded-full bg-secondary'>
          <div
            className={cn(
              'h-full transition-all duration-500',
              isPlannerRunning ? 'w-full animate-[pulse_2s_infinite] bg-primary' : 'w-0 bg-muted',
            )}
          />
        </div>
      </div>
    );
  },
);

PlannerControl.displayName = 'PlannerControl';

export default PlannerControl;
