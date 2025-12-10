import { z } from 'zod';

const envSchema = z.object({
  // Optional - required in production but lenient in tests/CI
  VITE_AI_GATEWAY_API_KEY: z.string().optional(),

  // Optional with defaults
  VITE_DEFAULT_AI_PROVIDER: z.enum(['openai', 'anthropic', 'google', 'mistral']).default('mistral'),
  VITE_DEFAULT_AI_MODEL: z.string().default('mistral:mistral-medium-latest'),
  VITE_THINKING_AI_MODEL: z.string().default('mistral:mistral-medium'),
  VITE_ENABLE_AUTO_FALLBACK: z.string().optional(),
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
      const isCI = import.meta.env.CI;
      const errors = error.issues.map((err: z.ZodIssue) => ({
        path: err.path.join('.'),
        message: err.message,
        severity: isCI ? 'warning' : 'error',
      }));
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
        VITE_AI_GATEWAY_API_KEY: undefined,
        VITE_DEFAULT_AI_PROVIDER: 'mistral',
        VITE_DEFAULT_AI_MODEL: 'mistral:mistral-medium-latest',
        VITE_THINKING_AI_MODEL: 'mistral:mistral-medium',
        VITE_ENABLE_AUTO_FALLBACK: undefined,
      };
    }
    const errorMessages = result.errors?.map(e => `${e.path}: ${e.message}`).join('\n');
    throw new Error(`Environment validation failed:\n${errorMessages}`);
  }
  return result.env;
}
