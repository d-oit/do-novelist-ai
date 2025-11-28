# AI Configuration Database Schema

**Date:** 2025-11-28  
**Project:** Novelist.ai - AI Provider Configuration  
**Database:** IndexedDB (Client-side)  
**Version:** 1.0  

---

## Overview

This document defines the complete database schema for storing AI provider configurations, usage logs, and related analytics data in the Novelist.ai application. The schema is designed for IndexedDB with client-side encryption for sensitive data.

---

## Database Architecture

### Database Information
- **Name**: `NovelistAIDB`
- **Version**: 1
- **Storage**: IndexedDB (browser-based)
- **Encryption**: Client-side AES-GCM for API keys
- **Fallback**: localStorage for offline scenarios

### Design Principles
1. **Security First**: All API keys encrypted before storage
2. **User Isolation**: Each user can only access their own configurations
3. **Audit Trail**: Complete usage logging for analytics and billing
4. **Performance Optimized**: Proper indexing for fast queries
5. **Scalable**: Schema supports future provider additions

---

## Schema Definition

### 1. AI Configurations Store (`aiConfigs`)

Stores user AI provider configurations with encrypted API keys.

```typescript
interface AIConfigRecord {
  // Primary Key
  id: string;                    // UUID v4
  
  // User Association
  userId: string;                 // User identifier
  
  // Provider Configuration
  provider: 'openai' | 'anthropic' | 'google' | 'meta' | 'xai';
  model: string;                  // Model identifier (e.g., 'gpt-4o')
  encryptedApiKey: string;        // AES-GCM encrypted API key
  
  // Generation Parameters
  temperature: number;            // 0.0 - 2.0, default 0.7
  maxTokens: number;              // 100 - 4000, default 2000
  
  // Metadata
  isDefault: boolean;             // User's default configuration
  name?: string;                  // User-defined configuration name
  description?: string;           // Optional description
  
  // Timestamps
  createdAt: Date;                // Configuration creation time
  updatedAt: Date;                // Last modification time
  lastUsedAt?: Date;              // Last usage timestamp
}
```

#### Indexes
```typescript
// Primary indexes for performance
indexes: {
  by_userId: string;              // Get all user configurations
  by_provider: string;            // Filter by provider type
  by_default: boolean;            // Find default configuration
  by_lastUsed: Date;              // Sort by recent usage
}
```

#### Validation Rules
```typescript
const AI_CONFIG_VALIDATION = {
  id: 'required|uuid',
  userId: 'required|string|max:255',
  provider: 'required|in:openai,anthropic,google,meta,xai',
  model: 'required|string|max:100',
  encryptedApiKey: 'required|string|min:50', // Encrypted data is longer
  temperature: 'required|number|min:0|max:2',
  maxTokens: 'required|integer|min:100|max:4000',
  isDefault: 'required|boolean',
  name: 'optional|string|max:255',
  description: 'optional|string|max:1000',
};
```

---

### 2. Usage Logs Store (`aiUsageLogs`)

Tracks all AI API calls for analytics, billing, and debugging.

```typescript
interface AIUsageLogRecord {
  // Primary Key
  id: string;                     // UUID v4
  
  // Association
  configId: string;               // Reference to AI configuration
  userId: string;                 // User identifier (denormalized for queries)
  
  // Request Details
  provider: 'openai' | 'anthropic' | 'google' | 'meta' | 'xai';
  model: string;                  // Model used
  prompt: string;                 // Original prompt (truncated for storage)
  
  // Response Metrics
  response: string;               // Generated response (truncated for storage)
  promptTokens: number;            // Tokens in prompt
  completionTokens: number;        // Tokens in response
  totalTokens: number;             // Total tokens used
  
  // Performance Metrics
  responseTime: number;            // Response time in milliseconds
  costEstimate: number;            // Estimated cost in USD
  
  // Status Information
  status: 'success' | 'failed' | 'rate_limited' | 'timeout' | 'aborted';
  errorMessage?: string;           // Error details if failed
  
  // Timestamps
  timestamp: Date;                // Request timestamp
  completedAt?: Date;             // Completion timestamp (if different)
}
```

