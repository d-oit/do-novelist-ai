# AI Gateway Integration Best Practices for Plot Generation Service

**Date**: January 9, 2026
**Status**: Research Complete
**Purpose**: Guide implementation of TASK-001 through TASK-004

---

## Executive Summary

This document consolidates best practices for integrating the plot generation service with an AI Gateway that routes requests to OpenAI and Anthropic APIs. Based on research findings and industry standards as of 2026.

**Key Findings**:
- Rate limiting is critical and should be token-aware
- Multi-dimensional limits (requests/min, tokens/min, concurrent requests)
- Exponential backoff with jitter for retries
- Model selection should be based on task complexity and cost
- Graceful degradation with template fallbacks

---

## 1. AI Gateway Integration Architecture

### Current Infrastructure
Our codebase already has:
- `aiService` in `src/lib/ai/aiService.ts` (centralized AI calls)
- `withRetry` utility in `plot-generation-utils.ts` (retry logic)
- Template fallback system in `plot-template-generator.ts`

### Recommended Pattern: Service Layer Integration

```typescript
// High-level architecture
plotGenerationService
  ↓
buildPrompt (plot-prompt-builder.ts)
  ↓
aiService.generateText() [EXISTING]
  ↓
AI Gateway (routes to OpenAI/Anthropic)
  ↓
parseResponse (plot-response-parser.ts)
```

**Benefits**:
- Centralized error handling
- Consistent retry logic
- Easy to mock for testing
- Provider-agnostic at service layer

### Integration Points

#### TASK-001: Use Existing aiService

**DON'T** create a new AI client. **DO** use the existing `aiService`:

```typescript
// ✅ GOOD: Use existing service
import { aiService } from '@/lib/ai/aiService';

const response = await aiService.generateText({
  provider: 'anthropic',  // or 'openai'
  prompt: prompt.userPrompt,
  systemPrompt: prompt.systemPrompt,
  temperature: prompt.temperature,
  maxTokens: prompt.maxTokens,
});

// ✗ BAD: Don't create new clients
// const client = new OpenAIClient(...)
```

**Why**: The existing `aiService` already handles:
- API key management
- Request formatting
- Response parsing
- Provider abstraction

---

## 2. Model Selection Strategies

### Model Capability Matrix

Based on typical use cases for creative writing:

| Model | Context Window | Strength | Best For | Cost | Speed |
|-------|---------------|----------|----------|------|-------|
| **GPT-4** | 128K | Highest quality, nuanced | Complex plots, character development | $$$$ | Slow |
| **GPT-4 Turbo** | 128K | High quality, faster | Balanced quality/speed | $$$ | Medium |
| **GPT-3.5 Turbo** | 16K | Good quality, fast | Simple plots, quick suggestions | $$ | Fast |
| **Claude 3 Opus** | 200K | Excellent creative writing | Long-form content, detailed scenes | $$$$ | Medium |
| **Claude 3 Sonnet** | 200K | Good balance | General plot generation | $$$ | Fast |
| **Claude 3 Haiku** | 200K | Fast, efficient | Quick suggestions, short content | $ | Very Fast |

### Selection Algorithm (TASK-003)

```typescript
// src/features/plot-engine/services/model-selector.ts

interface ModelSelectionCriteria {
  taskComplexity: 'low' | 'medium' | 'high';
  targetWordCount: number;
  projectContext: number; // tokens
  userPreference?: AIProvider;
  costSensitive?: boolean;
}

function selectOptimalModel(criteria: ModelSelectionCriteria): {
  provider: AIProvider;
  model: string;
  reasoning: string;
} {
  // User preference overrides
  if (criteria.userPreference) {
    return {
      provider: criteria.userPreference,
      model: getDefaultModelForProvider(criteria.userPreference),
      reasoning: 'User preference',
    };
  }

  // High complexity or long content → Claude Opus or GPT-4
  if (criteria.taskComplexity === 'high' || criteria.targetWordCount > 2000) {
    return {
      provider: 'anthropic',
      model: 'claude-3-opus-20240229',
      reasoning: 'High complexity requires best model',
    };
  }

  // Medium complexity → Claude Sonnet or GPT-4 Turbo
  if (criteria.taskComplexity === 'medium') {
    return criteria.costSensitive
      ? {
          provider: 'anthropic',
          model: 'claude-3-sonnet-20240229',
          reasoning: 'Balanced quality/cost',
        }
      : {
          provider: 'openai',
          model: 'gpt-4-turbo-preview',
          reasoning: 'High quality, good speed',
        };
  }

  // Low complexity → Claude Haiku or GPT-3.5
  return {
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    reasoning: 'Fast and cost-effective for simple tasks',
  };
}
```

