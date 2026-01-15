import React from 'react';

import { logger } from '@/lib/logging/logger';

// Error boundary for lazy loading failures
export class LazyLoadErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): { hasError: boolean; error: Error } {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    logger.error('Lazy loading error', {
      component: 'LazyLoadErrorBoundary',
      error,
      errorInfo,
    });
  }

  override render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className='flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-background p-8 text-foreground'>
            <div className='max-w-md text-center'>
              <h2 className='mb-2 text-xl font-semibold text-destructive'>
                Failed to Load Component
              </h2>
              <p className='mb-4 text-muted-foreground'>
                {this.state.error?.message ||
                  'An unexpected error occurred while loading this component.'}
              </p>
              <button
                onClick={() => window.location.reload()}
                className='rounded-md bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90'
              >
                Reload Page
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
