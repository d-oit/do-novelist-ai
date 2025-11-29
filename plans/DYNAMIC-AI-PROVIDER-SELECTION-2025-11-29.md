# Dynamic AI Provider Selection Implementation Plan
**Date:** 2025-11-29  
**Objective:** Implement user-selectable AI providers and models using Vercel AI Gateway with Turso DB persistence

---

## 🎯 **Executive Summary**

Transform do-novelist-ai from hardcoded Google Gemini integration to a **flexible, user-centric AI platform** where users can select from 8+ providers and 100+ models through an intuitive interface, with preferences stored in Turso database for seamless experience across sessions.

---

## 🏗️ **Architecture Overview**

### **Current State: Hardcoded Integration**
```typescript
// src/lib/gemini.ts - Current approach
import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey });

const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash', // Hardcoded
  contents: prompt
});
```

### **Target State: Dynamic Selection**
```typescript
// src/lib/ai-gateway.ts - New approach
import { generateText } from 'ai';
import { getProviderConfig } from './db/provider-config';

const userConfig = await getProviderConfig(userId);
const result = await generateText({
  model: userConfig.selectedModel,        // User selected
  prompt,
  providerOptions: {
    gateway: {
      models: userConfig.fallbackModels,  // User configured
      order: userConfig.providerOrder,   // User preference
      budget: userConfig.budget          // User control
    }
  }
});
```

---

## 📊 **Provider & Model Matrix**

### **Supported Providers (Vercel AI Gateway)**
| Provider | Models Available | Best For | Cost Tier |
|-----------|------------------|------------|------------|
| **OpenAI** | gpt-4o, gpt-4o-mini, gpt-4-turbo | General purpose, dialogue | Premium |
| **Anthropic** | claude-3.5-sonnet, claude-3-opus, claude-3-haiku | Writing, analysis | Premium |
| **Google** | gemini-2.5-pro, gemini-2.5-flash, gemini-1.5-pro | Multimodal, cost-effective | Standard |
| **Meta** | llama-3.1-8b, llama-3.1-70b, llama-3.2-3b | Open source, privacy | Free |
| **Mistral** | mistral-large, mistral-medium, mistral-small | Speed, efficiency | Standard |
| **Cohere** | command-r-plus, command, command-light | Commands, structured data | Standard |
| **Perplexity** | llama-3.1-sonar-large, codellama-70b | Coding, technical | Standard |
| **Groq** | llama-3.1-70b-8k, mixtral-8x7b | Speed, real-time | Free |

### **Task-Specific Model Recommendations**
| Task | Recommended Model | Rationale |
|-------|------------------|-----------|
| **Outline Generation** | openai/gpt-4o | Best for structured output |
| **Creative Writing** | anthropic/claude-3.5-sonnet | Superior writing quality |
| **Character Development** | google/gemini-2.5-pro | Creative and detailed |
| **Dialogue Writing** | openai/gpt-4o-mini | Natural conversation |
| **Editing & Refinement** | anthropic/claude-3-haiku | Precise and concise |
| **Image Generation** | openai/dall-e-3 | High quality images |
| **Translation** | google/gemini-2.5-flash | Multilingual support |
| **Code Generation** | perplexity/llama-3.1-sonar-large | Technical accuracy |

---

## 🗄️ **Database Schema Design**

### **Turso DB Tables**