#### Indexes
```typescript
indexes: {
  by_configId: string;            // Get usage for specific configuration
  by_userId: string;              // Get all user usage
  by_timestamp: Date;              // Time-based queries
  by_provider: string;            // Filter by provider
  by_status: string;              // Filter by status
  by_cost: number;                // Cost-based queries
}
```

#### Validation Rules
```typescript
const USAGE_LOG_VALIDATION = {
  id: 'required|uuid',
  configId: 'required|uuid',
  userId: 'required|string|max:255',
  provider: 'required|in:openai,anthropic,google,meta,xai',
  model: 'required|string|max:100',
  prompt: 'required|string|max:10000', // Truncated for storage
  response: 'optional|string|max:50000', // Truncated for storage
  promptTokens: 'required|integer|min:0',
  completionTokens: 'required|integer|min:0',
  totalTokens: 'required|integer|min:0',
  responseTime: 'required|integer|min:0',
  costEstimate: 'required|number|min:0',
  status: 'required|in:success,failed,rate_limited,timeout,aborted',
  errorMessage: 'optional|string|max:1000',
  timestamp: 'required|date',
  completedAt: 'optional|date',
};
```

---

### 3. Provider Models Store (`providerModels`)

Cache of available models for each provider (updated periodically).

```typescript
interface ProviderModelRecord {
  // Primary Key
  id: string;                     // Composite: `${provider}:${modelId}`
  
  // Provider Information
  provider: 'openai' | 'anthropic' | 'google' | 'meta' | 'xai';
  modelId: string;                // Provider's model identifier
  displayName: string;             // Human-readable name
  
  // Model Capabilities
  maxTokens: number;              // Maximum context window
  maxOutputTokens: number;        // Maximum output tokens
  
  // Pricing Information
  promptCostPer1K: number;        // Cost per 1K prompt tokens
  completionCostPer1K: number;    // Cost per 1K completion tokens
  
  // Features
  supportsStreaming: boolean;       // Can stream responses
  supportsImages: boolean;          // Can process images
  supportsTools: boolean;          // Supports function calling
  
  // Metadata
  category: 'text' | 'chat' | 'completion' | 'multimodal';
  quality: 'basic' | 'standard' | 'premium';
  status: 'available' | 'deprecated' | 'coming_soon';
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastValidated: Date;            // Last availability check
}
```

#### Indexes
```typescript
indexes: {
  by_provider: string;            // Get models by provider
  by_category: string;            // Filter by capability
  by_quality: string;             // Filter by quality tier
  by_status: string;              // Filter by availability
  by_cost: number;                // Sort by cost
}
```

---

## Database Operations

### Configuration Management

#### Create Configuration
```typescript
async function createAIConfig(
  userId: string,
  configData: Omit<AIConfigRecord, 'id' | 'createdAt' | 'updatedAt'>
): Promise<AIConfigRecord> {
  const db = await getDB();
  const id = crypto.randomUUID();
  
  // Validate input
  validateAIConfig(configData);
  
  // Encrypt API key
  const encryptedApiKey = await EncryptionService.encryptApiKey(
    configData.apiKey,
    userId
  );
  
  const config: AIConfigRecord = {
    ...configData,
    id,
    encryptedApiKey,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  const tx = db.transaction('aiConfigs', 'readwrite');
  await tx.objectStore('aiConfigs').add(config);
  await tx.done;
  
  return config;
}
```

#### Update Configuration
```typescript
async function updateAIConfig(
  userId: string,
  configId: string,
  updates: Partial<AIConfigRecord>
): Promise<AIConfigRecord> {
  const db = await getDB();
  const tx = db.transaction('aiConfigs', 'readwrite');
  const store = tx.objectStore('aiConfigs');
  
  const existing = await store.get(configId);
  if (!existing || existing.userId !== userId) {
    throw new Error('Configuration not found or access denied');
  }
  
  // Encrypt new API key if provided
  if (updates.apiKey) {
    updates.encryptedApiKey = await EncryptionService.encryptApiKey(
      updates.apiKey,
      userId
    );
    delete updates.apiKey; // Remove plain text key
  }
  
  const updated: AIConfigRecord = {
    ...existing,
    ...updates,
    updatedAt: new Date(),
  };
  
  await store.put(updated);
  await tx.done;
  
  return updated;
}
```

