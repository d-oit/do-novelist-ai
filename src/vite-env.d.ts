/// <reference types="vite/client" />

interface ImportMetaEnv {
  // AI Configuration
  readonly VITE_OPENROUTER_API_KEY?: string;
  readonly VITE_DEFAULT_AI_PROVIDER?: string;
  readonly VITE_DEFAULT_AI_MODEL?: string;
  readonly VITE_THINKING_AI_MODEL?: string;
  readonly VITE_GEMINI_API_KEY?: string;
  readonly VITE_ENABLE_AUTO_FALLBACK?: string;
  readonly VITE_DISABLE_AI_SDK?: string;

  // Database Configuration
  readonly VITE_TURSO_DATABASE_URL?: string;
  readonly VITE_TURSO_AUTH_TOKEN?: string;

  // Test Environment Flags
  readonly PLAYWRIGHT_TEST?: string;
  readonly PLAYWRIGHT?: string;
  readonly CI?: string;
  readonly NODE_ENV?: string;

  // Vite built-in
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
  readonly BASE_URL: string;
  readonly SSR: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
