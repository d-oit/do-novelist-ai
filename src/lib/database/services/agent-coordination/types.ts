/**
 * Agent coordination types
 * Defines all types for agent coordination system
 */

/**
 * Agent type enum - 19 different agent types
 */
export type AgentType =
  | 'planner_agent'
  | 'research_agent'
  | 'character_agent'
  | 'plot_agent'
  | 'world_building_agent'
  | 'dialogue_agent'
  | 'writing_agent'
  | 'editing_agent'
  | 'feedback_agent'
  | 'analytics_agent'
  | 'publishing_agent'
  | 'versioning_agent'
  | 'consistency_agent'
  | 'timeline_agent'
  | 'location_agent'
  | 'culture_agent'
  | 'map_agent'
  | 'lore_agent'
  | 'coordination_agent';

/**
 * Agent status enum
 */
export type AgentStatus = 'idle' | 'active' | 'busy' | 'paused' | 'terminated' | 'error';

/**
 * Task status enum
 */
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';

/**
 * Handoff status enum
 */
export type HandoffStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'rejected';

/**
 * Agent instance interface
 */
export interface AgentInstance {
  id: string;
  agentId: string;
  agentType: AgentType;
  status: AgentStatus;
  projectId: string | null;
  currentTask: string | null;
  handoffTarget: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Task interface
 */
export interface Task {
  id: string;
  agentId: string;
  taskType: string;
  status: TaskStatus;
  priority: number;
  inputData: Record<string, unknown>;
  outputData: Record<string, unknown> | null;
  errorMessage: string | null;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

/**
 * Handoff interface
 */
export interface Handoff {
  id: string;
  fromAgentId: string;
  toAgentId: string;
  taskId: string;
  handoffReason: string;
  contextData: Record<string, unknown>;
  timestamp: string;
  status: HandoffStatus;
}

/**
 * Agent metrics interface
 */
export interface AgentMetrics {
  id: string;
  agentId: string;
  totalDecisions: number;
  successfulDecisions: number;
  failedDecisions: number;
  averageDecisionTime: number;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  handoffsInitiated: number;
  handoffsReceived: number;
  lastActiveAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Spawn agent options
 */
export interface SpawnAgentOptions {
  agentType: AgentType;
  projectId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Assign task options
 */
export interface AssignTaskOptions {
  agentId: string;
  taskType: string;
  priority?: number;
  inputData: Record<string, unknown>;
  maxAttempts?: number;
}

/**
 * Initiate handoff options
 */
export interface InitiateHandoffOptions {
  fromAgentId: string;
  toAgentId: string;
  taskId: string;
  reason: string;
  contextData: Record<string, unknown>;
}

/**
 * Agent type descriptions for 19 agents
 */
export const AGENT_DESCRIPTIONS: Record<AgentType, string> = {
  planner_agent: 'High-level planning and coordination',
  research_agent: 'Research and fact-checking',
  character_agent: 'Character development and arcs',
  plot_agent: 'Plot structure and pacing',
  world_building_agent: 'World building and setting creation',
  dialogue_agent: 'Dialogue writing and refinement',
  writing_agent: 'Content generation and drafting',
  editing_agent: 'Content editing and proofreading',
  feedback_agent: 'User feedback processing',
  analytics_agent: 'Analytics and insights generation',
  publishing_agent: 'Publishing workflow management',
  versioning_agent: 'Version control and history',
  consistency_agent: 'Consistency checking across story',
  timeline_agent: 'Timeline management and tracking',
  location_agent: 'Location management and mapping',
  culture_agent: 'Culture and society development',
  map_agent: 'World mapping and geography',
  lore_agent: 'Lore management and documentation',
  coordination_agent: 'Master coordinator and orchestrator',
};

/**
 * Maximum number of agents that can be spawned
 */
export const MAX_AGENTS = 19;

/**
 * Default task priority levels
 */
export const TASK_PRIORITY = {
  URGENT: 100,
  HIGH: 75,
  NORMAL: 50,
  LOW: 25,
} as const;
