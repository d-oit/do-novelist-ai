/**
 * AI Preferences Database Service
 * Provides CRUD operations for AI provider preferences, usage analytics, and health monitoring
 */

import { createClient } from '@libsql/client/web';

import { logger } from '@/lib/logging/logger';
import { type AIProvider } from '../ai-config';

import {
  type UserAIPreference,
  type AIProviderCapability,
  type AIUsageAnalytic,
  type AIProviderHealth,
  ALL_AI_SCHEMAS,
} from './schemas/ai-preferences-schema';

type Client = ReturnType<typeof createClient>;

const STORAGE_KEY = 'novelist_ai_preferences';

/**
 * Get database client (reuses existing client from db.ts if available)
 */
function getClient(): Client | null {
  const url = import.meta.env.VITE_TURSO_DATABASE_URL as string | undefined;
  const authToken = import.meta.env.VITE_TURSO_AUTH_TOKEN as string | undefined;

  if (url == null || authToken == null) return null;

  const config = {
    url: url,
    authToken: authToken,
  };

  try {
    return createClient({
      url: config.url,
      authToken: config.authToken,
    });
  } catch (e) {
    console.error('Failed to create Turso client for AI preferences', e);
    return null;
  }
}

/**
 * Initialize AI preferences database tables
 */
export async function initAIPreferencesDB(): Promise<void> {
  const client = getClient();
  if (client) {
    try {
      for (const schema of ALL_AI_SCHEMAS) {
        await client.execute(schema);
      }
      logger.info('AI Preferences DB tables initialized');
    } catch (e) {
      logger.error('Failed to initialize AI Preferences DB', { error: e });
    }
  } else {
    logger.info('Using LocalStorage for AI Preferences');
  }
}

/**
 * User AI Preferences CRUD Operations
 */

export async function getUserAIPreference(userId: string): Promise<UserAIPreference | null> {
  const client = getClient();

  if (client) {
    try {
      const result = await client.execute({
        sql: 'SELECT * FROM user_ai_preferences WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1',
        args: [userId],
      });

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      if (!row) return null;

      return {
        id: row.id as string,
        userId: row.user_id as string,
        selectedProvider: row.selected_provider as AIProvider,
        selectedModel: row.selected_model as string,
        enableFallback: row.enable_fallback === 1,
        fallbackProviders: JSON.parse(row.fallback_providers as string) as AIProvider[],
        budgetLimit: row.budget_limit as number | null,
        budgetPeriod: row.budget_period as 'daily' | 'weekly' | 'monthly' | null,
        maxTokensPerRequest: row.max_tokens_per_request as number | null,
        temperature: row.temperature as number,
        topP: row.top_p as number,
        frequencyPenalty: row.frequency_penalty as number,
        presencePenalty: row.presence_penalty as number,
        createdAt: row.created_at as string,
        updatedAt: row.updated_at as string,
      };
    } catch (e) {
      console.error('Failed to get user AI preference:', e);
      return null;
    }
  } else {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
      return stored != null ? (JSON.parse(stored) as UserAIPreference) : null;
    } catch (e) {
      console.error('Failed to parse user AI preference from localStorage:', e);
      return null;
    }
  }
}

