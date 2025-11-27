
import React from 'react';
import { Project, AgentAction } from '../types';
import { Check, Circle, Loader2, Zap } from 'lucide-react';

interface GoapVisualizerProps {
  project: Project;
  currentAction: AgentAction | null;
}

const GoapVisualizer: React.FC<GoapVisualizerProps> = ({ project, currentAction }) => {
  const { worldState } = project;

  // Determine Active Stage
  let activeStage = 0;
  if (worldState.hasOutline) activeStage = 1;
  if (worldState.hasOutline && worldState.chaptersCompleted > 0) activeStage = 2;
  if (worldState.chaptersCompleted === worldState.chaptersCount && worldState.chaptersCount > 0) activeStage = 3;
  if (project.status === 'Published') activeStage = 4;

  const stages = [
    { id: 0, label: 'Concept', icon: Zap },
    { id: 1, label: 'Outline', icon: Circle },
    { id: 2, label: 'Drafting', icon: Circle },
    { id: 3, label: 'Refining', icon: Circle },
    { id: 4, label: 'Publish', icon: Check }
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-4 shadow-sm">
      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
        <Zap className="w-3 h-3 text-primary" />
        Engine State
      </h3>
      
      {/* Pipeline Visualizer */}
      <div className="flex items-center justify-between relative">
        {/* Connecting Line */}
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border -z-10"></div>
        
        {stages.map((stage, index) => {
          const isActive = index === activeStage;
          const isCompleted = index < activeStage;

          return (
            <div key={stage.id} className="flex flex-col items-center gap-2 bg-card px-1 z-10">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500
                ${isActive 
                  ? 'border-primary bg-background text-primary shadow-[0_0_15px_rgba(59,130,246,0.4)] scale-110' 
                  : isCompleted 
                    ? 'border-primary bg-primary text-primary-foreground' 
                    : 'border-border bg-secondary text-muted-foreground'}
              `}>
                {isActive && currentAction ? (
                   <Loader2 className="w-4 h-4 animate-spin" />
                ) : isCompleted ? (
                   <Check className="w-4 h-4" />
                ) : (
                   <div className="w-2 h-2 rounded-full bg-current opacity-50"></div>
                )}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wide ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Current Action Detail */}
      {currentAction && (
        <div className="mt-6 flex items-center gap-3 bg-secondary/20 border border-primary/20 rounded-md p-2 animate-in fade-in slide-in-from-top-2">
          <div className="bg-primary/10 p-1.5 rounded text-primary">
             <Loader2 className="w-3 h-3 animate-spin" />
          </div>
          <div className="flex-1 min-w-0">
             <div className="text-[10px] font-bold uppercase text-muted-foreground">Executing Plan</div>
             <div className="text-xs font-medium truncate text-primary">{currentAction.label}</div>
          </div>
          <div className="text-[10px] font-mono bg-background px-2 py-1 rounded border border-border">
            {currentAction.agentMode}
          </div>
        </div>
      )}
    </div>
  );
};

export default GoapVisualizer;
