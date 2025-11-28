import { openDB, type IDBPDatabase } from 'idb';
import type { AIProviderConfig, AIUsageLog } from '../../types/ai-config';
import { encryptApiKey, decryptApiKey } from '../ai/encryption';

const DB_NAME = 'NovelistAI';
const DB_VERSION = 1;
const USER_ID = 'default';

interface AIConfigDB extends AIProviderConfig {
  user_id: string;
  encrypted_api_key: string;
}

async function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // AI Configurations store
      if (!db.objectStoreNames.contains('ai_configs')) {
        const store = db.createObjectStore('ai_configs', { keyPath: 'id' });
        store.createIndex('user_id', 'user_id');
        store.createIndex('is_default', 'is_default');
      }

      // AI Usage Logs store
      if (!db.objectStoreNames.contains('ai_usage_logs')) {
        const store = db.createObjectStore('ai_usage_logs', { keyPath: 'id' });
        store.createIndex('config_id', 'config_id');
        store.createIndex('timestamp', 'timestamp');
      }
    },
  });
}

export async function saveAIConfig(config: Omit<AIProviderConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const db = await getDB();
  const id = crypto.randomUUID();
  const now = new Date();

  const configData: AIConfigDB = {
    id,
    user_id: config.userId || USER_ID,
    provider: config.provider,
    model: config.model,
    encrypted_api_key: await encryptApiKey(config.apiKey),
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    isDefault: config.isDefault,
    createdAt: now,
    updatedAt: now,
  };

  await db.put('ai_configs', configData);
  return id;
}

export async function getAIConfigs(userId: string = USER_ID): Promise<AIProviderConfig[]> {
  const db = await getDB();
  const configs = await db.getAllFromIndex('ai_configs', 'user_id', userId);

  // Decrypt API keys
  const decryptedConfigs = await Promise.all(
    configs.map(async (config) => {
      const decryptedConfig = config as AIConfigDB;
      return {
        id: decryptedConfig.id,
        userId: decryptedConfig.user_id,
        provider: decryptedConfig.provider,
        model: decryptedConfig.model,
        apiKey: await decryptApiKey(decryptedConfig.encrypted_api_key),
        temperature: decryptedConfig.temperature,
        maxTokens: decryptedConfig.maxTokens,
        isDefault: decryptedConfig.isDefault,
        createdAt: decryptedConfig.createdAt,
        updatedAt: decryptedConfig.updatedAt,
      } as AIProviderConfig;
    })
  );

  return decryptedConfigs;
}

export async function getDefaultAIConfig(): Promise<AIProviderConfig | null> {
  const db = await getDB();
  const configs = await db.getAllFromIndex('ai_configs', 'is_default', true);

  if (configs.length === 0) return null;

  const config = configs[0] as AIConfigDB;
  return {
    id: config.id,
    userId: config.user_id,
    provider: config.provider,
    model: config.model,
    apiKey: await decryptApiKey(config.encrypted_api_key),
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    isDefault: config.isDefault,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt,
  };
}

export async function updateAIConfig(id: string, updates: Partial<AIProviderConfig>): Promise<void> {
  const db = await getDB();
  const existing = await db.get('ai_configs', id);

  if (!existing) {
    throw new Error('Configuration not found');
  }

  const updated = {
    ...existing,
    ...updates,
    updatedAt: new Date(),
  };

  if (updates.apiKey) {
    (updated as AIConfigDB).encrypted_api_key = await encryptApiKey(updates.apiKey);
  }

  await db.put('ai_configs', updated);
}

export async function deleteAIConfig(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('ai_configs', id);
}

export async function logAIUsage(log: Omit<AIUsageLog, 'id'>): Promise<string> {
  const db = await getDB();
  const id = crypto.randomUUID();
  const usageLog = {
    ...log,
    id,
    timestamp: new Date(),
  };
  await db.put('ai_usage_logs', usageLog);
  return id;
}

export async function getAIUsageLogs(configId?: string, limit: number = 100): Promise<AIUsageLog[]> {
  const db = await getDB();

  if (configId) {
    const logs = await db.getAllFromIndex('ai_usage_logs', 'config_id', configId);
    return logs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  const logs = await db.getAll('ai_usage_logs');
  return logs
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
}
