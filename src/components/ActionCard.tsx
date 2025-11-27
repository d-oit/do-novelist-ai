
import React from 'react';
import { AgentAction, AgentMode } from '../types';
import { Play, Activity, Users, Zap, BrainCircuit } from 'lucide-react';

interface ActionCardProps {
  action: AgentAction;
  isActive: boolean;
  disabled?: boolean;
  onClick: () => void;
}

const ModeIcon = ({ mode }: { mode: AgentMode | string }) => {
  switch (mode) {
    case 'SINGLE':
    case AgentMode.SINGLE: return <Zap className="w-4 h-4 text-blue-400" />;
    case 'PARALLEL':
    case AgentMode.PARALLEL: return <Activity className="w-4 h-4 text-green-400" />;
    case 'HYBRID':
    case AgentMode.HYBRID: return <BrainCircuit className="w-4 h-4 text-purple-400" />;
    case 'SWARM':
    case AgentMode.SWARM: return <Users className="w-4 h-4 text-orange-400" />;
    default: return <Zap className="w-4 h-4" />;
  }
};

const ActionCard: React.FC<ActionCardProps> = ({ action, isActive, disabled, onClick }) => {
  return (
    <div 
      onClick={disabled ? undefined : onClick}
      className={`
        relative overflow-hidden rounded-lg border p-4 transition-all duration-200
        ${isActive 
          ? 'bg-primary/10 border-primary shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
          : 'bg-card border-border hover:border-primary/50 hover:bg-secondary/50'}
        ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : 'cursor-pointer'}
      `}
      data-testid={`action-card-${action.name}`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <ModeIcon mode={action.agentMode} />
          <span className={`text-xs font-bold uppercase tracking-wider ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
            {action.agentMode}
          </span>
        </div>
        <div className="text-xs font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded">
          Cost: {action.cost}
        </div>
      </div>
      
      <h3 className="font-semibold text-foreground mb-1">{action.label}</h3>
      <p className="text-xs text-muted-foreground line-clamp-2">{action.description}</p>

      {isActive && (
        <div className="absolute bottom-2 right-2 animate-pulse">
           <Play className="w-4 h-4 text-primary fill-current" />
        </div>
      )}
    </div>
  );
};

export default ActionCard;
