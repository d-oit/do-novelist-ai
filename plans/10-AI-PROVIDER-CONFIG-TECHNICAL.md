# AI Provider Configuration - Technical Implementation Plan

**Date:** 2025-11-28  
**Project:** Novelist.ai - AI Configuration System  
**Priority:** P0 (Critical)  
**Estimated Time:** 8 hours  

---

## Overview

This document provides the detailed technical implementation plan for the AI provider configuration system, allowing users to select and configure their preferred AI providers through Vercel AI Gateway.

---

## Architecture Overview

### Configuration Flow
```
User Settings UI → useAIConfig Hook → AI Config Service → IndexedDB Storage
                                    ↓
AI Gateway Client ← Provider Factory ← Decrypted Config
                                    ↓
Text Generation ← Selected Provider ← User's API Key
```

### Security Model
- **Client-side encryption** using Web Crypto API
- **User-specific encryption keys** derived from browser fingerprint
- **Encrypted storage** in IndexedDB with localStorage fallback
- **Runtime decryption** only when needed for API calls

---

## File Structure

### New Files to Create
```
src/
├── lib/
│   ├── ai/
│   │   ├── ai-gateway.ts          # Main AI Gateway client
│   │   ├── ai-config.ts           # Configuration types & constants
│   │   ├── provider-factory.ts    # Provider instantiation logic
│   │   └── encryption.ts          # API key encryption utilities
│   ├── hooks/
│   │   └── useAIConfig.ts         # Configuration management hook
│   └── services/
│       └── aiConfigService.ts     # Database operations
├── components/
│   └── settings/
│       └── AIProviderSettings.tsx # Configuration UI component
└── types/
    └── ai-config.ts               # TypeScript type definitions
```

### Files to Modify
```
src/
├── lib/
│   └── gemini.ts                   # Replace with AI Gateway calls
├── features/
│   ├── editor/
│   │   └── hooks/
│   │       └── useGoapEngine.ts   # Update to use new AI client
│   ├── characters/
│   │   └── services/
│   │       └── characterService.ts # Update generation calls
│   └── analytics/
│       └── services/
│           └── analyticsService.ts # Update insights generation
└── db.ts                           # Add AI config tables
```

---

## Implementation Details

### 1. Type Definitions (`src/types/ai-config.ts`)

```typescript
/**
 * AI Provider Configuration Types
 */

export type AIProvider = 'openai' | 'anthropic' | 'google' | 'meta' | 'xai';

export interface AIProviderConfig {
  id: string;
  provider: AIProvider;
  model: string;
  encryptedApiKey: string;
  temperature: number;
  maxTokens: number;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt?: Date;
}

export interface AIUsageLog {
  id: string;
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

export interface AIGatewayRequest {
  prompt: string;
  config: AIProviderConfig;
  stream?: boolean;
  abortSignal?: AbortSignal;
}

export interface AIGatewayResponse {
  text: string;
  tokensUsed: number;
  costEstimate: number;
  provider: AIProvider;
  model: string;
  responseTime: number;
}

// Provider-specific model mappings
export const PROVIDER_MODELS = {
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o', maxTokens: 128000, costPer1KTokens: 0.005 },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', maxTokens: 128000, costPer1KTokens: 0.01 },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', maxTokens: 16384, costPer1KTokens: 0.0015 },
  ],
  anthropic: [
    { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', maxTokens: 200000, costPer1KTokens: 0.003 },
    { id: 'claude-3-opus', name: 'Claude 3 Opus', maxTokens: 200000, costPer1KTokens: 0.015 },
    { id: 'claude-3-haiku', name: 'Claude 3 Haiku', maxTokens: 200000, costPer1KTokens: 0.00025 },
  ],
  google: [
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', maxTokens: 1048576, costPer1KTokens: 0.000075 },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', maxTokens: 2097152, costPer1KTokens: 0.0025 },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', maxTokens: 1048576, costPer1KTokens: 0.000075 },
  ],
  meta: [
    { id: 'llama-3.1-405b', name: 'Llama 3.1 405B', maxTokens: 131072, costPer1KTokens: 0.003 },
    { id: 'llama-3.1-70b', name: 'Llama 3.1 70B', maxTokens: 131072, costPer1KTokens: 0.00065 },
  ],
  xai: [
    { id: 'grok-2', name: 'Grok 2', maxTokens: 131072, costPer1KTokens: 0.002 },
    { id: 'grok-2-vision-1212', name: 'Grok 2 Vision', maxTokens: 8192, costPer1KTokens: 0.003 },
  ],
} as const;

// Default configurations for quick setup
export const DEFAULT_CONFIGS: Partial<AIProviderConfig>[] = [
  { provider: 'openai', model: 'gpt-4o', temperature: 0.7, maxTokens: 2000 },
  { provider: 'anthropic', model: 'claude-3-5-sonnet', temperature: 0.8, maxTokens: 2000 },
  { provider: 'google', model: 'gemini-2.0-flash', temperature: 0.7, maxTokens: 2000 },
];
```

