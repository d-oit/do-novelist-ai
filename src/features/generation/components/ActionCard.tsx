import type { AgentAction } from '@shared/types';
import { AgentMode } from '@shared/types';
import { Play, Activity, Users, Zap, BrainCircuit } from 'lucide-react';
import React from 'react';
import { cn } from '@/lib/utils';

interface ActionCardProps {
  action: AgentAction;
  isActive: boolean;
  disabled?: boolean;
  onClick: () => void;
}

const ModeIcon = ({ mode }: { mode: AgentMode }): React.ReactElement => {
  switch (mode) {
    case AgentMode.SINGLE:
      return <Zap className='h-4 w-4 text-blue-400' />;
    case AgentMode.PARALLEL:
      return <Activity className='h-4 w-4 text-green-400' />;
    case AgentMode.HYBRID:
      return <BrainCircuit className='h-4 w-4 text-purple-400' />;
    case AgentMode.SWARM:
      return <Users className='h-4 w-4 text-orange-400' />;
    default:
      return <Zap className='h-4 w-4' />;
  }
};

const ActionCard: React.FC<ActionCardProps> = ({ action, isActive, disabled, onClick }) => {
  return (
    <div
      onClick={(disabled ?? false) ? undefined : onClick}
      className={cn(
        'relative overflow-hidden rounded-lg border p-4 transition-all duration-200',
        isActive
          ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
          : 'border-border bg-card hover:border-primary/50 hover:bg-secondary/50',
        (disabled ?? false) ? 'cursor-not-allowed opacity-50 grayscale' : 'cursor-pointer',
      )}
      data-testid={`action-card-${action.name}`}
    >
      <div className='mb-2 flex items-start justify-between'>
        <div className='flex items-center gap-2'>
          <ModeIcon mode={action.agentMode} />
          <span
            className={cn(
              'text-xs font-bold uppercase tracking-wider',
              isActive ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            {action.agentMode}
          </span>
        </div>
        <div className='rounded bg-secondary px-2 py-0.5 font-mono text-xs text-muted-foreground'>
          Cost: {action.cost}
        </div>
      </div>

      <h3 className='mb-1 font-semibold text-foreground'>{action.label}</h3>
      <p className='line-clamp-2 text-xs text-muted-foreground'>{action.description}</p>

      {isActive && (
        <div className='absolute bottom-2 right-2 animate-pulse'>
          <Play className='h-4 w-4 fill-current text-primary' />
        </div>
      )}
    </div>
  );
};

export default ActionCard;