### Usage Analytics

#### Log Usage
```typescript
async function logAIUsage(usageData: Omit<AIUsageLogRecord, 'id' | 'timestamp'>): Promise<void> {
  const db = await getDB();
  const id = crypto.randomUUID();
  
  const log: AIUsageLogRecord = {
    ...usageData,
    id,
    timestamp: new Date(),
  };
  
  const tx = db.transaction('aiUsageLogs', 'readwrite');
  await tx.objectStore('aiUsageLogs').add(log);
  await tx.done;
}
```

#### Get Usage Analytics
```typescript
async function getUserUsageAnalytics(
  userId: string,
  dateRange: { start: Date; end: Date }
): Promise<{
  totalTokens: number;
  totalCost: number;
  providerBreakdown: Record<string, { tokens: number; cost: number }>;
  dailyUsage: Array<{ date: string; tokens: number; cost: number }>;
}> {
  const db = await getDB();
  const tx = db.transaction('aiUsageLogs', 'readonly');
  const index = tx.objectStore('aiUsageLogs').index('by_userId');
  
  const range = IDBKeyRange.bound(
    dateRange.start,
    dateRange.end
  );
  
  const logs = await index.getAll(userId);
  await tx.done;
  
  // Process analytics data
  const successfulLogs = logs.filter(log => 
    log.status === 'success' && 
    log.timestamp >= dateRange.start && 
    log.timestamp <= dateRange.end
  );
  
  const totalTokens = successfulLogs.reduce((sum, log) => sum + log.totalTokens, 0);
  const totalCost = successfulLogs.reduce((sum, log) => sum + log.costEstimate, 0);
  
  // Provider breakdown
  const providerBreakdown: Record<string, { tokens: number; cost: number }> = {};
  for (const log of successfulLogs) {
    if (!providerBreakdown[log.provider]) {
      providerBreakdown[log.provider] = { tokens: 0, cost: 0 };
    }
    providerBreakdown[log.provider].tokens += log.totalTokens;
    providerBreakdown[log.provider].cost += log.costEstimate;
  }
  
  // Daily usage
  const dailyUsage: Record<string, { tokens: number; cost: number }> = {};
  for (const log of successfulLogs) {
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
```

---

## Data Migration & Versioning

### Database Versioning Strategy
```typescript
// Database upgrade handler
function handleDatabaseUpgrade(oldVersion: number, newVersion: number, db: IDBDatabase) {
  if (oldVersion < 1) {
    // Initial schema creation
    createV1Schema(db);
  }
  
  if (oldVersion < 2) {
    // Future schema changes
    createV2Schema(db);
    migrateV1ToV2(db);
  }
}
```

### Migration Scripts
```typescript
// Example: Migrate from direct Gemini to AI Gateway
async function migrateGeminiToGateway(userId: string): Promise<void> {
  const db = await getDB();
  
  // Check if user has existing Gemini configuration
  const existingGeminiKey = localStorage.getItem(`gemini-api-key-${userId}`);
  if (!existingGeminiKey) return;
  
  // Create new AI Gateway configuration
  const config = await createAIConfig(userId, {
    userId,
    provider: 'google',
    model: 'gemini-2.0-flash',
    apiKey: existingGeminiKey,
    temperature: 0.7,
    maxTokens: 2000,
    isDefault: true,
    name: 'Migrated from Gemini',
    description: 'Automatically migrated from previous Gemini configuration',
  });
  
  // Remove old configuration
  localStorage.removeItem(`gemini-api-key-${userId}`);
  
  console.log('Successfully migrated Gemini configuration to AI Gateway:', config.id);
}
```

---

## Performance Optimization