### 2. Encryption Utilities (`src/lib/ai/encryption.ts`)

```typescript
/**
 * API Key Encryption Utilities
 * Uses Web Crypto API for client-side encryption
 */

import { crypto } from 'node:crypto';

export class EncryptionService {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;
  private static readonly SALT_LENGTH = 32;
  private static readonly IV_LENGTH = 12;

  /**
   * Generate encryption key from browser fingerprint
   */
  private static async deriveKey(userId: string): Promise<CryptoKey> {
    // Create browser fingerprint
    const fingerprint = await this.createFingerprint();
    const keyMaterial = `${userId}:${fingerprint}`;
    
    const encoder = new TextEncoder();
    const keyData = encoder.encode(keyMaterial);
    
    // Import key material
    const baseKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );
    
    // Derive encryption key
    const salt = encoder.encode('novelist-ai-salt-2025');
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      baseKey,
      { name: this.ALGORITHM, length: this.KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Create browser fingerprint for key derivation
   */
  private static async createFingerprint(): Promise<string> {
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency,
    ];
    
    const encoder = new TextEncoder();
    const data = encoder.encode(components.join('|'));
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Encrypt API key
   */
  static async encryptApiKey(apiKey: string, userId: string): Promise<string> {
    const key = await this.deriveKey(userId);
    const encoder = new TextEncoder();
    const data = encoder.encode(apiKey);
    
    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
    
    // Encrypt data
    const encryptedData = await crypto.subtle.encrypt(
      { name: this.ALGORITHM, iv },
      key,
      data
    );
    
    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedData), iv.length);
    
    // Return base64 encoded string
    return btoa(String.fromCharCode(...combined));
  }

  /**
   * Decrypt API key
   */
  static async decryptApiKey(encryptedApiKey: string, userId: string): Promise<string> {
    try {
      const key = await this.deriveKey(userId);
      
      // Decode base64
      const combined = new Uint8Array(
        atob(encryptedApiKey).split('').map(char => char.charCodeAt(0))
      );
      
      // Extract IV and encrypted data
      const iv = combined.slice(0, this.IV_LENGTH);
      const encryptedData = combined.slice(this.IV_LENGTH);
      
      // Decrypt data
      const decryptedData = await crypto.subtle.decrypt(
        { name: this.ALGORITHM, iv },
        key,
        encryptedData
      );
      
      const decoder = new TextDecoder();
      return decoder.decode(decryptedData);
    } catch (error) {
      throw new Error('Failed to decrypt API key. Invalid configuration or corrupted data.');
    }
  }

  /**
   * Test encryption/decryption
   */
  static async testEncryption(userId: string): Promise<boolean> {
    try {
      const testKey = 'test-api-key-12345';
      const encrypted = await this.encryptApiKey(testKey, userId);
      const decrypted = await this.decryptApiKey(encrypted, userId);
      return testKey === decrypted;
    } catch {
      return false;
    }
  }
}
```

### 3. AI Gateway Client (`src/lib/ai/ai-gateway.ts`)

