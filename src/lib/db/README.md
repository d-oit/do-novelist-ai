# AI Preferences Database Layer

This module provides a complete database layer for managing AI provider preferences, usage analytics, and health monitoring.

## Overview

The database layer supports both cloud (Turso DB) and local (localStorage) persistence, automatically falling back to localStorage when cloud is unavailable.

## Architecture

```
src/lib/db/
├── schemas/
│   └── ai-preferences-schema.ts    # Database schema definitions
├── ai-preferences.ts               # CRUD operations and service layer
├── __tests__/
│   └── ai-preferences.test.ts      # Comprehensive test suite
├── index.ts                        # Public API exports
└── README.md                       # This file
```

## Database Tables

### 1. user_ai_preferences
Stores user-specific AI provider settings and preferences.

**Fields:**
- `id`: Unique identifier
- `user_id`: User identifier
- `selected_provider`: Current AI provider ('openai' | 'anthropic' | 'google')
- `selected_model`: Model name
- `enable_fallback`: Enable automatic provider fallback
- `fallback_providers`: Array of fallback provider names
- `budget_limit`: Optional spending limit
- `budget_period`: Budget period ('daily' | 'weekly' | 'monthly')
- `max_tokens_per_request`: Optional token limit per request
- `temperature`: Model temperature (0-2)
- `top_p`: Nucleus sampling parameter
- `frequency_penalty`: Frequency penalty (-2 to 2)
- `presence_penalty`: Presence penalty (-2 to 2)
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

### 2. ai_provider_capabilities
Stores information about available AI providers and models.

**Fields:**
- `id`: Unique identifier
- `provider`: Provider name
- `model_name`: Model identifier
- `model_tier`: Model tier ('fast' | 'standard' | 'advanced')
- `max_tokens`: Maximum tokens supported
- `input_cost_per_1k_tokens`: Input cost per 1K tokens
- `output_cost_per_1k_tokens`: Output cost per 1K tokens
- `supports_streaming`: Streaming support flag
- `supports_vision`: Vision capability flag
- `supports_function_calling`: Function calling support flag
- `context_window`: Context window size
- `capabilities`: JSON string of additional capabilities
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

### 3. ai_usage_analytics
Tracks token usage, costs, and performance metrics.

**Fields:**
- `id`: Unique identifier
- `user_id`: User identifier
- `provider`: AI provider used
- `model_name`: Model used
- `prompt_tokens`: Input token count
- `completion_tokens`: Output token count
- `total_tokens`: Total token count
- `estimated_cost`: Estimated cost in USD
- `latency_ms`: Request latency in milliseconds
- `success`: Success flag
- `error_message`: Error message if failed
- `request_type`: Type of request (e.g., 'chapter-generation')
- `created_at`: Timestamp

### 4. ai_provider_health
Monitors health status of AI providers.

**Fields:**
- `id`: Unique identifier
- `provider`: Provider name (unique)
- `status`: Status ('operational' | 'degraded' | 'outage')
- `uptime`: Uptime percentage
- `error_rate`: Error rate percentage
- `avg_latency_ms`: Average latency in milliseconds
- `last_checked_at`: Last health check timestamp
- `last_incident_at`: Last incident timestamp
- `incident_description`: Description of last incident
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

## API Reference

### Initialization

```typescript
import { initAIPreferencesDB } from '@/lib/db';

// Initialize database tables
await initAIPreferencesDB();
```

### User Preferences

```typescript
import {
  getUserAIPreference,
  saveUserAIPreference,
  type UserAIPreference
} from '@/lib/db';

// Get user preferences
const preference = await getUserAIPreference('user-123');

// Save/update preferences
const newPreference: UserAIPreference = {
  id: 'pref-123',
  userId: 'user-123',
  selectedProvider: 'openai',
  selectedModel: 'gpt-4o',
  enableFallback: true,
  fallbackProviders: ['anthropic', 'google'],
  budgetLimit: 100.0,
  budgetPeriod: 'monthly',
  maxTokensPerRequest: 4000,
  temperature: 0.7,
  topP: 1.0,
  frequencyPenalty: 0.0,
  presencePenalty: 0.0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

await saveUserAIPreference(newPreference);
```

### Provider Capabilities

```typescript
import {
  getProviderCapabilities,
  saveProviderCapability,
  type AIProviderCapability
} from '@/lib/db';

// Get all capabilities
const allCapabilities = await getProviderCapabilities();

// Get capabilities for specific provider
const openaiCapabilities = await getProviderCapabilities('openai');

// Save capability
const capability: AIProviderCapability = {
  id: 'cap-123',
  provider: 'openai',
  modelName: 'gpt-4o',
  modelTier: 'advanced',
  maxTokens: 4096,
  inputCostPer1kTokens: 0.005,
  outputCostPer1kTokens: 0.015,
  supportsStreaming: true,
  supportsVision: true,
  supportsFunctionCalling: true,
  contextWindow: 128000,
  capabilities: JSON.stringify(['text', 'vision', 'function-calling']),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

await saveProviderCapability(capability);
```

