/**
 * Enhanced code splitting utilities with performance optimizations
 */

import { logger } from '@/lib/logging/logger';

// Performance optimization utilities for component preloading

// Simplified preload function
export const preloadComponent = (importFn: () => Promise<unknown>): void => {
  // Preload on user interaction or idle time
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => {
      importFn().catch(error => {
        logger.error('Failed to preload component', { component: 'code-splitting', error });
      });
    });
  } else {
    setTimeout(() => {
      importFn().catch(error => {
        logger.error('Failed to preload component', { component: 'code-splitting', error });
      });
    }, 100);
  }
};

// Preload critical components on app start
export const preloadCriticalComponents = (): void => {
  // Preload likely-to-be-used components
  preloadComponent(() => import('@/features/analytics/components/AnalyticsDashboard'));
  preloadComponent(() => import('@/features/editor/components/BookViewer'));
};
