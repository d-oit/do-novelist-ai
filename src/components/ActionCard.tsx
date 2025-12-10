import { Play, ArrowLeftRight, Users, Zap, BrainCircuit } from 'lucide-react';
import React, { useCallback } from 'react';

import { cn } from '@/lib/utils';

import type { AgentAction } from '@shared/types';
import { AgentMode } from '@shared/types';

interface ActionCardProps {
  action: AgentAction;
  isActive: boolean;
  disabled?: boolean;
  onClick: () => void;
}

const ModeIcon = ({ mode }: { mode: AgentMode }): React.ReactElement => {
  switch (mode) {
    case AgentMode.SINGLE:
      return <Zap className='h-4 w-4 text-primary' />;
    case AgentMode.PARALLEL:
      return <ArrowLeftRight className='h-4 w-4 text-primary' />;
    case AgentMode.HYBRID:
      return <Users className='h-4 w-4 text-primary' />;
    case AgentMode.SWARM:
      return <BrainCircuit className='h-4 w-4 text-primary' />;
    default:
      return <Play className='h-4 w-4 text-muted-foreground' />;
  }
};

const ActionCard = React.memo<ActionCardProps>(({ action, isActive, disabled, onClick }) => {
  const handleClick = useCallback(() => {
    if (!disabled) {
      onClick();
    }
  }, [onClick, disabled]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!disabled && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        onClick();
      }
    },
    [onClick, disabled],
  );

  return (
    <button
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      className={cn(
        'relative overflow-hidden rounded-lg border p-4 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        isActive
          ? 'border-primary bg-primary/10'
          : 'border-border bg-card hover:border-primary/50 hover:bg-secondary/50',
        disabled === true
          ? 'cursor-not-allowed opacity-50 grayscale'
          : 'cursor-pointer hover:shadow-md',
      )}
      data-testid={`action-card-${action.name}`}
      aria-label={`${action.label} - ${action.description} (Cost: ${action.cost})`}
      aria-pressed={isActive}
      type='button'
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

      {isActive === true && (
        <div className='absolute bottom-2 right-2 animate-pulse' aria-hidden='true'>
          <Play className='h-4 w-4 fill-current text-primary' />
        </div>
      )}
    </button>
  );
});

ActionCard.displayName = 'ActionCard';

export default ActionCard;
export { ActionCard };
