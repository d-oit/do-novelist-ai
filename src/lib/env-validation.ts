import { z } from 'zod';

const envSchema = z.object({
  // Optional with defaults
  VITE_DEFAULT_AI_PROVIDER: z
    .enum([
      'openai',
      'anthropic',
      'google',
      'mistral',
      'deepseek',
      'cohere',
      'ai21',
      'together',
      'fireworks',
      'perplexity',
      'xai',
      '01-ai',
      'nvidia',
      'amazon',
      'meta',
    ])
    .default('google'),
  VITE_DEFAULT_AI_MODEL: z.string().default('google/gemini-2.0-flash-exp'),
  VITE_THINKING_AI_MODEL: z.string().default('anthropic/claude-3-5-sonnet-20241022'),
  VITE_ENABLE_AUTO_FALLBACK: z.string().optional(),

  // New OpenRouter advanced features
  VITE_ENABLE_AUTO_ROUTING: z.string().optional(),
  VITE_ENABLE_MODEL_VARIANTS: z.string().optional(),
  VITE_CACHE_MODEL_LIST_DURATION: z.string().optional(),
});

export type ValidatedEnv = z.infer<typeof envSchema>;

export interface ValidationResult {
  success: boolean;
  env?: ValidatedEnv;
  errors?: Array<{
    path: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
}

export function validateEnvironment(): ValidationResult {
  try {
    const validated = envSchema.parse(import.meta.env);
    return { success: true, env: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((err: z.ZodIssue) => {
        const severity: 'error' | 'warning' = import.meta.env.CI ? 'warning' : 'error';
        return {
          path: err.path.join('.'),
          message: err.message,
          severity,
        };
      });
      return { success: false, errors };
    }
    return {
      success: false,
      errors: [{ path: 'unknown', message: 'Unknown validation error', severity: 'error' }],
    };
  }
}

export function getValidatedEnv(): ValidatedEnv {
  const result = validateEnvironment();
  if (!result.success || !result.env) {
    if (import.meta.env.CI) {
      // In CI, return default environment instead of throwing
      return {
        VITE_DEFAULT_AI_PROVIDER: 'google',
        VITE_DEFAULT_AI_MODEL: 'google/gemini-2.0-flash-exp',
        VITE_THINKING_AI_MODEL: 'anthropic/claude-3-5-sonnet-20241022',
        VITE_ENABLE_AUTO_FALLBACK: undefined,
        VITE_ENABLE_AUTO_ROUTING: undefined,
        VITE_ENABLE_MODEL_VARIANTS: undefined,
        VITE_CACHE_MODEL_LIST_DURATION: undefined,
      };
    }
    const errorMessages = result.errors?.map(e => `${e.path}: ${e.message}`).join('\n');
    throw new Error(`Environment validation failed:\n${errorMessages}`);
  }
  return result.env;
}
