/**
 * AI Preferences Database Schema
 * Defines tables for storing AI provider preferences, capabilities, usage analytics, and health status
 */

import { type AIProvider } from '../../ai-config';

/**
 * User AI Preferences
 * Stores per-user AI provider settings, model selection, budget limits, and fallback preferences
 */
export interface UserAIPreference {
  id: string;
  userId: string;
  selectedProvider: AIProvider;
  selectedModel: string;
  enableFallback: boolean;
  fallbackProviders: AIProvider[];
  budgetLimit: number | null;
  budgetPeriod: 'daily' | 'weekly' | 'monthly' | null;
  maxTokensPerRequest: number | null;
  temperature: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * AI Provider Capabilities
 * Stores information about available providers, models, cost tiers, and features
 */
export interface AIProviderCapability {
  id: string;
  provider: AIProvider;
  modelName: string;
  modelTier: 'fast' | 'standard' | 'advanced';
  maxTokens: number;
  inputCostPer1kTokens: number;
  outputCostPer1kTokens: number;
  supportsStreaming: boolean;
  supportsVision: boolean;
  supportsFunctionCalling: boolean;
  contextWindow: number;
  capabilities: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * AI Usage Analytics
 * Tracks token usage, costs, latency, and performance metrics per request
 */
export interface AIUsageAnalytic {
  id: string;
  userId: string;
  provider: AIProvider;
  modelName: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
  latencyMs: number;
  success: boolean;
  errorMessage: string | null;
  requestType: string;
  createdAt: string;
}

/**
 * AI Provider Health
 * Monitors health status, uptime, error rates, and performance of AI providers
 */
export interface AIProviderHealth {
  id: string;
  provider: AIProvider;
  status: 'operational' | 'degraded' | 'outage';
  uptime: number;
  errorRate: number;
  avgLatencyMs: number;
  lastCheckedAt: string;
  lastIncidentAt: string | null;
  incidentDescription: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * SQL Schema Definitions
 */

export const USER_AI_PREFERENCES_SCHEMA = `
  CREATE TABLE IF NOT EXISTS user_ai_preferences (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    selected_provider TEXT NOT NULL,
    selected_model TEXT NOT NULL,
    enable_fallback INTEGER NOT NULL DEFAULT 1,
    fallback_providers TEXT NOT NULL,
    budget_limit REAL,
    budget_period TEXT,
    max_tokens_per_request INTEGER,
    temperature REAL NOT NULL DEFAULT 0.7,
    top_p REAL NOT NULL DEFAULT 1.0,
    frequency_penalty REAL NOT NULL DEFAULT 0.0,
    presence_penalty REAL NOT NULL DEFAULT 0.0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`;

export const AI_PROVIDER_CAPABILITIES_SCHEMA = `
  CREATE TABLE IF NOT EXISTS ai_provider_capabilities (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    model_name TEXT NOT NULL,
    model_tier TEXT NOT NULL,
    max_tokens INTEGER NOT NULL,
    input_cost_per_1k_tokens REAL NOT NULL,
    output_cost_per_1k_tokens REAL NOT NULL,
    supports_streaming INTEGER NOT NULL DEFAULT 0,
    supports_vision INTEGER NOT NULL DEFAULT 0,
    supports_function_calling INTEGER NOT NULL DEFAULT 0,
    context_window INTEGER NOT NULL,
    capabilities TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(provider, model_name)
  )
`;

export const AI_USAGE_ANALYTICS_SCHEMA = `
  CREATE TABLE IF NOT EXISTS ai_usage_analytics (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    model_name TEXT NOT NULL,
    prompt_tokens INTEGER NOT NULL,
    completion_tokens INTEGER NOT NULL,
    total_tokens INTEGER NOT NULL,
    estimated_cost REAL NOT NULL,
    latency_ms INTEGER NOT NULL,
    success INTEGER NOT NULL,
    error_message TEXT,
    request_type TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`;

export const AI_PROVIDER_HEALTH_SCHEMA = `
  CREATE TABLE IF NOT EXISTS ai_provider_health (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL,
    uptime REAL NOT NULL DEFAULT 100.0,
    error_rate REAL NOT NULL DEFAULT 0.0,
    avg_latency_ms INTEGER NOT NULL DEFAULT 0,
    last_checked_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_incident_at TEXT,
    incident_description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`;

/**
 * Index definitions for optimizing queries
 */

export const AI_PREFERENCES_INDEXES = [
  'CREATE INDEX IF NOT EXISTS idx_user_ai_preferences_user_id ON user_ai_preferences(user_id)',
  'CREATE INDEX IF NOT EXISTS idx_ai_usage_analytics_user_id ON ai_usage_analytics(user_id)',
  'CREATE INDEX IF NOT EXISTS idx_ai_usage_analytics_provider ON ai_usage_analytics(provider)',
  'CREATE INDEX IF NOT EXISTS idx_ai_usage_analytics_created_at ON ai_usage_analytics(created_at)',
  'CREATE INDEX IF NOT EXISTS idx_ai_provider_capabilities_provider ON ai_provider_capabilities(provider)',
  'CREATE INDEX IF NOT EXISTS idx_ai_provider_health_provider ON ai_provider_health(provider)'
];

/**
 * All schema statements for initialization
 */
export const ALL_AI_SCHEMAS = [
  USER_AI_PREFERENCES_SCHEMA,
  AI_PROVIDER_CAPABILITIES_SCHEMA,
  AI_USAGE_ANALYTICS_SCHEMA,
  AI_PROVIDER_HEALTH_SCHEMA,
  ...AI_PREFERENCES_INDEXES
];