export async function saveUserAIPreference(preference: UserAIPreference): Promise<void> {
  const client = getClient();

  if (client) {
    try {
      await client.execute({
        sql: `INSERT INTO user_ai_preferences (
          id, user_id, selected_provider, selected_model, enable_fallback,
          fallback_providers, budget_limit, budget_period, max_tokens_per_request,
          temperature, top_p, frequency_penalty, presence_penalty, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          selected_provider=excluded.selected_provider,
          selected_model=excluded.selected_model,
          enable_fallback=excluded.enable_fallback,
          fallback_providers=excluded.fallback_providers,
          budget_limit=excluded.budget_limit,
          budget_period=excluded.budget_period,
          max_tokens_per_request=excluded.max_tokens_per_request,
          temperature=excluded.temperature,
          top_p=excluded.top_p,
          frequency_penalty=excluded.frequency_penalty,
          presence_penalty=excluded.presence_penalty,
          updated_at=datetime('now')`,
        args: [
          preference.id,
          preference.userId,
          preference.selectedProvider,
          preference.selectedModel,
          preference.enableFallback ? 1 : 0,
          JSON.stringify(preference.fallbackProviders),
          preference.budgetLimit,
          preference.budgetPeriod,
          preference.maxTokensPerRequest,
          preference.temperature,
          preference.topP,
          preference.frequencyPenalty,
          preference.presencePenalty,
          preference.createdAt,
          preference.updatedAt,
        ],
      });
    } catch (e) {
      console.error('Failed to save user AI preference:', e);
      throw e;
    }
  } else {
    localStorage.setItem(`${STORAGE_KEY}_${preference.userId}`, JSON.stringify(preference));
  }
}

/**
 * AI Provider Capabilities CRUD Operations
 */

export async function getProviderCapabilities(
  provider?: AIProvider,
): Promise<AIProviderCapability[]> {
  const client = getClient();

  if (client) {
    try {
      const sql = provider
        ? 'SELECT * FROM ai_provider_capabilities WHERE provider = ? ORDER BY model_tier'
        : 'SELECT * FROM ai_provider_capabilities ORDER BY provider, model_tier';
      const args = provider ? [provider] : [];

      const result = await client.execute({ sql, args });

      return result.rows.map(row => ({
        id: row.id as string,
        provider: row.provider as AIProvider,
        modelName: row.model_name as string,
        modelTier: row.model_tier as 'fast' | 'standard' | 'advanced',
        maxTokens: row.max_tokens as number,
        inputCostPer1kTokens: row.input_cost_per_1k_tokens as number,
        outputCostPer1kTokens: row.output_cost_per_1k_tokens as number,
        supportsStreaming: row.supports_streaming === 1,
        supportsVision: row.supports_vision === 1,
        supportsFunctionCalling: row.supports_function_calling === 1,
        contextWindow: row.context_window as number,
        capabilities: row.capabilities as string,
        createdAt: row.created_at as string,
        updatedAt: row.updated_at as string,
      }));
    } catch (e) {
      console.error('Failed to get provider capabilities:', e);
      return [];
    }
  } else {
    const stored = localStorage.getItem(`${STORAGE_KEY}_capabilities`);
    const all = stored != null ? (JSON.parse(stored) as AIProviderCapability[]) : [];
    return provider ? all.filter((c: AIProviderCapability) => c.provider === provider) : all;
  }
}

export async function saveProviderCapability(capability: AIProviderCapability): Promise<void> {
  const client = getClient();

  if (client) {
    try {
      await client.execute({
        sql: `INSERT INTO ai_provider_capabilities (
          id, provider, model_name, model_tier, max_tokens,
          input_cost_per_1k_tokens, output_cost_per_1k_tokens,
          supports_streaming, supports_vision, supports_function_calling,
          context_window, capabilities, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(provider, model_name) DO UPDATE SET
          model_tier=excluded.model_tier,
          max_tokens=excluded.max_tokens,
          input_cost_per_1k_tokens=excluded.input_cost_per_1k_tokens,
          output_cost_per_1k_tokens=excluded.output_cost_per_1k_tokens,
          supports_streaming=excluded.supports_streaming,
          supports_vision=excluded.supports_vision,
          supports_function_calling=excluded.supports_function_calling,
          context_window=excluded.context_window,
          capabilities=excluded.capabilities,
          updated_at=datetime('now')`,
        args: [
          capability.id,
          capability.provider,
          capability.modelName,
          capability.modelTier,
          capability.maxTokens,
          capability.inputCostPer1kTokens,
          capability.outputCostPer1kTokens,
          capability.supportsStreaming ? 1 : 0,
          capability.supportsVision ? 1 : 0,
          capability.supportsFunctionCalling ? 1 : 0,
          capability.contextWindow,
          capability.capabilities,
          capability.createdAt,
          capability.updatedAt,
        ],
      });
    } catch (e) {
      console.error('Failed to save provider capability:', e);
      throw e;
    }
  } else {
    const stored = localStorage.getItem(`${STORAGE_KEY}_capabilities`);
    const all = stored != null ? (JSON.parse(stored) as AIProviderCapability[]) : [];
    const index = all.findIndex(
      (c: AIProviderCapability) =>
        c.provider === capability.provider && c.modelName === capability.modelName,
    );

    if (index >= 0) {
      all[index] = capability;
    } else {
      all.push(capability);
    }

    localStorage.setItem(`${STORAGE_KEY}_capabilities`, JSON.stringify(all));
  }
}

