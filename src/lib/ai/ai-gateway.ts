import { generateText, streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { AIProviderConfig } from '../../types/ai-config';

export class AIGatewayClient {
  private provider: any;
  private config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
    this.provider = this.createProvider(config);
  }

  private createProvider(config: AIProviderConfig) {
    switch (config.provider) {
      case 'openai':
        return createOpenAI({ apiKey: config.apiKey });
      case 'anthropic':
        return createAnthropic({ apiKey: config.apiKey });
      case 'google':
        return createGoogleGenerativeAI({ apiKey: config.apiKey });
      default:
        throw new Error(`Provider ${config.provider} not supported`);
    }
  }

  async generateText(prompt: string): Promise<string> {
    try {
      const result = await generateText({
        model: this.provider(this.config.model),
        prompt,
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
      });
      return result;
    } catch (error) {
      console.error('AI Gateway error:', error);
      throw error;
    }
  }

  async *streamText(prompt: string): AsyncGenerator<string, void, unknown> {
    try {
      const stream = await streamText({
        model: this.provider(this.config.model),
        prompt,
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
      });

      for await (const chunk of stream) {
        yield chunk;
      }
    } catch (error) {
      console.error('AI Gateway streaming error:', error);
      throw error;
    }
  }

  getConfig(): AIProviderConfig {
    return { ...this.config };
  }
}

export async function createAIGateway(config: AIProviderConfig): Promise<AIGatewayClient> {
  return new AIGatewayClient(config);
}