```typescript
/**
 * Vercel AI Gateway Client
 * Unified interface for all AI providers
 */

import { generateText, streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { 
  AIProvider, 
  AIProviderConfig, 
  AIGatewayRequest, 
  AIGatewayResponse,
  PROVIDER_MODELS 
} from '@/types/ai-config';
import { EncryptionService } from './encryption';

export class AIGatewayClient {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Get provider instance based on configuration
   */
  private async getProvider(config: AIProviderConfig) {
    // Decrypt API key
    const apiKey = await EncryptionService.decryptApiKey(config.encryptedApiKey, this.userId);

    switch (config.provider) {
      case 'openai':
        return createOpenAI({ apiKey });
      case 'anthropic':
        return createAnthropic({ apiKey });
      case 'google':
        return createGoogleGenerativeAI({ apiKey });
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }
  }

  /**
   * Generate text using configured provider
   */
  async generateText(request: AIGatewayRequest): Promise<AIGatewayResponse> {
    const startTime = performance.now();
    
    try {
      const provider = await this.getProvider(request.config);
      const modelInfo = PROVIDER_MODELS[request.config.provider]
        .find(m => m.id === request.config.model);

      if (!modelInfo) {
        throw new Error(`Invalid model: ${request.config.model} for provider: ${request.config.provider}`);
      }

      const { text, usage } = await generateText({
        model: provider(request.config.model),
        prompt: request.prompt,
        temperature: request.config.temperature,
        maxTokens: request.config.maxTokens,
      });

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      // Calculate cost estimate
      const costEstimate = this.calculateCost(
        request.config.provider,
        request.config.model,
        usage?.promptTokens || 0,
        usage?.completionTokens || 0
      );

      // Log usage
      await this.logUsage({
        configId: request.config.id,
        provider: request.config.provider,
        model: request.config.model,
        promptTokens: usage?.promptTokens || 0,
        completionTokens: usage?.completionTokens || 0,
        totalTokens: usage?.totalTokens || 0,
        costEstimate,
        status: 'success',
      });

      return {
        text,
        tokensUsed: usage?.totalTokens || 0,
        costEstimate,
        provider: request.config.provider,
        model: request.config.model,
        responseTime,
      };
    } catch (error) {
      const endTime = performance.now();
      const responseTime = endTime - startTime;

      // Log failure
      await this.logUsage({
        configId: request.config.id,
        provider: request.config.provider,
        model: request.config.model,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        costEstimate: 0,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  /**
   * Stream text generation
   */
  async *streamText(request: AIGatewayRequest): AsyncGenerator<string, void, unknown> {
    const startTime = performance.now();
    let totalTokens = 0;
    let fullText = '';

    try {
      const provider = await this.getProvider(request.config);
      
      const { textStream } = await streamText({
        model: provider(request.config.model),
        prompt: request.prompt,
        temperature: request.config.temperature,
        maxTokens: request.config.maxTokens,
      });

      for await (const chunk of textStream) {
        if (request.abortSignal?.aborted) {
          throw new Error('Generation aborted');
        }
        
        fullText += chunk;
        totalTokens += this.estimateTokens(chunk);
        yield chunk;
      }

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      // Calculate cost estimate
      const costEstimate = this.calculateCost(
        request.config.provider,
        request.config.model,
        Math.floor(totalTokens * 0.3), // Estimate prompt tokens
        Math.floor(totalTokens * 0.7)  // Estimate completion tokens
      );

      // Log usage
      await this.logUsage({
        configId: request.config.id,
        provider: request.config.provider,
        model: request.config.model,
        promptTokens: Math.floor(totalTokens * 0.3),
        completionTokens: Math.floor(totalTokens * 0.7),
        totalTokens,
        costEstimate,
        status: 'success',
      });
    } catch (error) {
      const endTime = performance.now();
      const responseTime = endTime - startTime;

      // Log failure
      await this.logUsage({
        configId: request.config.id,
        provider: request.config.provider,
        model: request.config.model,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        costEstimate: 0,
        status: request.abortSignal?.aborted ? 'failed' : 'rate_limited',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  /**
   * Calculate cost based on provider and token usage
   */
  private calculateCost(
    provider: AIProvider,
    model: string,
    promptTokens: number,
    completionTokens: number
  ): number {
    const modelInfo = PROVIDER_MODELS[provider].find(m => m.id === model);
    if (!modelInfo) return 0;

    // Most providers charge differently for prompt vs completion
    const promptCost = (promptTokens / 1000) * modelInfo.costPer1KTokens;
    const completionCost = (completionTokens / 1000) * (modelInfo.costPer1KTokens * 3); // Typically 3x for completion
    
    return promptCost + completionCost;
  }

  /**
   * Estimate tokens from text (rough approximation)
   */
  private estimateTokens(text: string): number {
    // Rough estimate: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Log usage for analytics
   */
  private async logUsage(logData: {
    configId: string;
    provider: AIProvider;
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    costEstimate: number;
    status: 'success' | 'failed' | 'rate_limited';
    errorMessage?: string;
  }): Promise<void> {
    try {
      // Import dynamically to avoid circular dependencies
      const { aiConfigService } = await import('@/lib/services/aiConfigService');
      await aiConfigService.logUsage(logData);
    } catch (error) {
      console.warn('Failed to log AI usage:', error);
    }
  }

  /**
   * Test provider connection
   */
  async testConnection(config: AIProviderConfig): Promise<boolean> {
    try {
      const response = await this.generateText({
        prompt: 'Test message - respond with "OK"',
        config,
      });
      return response.text.includes('OK');
    } catch {
      return false;
    }
  }
}
```