/**
 * AI Usage Analytics Operations
 */

export async function logUsageAnalytic(analytic: AIUsageAnalytic): Promise<void> {
  const client = getClient();

  if (client) {
    try {
      await client.execute({
        sql: `INSERT INTO ai_usage_analytics (
          id, user_id, provider, model_name, prompt_tokens, completion_tokens,
          total_tokens, estimated_cost, latency_ms, success, error_message,
          request_type, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          analytic.id,
          analytic.userId,
          analytic.provider,
          analytic.modelName,
          analytic.promptTokens,
          analytic.completionTokens,
          analytic.totalTokens,
          analytic.estimatedCost,
          analytic.latencyMs,
          analytic.success ? 1 : 0,
          analytic.errorMessage,
          analytic.requestType,
          analytic.createdAt,
        ],
      });
    } catch (e) {
      console.error('Failed to log usage analytic:', e);
    }
  } else {
    const stored = localStorage.getItem(`${STORAGE_KEY}_analytics`);
    const all = stored != null ? (JSON.parse(stored) as AIUsageAnalytic[]) : [];
    all.push(analytic);
    localStorage.setItem(`${STORAGE_KEY}_analytics`, JSON.stringify(all));
  }
}

export interface UsageStats {
  totalTokens: number;
  totalCost: number;
  totalRequests: number;
  successRate: number;
  avgLatencyMs: number;
}

export async function getUserUsageStats(
  userId: string,
  startDate?: string,
  endDate?: string,
): Promise<UsageStats> {
  const client = getClient();

  if (client) {
    try {
      let sql = `
        SELECT
          SUM(total_tokens) as total_tokens,
          SUM(estimated_cost) as total_cost,
          COUNT(*) as total_requests,
          AVG(CASE WHEN success = 1 THEN 1.0 ELSE 0.0 END) as success_rate,
          AVG(latency_ms) as avg_latency_ms
        FROM ai_usage_analytics
        WHERE user_id = ?
      `;
      const args: (string | number)[] = [userId];

      if (startDate != null) {
        sql += ' AND created_at >= ?';
        args.push(startDate);
      }
      if (endDate != null) {
        sql += ' AND created_at <= ?';
        args.push(endDate);
      }

      const result = await client.execute({ sql, args });
      const row = result.rows[0];

      if (row == null) {
        return {
          totalTokens: 0,
          totalCost: 0,
          totalRequests: 0,
          successRate: 0,
          avgLatencyMs: 0,
        };
      }

      return {
        totalTokens: (row.total_tokens as number) ?? 0,
        totalCost: (row.total_cost as number) ?? 0,
        totalRequests: (row.total_requests as number) ?? 0,
        successRate: ((row.success_rate as number) ?? 0) * 100,
        avgLatencyMs: (row.avg_latency_ms as number) ?? 0,
      };
    } catch (e) {
      console.error('Failed to get user usage stats:', e);
      return {
        totalTokens: 0,
        totalCost: 0,
        totalRequests: 0,
        successRate: 0,
        avgLatencyMs: 0,
      };
    }
  } else {
    const stored = localStorage.getItem(`${STORAGE_KEY}_analytics`);
    const all: AIUsageAnalytic[] = stored != null ? (JSON.parse(stored) as AIUsageAnalytic[]) : [];
    const filtered = all.filter(a => {
      if (a.userId !== userId) return false;
      if (startDate != null && a.createdAt < startDate) return false;
      if (endDate != null && a.createdAt > endDate) return false;
      return true;
    });

    const totalTokens = filtered.reduce((sum, a) => sum + a.totalTokens, 0);
    const totalCost = filtered.reduce((sum, a) => sum + a.estimatedCost, 0);
    const totalRequests = filtered.length;
    const successCount = filtered.filter(a => a.success).length;
    const avgLatencyMs =
      filtered.length > 0 ? filtered.reduce((sum, a) => sum + a.latencyMs, 0) / filtered.length : 0;

    return {
      totalTokens,
      totalCost,
      totalRequests,
      successRate: totalRequests > 0 ? (successCount / totalRequests) * 100 : 0,
      avgLatencyMs,
    };
  }
}

/**
 * AI Provider Health Operations
 */

export async function getProviderHealth(provider?: AIProvider): Promise<AIProviderHealth[]> {
  const client = getClient();

  if (client) {
    try {
      const sql = provider
        ? 'SELECT * FROM ai_provider_health WHERE provider = ?'
        : 'SELECT * FROM ai_provider_health ORDER BY provider';
      const args = provider ? [provider] : [];

      const result = await client.execute({ sql, args });

      return result.rows.map(row => ({
        id: row.id as string,
        provider: row.provider as AIProvider,
        status: row.status as 'operational' | 'degraded' | 'outage',
        uptime: row.uptime as number,
        errorRate: row.error_rate as number,
        avgLatencyMs: row.avg_latency_ms as number,
        lastCheckedAt: row.last_checked_at as string,
        lastIncidentAt: row.last_incident_at as string | null,
        incidentDescription: row.incident_description as string | null,
        createdAt: row.created_at as string,
        updatedAt: row.updated_at as string,
      }));
    } catch (e) {
      console.error('Failed to get provider health:', e);
      return [];
    }
  } else {
    const stored = localStorage.getItem(`${STORAGE_KEY}_health`);
    const all = stored != null ? (JSON.parse(stored) as AIProviderHealth[]) : [];
    return provider ? all.filter((h: AIProviderHealth) => h.provider === provider) : all;
  }
}

export async function updateProviderHealth(health: AIProviderHealth): Promise<void> {
  const client = getClient();

  if (client) {
    try {
      await client.execute({
        sql: `INSERT INTO ai_provider_health (
          id, provider, status, uptime, error_rate, avg_latency_ms,
          last_checked_at, last_incident_at, incident_description,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(provider) DO UPDATE SET
          status=excluded.status,
          uptime=excluded.uptime,
          error_rate=excluded.error_rate,
          avg_latency_ms=excluded.avg_latency_ms,
          last_checked_at=excluded.last_checked_at,
          last_incident_at=excluded.last_incident_at,
          incident_description=excluded.incident_description,
          updated_at=datetime('now')`,
        args: [
          health.id,
          health.provider,
          health.status,
          health.uptime,
          health.errorRate,
          health.avgLatencyMs,
          health.lastCheckedAt,
          health.lastIncidentAt,
          health.incidentDescription,
          health.createdAt,
          health.updatedAt,
        ],
      });
    } catch (e) {
      console.error('Failed to update provider health:', e);
      throw e;
    }
  } else {
    const stored = localStorage.getItem(`${STORAGE_KEY}_health`);
    const all = stored != null ? (JSON.parse(stored) as AIProviderHealth[]) : [];
    const index = all.findIndex((h: AIProviderHealth) => h.provider === health.provider);

    if (index >= 0) {
      all[index] = health;
    } else {
      all.push(health);
    }

    localStorage.setItem(`${STORAGE_KEY}_health`, JSON.stringify(all));
  }
}