### Index Strategy
```typescript
// Critical indexes for performance
const PERFORMANCE_INDEXES = {
  // User configuration queries
  'aiConfigs.by_userId': { unique: false, multiEntry: false },
  'aiConfigs.by_provider': { unique: false, multiEntry: false },
  'aiConfigs.by_default': { unique: false, multiEntry: false },
  
  // Usage analytics queries
  'aiUsageLogs.by_userId': { unique: false, multiEntry: false },
  'aiUsageLogs.by_timestamp': { unique: false, multiEntry: false },
  'aiUsageLogs.by_configId': { unique: false, multiEntry: false },
  'aiUsageLogs.by_provider': { unique: false, multiEntry: false },
  
  // Model catalog queries
  'providerModels.by_provider': { unique: false, multiEntry: false },
  'providerModels.by_category': { unique: false, multiEntry: false },
  'providerModels.by_quality': { unique: false, multiEntry: false },
};
```

### Data Retention Policy
```typescript
// Automatic cleanup of old usage logs
async function cleanupOldUsageLogs(daysToKeep = 90): Promise<void> {
  const db = await getDB();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  const tx = db.transaction('aiUsageLogs', 'readwrite');
  const store = tx.objectStore('aiUsageLogs');
  const index = store.index('by_timestamp');
  
  const range = IDBKeyRange.upperBound(cutoffDate);
  let cursor = await index.openCursor(range);
  
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  
  await tx.done;
  console.log(`Cleaned up usage logs older than ${daysToKeep} days`);
}
```

---

## Security Considerations

### Encryption Implementation
```typescript
// API key encryption using Web Crypto API
class EncryptionService {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;
  private static readonly IV_LENGTH = 12;
  
  // Derive encryption key from user-specific data
  private static async deriveKey(userId: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = encoder.encode(`${userId}:${navigator.userAgent}`);
    
    const baseKey = await crypto.subtle.importKey(
      'raw',
      keyMaterial,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );
    
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('novelist-ai-salt-2025'),
        iterations: 100000,
        hash: 'SHA-256',
      },
      baseKey,
      { name: this.ALGORITHM, length: this.KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    );
  }
  
  // Encrypt API key before storage
  static async encryptApiKey(apiKey: string, userId: string): Promise<string> {
    const key = await this.deriveKey(userId);
    const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
    
    const encrypted = await crypto.subtle.encrypt(
      { name: this.ALGORITHM, iv },
      key,
      new TextEncoder().encode(apiKey)
    );
    
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    return btoa(String.fromCharCode(...combined));
  }
  
  // Decrypt API key for API calls
  static async decryptApiKey(encryptedApiKey: string, userId: string): Promise<string> {
    const key = await this.deriveKey(userId);
    const combined = new Uint8Array(
      atob(encryptedApiKey).split('').map(char => char.charCodeAt(0))
    );
    
    const iv = combined.slice(0, this.IV_LENGTH);
    const encrypted = combined.slice(this.IV_LENGTH);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: this.ALGORITHM, iv },
      key,
      encrypted
    );
    
    return new TextDecoder().decode(decrypted);
  }
}
```

### Access Control
```typescript
// Ensure user can only access their own data
async function verifyUserAccess(userId: string, configId: string): Promise<boolean> {
  const db = await getDB();
  const config = await db.get('aiConfigs', configId);
  return config?.userId === userId;
}

// Wrapper for all database operations
async function withUserAccess<T>(
  userId: string,
  configId: string,
  operation: () => Promise<T>
): Promise<T> {
  const hasAccess = await verifyUserAccess(userId, configId);
  if (!hasAccess) {
    throw new Error('Access denied: Invalid user or configuration');
  }
  
  return operation();
}
```

---

## Testing Strategy

