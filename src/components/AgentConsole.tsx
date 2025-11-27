
import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';
import { Terminal, CheckCircle2, AlertTriangle, Info, Brain } from 'lucide-react';

interface AgentConsoleProps {
  logs: LogEntry[];
}

const LogIcon = ({ type }: { type: LogEntry['type'] }) => {
  switch (type) {
    case 'success': return <CheckCircle2 className="w-3 h-3 text-green-500" />;
    case 'error': return <AlertTriangle className="w-3 h-3 text-red-500" />;
    case 'thought': return <Brain className="w-3 h-3 text-purple-500" />;
    case 'warning': return <AlertTriangle className="w-3 h-3 text-yellow-500" />;
    default: return <Info className="w-3 h-3 text-blue-500" />;
  }
};

const AgentConsole: React.FC<AgentConsoleProps> = ({ logs }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="flex flex-col h-full bg-black/40 border border-border rounded-lg overflow-hidden backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 py-2 bg-secondary/50 border-b border-border">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-mono font-medium text-muted-foreground">AGENT_OUTPUT_STREAM</span>
        </div>
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500/20"></div>
          <div className="w-2 h-2 rounded-full bg-yellow-500/20"></div>
          <div className="w-2 h-2 rounded-full bg-green-500/20"></div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-3 custom-scrollbar">
        {logs.length === 0 && (
          <div className="text-muted-foreground italic opacity-50">System initialized. Waiting for GOAP planner...</div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="flex gap-3 group animate-in fade-in slide-in-from-bottom-1 duration-300">
            <span className="text-muted-foreground shrink-0 w-16 opacity-50">
              {log.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}
            </span>
            <div className="flex gap-2 items-start">
              <div className="mt-0.5 shrink-0">
                <LogIcon type={log.type} />
              </div>
              <div>
                <span className={`font-bold mr-2 ${log.type === 'thought' ? 'text-purple-400' : 'text-primary'}`}>
                  [{log.agentName}]
                </span>
                <span className={log.type === 'thought' ? 'text-muted-foreground italic' : 'text-foreground'}>
                  {log.message}
                </span>
              </div>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
};

export default AgentConsole;
