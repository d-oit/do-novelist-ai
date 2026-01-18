/**
 * Agent coordination service
 * Manages agent lifecycle, tasks, and handoffs
 */
import { eq, and, desc, type SQL, sql } from 'drizzle-orm';

import { getDrizzleClient } from '@/lib/database/drizzle';
import { agentInstances, agentTasks, agentHandoffs, agentMetrics } from '@/lib/database/schemas';
import { logger } from '@/lib/logging/logger';

import type {
  AgentInstance,
  AgentStatus,
  Task,
  TaskStatus,
  Handoff,
  HandoffStatus,
  SpawnAgentOptions,
  AssignTaskOptions,
  InitiateHandoffOptions,
  AgentType,
} from './agent-coordination/types';
import { MAX_AGENTS } from './agent-coordination/types';

/**
 * Get all active agents for a project
 */
export const getActiveAgents = async (projectId?: string): Promise<AgentInstance[]> => {
  const db = getDrizzleClient();
  if (!db) {
    logger.error('Database client not available for getActiveAgents');
    return [];
  }

  try {
    const whereCondition: SQL | undefined = projectId
      ? and(eq(agentInstances.status, 'active'), eq(agentInstances.projectId, projectId))
      : eq(agentInstances.status, 'active');

    const rows = await db.select().from(agentInstances).where(whereCondition).limit(MAX_AGENTS);
    return rows.map(row => ({
      id: row.id,
      agentId: row.agentId,
      agentType: row.agentId as AgentType,
      status: row.status as AgentStatus,
      projectId: row.projectId,
      currentTask: row.currentTask,
      handoffTarget: row.handoffTarget,
      metadata: (row.metadata as Record<string, unknown>) ?? {},
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  } catch (e) {
    logger.error('Failed to get active agents', { projectId }, e instanceof Error ? e : undefined);
    return [];
  }
};

/**
 * Get agent status
 */
export const getAgentStatus = async (agentId: string): Promise<AgentInstance | null> => {
  const db = getDrizzleClient();
  if (!db) {
    logger.error('Database client not available for getAgentStatus');
    return null;
  }

  try {
    const rows = await db
      .select()
      .from(agentInstances)
      .where(eq(agentInstances.agentId, agentId))
      .limit(1);

    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      agentId: row.agentId,
      agentType: row.agentId as AgentType,
      status: row.status as AgentStatus,
      projectId: row.projectId,
      currentTask: row.currentTask,
      handoffTarget: row.handoffTarget,
      metadata: (row.metadata as Record<string, unknown>) ?? {},
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  } catch (e) {
    logger.error('Failed to get agent status', { agentId }, e instanceof Error ? e : undefined);
    return null;
  }
};

/**
 * Spawn a new agent instance
 */
export const spawnAgent = async (options: SpawnAgentOptions): Promise<AgentInstance | null> => {
  const db = getDrizzleClient();
  if (!db) {
    logger.error('Database client not available for spawnAgent');
    return null;
  }

  try {
    // Check if we've reached the maximum number of agents
    const activeAgents = await getActiveAgents(options.projectId);
    if (activeAgents.length >= MAX_AGENTS) {
      logger.warn('Maximum number of agents reached', {
        count: activeAgents.length,
        max: MAX_AGENTS,
      });
      return null;
    }

    // Generate unique agent ID
    const agentId = `${options.agentType}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    // Create agent instance
    const instance = await db
      .insert(agentInstances)
      .values({
        id: crypto.randomUUID(),
        agentId,
        agentType: options.agentType,
        status: 'active',
        projectId: options.projectId ?? null,
        currentTask: null,
        handoffTarget: null,
        metadata: options.metadata ?? {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    if (instance.length === 0) {
      logger.error('Failed to create agent instance', { agentId });
      return null;
    }

    const row = instance[0];
    if (!row) {
      logger.error('Failed to create agent instance', { agentId });
      return null;
    }

    logger.info('Agent spawned successfully', { agentId, agentType: options.agentType });

    // Initialize metrics
    await db.insert(agentMetrics).values({
      id: crypto.randomUUID(),
      agentId,
      totalDecisions: 0,
      successfulDecisions: 0,
      failedDecisions: 0,
      averageDecisionTime: 0,
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      handoffsInitiated: 0,
      handoffsReceived: 0,
      lastActiveAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return {
      id: row.id,
      agentId: row.agentId,
      agentType: row.agentId as AgentType,
      status: row.status as AgentStatus,
      projectId: row.projectId,
      currentTask: row.currentTask,
      handoffTarget: row.handoffTarget,
      metadata: (row.metadata as Record<string, unknown>) ?? {},
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  } catch (e) {
    logger.error('Failed to spawn agent', { options }, e instanceof Error ? e : undefined);
    return null;
  }
};

/**
 * Terminate an agent instance
 */
export const terminateAgent = async (agentId: string): Promise<boolean> => {
  const db = getDrizzleClient();
  if (!db) {
    logger.error('Database client not available for terminateAgent');
    return false;
  }

  try {
    await db
      .update(agentInstances)
      .set({
        status: 'terminated',
        updatedAt: new Date().toISOString(),
      })
      .where(eq(agentInstances.agentId, agentId));

    logger.info('Agent terminated successfully', { agentId });
    return true;
  } catch (e) {
    logger.error('Failed to terminate agent', { agentId }, e instanceof Error ? e : undefined);
    return false;
  }
};

/**
 * Assign a task to an agent
 */
export const assignTask = async (options: AssignTaskOptions): Promise<Task | null> => {
  const db = getDrizzleClient();
  if (!db) {
    logger.error('Database client not available for assignTask');
    return null;
  }

  try {
    const taskId = crypto.randomUUID();

    // Create task
    const task = await db
      .insert(agentTasks)
      .values({
        id: taskId,
        agentId: options.agentId,
        taskType: options.taskType,
        status: 'pending',
        priority: options.priority ?? 50,
        inputData: options.inputData,
        outputData: null,
        errorMessage: null,
        attempts: 0,
        maxAttempts: options.maxAttempts ?? 3,
        createdAt: new Date().toISOString(),
        startedAt: null,
        completedAt: null,
      })
      .returning();

    if (task.length === 0) {
      logger.error('Failed to create task', { taskId });
      return null;
    }

    // Update agent current task
    await db
      .update(agentInstances)
      .set({
        currentTask: taskId,
        status: 'busy',
        updatedAt: new Date().toISOString(),
      })
      .where(eq(agentInstances.agentId, options.agentId));

    logger.info('Task assigned successfully', { taskId, agentId: options.agentId });

    const row = task[0];
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      agentId: row.agentId,
      taskType: row.taskType,
      status: row.status as TaskStatus,
      priority: row.priority,
      inputData: (row.inputData as Record<string, unknown>) ?? {},
      outputData: row.outputData as Record<string, unknown> | null,
      errorMessage: row.errorMessage,
      attempts: row.attempts,
      maxAttempts: row.maxAttempts,
      createdAt: row.createdAt,
      startedAt: row.startedAt,
      completedAt: row.completedAt,
    };
  } catch (e) {
    logger.error('Failed to assign task', { options }, e instanceof Error ? e : undefined);
    return null;
  }
};

/**
 * Complete a task
 */
export const completeTask = async (
  taskId: string,
  outputData: Record<string, unknown>,
  success: boolean,
): Promise<boolean> => {
  const db = getDrizzleClient();
  if (!db) {
    logger.error('Database client not available for completeTask');
    return false;
  }

  try {
    // Update task
    await db
      .update(agentTasks)
      .set({
        status: success ? 'completed' : 'failed',
        outputData,
        completedAt: new Date().toISOString(),
      })
      .where(eq(agentTasks.id, taskId));

    // Get task to update agent
    const tasks = await db.select().from(agentTasks).where(eq(agentTasks.id, taskId)).limit(1);
    if (tasks.length > 0 && tasks[0]) {
      const task = tasks[0];

      // Update agent status
      await db
        .update(agentInstances)
        .set({
          currentTask: null,
          status: 'active',
          updatedAt: new Date().toISOString(),
        })
        .where(eq(agentInstances.agentId, task.agentId));

      // Update metrics
      await db
        .update(agentMetrics)
        .set({
          totalTasks: sql`total_tasks + 1`,
          completedTasks: sql`completed_tasks + 1`,
          lastActiveAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(agentMetrics.agentId, task.agentId));
    }

    logger.info('Task completed', { taskId, success });
    return true;
  } catch (e) {
    logger.error('Failed to complete task', { taskId }, e instanceof Error ? e : undefined);
    return false;
  }
};

/**
 * Initiate a handoff between agents
 */
export const initiateHandoff = async (options: InitiateHandoffOptions): Promise<Handoff | null> => {
  const db = getDrizzleClient();
  if (!db) {
    logger.error('Database client not available for initiateHandoff');
    return null;
  }

  try {
    const handoffId = crypto.randomUUID();

    // Create handoff record
    const handoff = await db
      .insert(agentHandoffs)
      .values({
        id: handoffId,
        fromAgentId: options.fromAgentId,
        toAgentId: options.toAgentId,
        taskId: options.taskId,
        handoffReason: options.reason,
        contextData: options.contextData,
        timestamp: new Date().toISOString(),
        status: 'pending',
      })
      .returning();

    if (handoff.length === 0) {
      logger.error('Failed to create handoff', { handoffId });
      return null;
    }

    // Update from agent
    await db
      .update(agentInstances)
      .set({
        handoffTarget: options.toAgentId,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(agentInstances.agentId, options.fromAgentId));

    // Update from agent metrics
    await db
      .update(agentMetrics)
      .set({
        handoffsInitiated: sql`handoffs_initiated + 1`,
        lastActiveAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(agentMetrics.agentId, options.fromAgentId));

    logger.info('Handoff initiated', {
      handoffId,
      from: options.fromAgentId,
      to: options.toAgentId,
    });

    const row = handoff[0];
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      fromAgentId: row.fromAgentId,
      toAgentId: row.toAgentId,
      taskId: row.taskId,
      handoffReason: row.handoffReason,
      contextData: (row.contextData as Record<string, unknown>) ?? {},
      timestamp: row.timestamp,
      status: row.status as HandoffStatus,
    };
  } catch (e) {
    logger.error('Failed to initiate handoff', { options }, e instanceof Error ? e : undefined);
    return null;
  }
};

/**
 * Complete a handoff
 */
export const completeHandoff = async (handoffId: string): Promise<boolean> => {
  const db = getDrizzleClient();
  if (!db) {
    logger.error('Database client not available for completeHandoff');
    return false;
  }

  try {
    // Get handoff to update agents
    const handoffs = await db
      .select()
      .from(agentHandoffs)
      .where(eq(agentHandoffs.id, handoffId))
      .limit(1);
    if (handoffs.length === 0) {
      logger.warn('Handoff not found', { handoffId });
      return false;
    }

    const handoff = handoffs[0];
    if (!handoff) {
      logger.warn('Handoff not found', { handoffId });
      return false;
    }

    // Update handoff status
    await db
      .update(agentHandoffs)
      .set({
        status: 'completed',
      })
      .where(eq(agentHandoffs.id, handoffId));

    // Clear from agent handoff target
    await db
      .update(agentInstances)
      .set({
        handoffTarget: null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(agentInstances.agentId, handoff.fromAgentId));

    // Update to agent metrics
    await db
      .update(agentMetrics)
      .set({
        handoffsReceived: sql`handoffs_received + 1`,
        lastActiveAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(agentMetrics.agentId, handoff.toAgentId));

    logger.info('Handoff completed', { handoffId });
    return true;
  } catch (e) {
    logger.error('Failed to complete handoff', { handoffId }, e instanceof Error ? e : undefined);
    return false;
  }
};

/**
 * Get agent task history
 */
export const getAgentHistory = async (agentId: string): Promise<Task[]> => {
  const db = getDrizzleClient();
  if (!db) {
    logger.error('Database client not available for getAgentHistory');
    return [];
  }

  try {
    const rows = await db
      .select()
      .from(agentTasks)
      .where(eq(agentTasks.agentId, agentId))
      .orderBy(desc(agentTasks.createdAt))
      .limit(50);

    return rows.map(row => ({
      id: row.id,
      agentId: row.agentId,
      taskType: row.taskType,
      status: row.status as TaskStatus,
      priority: row.priority,
      inputData: (row.inputData as Record<string, unknown>) ?? {},
      outputData: row.outputData as Record<string, unknown> | null,
      errorMessage: row.errorMessage,
      attempts: row.attempts,
      maxAttempts: row.maxAttempts,
      createdAt: row.createdAt,
      startedAt: row.startedAt,
      completedAt: row.completedAt,
    }));
  } catch (e) {
    logger.error('Failed to get agent history', { agentId }, e instanceof Error ? e : undefined);
    return [];
  }
};

/**
 * Export all agent coordination service functions
 */
export const agentCoordinationService = {
  getActiveAgents,
  getAgentStatus,
  spawnAgent,
  terminateAgent,
  assignTask,
  completeTask,
  initiateHandoff,
  completeHandoff,
  getAgentHistory,
};
