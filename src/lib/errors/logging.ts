/**
 * Logging System - Structured logging with multiple service support
 * Based on 2024-2025 best practices
 */

/**
 * Log levels in order of severity
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Log entry structure
 */
export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: Error;
  stack?: string;
  source?: string;
}

/**
 * Log service interface
 */
export interface LogService {
  name: string;
  log(entry: LogEntry): void;
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string | Error, context?: Record<string, unknown>): void;
}

/**
 * Console log service (default)
 */
export class ConsoleLogService implements LogService {
  public name = 'console';
  private minLevel: LogLevel;

  public constructor(minLevel: LogLevel = 'info') {
    this.minLevel = minLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };
    return levels[level] >= levels[this.minLevel];
  }

  private formatEntry(entry: LogEntry): string {
    const date = new Date(entry.timestamp).toISOString();
    const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
    const errorStr = entry.error ? `\n${entry.error.stack ?? entry.error.message}` : '';
    return `[${date}] [${entry.level.toUpperCase()}] ${entry.message}${contextStr}${errorStr}`;
  }

  public log(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;

    const formatted = this.formatEntry(entry);
    switch (entry.level) {
      case 'debug':
        console.debug(formatted);
        break;
      case 'info':
        console.info(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'error':
        console.error(formatted);
        break;
    }
  }

  public debug(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog('debug')) return;
    this.log({
      timestamp: Date.now(),
      level: 'debug',
      message,
      context,
      source: 'application',
    });
  }

  public info(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog('info')) return;
    this.log({
      timestamp: Date.now(),
      level: 'info',
      message,
      context,
      source: 'application',
    });
  }

  public warn(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog('warn')) return;
    this.log({
      timestamp: Date.now(),
      level: 'warn',
      message,
      context,
      source: 'application',
    });
  }

  public error(message: string | Error, context?: Record<string, unknown>): void {
    if (!this.shouldLog('error')) return;
    this.log({
      timestamp: Date.now(),
      level: 'error',
      message: typeof message === 'string' ? message : message.message,
      error: message instanceof Error ? message : undefined,
      stack: message instanceof Error ? message.stack : undefined,
      context,
      source: 'application',
    });
  }
}

/**
 * Sentry log service (for production error tracking)
 */
export class SentryLogService implements LogService {
  public name = 'sentry';

  public constructor() {}

  public ensureSentryLoaded(): void {
    if (typeof window === 'undefined' || (window as { Sentry?: unknown }).Sentry == null) {
      return;
    }
  }

  public log(entry: LogEntry): void {
    this.ensureSentryLoaded();
    const Sentry = (
      window as {
        Sentry?: {
          captureException: (
            error: Error,
            options?: { level: string; extra?: Record<string, unknown> },
          ) => void;
          addBreadcrumb: (breadcrumb: {
            message: string;
            level: string;
            data?: Record<string, unknown>;
            timestamp: number;
          }) => void;
        };
      }
    ).Sentry;
    if (!Sentry) return;

    if (entry.level === 'error' && entry.error) {
      Sentry.captureException(entry.error, {
        level: 'error',
        extra: entry.context,
      });
    } else {
      Sentry.addBreadcrumb({
        message: entry.message,
        level: entry.level,
        data: entry.context,
        timestamp: entry.timestamp / 1000,
      });
    }
  }

  public debug(message: string, context?: Record<string, unknown>): void {
    this.log({
      timestamp: Date.now(),
      level: 'debug',
      message,
      context,
      source: 'application',
    });
  }

  public info(message: string, context?: Record<string, unknown>): void {
    this.log({
      timestamp: Date.now(),
      level: 'info',
      message,
      context,
      source: 'application',
    });
  }

  public warn(message: string, context?: Record<string, unknown>): void {
    this.log({
      timestamp: Date.now(),
      level: 'warn',
      message,
      context,
      source: 'application',
    });
  }

  public error(message: string | Error, context?: Record<string, unknown>): void {
    this.log({
      timestamp: Date.now(),
      level: 'error',
      message: typeof message === 'string' ? message : message.message,
      error: message instanceof Error ? message : undefined,
      context,
      source: 'application',
    });
  }
}

/**
 * Logger - Main logging interface
 */
export class Logger {
  private services: LogService[];
  private minLevel: LogLevel;

  public constructor(
    services: LogService[] = [new ConsoleLogService()],
    minLevel: LogLevel = 'info',
  ) {
    this.services = services;
    this.minLevel = minLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };
    return levels[level] >= levels[this.minLevel];
  }

  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error,
  ): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      message,
      context,
      error,
      source: 'application',
    };

    this.services.forEach(service => service.log(entry));
  }

  public debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context);
  }

  public info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }

  public warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
  }

  public error(message: string | Error, context?: Record<string, unknown>): void {
    this.log(
      'error',
      message instanceof Error ? message.message : message,
      context,
      message instanceof Error ? message : undefined,
    );
  }

  /**
   * Log an error with full context
   */
  public logError(error: unknown, context?: Record<string, unknown>): void {
    const appError = error instanceof Error ? error : new Error(String(error));

    this.log(
      'error',
      appError.message,
      {
        ...context,
        error: {
          name: appError.name,
          message: appError.message,
          stack: appError.stack,
          cause: appError.cause,
        },
      },
      appError,
    );
  }

  /**
   * Create a child logger with additional context
   */
  public child(context: Record<string, unknown>): Logger {
    return new Logger(
      this.services.map(service => ({
        ...service,
        debug: (message: string, ctx?: Record<string, unknown>) =>
          service.debug(message, { ...ctx, ...context }),
        info: (message: string, ctx?: Record<string, unknown>) =>
          service.info(message, { ...ctx, ...context }),
        warn: (message: string, ctx?: Record<string, unknown>) =>
          service.warn(message, { ...ctx, ...context }),
        error: (message: string | Error, ctx?: Record<string, unknown>) =>
          service.error(message, { ...ctx, ...context }),
      })),
      this.minLevel,
    );
  }
}

/**
 * Global logger instance
 */
let globalLogger: Logger | null = null;

/**
 * Get or create global logger
 */
export const getLogger = (): Logger => {
  if (!globalLogger) {
    const services: LogService[] = [new ConsoleLogService()];

    // Add Sentry in production if available
    if (typeof window !== 'undefined' && (window as { Sentry?: unknown }).Sentry != null) {
      services.push(new SentryLogService());
    }

    globalLogger = new Logger(services, import.meta.env.DEV ? 'debug' : 'info');
  }
  return globalLogger;
};

/**
 * Convenience loggers for specific modules
 */
export const logger = getLogger();

/**
 * Performance logger
 */
export const performanceLogger = {
  start: (operation: string): (() => void) => {
    const start = performance.now();
    logger.debug(`Starting operation: ${operation}`);
    return () => {
      const duration = performance.now() - start;
      logger.info(`Completed operation: ${operation}`, { duration });
    };
  },

  measure: async <T>(operation: string, fn: () => Promise<T>): Promise<T> => {
    const end = performanceLogger.start(operation);
    try {
      const result = await fn();
      end();
      return result;
    } catch (error) {
      end();
      throw error;
    }
  },
};

/**
 * Log structured data for analytics or debugging
 */
export const logEvent = (eventName: string, properties?: Record<string, unknown>): void => {
  logger.info(`Event: ${eventName}`, {
    event: eventName,
    properties,
  });
};
