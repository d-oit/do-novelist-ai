/**
 * Global type declarations for external libraries
 */

declare global {
  interface Window {
    Sentry?: {
      captureMessage: (message: string, options?: { level?: string; extra?: Record<string, unknown> }) => void;
    };
    DD_LOGS?: {
      logger: {
        info: (message: string, context?: Record<string, unknown>) => void;
      };
    };
    LogRocket?: {
      log: (message: string, data?: Record<string, unknown>) => void;
    };
  }
}

export {};