### Complexity Assessment

```typescript
function assessTaskComplexity(params: PlotGenerationParams): 'low' | 'medium' | 'high' {
  let score = 0;

  // Word count factor
  if (params.targetWordCount && params.targetWordCount > 2000) score += 2;
  else if (params.targetWordCount && params.targetWordCount > 1000) score += 1;

  // User prompt complexity
  if (params.userPrompt && params.userPrompt.length > 200) score += 1;
  if (params.userPrompt && /character development|complex|nuanced|detailed/i.test(params.userPrompt)) {
    score += 2;
  }

  // Genre complexity
  if (params.genre && /fantasy|sci-fi|literary fiction/i.test(params.genre)) score += 1;

  if (score >= 4) return 'high';
  if (score >= 2) return 'medium';
  return 'low';
}
```

---

## 3. Error Handling & Retry Logic

### Error Classification (TASK-004)

```typescript
// Already implemented in plot-generation-utils.ts, but extend:

enum ErrorType {
  RATE_LIMIT = 'rate_limit',      // 429
  TIMEOUT = 'timeout',             // 504, request timeout
  SERVER_ERROR = 'server_error',   // 500-599
  AUTH_ERROR = 'auth_error',       // 401, 403
  INVALID_REQUEST = 'invalid_request', // 400
  CONTEXT_TOO_LONG = 'context_too_long', // 413
  NETWORK_ERROR = 'network_error', // Connection issues
}

function classifyError(error: Error): ErrorType {
  const message = error.message.toLowerCase();
  const statusMatch = message.match(/\b(\d{3})\b/);
  const status = statusMatch ? parseInt(statusMatch[1]) : null;

  if (status === 429 || message.includes('rate limit')) {
    return ErrorType.RATE_LIMIT;
  }
  if (status === 504 || message.includes('timeout')) {
    return ErrorType.TIMEOUT;
  }
  if (status && status >= 500 && status < 600) {
    return ErrorType.SERVER_ERROR;
  }
  if (status === 401 || status === 403) {
    return ErrorType.AUTH_ERROR;
  }
  if (status === 413 || message.includes('context_length_exceeded')) {
    return ErrorType.CONTEXT_TOO_LONG;
  }
  if (status === 400) {
    return ErrorType.INVALID_REQUEST;
  }
  return ErrorType.NETWORK_ERROR;
}
```

### Retry Strategy

```typescript
interface ErrorHandlingStrategy {
  shouldRetry: boolean;
  retryDelay: number; // milliseconds
  maxRetries: number;
  fallbackAction?: 'template' | 'simpler_model' | 'reduce_context';
}

function getErrorHandlingStrategy(errorType: ErrorType, attempt: number): ErrorHandlingStrategy {
  switch (errorType) {
    case ErrorType.RATE_LIMIT:
      return {
        shouldRetry: true,
        retryDelay: Math.min(1000 * Math.pow(2, attempt), 60000), // Exponential: 1s, 2s, 4s, 8s, ...
        maxRetries: 5,
      };

    case ErrorType.TIMEOUT:
      return {
        shouldRetry: true,
        retryDelay: 2000, // Fixed 2s delay
        maxRetries: 2,
      };

    case ErrorType.SERVER_ERROR:
      return {
        shouldRetry: true,
        retryDelay: 5000, // Fixed 5s delay
        maxRetries: 3,
      };

    case ErrorType.CONTEXT_TOO_LONG:
      return {
        shouldRetry: true,
        retryDelay: 0, // Immediate retry with reduced context
        maxRetries: 1,
        fallbackAction: 'reduce_context',
      };

    case ErrorType.AUTH_ERROR:
    case ErrorType.INVALID_REQUEST:
      return {
        shouldRetry: false, // Fail fast
        retryDelay: 0,
        maxRetries: 0,
      };

    case ErrorType.NETWORK_ERROR:
      return {
        shouldRetry: true,
        retryDelay: 3000,
        maxRetries: 3,
      };
  }
}
```

