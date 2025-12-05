/**
 * Error Boundary - React error boundary component
 * Based on 2024-2025 best practices
 */

import React, { Component, ErrorInfo, ReactNode, ComponentType } from 'react';
import { Button } from './ui/Button';
import { errorHandler } from '../lib/errors/error-handler';
import { logger } from '../lib/errors/logging';

interface Props {
  children: ReactNode;
  fallback?: ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'page' | 'section' | 'component';
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Generic error boundary component
 */
export class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private readonly maxRetries = 3;

  public constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error using error handler
    errorHandler.handle(error, {
      context: this.props.componentName ?? 'ErrorBoundary',
      source: 'react-error-boundary',
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      try {
        this.props.onError(error, errorInfo);
      } catch (handlerError) {
        logger.error('Error in onError handler', { handlerError });
      }
    }

    // Report to error tracking service
    logger.error('React component error', {
      error: {
        message: error.message,
        stack: error.stack,
      },
      errorInfo: {
        componentStack: errorInfo.componentStack,
      },
      componentName: this.props.componentName,
      retryCount: this.retryCount,
    });
  }

  private handleRetry = (): void => {
    this.retryCount++;

    if (this.retryCount <= this.maxRetries) {
      logger.info('Retrying component', {
        componentName: this.props.componentName,
        retryCount: this.retryCount,
        maxRetries: this.maxRetries,
      });

      this.setState({
        hasError: false,
        error: null,
      });
    } else {
      logger.error('Max retries exceeded', {
        componentName: this.props.componentName,
        retryCount: this.retryCount,
        maxRetries: this.maxRetries,
      });
    }
  };