### 4. Configuration Management Hook (`src/lib/hooks/useAIConfig.ts`)

```typescript
/**
 * AI Configuration Management Hook
 * Handles loading, saving, and updating AI provider configurations
 */

import { useState, useEffect, useCallback } from 'react';
import { AIProviderConfig, DEFAULT_CONFIGS } from '@/types/ai-config';
import { aiConfigService } from '@/lib/services/aiConfigService';
import { EncryptionService } from '@/lib/ai/encryption';

interface UseAIConfigReturn {
  configs: AIProviderConfig[];
  defaultConfig: AIProviderConfig | null;
  loading: boolean;
  error: string | null;
  addConfig: (config: Omit<AIProviderConfig, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateConfig: (id: string, updates: Partial<AIProviderConfig>) => Promise<void>;
  deleteConfig: (id: string) => Promise<void>;
  setDefaultConfig: (id: string) => Promise<void>;
  testConnection: (config: AIProviderConfig) => Promise<boolean>;
  refreshConfigs: () => Promise<void>;
}

export function useAIConfig(userId: string): UseAIConfigReturn {
  const [configs, setConfigs] = useState<AIProviderConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load configurations on mount
  useEffect(() => {
    refreshConfigs();
  }, [userId]);

  const refreshConfigs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userConfigs = await aiConfigService.getConfigs(userId);
      setConfigs(userConfigs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configurations');
      
      // Try localStorage fallback
      try {
        const cached = localStorage.getItem(`ai-configs-${userId}`);
        if (cached) {
          const parsedConfigs = JSON.parse(cached);
          setConfigs(parsedConfigs);
        }
      } catch {
        // Ignore localStorage errors
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const addConfig = useCallback(
    async (configData: Omit<AIProviderConfig, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        setError(null);

        // Encrypt API key
        const encryptedApiKey = await EncryptionService.encryptApiKey(
          configData.encryptedApiKey,
          userId
        );

        const newConfig: Omit<AIProviderConfig, 'id'> = {
          ...configData,
          encryptedApiKey,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const savedConfig = await aiConfigService.addConfig(userId, newConfig);
        
        setConfigs(prev => [...prev, savedConfig]);
        
        // Cache in localStorage
        const updatedConfigs = [...configs, savedConfig];
        localStorage.setItem(`ai-configs-${userId}`, JSON.stringify(updatedConfigs));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add configuration');
        throw err;
      }
    },
    [userId, configs]
  );

  const updateConfig = useCallback(
    async (id: string, updates: Partial<AIProviderConfig>) => {
      try {
        setError(null);

        let finalUpdates = { ...updates, updatedAt: new Date() };

        // Encrypt new API key if provided
        if (updates.encryptedApiKey) {
          finalUpdates.encryptedApiKey = await EncryptionService.encryptApiKey(
            updates.encryptedApiKey,
            userId
          );
        }

        const updatedConfig = await aiConfigService.updateConfig(userId, id, finalUpdates);
        
        setConfigs(prev => prev.map(config => 
          config.id === id ? updatedConfig : config
        ));
        
        // Update localStorage cache
        const updatedConfigs = configs.map(config => 
          config.id === id ? updatedConfig : config
        );
        localStorage.setItem(`ai-configs-${userId}`, JSON.stringify(updatedConfigs));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update configuration');
        throw err;
      }
    },
    [userId, configs]
  );

  const deleteConfig = useCallback(
    async (id: string) => {
      try {
        setError(null);
        await aiConfigService.deleteConfig(userId, id);
        
        setConfigs(prev => prev.filter(config => config.id !== id));
        
        // Update localStorage cache
        const updatedConfigs = configs.filter(config => config.id !== id);
        localStorage.setItem(`ai-configs-${userId}`, JSON.stringify(updatedConfigs));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete configuration');
        throw err;
      }
    },
    [userId, configs]
  );

  const setDefaultConfig = useCallback(
    async (id: string) => {
      try {
        setError(null);
        
        // Update all configs to remove default flag
        const updatePromises = configs.map(config =>
          aiConfigService.updateConfig(userId, config.id, { isDefault: config.id === id })
        );
        
        await Promise.all(updatePromises);
        
        // Refresh configs to get updated state
        await refreshConfigs();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to set default configuration');
        throw err;
      }
    },
    [userId, configs, refreshConfigs]
  );

  const testConnection = useCallback(
    async (config: AIProviderConfig): Promise<boolean> => {
      try {
        const { AIGatewayClient } = await import('@/lib/ai/ai-gateway');
        const client = new AIGatewayClient(userId);
        return await client.testConnection(config);
      } catch {
        return false;
      }
    },
    [userId]
  );

  const defaultConfig = configs.find(config => config.isDefault) || null;

  return {
    configs,
    defaultConfig,
    loading,
    error,
    addConfig,
    updateConfig,
    deleteConfig,
    setDefaultConfig,
    testConnection,
    refreshConfigs,
  };
}
```