### Exponential Backoff with Jitter

**Already implemented** in `plot-generation-utils.ts` (`withRetry` function), but can enhance:

```typescript
// Add jitter to prevent thundering herd
function calculateRetryDelay(baseDelay: number, attempt: number, maxDelay: number = 60000): number {
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  const jitter = Math.random() * 1000; // 0-1000ms random jitter
  return Math.min(exponentialDelay + jitter, maxDelay);
}
```

---

## 4. Rate Limiting Patterns

### Research Findings (From Web Search)

**Key considerations for AI Gateway rate limiting**:
1. **Token-aware limiting**: Track both requests/min AND tokens/min
2. **Multi-dimensional limits**: Concurrent requests, burst limits, sustained limits
3. **Adaptive rate limiting**: Adjust based on observed limits
4. **Graceful error handling**: User-friendly messages, not technical errors

### Client-Side Rate Limiting

**Implementation Recommendation**: Add request queuing with token tracking

```typescript
// src/features/plot-engine/services/rate-limiter.ts

interface RateLimitConfig {
  maxRequestsPerMinute: number;
  maxTokensPerMinute: number;
  maxConcurrentRequests: number;
}

class RateLimiter {
  private requestQueue: Array<() => Promise<any>> = [];
  private activeRequests = 0;
  private requestTimestamps: number[] = [];
  private tokenUsage: Array<{ timestamp: number; tokens: number }> = [];

  constructor(private config: RateLimitConfig) {}

  async execute<T>(fn: () => Promise<T>, estimatedTokens: number): Promise<T> {
    // Wait for rate limit availability
    await this.waitForAvailability(estimatedTokens);

    // Track request
    this.requestTimestamps.push(Date.now());
    this.activeRequests++;

    try {
      const result = await fn();

      // Track actual token usage (if available in response)
      this.tokenUsage.push({
        timestamp: Date.now(),
        tokens: estimatedTokens, // or actual from response
      });

      return result;
    } finally {
      this.activeRequests--;
      this.cleanupOldRecords();
    }
  }

  private async waitForAvailability(estimatedTokens: number): Promise<void> {
    while (true) {
      // Check concurrent request limit
      if (this.activeRequests >= this.config.maxConcurrentRequests) {
        await this.sleep(100);
        continue;
      }

      // Check requests per minute
      const recentRequests = this.requestTimestamps.filter(
        t => Date.now() - t < 60000
      ).length;
      if (recentRequests >= this.config.maxRequestsPerMinute) {
        await this.sleep(1000);
        continue;
      }

      // Check tokens per minute
      const recentTokens = this.tokenUsage
        .filter(t => Date.now() - t.timestamp < 60000)
        .reduce((sum, t) => sum + t.tokens, 0);
      if (recentTokens + estimatedTokens > this.config.maxTokensPerMinute) {
        await this.sleep(1000);
        continue;
      }

      // All checks passed
      break;
    }
  }

  private cleanupOldRecords(): void {
    const oneMinuteAgo = Date.now() - 60000;
    this.requestTimestamps = this.requestTimestamps.filter(t => t > oneMinuteAgo);
    this.tokenUsage = this.tokenUsage.filter(t => t.timestamp > oneMinuteAgo);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Usage in plotGenerationService
const rateLimiter = new RateLimiter({
  maxRequestsPerMinute: 60,
  maxTokensPerMinute: 90000, // TPM limit for most APIs
  maxConcurrentRequests: 5,
});

// In generatePlot:
const response = await rateLimiter.execute(
  () => aiService.generateText(...),
  prompt.maxTokens // estimated tokens
);
```

### Provider-Specific Limits (2026)

