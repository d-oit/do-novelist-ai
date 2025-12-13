
import { Terminal, CheckCircle2, AlertTriangle, Info, Brain } from 'lucide-react';
import React, { useEffect, useRef } from 'react';

import { cn } from '@/lib/utils';

import type { LogEntry, ActionTraceStep, AgentDecision } from '@shared/types';

interface AgentConsoleProps {
  logs: LogEntry[];
  debugInfo?: {
    decisions: AgentDecision[];
    actionTraces: ActionTraceStep[];
    performanceMetrics: {
      totalDecisions: number;
      averageDecisionTime: number;
      successRate: number;
      mostRejectedAction: string;
    };
  };
}

const LogIcon = React.memo<{ type: LogEntry['type'] }>(({ type }) => {
  switch (type) {
    case 'success':
      return <CheckCircle2 className='h-3 w-3 text-green-500' />;
    case 'error':
      return <AlertTriangle className='h-3 w-3 text-red-500' />;
    case 'thought':
      return <Brain className='h-3 w-3 text-purple-500' />;
    case 'warning':
      return <AlertTriangle className='h-3 w-3 text-yellow-500' />;
    default:
      return <Info className='h-3 w-3 text-blue-500' />;
  }
});

LogIcon.displayName = 'LogIcon';

const AgentConsole: React.FC<AgentConsoleProps> = React.memo(({ logs }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className='flex h-full flex-col overflow-hidden rounded-lg border border-border bg-black/40 backdrop-blur-sm'>
      <div className='flex items-center justify-between border-b border-border bg-secondary/50 px-4 py-2'>
        <div className='flex items-center gap-2'>
          <Terminal className='h-4 w-4 text-muted-foreground' />
          <span className='font-mono text-xs font-medium text-muted-foreground'>
            AGENT_OUTPUT_STREAM
          </span>
        </div>
        <div className='flex gap-1'>
          <div className='h-2 w-2 rounded-full bg-red-500/20' />
          <div className='h-2 w-2 rounded-full bg-yellow-500/20' />
          <div className='h-2 w-2 rounded-full bg-green-500/20' />
        </div>
      </div>

      <div className='custom-scrollbar flex-1 space-y-3 overflow-y-auto p-4 font-mono text-xs'>
        {logs.length === 0 && (
          <div className='italic text-muted-foreground opacity-50'>
            System initialized. Waiting for GOAP planner...
          </div>
        )}
        {logs.map(log => (
          <div
            key={log.id}
            className='animate-in fade-in slide-in-from-bottom-1 group flex gap-3 duration-300'
          >
            <span className='w-16 shrink-0 text-muted-foreground opacity-50'>
              {log.timestamp.toLocaleTimeString([], {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
            <div className='flex items-start gap-2'>
              <div className='mt-0.5 shrink-0'>
                <LogIcon type={log.type} />
              </div>
              <div>
                <span
                  className={cn(
                    'mr-2 font-bold',
                    log.type === 'thought' ? 'text-purple-400' : 'text-primary',
                  )}
                >
                  [{log.agentName}]
                </span>
                <span
                  className={
                    log.type === 'thought' ? 'italic text-muted-foreground' : 'text-foreground'
                  }
                >
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
});

AgentConsole.displayName = 'AgentConsole';

export default AgentConsole;
