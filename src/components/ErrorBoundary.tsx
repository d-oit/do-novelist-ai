import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private readonly handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  private readonly handleRefresh = (): void => {
    window.location.reload();
  };

  public override render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className='flex min-h-screen items-center justify-center bg-background text-foreground'>
          <div className='mx-auto max-w-md p-6 text-center'>
            <div className='mb-6'>
              <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10'>
                <span className='text-2xl'>⚠️</span>
              </div>
              <h2 className='mb-2 text-2xl font-bold'>Something went wrong</h2>
              <p className='mb-6 text-muted-foreground'>
                An unexpected error occurred. Please try refreshing the page or contact support if
                the problem persists.
              </p>
            </div>

            <div className='space-y-3'>
              <button
                onClick={this.handleRefresh}
                className='w-full rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90'
              >
                Refresh Page
              </button>

              <button
                onClick={this.handleRetry}
                className='w-full rounded-lg bg-secondary px-4 py-2 font-medium text-secondary-foreground transition-colors hover:bg-secondary/90'
              >
                Try Again
              </button>
            </div>

            {this.state.error && (
              <details className='mt-6 text-left'>
                <summary className='cursor-pointer text-sm text-muted-foreground hover:text-foreground'>
                  Show Error Details
                </summary>
                <pre className='mt-2 overflow-auto rounded bg-muted p-3 text-xs text-muted-foreground'>
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