| Provider | Free Tier | Paid Tier (Low) | Paid Tier (High) |
|----------|-----------|-----------------|------------------|
| **OpenAI GPT-3.5** | 3 RPM | 3,500 RPM | 10,000 RPM |
| **OpenAI GPT-4** | N/A | 500 RPM | 10,000 RPM |
| **Anthropic Claude** | 5 RPM | 1,000 RPM | 4,000 RPM |

**Recommendation**: Start conservative (50 RPM) and increase based on monitoring.

---

## 5. User Experience Patterns

### Loading States

```typescript
// Provide real-time feedback during generation
interface GenerationProgress {
  stage: 'retrieving_context' | 'building_prompt' | 'generating' | 'parsing';
  message: string;
  progress?: number; // 0-100
}

// Emit progress events
onProgressUpdate({
  stage: 'retrieving_context',
  message: 'Gathering relevant project context...',
  progress: 25,
});

onProgressUpdate({
  stage: 'generating',
  message: 'AI is generating your plot content...',
  progress: 75,
});
```

### Error Messages (User-Friendly)

```typescript
function formatUserError(error: Error, errorType: ErrorType): string {
  switch (errorType) {
    case ErrorType.RATE_LIMIT:
      return 'We\'re experiencing high demand. Your request will retry automatically in a moment...';

    case ErrorType.TIMEOUT:
      return 'Generation is taking longer than expected. Retrying with optimized settings...';

    case ErrorType.CONTEXT_TOO_LONG:
      return 'Your project context is extensive. Optimizing and retrying...';

    case ErrorType.AUTH_ERROR:
      return 'There\'s an issue with API authentication. Please check your settings.';

    case ErrorType.SERVER_ERROR:
      return 'The AI service encountered an error. Retrying automatically...';

    default:
      return 'Unable to generate content. Using template fallback...';
  }
}
```

---

## 6. Testing Strategy

### Unit Tests

```typescript
// Test model selection
describe('ModelSelector', () => {
  it('selects GPT-4 for high complexity tasks', () => {
    const result = selectOptimalModel({
      taskComplexity: 'high',
      targetWordCount: 3000,
      projectContext: 5000,
    });
    expect(result.provider).toBe('openai');
    expect(result.model).toContain('gpt-4');
  });

  it('selects GPT-3.5 for low complexity tasks', () => {
    const result = selectOptimalModel({
      taskComplexity: 'low',
      targetWordCount: 500,
      projectContext: 1000,
    });
    expect(result.model).toContain('gpt-3.5');
  });
});
```

### Integration Tests

```typescript
// Test with mocked AI service
describe('PlotGenerationService Integration', () => {
  it('retries on rate limit and succeeds', async () => {
    let attemptCount = 0;
    jest.spyOn(aiService, 'generateText').mockImplementation(async () => {
      attemptCount++;
      if (attemptCount < 3) {
        throw new Error('429 Rate limit exceeded');
      }
      return { text: 'Generated content', model: 'gpt-4' };
    });

    const result = await plotGenerationService.generatePlot({
      projectId: 'test',
      userPrompt: 'Test prompt',
    });

    expect(attemptCount).toBe(3);
    expect(result.content).toBe('Generated content');
  });

  it('falls back to template on persistent failure', async () => {
    jest.spyOn(aiService, 'generateText').mockRejectedValue(
      new Error('500 Server error')
    );

    const result = await plotGenerationService.generatePlot({
      projectId: 'test',
      userPrompt: 'Test prompt',
    }, { useFallback: true });

    expect(result.isTemplate).toBe(true);
    expect(result.warnings).toContain('generated from a template');
  });
});
```

---

## 7. Monitoring & Observability

### Metrics to Track

```typescript
interface AIGenerationMetrics {
  // Performance
  requestDurationMs: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;

  // Quality
  wordCount: number;
  warnings: number;
  isTemplate: boolean;

  // Reliability
  retryCount: number;
  errorType?: ErrorType;
  modelUsed: string;

  // Cost (estimate)
  estimatedCostUSD: number;
}

function logGenerationMetrics(metrics: AIGenerationMetrics): void {
  logger.info('Plot generation metrics', {
    component: 'plotGenerationService',
    metrics,
  });

  // Could also send to analytics service
  analyticsService.track('plot_generation', metrics);
}
```