### 5. Database Service (`src/lib/services/aiConfigService.ts`)

```typescript
/**
 * AI Configuration Database Service
 * Handles IndexedDB operations for AI configurations
 */

import { openDB, DBSchema } from 'idb';
import { AIProviderConfig, AIUsageLog, AIProvider } from '@/types/ai-config';

interface AIDatabase extends DBSchema {
  aiConfigs: {
    key: string;
    value: AIProviderConfig;
    indexes: {
      by_userId: string;
      by_provider: string;
      by_default: boolean;
    };
  };
  aiUsageLogs: {
    key: string;
    value: AIUsageLog;
    indexes: {
      by_configId: string;
      by_userId: string;
      by_timestamp: Date;
      by_provider: string;
    };
  };
}

let dbInstance: ReturnType<typeof openDB<AIDatabase>> | null = null;

async function getDB() {
  if (!dbInstance) {
    dbInstance = await openDB<AIDatabase>('NovelistAIDB', 1, {
      upgrade(db) {
        // AI Configurations store
        const configStore = db.createObjectStore('aiConfigs', { keyPath: 'id' });
        configStore.createIndex('by_userId', 'userId');
        configStore.createIndex('by_provider', 'provider');
        configStore.createIndex('by_default', 'isDefault');

        // Usage Logs store
        const usageStore = db.createObjectStore('aiUsageLogs', { keyPath: 'id' });
        usageStore.createIndex('by_configId', 'configId');
        usageStore.createIndex('by_userId', 'userId');
        usageStore.createIndex('by_timestamp', 'timestamp');
        usageStore.createIndex('by_provider', 'provider');
      },
    });
  }
  return dbInstance;
}

export class AIConfigService {
  /**
   * Get all configurations for a user
   */
  async getConfigs(userId: string): Promise<AIProviderConfig[]> {
    const db = await getDB();
    const tx = db.transaction('aiConfigs', 'readonly');
    const index = tx.objectStore('aiConfigs').index('by_userId');
    const configs = await index.getAll(userId);
    await tx.done;
    return configs.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  /**
   * Add new configuration
   */
  async addConfig(userId: string, configData: Omit<AIProviderConfig, 'id'>): Promise<AIProviderConfig> {
    const db = await getDB();
    const id = crypto.randomUUID();
    
    const config: AIProviderConfig = {
      ...configData,
      id,
      userId,
    };

    const tx = db.transaction('aiConfigs', 'readwrite');
    await tx.objectStore('aiConfigs').add(config);
    await tx.done;

    return config;
  }

  /**
   * Update configuration
   */
  async updateConfig(userId: string, id: string, updates: Partial<AIProviderConfig>): Promise<AIProviderConfig> {
    const db = await getDB();
    const tx = db.transaction('aiConfigs', 'readwrite');
    const store = tx.objectStore('aiConfigs');
    
    const existing = await store.get(id);
    if (!existing || existing.userId !== userId) {
      throw new Error('Configuration not found');
    }

    const updated: AIProviderConfig = {
      ...existing,
      ...updates,
      id,
      userId,
    };

    await store.put(updated);
    await tx.done;

    return updated;
  }

  /**
   * Delete configuration
   */
  async deleteConfig(userId: string, id: string): Promise<void> {
    const db = await getDB();
    const tx = db.transaction('aiConfigs', 'readwrite');
    const store = tx.objectStore('aiConfigs');
    
    const existing = await store.get(id);
    if (!existing || existing.userId !== userId) {
      throw new Error('Configuration not found');
    }

    await store.delete(id);
    await tx.done;
  }

  /**
   * Get default configuration for user
   */
  async getDefaultConfig(userId: string): Promise<AIProviderConfig | null> {
    const db = await getDB();
    const tx = db.transaction('aiConfigs', 'readonly');
    const index = tx.objectStore('aiConfigs').index('by_userId');
    const configs = await index.getAll(userId);
    await tx.done;
    
    return configs.find(config => config.isDefault) || null;
  }

  /**
   * Log AI usage for analytics
   */
  async logUsage(logData: {
    configId: string;
    provider: AIProvider;
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    costEstimate: number;
    status: 'success' | 'failed' | 'rate_limited';
    errorMessage?: string;
  }): Promise<void> {
    const db = await getDB();
    const id = crypto.randomUUID();
    
    const log: AIUsageLog = {
      id,
      timestamp: new Date(),
      ...logData,
    };

    const tx = db.transaction('aiUsageLogs', 'readwrite');
    await tx.objectStore('aiUsageLogs').add(log);
    await tx.done;
  }

  /**
   * Get usage logs for configuration
   */
  async getUsageLogs(configId: string, limit = 100): Promise<AIUsageLog[]> {
    const db = await getDB();
    const tx = db.transaction('aiUsageLogs', 'readonly');
    const index = tx.objectStore('aiUsageLogs').index('by_configId');
    const logs = await index.getAll(configId);
    await tx.done;
    
    return logs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get usage analytics for user
   */
  async getUserAnalytics(userId: string, days = 30): Promise<{
    totalTokens: number;
    totalCost: number;
    providerBreakdown: Record<AIProvider, { tokens: number; cost: number }>;
    dailyUsage: Array<{ date: string; tokens: number; cost: number }>;
  }> {
    const db = await getDB();
    const tx = db.transaction('aiUsageLogs', 'readonly');
    const index = tx.objectStore('aiUsageLogs').index('by_userId');
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const allLogs = await index.getAll(userId);
    await tx.done;
    
    const filteredLogs = allLogs.filter(log => log.timestamp >= cutoffDate && log.status === 'success');
    
    // Calculate totals
    const totalTokens = filteredLogs.reduce((sum, log) => sum + log.totalTokens, 0);
    const totalCost = filteredLogs.reduce((sum, log) => sum + log.costEstimate, 0);
    
    // Provider breakdown
    const providerBreakdown: Record<AIProvider, { tokens: number; cost: number }> = {} as any;
    for (const log of filteredLogs) {
      if (!providerBreakdown[log.provider]) {
        providerBreakdown[log.provider] = { tokens: 0, cost: 0 };
      }
      providerBreakdown[log.provider].tokens += log.totalTokens;
      providerBreakdown[log.provider].cost += log.costEstimate;
    }
    
    // Daily usage
    const dailyUsage: Record<string, { tokens: number; cost: number }> = {};
    for (const log of filteredLogs) {
      const dateKey = log.timestamp.toISOString().split('T')[0];
      if (!dailyUsage[dateKey]) {
        dailyUsage[dateKey] = { tokens: 0, cost: 0 };
      }
      dailyUsage[dateKey].tokens += log.totalTokens;
      dailyUsage[dateKey].cost += log.costEstimate;
    }
    
    return {
      totalTokens,
      totalCost,
      providerBreakdown,
      dailyUsage: Object.entries(dailyUsage).map(([date, data]) => ({ date, ...data })),
    };
  }

  /**
   * Cleanup old usage logs
   */
  async cleanupOldLogs(daysToKeep = 90): Promise<void> {
    const db = await getDB();
    const tx = db.transaction('aiUsageLogs', 'readwrite');
    const store = tx.objectStore('aiUsageLogs');
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const allLogs = await store.getAll();
    const logsToDelete = allLogs.filter(log => log.timestamp < cutoffDate);
    
    for (const log of logsToDelete) {
      await store.delete(log.id);
    }
    
    await tx.done;
  }
}

export const aiConfigService = new AIConfigService();
```

