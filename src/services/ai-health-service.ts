/**
 * AI Provider Health Monitoring Service
 * Tracks provider health, latency, and manages circuit breakers
 */

import {
  getProviderHealth,
  updateProviderHealth,
  type AIProviderHealth
} from '@/lib/db';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { getAIConfig, type AIProvider } from '@/lib/ai-config';

export type HealthStatus = 'operational' | 'degraded' | 'outage';

export interface HealthCheckResult {
  provider: AIProvider;
  status: HealthStatus;
  latencyMs: number;
  errorType?: string;
  errorMessage?: string;
  timestamp: string;
}

/**
 * Check health of a single provider
 */
export async function checkProviderHealth(provider: AIProvider): Promise<HealthCheckResult> {
  const startTime = Date.now();
  const config = getAIConfig();
  const providerConfig = config.providers[provider];

  if (!providerConfig.enabled) {
    return {
      provider,
      status: 'outage',
      latencyMs: 0,
      errorMessage: `Provider ${provider} is not configured`,
      timestamp: new Date().toISOString()
    };
  }

  try {
    let model: any;
    
    switch (provider) {
      case 'openai':
        model = createOpenAI({ apiKey: providerConfig.apiKey })('gpt-4o-mini');
        break;
      case 'anthropic':
        model = createAnthropic({ apiKey: providerConfig.apiKey })('claude-3-5-haiku-20241022');
        break;
      case 'google':
        model = createGoogleGenerativeAI({ apiKey: providerConfig.apiKey })('gemini-2.0-flash-exp');
        break;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }

    await generateText({
      model,
      prompt: 'Hi',
      maxTokens: 1,
      temperature: 0
    });

    const latencyMs = Date.now() - startTime;

    return {
      provider,
      status: latencyMs > 5000 ? 'degraded' : 'operational',
      latencyMs,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const status = latencyMs > 10000 ? 'outage' : 'degraded';

    return {
      provider,
      status,
      latencyMs,
      errorMessage,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Check health of all configured providers
 */
export async function checkAllProviders(): Promise<HealthCheckResult[]> {
  const config = getAIConfig();
  const providers: AIProvider[] = ['openai', 'anthropic', 'google'];
  const enabledProviders = providers.filter(p => config.providers[p].enabled);

  const results = await Promise.allSettled(
    enabledProviders.map(p => checkProviderHealth(p))
  );

  const healthResults: HealthCheckResult[] = results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      const provider = enabledProviders[index];
      return {
        provider,
        status: 'outage',
        latencyMs: 0,
        errorMessage: 'Health check failed',
        timestamp: new Date().toISOString()
      };
    }
  });

  return healthResults;
}

/**
 * Start periodic health monitoring
 */
export function startHealthMonitoring(intervalMs: number = 300000): () => void {
  console.log(`Starting health monitoring (interval: ${intervalMs}ms)`);

  const intervalId = setInterval(async () => {
    try {
      await checkAllProviders();
    } catch (error) {
      console.error('Health check failed:', error);
    }
  }, intervalMs);

  return () => clearInterval(intervalId);
}