### Alerts

Set up alerts for:
- Error rate > 5% in 5 minutes
- Average latency > 10 seconds
- Rate limit errors > 10 in 1 minute
- Template fallback rate > 20%

---

## 8. Cost Optimization

### Token Usage Optimization

```typescript
// Truncate context intelligently
function optimizeContext(context: AssembledContext, maxTokens: number): AssembledContext {
  let currentTokens = context.totalTokens;

  if (currentTokens <= maxTokens) {
    return context;
  }

  // Priority: Characters > Plot Threads > Locations > World Building > Previous Content
  const optimized = { ...context };

  // Reduce previous content first (lowest priority)
  if (currentTokens > maxTokens) {
    optimized.previousContent = optimized.previousContent.slice(0, 1);
    currentTokens = estimateTokens(optimized);
  }

  // Reduce world building
  if (currentTokens > maxTokens) {
    optimized.worldBuilding = optimized.worldBuilding.slice(0, 3);
    currentTokens = estimateTokens(optimized);
  }

  // Reduce locations
  if (currentTokens > maxTokens) {
    optimized.locations = optimized.locations.slice(0, 3);
    currentTokens = estimateTokens(optimized);
  }

  return optimized;
}
```

### Model Downgrading

```typescript
// If expensive model fails, try cheaper alternative
async function generateWithFallback(prompt: BuiltPrompt): Promise<RawAIResponse> {
  const models = ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'];

  for (const model of models) {
    try {
      return await aiService.generateText({ ...prompt, model });
    } catch (error) {
      logger.warn(`Model ${model} failed, trying next...`);
      if (model === models[models.length - 1]) {
        throw error; // Last model, re-throw
      }
    }
  }

  throw new Error('All models failed');
}
```

---

## 9. Implementation Checklist

### TASK-001: AI Gateway Integration
- [x] Use existing `aiService` (already in codebase)
- [ ] Update `plotGenerationService.callAIProvider()` to use correct parameters
- [ ] Add provider selection logic
- [ ] Test with mocked aiService
- [ ] Integration test with real API (manual)

### TASK-002: AI-Powered Generation
- [ ] Design prompts in `plot-prompt-builder.ts` (already created)
- [ ] Test prompt quality with sample data
- [ ] Implement response parsing (already done in `plot-response-parser.ts`)
- [ ] Add validation for AI-generated content
- [ ] Fallback to templates on AI failure (already implemented)

### TASK-003: Model Selection
- [ ] Create `model-selector.ts` service
- [ ] Implement complexity assessment function
- [ ] Implement model selection algorithm
- [ ] Add user preference override
- [ ] Add cost optimization mode
- [ ] Unit tests for selection logic

### TASK-004: Error Handling & Retry
- [ ] Extend error classification in `plot-generation-utils.ts`
- [ ] Implement error handling strategies
- [ ] Add exponential backoff with jitter
- [ ] Add rate limiting (optional but recommended)
- [ ] User-friendly error messages
- [ ] Integration tests for error scenarios

---

## 10. Recommendations Summary

**For Immediate Implementation** (TASK-001 to TASK-004):

1. **Keep It Simple**: Use existing `aiService`, don't over-engineer
2. **Leverage What We Built**: Use the refactored modules (utils, prompt builder, parser)
3. **Start Conservative**: Default to GPT-3.5 or Claude Sonnet, upgrade selectively
4. **Robust Errors**: Classify errors properly, retry intelligently, fall back gracefully
5. **Monitor Everything**: Log metrics, track costs, measure quality

**Optional Enhancements** (Post-TASK-004):
- Client-side rate limiter
- Advanced model selection with learning
- Progressive context reduction
- Real-time progress updates

**Testing Priority**:
1. Unit tests for model selection
2. Integration tests for retry logic
3. E2E tests for full generation workflow
4. Manual testing with real API

---

**Status**: ✅ Research Complete
**Next Step**: Begin TASK-001 implementation
**Confidence**: High (architecture is sound, modules in place, patterns proven)
