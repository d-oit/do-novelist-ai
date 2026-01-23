/**
 * Server-side logging utility for API routes
 * Designed for Vercel serverless/edge functions
 * Uses console for serverless environments (expected behavior)
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
}

/**
 * Check if we're in production mode
 */
function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Server-side logger for API routes
 * Uses console (appropriate for serverless functions)
 */
class APILogger {
  private minLevel: LogLevel = isProduction() ? 'info' : 'debug';

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  private formatEntry(level: LogLevel, message: string, context?: LogContext): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(context && { context }),
    };
  }

  public debug(message: string, context?: LogContext): void {
    if (!this.shouldLog('debug')) return;
    const entry = this.formatEntry('debug', message, context);
    console.debug(JSON.stringify(entry));
  }

  public info(message: string, context?: LogContext): void {
    if (!this.shouldLog('info')) return;
    const entry = this.formatEntry('info', message, context);
    console.info(JSON.stringify(entry));
  }

  public warn(message: string, context?: LogContext): void {
    if (!this.shouldLog('warn')) return;
    const entry = this.formatEntry('warn', message, context);
    console.warn(JSON.stringify(entry));
  }

  public error(message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog('error')) return;
    const entry = this.formatEntry('error', message, {
      ...context,
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      }),
    });
    console.error(JSON.stringify(entry));
  }

  /**
   * Generic log method (for compatibility with existing code)
   */
  public log(level: LogLevel, message: string, context?: LogContext): void {
    switch (level) {
      case 'debug':
        this.debug(message, context);
        break;
      case 'info':
        this.info(message, context);
        break;
      case 'warn':
        this.warn(message, context);
        break;
      case 'error':
        this.error(message, context);
        break;
    }
  }
}

export const apiLogger = new APILogger();
