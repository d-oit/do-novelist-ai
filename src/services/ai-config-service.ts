/**
 * AI Provider Configuration Service
 * Manages user preferences for AI provider selection
 */

import { getUserAIPreference, saveUserAIPreference, type UserAIPreference } from '@/lib/db/index';
import { getAIConfig, type AIProvider } from '@/lib/ai-config';

export interface ProviderConfig {
  provider: AIProvider;
  model: string;
  fallbackProviders?: AIProvider[];
  temperature?: number;
  maxTokens?: number;
}

export interface ProviderPreferenceData {
  selectedProvider: AIProvider;
  selectedModel: string;
  fallbackProviders: AIProvider[];
  temperature: number;
  maxTokens: number;
  monthlyBudget: number;
  autoFallback: boolean;
  costOptimization: boolean;
}

/**
 * Map database UserAIPreference to service ProviderPreferenceData
 */
function mapUserAIToProviderData(pref: UserAIPreference): ProviderPreferenceData {
  return {
    selectedProvider: pref.selectedProvider,
    selectedModel: pref.selectedModel,
    fallbackProviders: pref.fallbackProviders,
    temperature: pref.temperature,
    maxTokens: pref.maxTokensPerRequest ?? 4000,
    monthlyBudget: pref.budgetLimit ?? 50,
    autoFallback: pref.enableFallback,
    costOptimization: false, // Default value as it's not in database schema
  };
}

/**
 * Map service ProviderPreferenceData to database UserAIPreference
 */
function mapProviderDataToUserAI(
  data: ProviderPreferenceData,
  userId: string,
  existingId?: string,
): Omit<UserAIPreference, 'createdAt' | 'updatedAt'> {
  return {
    id: existingId ?? crypto.randomUUID(),
    userId,
    selectedProvider: data.selectedProvider,
    selectedModel: data.selectedModel,
    enableFallback: data.autoFallback,
    fallbackProviders: data.fallbackProviders,
    budgetLimit: data.monthlyBudget,
    budgetPeriod: 'monthly',
    maxTokensPerRequest: data.maxTokens,
    temperature: data.temperature,
    topP: 1.0, // Default
    frequencyPenalty: 0.0, // Default
    presencePenalty: 0.0, // Default
  };
}

/**
 * Default preferences for new users
 */
const DEFAULT_PREFERENCES: ProviderPreferenceData = {
  selectedProvider: 'google',
  selectedModel: 'gemini-2.0-flash-exp',
  fallbackProviders: [],
  temperature: 0.7,
  maxTokens: 4000,
  monthlyBudget: 50,
  autoFallback: true,
  costOptimization: false,
};

/**
 * Load user AI preferences
 */
export async function loadUserPreferences(userId: string): Promise<ProviderPreferenceData> {
  try {
    const userPrefs = await getUserAIPreference(userId);

    if (userPrefs === null) {
      return getDefaultConfig();
    }

    return mapUserAIToProviderData(userPrefs);
  } catch (error) {
    console.error('Failed to load user preferences:', error);
    return getDefaultConfig();
  }
}

/**
 * Save user AI preferences
 */
export async function saveUserPreferences(
  userId: string,
  preferences: Partial<ProviderPreferenceData>,
): Promise<void> {
  try {
    const validatedPrefs = validatePreferences(preferences);
    const currentPrefs = await loadUserPreferences(userId);
    const mergedPrefs = { ...currentPrefs, ...validatedPrefs };

    const userAIPref = mapProviderDataToUserAI(mergedPrefs, userId);

    await saveUserAIPreference(userAIPref as UserAIPreference);

    console.log(`[AI Config] Saved preferences for user ${userId}`);
  } catch (error) {
    console.error('Failed to save user preferences:', error);
    throw new Error('Failed to save preferences');
  }
}

/**
 * Get active providers based on user preferences
 */
export function getActiveProviders(prefs: ProviderPreferenceData): AIProvider[] {
  const providers: AIProvider[] = [];
  const aiConfig = getAIConfig();

  if (aiConfig.providers[prefs.selectedProvider].enabled) {
    providers.push(prefs.selectedProvider);
  }

  for (const provider of prefs.fallbackProviders) {
    if (aiConfig.providers[provider].enabled && !providers.includes(provider)) {
      providers.push(provider);
    }
  }

  return providers;
}

/**
 * Validate provider and model combination
 */
export function validateProviderModel(
  provider: AIProvider,
  model: string,
): { valid: boolean; error?: string } {
  const aiConfig = getAIConfig();
  const providerConfig = aiConfig.providers[provider];

  if (providerConfig === undefined) {
    return { valid: false, error: `Unknown provider: ${provider}` };
  }

  if (!providerConfig.enabled) {
    return { valid: false, error: `Provider ${provider} is not configured` };
  }

  const allModels = [
    providerConfig.models.fast,
    providerConfig.models.standard,
    providerConfig.models.advanced,
  ];

  if (!allModels.includes(model)) {
    return { valid: false, error: `Model ${model} not available for provider ${provider}` };
  }

  return { valid: true };
}

/**
 * Get optimal model for a task type
 */
export function getOptimalModel(
  provider: AIProvider,
  taskType: 'fast' | 'standard' | 'advanced',
  _prefs: ProviderPreferenceData,
): string {
  const aiConfig = getAIConfig();
  return aiConfig.providers[provider].models[taskType];
}

/**
 * Private: Get default configuration
 */
function getDefaultConfig(): ProviderPreferenceData {
  const aiConfig = getAIConfig();
  const defaultProvider = aiConfig.defaultProvider;

  return {
    ...DEFAULT_PREFERENCES,
    selectedProvider: defaultProvider,
    selectedModel: getOptimalModel(defaultProvider, 'standard', DEFAULT_PREFERENCES),
  };
}

/**
 * Private: Validate preference data
 */
function validatePreferences(
  prefs: Partial<ProviderPreferenceData>,
): Omit<ProviderPreferenceData, 'selectedProvider'> {
  const validated: Partial<ProviderPreferenceData> = {};

  if (prefs.temperature !== undefined) {
    if (typeof prefs.temperature !== 'number' || prefs.temperature < 0 || prefs.temperature > 2) {
      throw new Error('Temperature must be a number between 0 and 2');
    }
    validated.temperature = prefs.temperature;
  }

  if (prefs.maxTokens !== undefined) {
    if (typeof prefs.maxTokens !== 'number' || prefs.maxTokens < 1 || prefs.maxTokens > 128000) {
      throw new Error('Max tokens must be between 1 and 128000');
    }
    validated.maxTokens = prefs.maxTokens;
  }

  if (prefs.monthlyBudget !== undefined) {
    if (typeof prefs.monthlyBudget !== 'number' || prefs.monthlyBudget < 0) {
      throw new Error('Monthly budget must be a positive number');
    }
    validated.monthlyBudget = prefs.monthlyBudget;
  }

  if (prefs.autoFallback !== undefined) {
    validated.autoFallback = !!prefs.autoFallback;
  }

  if (prefs.costOptimization !== undefined) {
    validated.costOptimization = !!prefs.costOptimization;
  }

  if (prefs.fallbackProviders !== undefined) {
    if (!Array.isArray(prefs.fallbackProviders)) {
      throw new Error('Fallback providers must be an array');
    }
    validated.fallbackProviders = prefs.fallbackProviders;
  }

  return validated as Omit<ProviderPreferenceData, 'selectedProvider'>;
}