  public override render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} retry={this.handleRetry} />;
      }

      // Default fallback UI
      return (
        <div className='flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-destructive/20 bg-destructive/5 p-8'>
          <div className='mb-2 font-semibold text-destructive'>Something went wrong</div>
          <div className='mb-4 max-w-md text-center text-sm text-muted-foreground'>
            {errorHandler.getUserMessage(this.state.error)}
          </div>
          {this.retryCount < this.maxRetries && (
            <Button onClick={this.handleRetry} variant='outline' size='sm'>
              Try Again ({this.maxRetries - this.retryCount} attempts left)
            </Button>
          )}
          {this.retryCount >= this.maxRetries && (
            <div className='mt-2 text-xs text-muted-foreground'>
              Max retries exceeded. Please refresh the page.
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Page-level error boundary
 */
export const PageErrorBoundary: React.FC<Props> = ({ children, componentName }): ReactNode => (
  <ErrorBoundary
    level='page'
    componentName={componentName ?? 'Page'}
    fallback={({ error, retry }) => (
      <div className='flex min-h-[400px] flex-col items-center justify-center p-12'>
        <h2 className='mb-4 text-2xl font-bold text-destructive'>Page Error</h2>
        <p className='mb-6 max-w-lg text-center text-muted-foreground'>
          We encountered an unexpected error. Our team has been notified.
        </p>
        <Button onClick={retry} variant='outline'>
          Try Again
        </Button>
        <details className='mt-6 max-w-2xl'>
          <summary className='cursor-pointer text-sm text-muted-foreground hover:text-foreground'>
            Error Details
          </summary>
          <pre className='mt-2 overflow-auto rounded-md bg-muted p-4 text-xs'>{error.message}</pre>
        </details>
      </div>
    )}
  >
    {children}
  </ErrorBoundary>
);

/**
 * Section-level error boundary
 */
export const SectionErrorBoundary: React.FC<Props> = ({ children, componentName }): ReactNode => (
  <ErrorBoundary
    level='section'
    componentName={componentName ?? 'Section'}
    fallback={({ error }) => (
      <div className='flex flex-col items-center justify-center rounded-lg border border-destructive/20 bg-destructive/5 p-8'>
        <div className='mb-2 font-medium text-destructive'>This section encountered an error</div>
        <div className='text-sm text-muted-foreground'>{errorHandler.getUserMessage(error)}</div>
      </div>
    )}
  >
    {children}
  </ErrorBoundary>
);

/**
 * Component-level error boundary (minimal)
 */
export const ComponentErrorBoundary: React.FC<Props> = ({ children, componentName }): ReactNode => (
  <ErrorBoundary
    level='component'
    componentName={componentName ?? 'Component'}
    fallback={() => <div className='text-sm text-destructive'>⚠️ Error rendering component</div>}
  >
    {children}
  </ErrorBoundary>
);

/**
 * Higher-order component for error boundaries
 */
export const withErrorBoundary = <P extends object>(
  Component: ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>,
): ComponentType<P> => {
  const WrappedComponent = (props: P): ReactNode => {
    return (
      <ErrorBoundary
        {...errorBoundaryProps}
        componentName={Component.displayName ?? Component.name}
      >
        <Component {...props} />
      </ErrorBoundary>
    );
  };

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName ?? Component.name})`;

  return WrappedComponent;
};

/**
 * Hook for error handling in function components
 */
export const useErrorHandler = (
  componentName?: string,
): {
  handleError: (error: unknown, context?: string) => void;
  getErrorMessage: (error: unknown) => string;
} => {
  const handleError = (error: unknown, context?: string): void => {
    const fullContext =
      context !== null && context !== undefined
        ? `${componentName ?? ''}:${context}`
        : (componentName ?? '');
    errorHandler.handle(error, {
      context: fullContext,
      source: 'react-hook',
    });
  };

  const getErrorMessage = (error: unknown): string => {
    return errorHandler.getUserMessage(error);
  };

  return { handleError, getErrorMessage };
};

/**
 * Editor-specific error boundary
 */
export const EditorErrorBoundary: React.FC<Props> = ({ children, componentName }): ReactNode => (
  <ErrorBoundary
    componentName={componentName ?? 'Editor'}
    level='section'
    fallback={({ error, retry }) => (
      <div className='flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-destructive/20 bg-destructive/5 p-6'>
        <h2 className='mb-3 text-lg font-semibold text-destructive'>Editor Error</h2>
        <p className='mb-4 text-center text-sm text-muted-foreground'>
          The editor encountered an error. Your work has been auto-saved.
        </p>
        <div className='flex gap-2'>
          <Button onClick={retry} size='sm'>
            Retry
          </Button>
          <Button onClick={() => window.location.reload()} variant='outline' size='sm'>
            Refresh Page
          </Button>
        </div>
        <details className='mt-4'>
          <summary className='cursor-pointer text-xs text-muted-foreground hover:text-foreground'>
            Technical Details
          </summary>
          <pre className='mt-2 max-w-full overflow-auto rounded bg-muted p-2 text-xs'>
            {error.message}
          </pre>
        </details>
      </div>
    )}
  >
    {children}
  </ErrorBoundary>
);

/**
 * Projects-specific error boundary
 */
export const ProjectsErrorBoundary: React.FC<Props> = ({ children, componentName }): ReactNode => (
  <ErrorBoundary
    componentName={componentName ?? 'Projects'}
    level='section'
    fallback={({ error }) => (
      <div className='flex flex-col items-center justify-center rounded-lg border border-destructive/20 bg-destructive/5 p-6'>
        <h2 className='mb-3 text-lg font-semibold text-destructive'>Projects Error</h2>
        <p className='mb-4 text-center text-sm text-muted-foreground'>
          Unable to load projects. Please try again.
        </p>
        <p className='text-xs text-muted-foreground'>{error.message}</p>
      </div>
    )}
  >
    {children}
  </ErrorBoundary>
);

/**
 * AI Service-specific error boundary
 */
export const AIServiceErrorBoundary: React.FC<Props> = ({ children, componentName }): ReactNode => (
  <ErrorBoundary
    componentName={componentName ?? 'AIService'}
    level='section'
    fallback={({ error }) => (
      <div className='flex flex-col items-center justify-center rounded-lg border border-destructive/20 bg-destructive/5 p-6'>
        <h2 className='mb-3 text-lg font-semibold text-destructive'>AI Service Error</h2>
        <p className='mb-2 text-center text-sm text-muted-foreground'>
          The AI service is temporarily unavailable.
        </p>
        <p className='text-xs text-muted-foreground'>{error.message}</p>
      </div>
    )}
  >
    {children}
  </ErrorBoundary>
);

// Default export for backward compatibility
export default ErrorBoundary;