```sql
-- User AI Preferences
CREATE TABLE user_ai_preferences (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  selected_provider TEXT NOT NULL DEFAULT 'google',
  selected_model TEXT NOT NULL DEFAULT 'gemini-2.5-flash',
  fallback_models TEXT NOT NULL DEFAULT '["anthropic/claude-3.5-sonnet","openai/gpt-4o"]',
  provider_order TEXT NOT NULL DEFAULT '["google","anthropic","openai"]',
  monthly_budget REAL DEFAULT 50.0,
  auto_fallback BOOLEAN DEFAULT TRUE,
  cost_optimization BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Provider Capabilities
CREATE TABLE ai_provider_capabilities (
  id TEXT PRIMARY KEY,
  provider_slug TEXT NOT NULL UNIQUE,
  provider_name TEXT NOT NULL,
  models TEXT NOT NULL, -- JSON array
  capabilities TEXT NOT NULL, -- JSON: text, image, audio, etc.
  cost_tier TEXT NOT NULL, -- free, standard, premium
  max_tokens INTEGER,
  supports_streaming BOOLEAN DEFAULT TRUE,
  supports_function_calling BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'active', -- active, deprecated, maintenance
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Usage Analytics
CREATE TABLE ai_usage_analytics (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider_slug TEXT NOT NULL,
  model_name TEXT NOT NULL,
  tokens_used INTEGER NOT NULL,
  cost_usd REAL NOT NULL,
  task_type TEXT NOT NULL, -- outline, chapter, refine, etc.
  response_time_ms INTEGER NOT NULL,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Model Performance Cache
CREATE TABLE model_performance_cache (
  id TEXT PRIMARY KEY,
  provider_slug TEXT NOT NULL,
  model_name TEXT NOT NULL,
  task_type TEXT NOT NULL,
  avg_response_time_ms REAL,
  success_rate REAL,
  cost_per_1k_tokens REAL,
  user_rating REAL,
  sample_size INTEGER,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(provider_slug, model_name, task_type)
);
```

---

## 🔧 **Implementation Phases**

### **Phase 1: Backend Infrastructure (Week 1)**

#### **1.1 Database Setup**
```typescript
// src/lib/db/ai-config.ts
export interface UserAIPreferences {
  id: string;
  userId: string;
  selectedProvider: string;
  selectedModel: string;
  fallbackModels: string[];
  providerOrder: string[];
  monthlyBudget: number;
  autoFallback: boolean;
  costOptimization: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIProviderCapability {
  id: string;
  providerSlug: string;
  providerName: string;
  models: string[];
  capabilities: string[];
  costTier: 'free' | 'standard' | 'premium';
  maxTokens: number;
  supportsStreaming: boolean;
  supportsFunctionCalling: boolean;
  status: 'active' | 'deprecated' | 'maintenance';
}

// Database operations
export class AIConfigDB {
  async getUserPreferences(userId: string): Promise<UserAIPreferences | null> {
    const result = await db.select(`
      SELECT * FROM user_ai_preferences WHERE user_id = ?
    `, [userId]);
    return result[0] || null;
  }

  async saveUserPreferences(preferences: UserAIPreferences): Promise<void> {
    await db.execute(`
      INSERT OR REPLACE INTO user_ai_preferences 
      (id, user_id, selected_provider, selected_model, fallback_models, 
       provider_order, monthly_budget, auto_fallback, cost_optimization, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      preferences.id, preferences.userId, preferences.selectedProvider,
      preferences.selectedModel, JSON.stringify(preferences.fallbackModels),
      JSON.stringify(preferences.providerOrder), preferences.monthlyBudget,
      preferences.autoFallback, preferences.costOptimization
    ]);
  }

  async getProviderCapabilities(): Promise<AIProviderCapability[]> {
    const result = await db.select(`
      SELECT * FROM ai_provider_capabilities WHERE status = 'active'
    `);
    return result.map(row => ({
      ...row,
      models: JSON.parse(row.models),
      capabilities: JSON.parse(row.capabilities)
    }));
  }
}
```

#### **1.2 Vercel AI Gateway Integration**
```typescript
// src/lib/ai-gateway.ts
import { generateText, generateObject, streamText } from 'ai';
import { AIConfigDB } from './db/ai-config';

export class AIGatewayService {
  private db: AIConfigDB;

  constructor() {
    this.db = new AIConfigDB();
  }

