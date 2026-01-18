/**
 * Drizzle ORM schema for agent coordination tables
 * Stores agent instances, tasks, and handoffs
 */
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

/**
 * Agent instances table schema
 * Tracks active agent instances and their state
 */
export const agentInstances = sqliteTable('agent_instances', {
  id: text('id').primaryKey(),
  agentId: text('agent_id').notNull().unique(),
  agentType: text('agent_type').notNull(),
  status: text('status').notNull().default('idle'),
  projectId: text('project_id'),
  currentTask: text('current_task'),
  handoffTarget: text('handoff_target'),
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown>>(),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

/**
 * Agent tasks table schema
 * Queue and history of tasks assigned to agents
 */
export const agentTasks = sqliteTable('agent_tasks', {
  id: text('id').primaryKey(),
  agentId: text('agent_id').notNull(),
  taskType: text('task_type').notNull(),
  status: text('status').notNull().default('pending'),
  priority: integer('priority').notNull().default(0),
  inputData: text('input_data', { mode: 'json' }).$type<Record<string, unknown>>(),
  outputData: text('output_data', { mode: 'json' }).$type<Record<string, unknown>>(),
  errorMessage: text('error_message'),
  attempts: integer('attempts').notNull().default(0),
  maxAttempts: integer('max_attempts').notNull().default(3),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  startedAt: text('started_at'),
  completedAt: text('completed_at'),
});

/**
 * Agent handoffs table schema
 * Tracks handoffs between agents with context
 */
export const agentHandoffs = sqliteTable('agent_handoffs', {
  id: text('id').primaryKey(),
  fromAgentId: text('from_agent_id').notNull(),
  toAgentId: text('to_agent_id').notNull(),
  taskId: text('task_id').notNull(),
  handoffReason: text('handoff_reason').notNull(),
  contextData: text('context_data', { mode: 'json' }).$type<Record<string, unknown>>(),
  timestamp: text('timestamp')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  status: text('status').notNull().default('pending'),
});

/**
 * Agent performance metrics table schema
 * Tracks agent performance and statistics
 */
export const agentMetrics = sqliteTable('agent_metrics', {
  id: text('id').primaryKey(),
  agentId: text('agent_id').notNull().unique(),
  totalDecisions: integer('total_decisions').notNull().default(0),
  successfulDecisions: integer('successful_decisions').notNull().default(0),
  failedDecisions: integer('failed_decisions').notNull().default(0),
  averageDecisionTime: integer('average_decision_time_ms').notNull().default(0),
  totalTasks: integer('total_tasks').notNull().default(0),
  completedTasks: integer('completed_tasks').notNull().default(0),
  failedTasks: integer('failed_tasks').notNull().default(0),
  handoffsInitiated: integer('handoffs_initiated').notNull().default(0),
  handoffsReceived: integer('handoffs_received').notNull().default(0),
  lastActiveAt: text('last_active_at'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

/**
 * Type inference helpers
 */
export type AgentInstanceRow = typeof agentInstances.$inferSelect;
export type NewAgentInstanceRow = typeof agentInstances.$inferInsert;

export type AgentTaskRow = typeof agentTasks.$inferSelect;
export type NewAgentTaskRow = typeof agentTasks.$inferInsert;

export type AgentHandoffRow = typeof agentHandoffs.$inferSelect;
export type NewAgentHandoffRow = typeof agentHandoffs.$inferInsert;

export type AgentMetricsRow = typeof agentMetrics.$inferSelect;
export type NewAgentMetricsRow = typeof agentMetrics.$inferInsert;
