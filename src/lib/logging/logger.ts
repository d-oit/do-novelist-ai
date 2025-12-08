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

class Logger {
  private minLevel: LogLevel = import.meta.env.DEV ? 'debug' : 'info';
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

    const formatted = import.meta.env.PROD
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

    if (import.meta.env.PROD) {
      this.sendToAggregator();
    }
  }

  private sendToAggregator(): void {
    // TODO: Implement log aggregation (Sentry, LogRocket, Datadog)
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