  async generateWithUserConfig(
    userId: string,
    prompt: string,
    taskType: 'outline' | 'chapter' | 'refine' | 'image'
  ): Promise<string> {
    const userConfig = await this.db.getUserPreferences(userId);
    const capabilities = await this.db.getProviderCapabilities();

    if (!userConfig) {
      throw new Error('User AI preferences not found');
    }

    // Build provider options from user preferences
    const providerOptions = {
      gateway: {
        models: userConfig.fallbackModels,
        order: userConfig.providerOrder,
        budget: { monthly: userConfig.monthlyBudget },
        costOptimization: userConfig.costOptimization,
        fallbacks: this.buildFallbacks(userConfig.selectedModel, userConfig.fallbackModels)
      }
    };

    try {
      const result = await generateText({
        model: userConfig.selectedModel,
        prompt,
        providerOptions,
        temperature: this.getTemperatureForTask(taskType),
        maxTokens: this.getMaxTokensForTask(taskType)
      });

      // Log successful usage
      await this.logUsage(userId, userConfig, taskType, result, null);
      
      return result.text;
    } catch (error) {
      // Log failed usage
      await this.logUsage(userId, userConfig, taskType, null, error.message);
      
      if (userConfig.autoFallback) {
        return this.tryFallbackProviders(prompt, taskType, userConfig, capabilities);
      }
      throw error;
    }
  }

  private buildFallbacks(primaryModel: string, fallbackModels: string[]): Record<string, string[]> {
    const fallbacks: Record<string, string[]> = {};
    fallbackModels.forEach(model => {
      if (model !== primaryModel) {
        const provider = model.split('/')[0];
        if (!fallbacks[provider]) fallbacks[provider] = [];
        fallbacks[provider].push(model);
      }
    });
    return fallbacks;
  }