---

## Testing Strategy

### Unit Tests
```typescript
// src/lib/ai/__tests__/encryption.test.ts
describe('EncryptionService', () => {
  it('should encrypt and decrypt API keys correctly', async () => {
    const apiKey = 'sk-test123456789';
    const userId = 'user-123';
    
    const encrypted = await EncryptionService.encryptApiKey(apiKey, userId);
    const decrypted = await EncryptionService.decryptApiKey(encrypted, userId);
    
    expect(decrypted).toBe(apiKey);
  });
});

// src/lib/ai/__tests__/ai-gateway.test.ts
describe('AIGatewayClient', () => {
  it('should generate text using OpenAI provider', async () => {
    const client = new AIGatewayClient('test-user');
    const config = createMockConfig('openai', 'gpt-4o');
    
    const response = await client.generateText({
      prompt: 'Test prompt',
      config,
    });
    
    expect(response.text).toBeTruthy();
    expect(response.provider).toBe('openai');
  });
});
```

### Integration Tests
```typescript
// src/lib/hooks/__tests__/useAIConfig.test.tsx
describe('useAIConfig', () => {
  it('should load and save configurations', async () => {
    const { result } = renderHook(() => useAIConfig('test-user'));
    
    await waitFor(() => expect(result.current.loading).toBe(false));
    
    await act(async () => {
      await result.current.addConfig({
        userId: 'test-user',
        provider: 'openai',
        model: 'gpt-4o',
        encryptedApiKey: 'sk-test123',
        temperature: 0.7,
        maxTokens: 2000,
        isDefault: true,
      });
    });
    
    expect(result.current.configs).toHaveLength(1);
  });
});
```

---

## Implementation Checklist

### Phase 1: Foundation (4 hours)
- [ ] Install AI SDK dependencies
- [ ] Create type definitions
- [ ] Implement encryption service
- [ ] Set up database schema
- [ ] Create AI gateway client

### Phase 2: Configuration Management (2 hours)
- [ ] Build configuration hook
- [ ] Implement database service
- [ ] Add error handling
- [ ] Create test utilities

### Phase 3: UI Components (2 hours)
- [ ] Build settings component
- [ ] Add provider selection UI
- [ ] Implement form validation
- [ ] Add connection testing

---

**Document Status:** ✅ Ready for Implementation  
**Total Estimated Time:** 8 hours  
**Priority:** P0 (Critical)  
**Dependencies:** None (can be implemented in parallel)