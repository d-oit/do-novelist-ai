export type AIProvider =
  // Core Providers
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'mistral'
  // Extended Providers
  | 'deepseek'
  | 'cohere'
  | 'ai21'
  | 'together'
  | 'fireworks'
  | 'perplexity'
  | 'xai'
  | '01-ai'
  | 'nvidia'
  | 'amazon'
  | 'meta';

export interface AIProviderConfig {
  id?: string;
  userId?: string;
  provider: AIProvider;
  model: string;
  apiKey: string;
  temperature: number;
  maxTokens: number;
  isDefault: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  lastUsedAt?: Date;
}

export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
  contextLength: number;
  pricing: {
    input: number;
    output: number;
  };
}

export interface AIUsageLog {
  id?: string;
  configId: string;
  provider: AIProvider;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costEstimate: number;
  timestamp: Date;
  status: 'success' | 'failed' | 'rate_limited';
  errorMessage?: string;
}
