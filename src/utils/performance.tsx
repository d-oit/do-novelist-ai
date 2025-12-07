// Performance monitoring utilities for lazy loading and component metrics
import React from 'react';

interface PerformanceMetrics {
  routeLoadTime: Record<string, number>;
  componentLoadTime: Record<string, number>;
  bundleSize: Record<string, number>;
  errorCount: Record<string, number>;
}

interface PerformanceBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface PerformanceBoundaryProps {
  children?: React.ReactNode;
  fallback?: React.ReactNode;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics;
  private startTime: Record<string, number>;

  constructor() {
    this.metrics = {
      routeLoadTime: {},
      componentLoadTime: {},
      bundleSize: {},
      errorCount: {},
    };
    this.startTime = {};
  }

  // Start timing for a component or route
  startTiming(label: string): void {
    this.startTime[label] = performance.now();
  }

  // End timing and record the duration
  endTiming(label: string): number {
    if (!this.startTime[label]) {
      console.warn(`No start time found for ${label}`);
      return 0;
    }

    const duration = performance.now() - this.startTime[label];
    this.metrics.componentLoadTime[label] = duration;
    delete this.startTime[label];

    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Performance [${label}]: ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  // Record bundle size
  recordBundleSize(label: string, size: number): void {
    this.metrics.bundleSize[label] = size;

    if (process.env.NODE_ENV === 'development') {
      console.log(`Bundle Size [${label}]: ${(size / 1024).toFixed(2)}KB`);
    }
  }

  // Record errors
  recordError(label: string): void {
    this.metrics.errorCount[label] = (this.metrics.errorCount[label] || 0) + 1;
  }

  // Get performance report
  getReport(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // Clear metrics
  clear(): void {
    this.metrics = {
      routeLoadTime: {},
      componentLoadTime: {},
      bundleSize: {},
      errorCount: {},
    };
  }

  // Check if performance budgets are exceeded
  checkBudgets(): { exceeded: boolean; warnings: string[] } {
    const warnings: string[] = [];
    let exceeded = false;

    // Check component load times (should be under 200ms for good UX)
    Object.entries(this.metrics.componentLoadTime).forEach(([component, time]) => {
      if (time > 200) {
        warnings.push(`Component ${component} took ${time.toFixed(2)}ms (budget: 200ms)`);
        exceeded = true;
      }
    });

    // Check bundle sizes (should be under 500KB for initial load)
    Object.entries(this.metrics.bundleSize).forEach(([bundle, size]) => {
      if (size > 500 * 1024) {
        // 500KB in bytes
        warnings.push(`Bundle ${bundle} is ${(size / 1024).toFixed(2)}KB (budget: 500KB)`);
        exceeded = true;
      }
    });

    return { exceeded, warnings };
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Performance boundary component
export class PerformanceBoundary extends React.Component<
  PerformanceBoundaryProps,
  PerformanceBoundaryState
> {
  constructor(props: PerformanceBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): PerformanceBoundaryState {
    performanceMonitor.recordError('PerformanceBoundary');
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Performance boundary error:', error, errorInfo);
  }

  override render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className='flex items-center justify-center p-8 text-center'>
            <div>
              <h3 className='mb-2 text-lg font-semibold text-destructive'>Performance Error</h3>
              <p className='text-muted-foreground'>
                A performance issue was detected. Please try again.
              </p>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
