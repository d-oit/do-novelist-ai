
import React from 'react';
import { Play, Pause, Loader2, BrainCircuit } from 'lucide-react';

interface PlannerControlProps {
  isPlannerRunning: boolean;
  isGenerating: boolean;
  isStyleDefined: boolean;
  onTogglePlanner: () => void;
}

const PlannerControl: React.FC<PlannerControlProps> = ({
  isPlannerRunning,
  isGenerating,
  isStyleDefined,
  onTogglePlanner
}) => {
  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm mb-4 animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center justify-between gap-4">
        
        {/* Status Text */}
        <div className="flex-1">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <BrainCircuit className={`w-4 h-4 ${isPlannerRunning ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
            GOAP Engine
          </h3>
          <p className="text-xs text-foreground mt-1 font-medium">
            {isGenerating ? (
              <span className="text-primary">Agents Active...</span>
            ) : isPlannerRunning ? (
              <span className="text-green-500">Autopilot Online</span>
            ) : (
              <span className="text-muted-foreground">Standby Mode</span>
            )}
          </p>
        </div>

        {/* Primary Action Button */}
        <button
          onClick={onTogglePlanner}
          disabled={isGenerating || !isStyleDefined}
          className={`
            relative overflow-hidden group flex items-center justify-center gap-3 px-6 py-3 rounded-lg font-bold text-sm transition-all shadow-md
            ${isPlannerRunning 
              ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20' 
              : 'bg-primary text-primary-foreground hover:shadow-primary/25 hover:scale-[1.02]'}
            disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100
          `}
          data-testid="planner-control-btn"
        >
          {isGenerating ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isPlannerRunning ? (
            <Pause className="w-5 h-5 fill-current" />
          ) : (
            <Play className="w-5 h-5 fill-current" />
          )}
          
          <span>
            {isPlannerRunning ? 'PAUSE ENGINE' : 'START AUTOPILOT'}
          </span>

          {/* Button Glow Effect */}
          {!isPlannerRunning && !isGenerating && isStyleDefined && (
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
          )}
        </button>
      </div>
      
      {/* Progress Bar (Visual Feedback) */}
      <div className="mt-3 w-full h-1 bg-secondary rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ${isPlannerRunning ? 'bg-primary w-full animate-[pulse_2s_infinite]' : 'bg-muted w-0'}`}
        ></div>
      </div>
    </div>
  );
};

export default PlannerControl;
