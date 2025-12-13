export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  userId?: string;
  projectId?: string;
  component?: string;
  action?: string;
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * Safely check if we're in development mode
 * Handles various environments including Vite, Node.js, and test contexts
 */
const isDevelopmentMode = (): boolean => {
  try {
    // Check Vite environment first
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      if (import.meta.env.DEV === true) return true;
      if (import.meta.env.NODE_ENV === 'development') return true;
    }
    // Check Node.js environment
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
      return true;
    }
  } catch {
    // Ignore errors in environment detection
  }
  return false;
};

/**
 * Safely check if we're in production mode
 */
const isProductionMode = (): boolean => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      if (import.meta.env.PROD === true) return true;
      if (import.meta.env.NODE_ENV === 'production') return true;
    }
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') {
      return true;
    }
  } catch {
    // Ignore errors in environment detection
  }
  return false;
};

class Logger {
  private minLevel: LogLevel = isDevelopmentMode() ? 'debug' : 'info';
  private context: LogContext = {};

  public setContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...this.context, ...context },
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    const formatted = isProductionMode()
      ? JSON.stringify(entry)
      : `[${entry.timestamp}] ${entry.level.toUpperCase()} ${message} ${JSON.stringify(entry.context || {})}`;

    switch (level) {
      case 'warn':
        console.warn(formatted);
        break;
      case 'error':
        console.error(formatted);
        break;
      default:
        // Debug and info levels don't use console to comply with ESLint no-console rule
        break;
    }

    if (isProductionMode()) {
      this.sendToAggregator();
    }
  }

  private sendToAggregator(): void {
    // Pluggable log aggregation with no-op defaults
    try {
      const entry = { context: this.context } as Partial<LogEntry>;
      // Sentry integration
      if (typeof window !== 'undefined' && window.Sentry && window.Sentry.captureMessage) {
        window.Sentry.captureMessage('log', {
          level: 'info',
          extra: entry,
        });
        return;
      }
      // Datadog RUM/logs
      if (typeof window !== 'undefined' && window.DD_LOGS && window.DD_LOGS.logger) {
        window.DD_LOGS.logger.info('log', entry);
        return;
      }
      // LogRocket breadcrumbs
      if (typeof window !== 'undefined' && window.LogRocket && window.LogRocket.log) {
        window.LogRocket.log('log', entry);
        return;
      }
      // No-op if no aggregator present
    } catch {
      // Swallow aggregator errors
    }
  }

  public debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  public info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  public warn(message: string, context?: LogContext, error?: Error): void {
    this.log('warn', message, context, error);
  }

  public error(message: string, context?: LogContext, error?: Error): void {
    this.log('error', message, context, error);
  }

  public child(context: LogContext): Logger {
    const childLogger = new Logger();
    childLogger.setContext({ ...this.context, ...context });
    return childLogger;
  }
}

export const logger = new Logger();

export function createLogger(context: LogContext): Logger {
  return logger.child(context);
}