### Usage Analytics

```typescript
import {
  logUsageAnalytic,
  getUserUsageStats,
  type AIUsageAnalytic,
  type UsageStats
} from '@/lib/db';

// Log usage
const analytic: AIUsageAnalytic = {
  id: 'anal-123',
  userId: 'user-123',
  provider: 'openai',
  modelName: 'gpt-4o',
  promptTokens: 100,
  completionTokens: 200,
  totalTokens: 300,
  estimatedCost: 0.0045,
  latencyMs: 1500,
  success: true,
  errorMessage: null,
  requestType: 'chapter-generation',
  createdAt: new Date().toISOString()
};

await logUsageAnalytic(analytic);

// Get usage statistics
const stats: UsageStats = await getUserUsageStats('user-123');
console.log(stats);
// {
//   totalTokens: 300,
//   totalCost: 0.0045,
//   totalRequests: 1,
//   successRate: 100,
//   avgLatencyMs: 1500
// }

// Get stats for date range
const monthlyStats = await getUserUsageStats(
  'user-123',
  '2024-01-01T00:00:00Z',
  '2024-01-31T23:59:59Z'
);
```

### Provider Health

```typescript
import {
  getProviderHealth,
  updateProviderHealth,
  type AIProviderHealth
} from '@/lib/db';

// Get all provider health
const allHealth = await getProviderHealth();

// Get specific provider health
const openaiHealth = await getProviderHealth('openai');

// Update health status
const health: AIProviderHealth = {
  id: 'health-123',
  provider: 'openai',
  status: 'operational',
  uptime: 99.9,
  errorRate: 0.1,
  avgLatencyMs: 1200,
  lastCheckedAt: new Date().toISOString(),
  lastIncidentAt: null,
  incidentDescription: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

await updateProviderHealth(health);
```

## Storage Behavior

### Cloud Storage (Turso DB)
When cloud credentials are configured:
- All data persists to Turso DB
- Automatic schema initialization
- Optimized queries with indexes
- Batch operations for performance

### Local Storage (Fallback)
When cloud is unavailable:
- Data stored in browser localStorage
- Same API interface maintained
- Automatic JSON serialization
- Key format: `novelist_ai_preferences_{identifier}`

## Testing

Comprehensive test suite with 24 test cases covering:
- CRUD operations for all tables
- Error handling and edge cases
- Type safety validation
- LocalStorage fallback behavior
- Analytics calculations
- Date range filtering

Run tests:
```bash
npm run test -- src/lib/db/__tests__/ai-preferences.test.ts
```

## Type Safety

All operations are fully typed with TypeScript strict mode:
- Explicit return types
- Strict null checks
- Type-safe provider and model tier enums
- Comprehensive interface definitions

## Performance Considerations

1. **Indexing**: All frequently queried columns have indexes
2. **Batch Operations**: Multiple inserts use batch API
3. **Lazy Client**: Database client created on-demand
4. **Caching**: Consider implementing application-level caching for frequently accessed data

## Future Enhancements

Potential improvements for future iterations:
- Connection pooling for cloud DB
- Query result caching
- Migration system for schema updates
- Data export/import utilities
- Real-time analytics dashboards

## Integration Example

```typescript
import { initAIPreferencesDB, getUserAIPreference, logUsageAnalytic } from '@/lib/db';

// Initialize on app startup
await initAIPreferencesDB();

// Get user preferences
const userPrefs = await getUserAIPreference('current-user-id');

// Use preferences in AI service
const response = await callAI({
  provider: userPrefs?.selectedProvider || 'openai',
  model: userPrefs?.selectedModel || 'gpt-4o',
  temperature: userPrefs?.temperature || 0.7
});

// Log usage
await logUsageAnalytic({
  id: crypto.randomUUID(),
  userId: 'current-user-id',
  provider: userPrefs?.selectedProvider || 'openai',
  modelName: userPrefs?.selectedModel || 'gpt-4o',
  promptTokens: response.usage.promptTokens,
  completionTokens: response.usage.completionTokens,
  totalTokens: response.usage.totalTokens,
  estimatedCost: calculateCost(response.usage),
  latencyMs: response.latencyMs,
  success: true,
  errorMessage: null,
  requestType: 'generation',
  createdAt: new Date().toISOString()
});
```

## License

Part of the Novelist.ai project.