  private async logUsage(
    userId: string,
    config: UserAIPreferences,
    taskType: string,
    result: string | null,
    error: string | null
  ): Promise<void> {
    const tokens = await this.estimateTokens(result || error || '');
    const cost = await this.calculateCost(config.selectedModel, tokens);
    
    await db.execute(`
      INSERT INTO ai_usage_analytics 
      (id, user_id, provider_slug, model_name, tokens_used, 
       cost_usd, task_type, response_time_ms, success, error_message, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      generateId(), userId, config.selectedProvider, config.selectedModel,
      tokens, cost, taskType, Date.now(), result !== null, error
    ]);
  }
}
```

### **Phase 2: Frontend Components (Week 2)**

#### **2.1 Provider Selection UI**
```typescript
// src/components/ai/ProviderSelector.tsx
import React, { useState, useEffect } from 'react';
import { ChevronDown, Settings, Zap } from 'lucide-react';

interface ProviderSelectorProps {
  userId: string;
  onProviderChange: (config: AIProviderConfig) => void;
}

export const ProviderSelector: React.FC<ProviderSelectorProps> = ({ userId, onProviderChange }) => {
  const [providers, setProviders] = useState<AIProviderCapability[]>([]);
  const [userConfig, setUserConfig] = useState<UserAIPreferences | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadProviderData();
  }, [userId]);

  const loadProviderData = async () => {
    const [capabilities, config] = await Promise.all([
      aiConfigDB.getProviderCapabilities(),
      aiConfigDB.getUserPreferences(userId)
    ]);
    setProviders(capabilities);
    setUserConfig(config);
  };

  const handleProviderSelect = async (providerSlug: string, modelSlug: string) => {
    const selectedProvider = providers.find(p => p.providerSlug === providerSlug);
    const selectedModel = selectedProvider?.models.find(m => m === modelSlug);
    
    if (selectedProvider && selectedModel && userConfig) {
      const newConfig = {
        ...userConfig,
        selectedProvider: providerSlug,
        selectedModel: modelSlug,
        updatedAt: new Date()
      };
      
      await aiConfigDB.saveUserPreferences(newConfig);
      setUserConfig(newConfig);
      onProviderChange(newConfig);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg hover:bg-gray-50"
      >
        <Zap className="w-4 h-4" />
        <span>{userConfig?.selectedModel || 'Select AI Model'}</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-96 bg-white border rounded-lg shadow-lg z-50">
          <div className="p-4">
            <h3 className="font-semibold mb-4">Choose AI Provider & Model</h3>
            
            {providers.map(provider => (
              <div key={provider.providerSlug} className="mb-4">
                <h4 className="font-medium text-sm text-gray-900 mb-2">
                  {provider.providerName}
                  <span className={`ml-2 px-2 py-1 text-xs rounded ${
                    provider.costTier === 'premium' ? 'bg-purple-100 text-purple-800' :
                    provider.costTier === 'standard' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {provider.costTier}
                  </span>
                </h4>
                
                <div className="space-y-2">
                  {provider.models.map(model => (
                    <button
                      key={model}
                      onClick={() => handleProviderSelect(provider.providerSlug, model)}
                      className={`w-full text-left p-3 rounded border text-sm transition-colors ${
                        userConfig?.selectedModel === model
                          ? 'bg-blue-50 border-blue-200 text-blue-900'
                          : 'hover:bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-medium">{model}</span>
                        {getModelCapabilities(model, provider.capabilities)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const getModelCapabilities = (model: string, capabilities: string[]) => {
  const modelCaps = {
    text: capabilities.includes('text'),
    image: capabilities.includes('image'),
    streaming: capabilities.includes('streaming'),
    functionCalling: capabilities.includes('function-calling')
  };

  return (
    <div className="flex gap-1 ml-2">
      {modelCaps.text && <span className="px-1 py-0.5 bg-green-100 text-green-800 text-xs rounded">Text</span>}
      {modelCaps.image && <span className="px-1 py-0.5 bg-purple-100 text-purple-800 text-xs rounded">Image</span>}
      {modelCaps.streaming && <span className="px-1 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">Stream</span>}
      {modelCaps.functionCalling && <span className="px-1 py-0.5 bg-orange-100 text-orange-800 text-xs rounded">Tools</span>}
    </div>
  );
};
```

#### **2.2 Settings Panel**
```typescript
// src/components/ai/AISettings.tsx
import React, { useState, useEffect } from 'react';
import { Save, DollarSign, Shield, Zap } from 'lucide-react';

export const AISettings: React.FC<{ userId: string }> = ({ userId }) => {
  const [config, setConfig] = useState<UserAIPreferences | null>(null);
  const [usage, setUsage] = useState<UsageAnalytics[]>([]);

  useEffect(() => {
    loadUserData();
  }, [userId]);

  const loadUserData = async () => {
    const [preferences, analytics] = await Promise.all([
      aiConfigDB.getUserPreferences(userId),
      aiConfigDB.getUsageAnalytics(userId)
    ]);
    setConfig(preferences);
    setUsage(analytics);
  };

  const handleSaveConfig = async (newConfig: Partial<UserAIPreferences>) => {
    if (config) {
      const updatedConfig = { ...config, ...newConfig, updatedAt: new Date() };
      await aiConfigDB.saveUserPreferences(updatedConfig);
      setConfig(updatedConfig);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          AI Provider Settings
        </h3>
        
        {/* Provider Selection */}
        <div className="mb-6">
          <ProviderSelector userId={userId} onProviderChange={handleSaveConfig} />
        </div>

        {/* Budget Control */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <DollarSign className="w-4 h-4 inline mr-1" />
            Monthly Budget ($)
          </label>
          <input
            type="number"
            min="0"
            step="5"
            value={config?.monthlyBudget || 50}
            onChange={(e) => handleSaveConfig({ monthlyBudget: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        {/* Fallback Settings */}
        <div className="mb-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config?.autoFallback || false}
              onChange={(e) => handleSaveConfig({ autoFallback: e.target.checked })}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">
              <Shield className="w-4 h-4 inline mr-1" />
              Enable automatic fallback to other providers
            </span>
          </label>
        </div>

        {/* Cost Optimization */}
        <div className="mb-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config?.costOptimization || false}
              onChange={(e) => handleSaveConfig({ costOptimization: e.target.checked })}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">
              <Zap className="w-4 h-4 inline mr-1" />
              Enable cost optimization (route to cheapest provider)
            </span>
          </label>
        </div>
      </div>

      {/* Usage Analytics */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Usage Analytics</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {usage.map(stat => (
            <div key={stat.id} className="bg-gray-50 p-4 rounded">
              <div className="text-2xl font-bold text-blue-600">${stat.costUsd}</div>
              <div className="text-sm text-gray-600">This Month</div>
              <div className="text-xs text-gray-500 mt-1">{stat.providerName}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

### **Phase 3: Integration & Migration (Week 3)**

#### **3.1 Gradual Migration Strategy**
```typescript
// src/lib/ai-migration.ts
export class AIMigrationManager {
  private static instance: AIMigrationManager;
  
  static getInstance(): AIMigrationManager {
    if (!AIMigrationManager.instance) {
      AIMigrationManager.instance = new AIMigrationManager();
    }
    return AIMigrationManager.instance;
  }

  async migrateFromGemini(userId: string): Promise<void> {
    const currentConfig = await geminiDB.getUserConfig(userId);
    
    // Create new config based on current Gemini settings
    const newConfig: UserAIPreferences = {
      id: generateId(),
      userId,
      selectedProvider: 'google',
      selectedModel: currentConfig.model || 'gemini-2.5-flash',
      fallbackModels: ['anthropic/claude-3.5-sonnet', 'openai/gpt-4o'],
      providerOrder: ['google', 'anthropic', 'openai'],
      monthlyBudget: currentConfig.monthlyBudget || 50,
      autoFallback: true,
      costOptimization: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await aiConfigDB.saveUserPreferences(newConfig);
  }

  async validateMigration(userId: string): Promise<boolean> {
    try {
      // Test new system with user's existing prompts
      const testPrompt = "Test migration to new AI system";
      const result = await aiGatewayService.generateWithUserConfig(
        userId, 
        testPrompt, 
        'outline'
      );
      
      return result.length > 0;
    } catch (error) {
      console.error('Migration validation failed:', error);
      return false;
    }
  }
}
```

#### **3.2 Feature Parity Testing**
```typescript
// src/lib/ai-feature-testing.ts
export class AIFeatureTesting {
  private testCases = {
    outlineGeneration: [
      { idea: "Sci-fi adventure", style: "Action thriller" },
      { idea: "Romance novel", style: "Contemporary" },
      { idea: "Mystery thriller", style: "Noir" }
    ],
    chapterWriting: [
      { title: "Chapter 1", summary: "Hero's call to adventure" },
      { title: "Chapter 2", summary: "Meeting the mentor" }
    ],
    characterDevelopment: [
      { idea: "Detective story", style: "Hardboiled" },
      { idea: "Fantasy epic", style: "High fantasy" }
    ]
  };

  async runFeatureParityTests(userId: string): Promise<TestResults> {
    const results: TestResults = {
      outlineGeneration: { passed: 0, failed: 0, errors: [] },
      chapterWriting: { passed: 0, failed: 0, errors: [] },
      characterDevelopment: { passed: 0, failed: 0, errors: [] }
    };

    // Test each feature with multiple providers
    for (const [feature, testCases] of Object.entries(this.testCases)) {
      for (const testCase of testCases) {
        try {
          const result = await this.testFeatureWithProviders(
            feature as keyof typeof this.testCases,
            testCase,
            userId
          );
          
          if (result.success) {
            results[feature].passed++;
          } else {
            results[feature].failed++;
            results[feature].errors.push(result.error);
          }
        } catch (error) {
          results[feature].failed++;
          results[feature].errors.push(error.message);
        }
      }
    }

    return results;
  }

  private async testFeatureWithProviders(
    feature: string,
    testCase: any,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    const providers = ['google/gemini-2.5-flash', 'anthropic/claude-3.5-sonnet', 'openai/gpt-4o'];
    const results: string[] = [];

    for (const provider of providers) {
      try {
        const result = await aiGatewayService.generateWithUserConfig(userId, testCase.prompt, feature as any);
        results.push(`${provider}: ${result.substring(0, 100)}...`);
      } catch (error) {
        results.push(`${provider}: ERROR - ${error.message}`);
      }
    }

    // Compare results for consistency
    const similarity = this.calculateResultSimilarity(results);
    return {
      success: similarity > 0.8, // 80% consistency threshold
      error: similarity < 0.8 ? `Inconsistent results: ${similarity}% similarity` : undefined
    };
  }
}
```

### **Phase 4: Advanced Features (Week 4)**

#### **4.1 Cost Optimization Engine**
```typescript
// src/lib/ai-cost-optimizer.ts
export class AICostOptimizer {
  private performanceCache: Map<string, ModelPerformance> = new Map();

  async optimizeProviderSelection(
    userId: string,
    taskType: string,
    prompt: string
  ): Promise<OptimizedSelection> {
    const userConfig = await aiConfigDB.getUserPreferences(userId);
    const capabilities = await aiConfigDB.getProviderCapabilities();

    // Get performance data for task type
    const relevantModels = this.getRelevantModels(taskType, capabilities);
    const performanceData = await this.getPerformanceData(relevantModels);

    // Calculate optimization scores
    const scores = relevantModels.map(model => ({
      model,
      score: this.calculateOptimizationScore(model, performanceData, userConfig, prompt),
      estimatedCost: this.estimateCost(model, prompt),
      estimatedTime: this.estimateResponseTime(model, performanceData)
    }));

    // Sort by optimization score
    scores.sort((a, b) => b.score - a.score);

    return {
      recommended: scores[0],
      alternatives: scores.slice(1, 4),
      reasoning: this.generateOptimizationReasoning(scores[0], userConfig)
    };
  }

  private calculateOptimizationScore(
    model: string,
    performance: ModelPerformance,
    userConfig: UserAIPreferences,
    prompt: string
  ): number {
    let score = 0;

    // Cost factor (40% weight)
    const costScore = this.normalizeCost(performance.avgCostPer1kTokens, userConfig.monthlyBudget);
    score += costScore * 0.4;

    // Performance factor (30% weight)
    const timeScore = this.normalizeTime(performance.avgResponseTime);
    score += timeScore * 0.3;

    // Quality factor (20% weight)
    const qualityScore = performance.successRate;
    score += qualityScore * 0.2;

    // User preference factor (10% weight)
    const preferenceScore = this.checkUserPreference(model, userConfig);
    score += preferenceScore * 0.1;

    return score;
  }
}
```

#### **4.2 Usage Analytics Dashboard**
```typescript
// src/components/ai/UsageAnalytics.tsx
export const UsageAnalytics: React.FC<{ userId: string }> = ({ userId }) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    loadAnalytics();
  }, [userId, timeRange]);

  const loadAnalytics = async () => {
    const data = await aiConfigDB.getUsageAnalytics(userId, timeRange);
    setAnalytics(data);
  };

  return (
    <div className="space-y-6">
      {/* Cost Overview */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Cost Overview</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              ${analytics?.totalCost || 0}
            </div>
            <div className="text-sm text-gray-600">Total Cost ($)</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              ${analytics?.totalTokens || 0}
            </div>
            <div className="text-sm text-gray-600">Tokens Used</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              ${analytics?.avgResponseTime || 0}ms
            </div>
            <div className="text-sm text-gray-600">Avg Response Time</div>
          </div>
        </div>
      </div>

      {/* Provider Breakdown */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Provider Usage</h3>
        
        <div className="space-y-3">
          {analytics?.providerBreakdown.map(provider => (
            <div key={provider.provider} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <div>
                  <div className="font-medium">{provider.provider}</div>
                  <div className="text-sm text-gray-600">{provider.model}</div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="font-bold">${provider.cost}</div>
                <div className="text-sm text-gray-600">{provider.percentage}%</div>
                <div className="text-xs text-gray-500">{provider.requests} requests</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Model Performance */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Model Performance</h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Model
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Success Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost/1k Tokens
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analytics?.modelPerformance.map(model => (
                <tr key={model.model}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {model.model}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {model.successRate}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {model.avgResponseTime}ms
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${model.costPer1kTokens}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
```

---

## 📋 **Implementation Timeline**

### **Week 1: Backend Infrastructure**
- **Day 1-2**: Database schema and migration scripts
- **Day 3-4**: AI Gateway service implementation
- **Day 5**: Provider capabilities and configuration management
- **Day 6-7**: Usage analytics and cost tracking

### **Week 2: Frontend Components**
- **Day 1-2**: Provider selection UI component
- **Day 3-4**: Settings panel and configuration interface
- **Day 5**: Usage analytics dashboard
- **Day 6-7**: Integration testing and component validation

### **Week 3: Integration & Migration**
- **Day 1-3**: Gradual migration from Gemini to new system
- **Day 4-5**: Feature parity testing across providers
- **Day 6-7**: Performance optimization and bug fixes

### **Week 4: Advanced Features**
- **Day 1-3**: Cost optimization engine
- **Day 4-5**: Advanced analytics and reporting
- **Day 6-7**: Production deployment and monitoring

---

## 🎯 **Success Criteria**

### **Technical Excellence**
- [ ] All 8+ providers integrated through Vercel AI Gateway
- [ ] 100+ models available for selection
- [ ] Automatic fallbacks working with 99.9% success rate
- [ ] User preferences persisting in Turso DB
- [ ] Real-time usage analytics and cost tracking

### **User Experience**
- [ ] Intuitive provider/model selection interface
- [ ] Seamless switching without losing work
- [ ] Transparent cost information and budget controls
- [ ] Performance insights and recommendations
- [ ] Mobile-responsive design

### **Business Value**
- [ ] 20-30% cost reduction through optimization
- [ ] 99.9% uptime with automatic fallbacks
- [ ] User retention improvement through choice and reliability
- [ ] Competitive advantage through multi-provider access

---

## 🚀 **Expected Outcomes**

### **Immediate Benefits (Week 1-2)**
- **Provider Flexibility**: Users choose from 8+ providers
- **Cost Control**: Budget limits and usage monitoring
- **Reliability**: Automatic fallbacks during outages
- **User Satisfaction**: Choice and control over AI experience

### **Long-term Strategic Benefits**
- **No Vendor Lock-in**: Easy switching between providers
- **Cost Optimization**: Intelligent routing to cheapest options
- **Future-Proofing**: Quick adoption of new models
- **Competitive Advantage**: Access to latest AI capabilities
- **Operational Excellence**: Unified monitoring and management

---

## ✅ **Implementation Ready**

This comprehensive plan provides a **clear, phased approach** to transforming do-novelist-ai from a single-provider system to a **flexible, user-centric AI platform** with:

- **8+ AI Providers** through Vercel AI Gateway
- **100+ Models** available for user selection
- **Turso DB Integration** for preference persistence
- **Advanced Analytics** for cost optimization and insights
- **Seamless Migration** from current Gemini integration
- **Production-Ready Architecture** with comprehensive testing

**Timeline:** 4 weeks to full implementation  
**Risk Level:** LOW (gradual migration with fallbacks)  
**Business Impact:** HIGH (user choice, cost optimization, reliability)

---

*This implementation plan positions do-novelist-ai as a leader in AI integration flexibility and user experience.*