### Unit Tests
```typescript
describe('AI Configuration Database', () => {
  beforeEach(async () => {
    await clearTestDatabase();
  });
  
  it('should create and retrieve AI configuration', async () => {
    const config = await createAIConfig(testUserId, testConfigData);
    const retrieved = await getAIConfig(testUserId, config.id);
    
    expect(retrieved).toMatchObject({
      ...testConfigData,
      id: config.id,
      userId: testUserId,
    });
    expect(retrieved.encryptedApiKey).toBeTruthy();
    expect(retrieved.encryptedApiKey).not.toBe(testConfigData.apiKey);
  });
  
  it('should encrypt and decrypt API keys correctly', async () => {
    const encrypted = await EncryptionService.encryptApiKey(testApiKey, testUserId);
    const decrypted = await EncryptionService.decryptApiKey(encrypted, testUserId);
    
    expect(decrypted).toBe(testApiKey);
  });
});
```

### Integration Tests
```typescript
describe('Usage Analytics', () => {
  it('should track usage across multiple providers', async () => {
    // Create configurations for different providers
    const openaiConfig = await createAIConfig(testUserId, openaiConfigData);
    const anthropicConfig = await createAIConfig(testUserId, anthropicConfigData);
    
    // Log usage for both providers
    await logAIUsage({ configId: openaiConfig.id, provider: 'openai', totalTokens: 100, costEstimate: 0.01 });
    await logAIUsage({ configId: anthropicConfig.id, provider: 'anthropic', totalTokens: 150, costEstimate: 0.02 });
    
    // Get analytics
    const analytics = await getUserUsageAnalytics(testUserId, {
      start: new Date(Date.now() - 86400000), // Last 24 hours
      end: new Date(),
    });
    
    expect(analytics.totalTokens).toBe(250);
    expect(analytics.totalCost).toBe(0.03);
    expect(analytics.providerBreakdown).toEqual({
      openai: { tokens: 100, cost: 0.01 },
      anthropic: { tokens: 150, cost: 0.02 },
    });
  });
});
```

---

## Monitoring & Maintenance

### Database Health Checks
```typescript
async function performDatabaseHealthCheck(): Promise<{
  status: 'healthy' | 'warning' | 'error';
  issues: string[];
  recommendations: string[];
}> {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  try {
    const db = await getDB();
    
    // Check database size
    const estimate = await navigator.storage.estimate();
    if (estimate.usage && estimate.quota) {
      const usagePercent = (estimate.usage / estimate.quota) * 100;
      if (usagePercent > 80) {
        issues.push(`Database usage is ${usagePercent.toFixed(1)}%`);
        recommendations.push('Consider running cleanup of old usage logs');
      }
    }
    
    // Check for orphaned records
    const orphanedLogs = await findOrphanedUsageLogs();
    if (orphanedLogs.length > 0) {
      issues.push(`Found ${orphanedLogs.length} orphaned usage logs`);
      recommendations.push('Run data cleanup to remove orphaned records');
    }
    
    // Check encryption integrity
    const encryptionTest = await EncryptionService.testEncryption('test-user');
    if (!encryptionTest) {
      issues.push('Encryption service test failed');
      recommendations.push('Check browser compatibility and security settings');
    }
    
    return {
      status: issues.length === 0 ? 'healthy' : issues.length > 2 ? 'error' : 'warning',
      issues,
      recommendations,
    };
  } catch (error) {
    return {
      status: 'error',
      issues: ['Database health check failed'],
      recommendations: ['Check browser IndexedDB support and permissions'],
    };
  }
}
```

---

## Summary

The AI Configuration Database Schema provides:

✅ **Secure Storage**: Client-side encryption for all API keys  
✅ **User Isolation**: Complete separation of user data  
✅ **Comprehensive Analytics**: Detailed usage tracking and cost analysis  
✅ **Performance Optimization**: Strategic indexing for fast queries  
✅ **Scalability**: Support for future providers and features  
✅ **Data Integrity**: Validation rules and constraints  
✅ **Migration Support**: Versioning and data migration strategies  

This schema enables Novelist.ai to provide enterprise-grade AI configuration management while maintaining security and performance standards expected by users.

---

**Document Status:** ✅ Complete  
**Schema Version:** 1.0  
**Last Updated:** 2025-11-28  
**Next Review:** 2025-12-31