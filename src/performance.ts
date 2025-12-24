/**
 * Performance optimization utilities for Novelist.ai
 */

import { logger } from '@/lib/logging/logger';

// Preload critical resources
export const preloadCriticalResources = (): void => {
  // Preload local self-hosted fonts (optional). Ensure files exist in public/fonts.
  const fontPreloads: { href: string; type?: string }[] = [
    { href: '/fonts/SpaceGrotesk[wght].woff2', type: 'font/woff2' },
    { href: '/fonts/InterTight-VariableFont[wght].woff2', type: 'font/woff2' },
    { href: '/fonts/JetBrainsMono[wght].woff2', type: 'font/woff2' },
    // Add Fraunces variants only if used frequently:
    // { href: '/fonts/Fraunces-VariableFont[wght,opsz].woff2', type: 'font/woff2' },
  ];

  fontPreloads.forEach(({ href, type }) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.href = href;
    if (type) link.type = type;
    link.setAttribute('crossorigin', 'anonymous');
    document.head.appendChild(link);
  });
};

// Lazy load heavy features only when needed
export const createLazyFeatureLoader = () => {
  const loadedFeatures = new Set<string>();

  return {
    loadAnalytics: async () => {
      if (loadedFeatures.has('analytics')) return;
      loadedFeatures.add('analytics');
      await import('@/features/analytics');
    },

    loadEditor: async () => {
      if (loadedFeatures.has('editor')) return;
      loadedFeatures.add('editor');
      await import('@/features/editor');
    },

    loadPublishing: async () => {
      if (loadedFeatures.has('publishing')) return;
      loadedFeatures.add('publishing');
      await import('@/features/publishing');
    },

    loadWorldBuilding: async () => {
      if (loadedFeatures.has('world-building')) return;
      loadedFeatures.add('world-building');
      await import('@/features/world-building');
    },
  };
};

// Resource hints for better loading performance
export const addResourceHints = (): void => {
  const hints = [{ rel: 'dns-prefetch', href: '//ai-gateway.vercel.sh' }];

  hints.forEach(hint => {
    const link = document.createElement('link');
    Object.assign(link, hint);
    document.head.appendChild(link);
  });
};

// Intersection Observer for lazy loading components
export const createIntersectionLoader = (
  callback: () => void,
  options: IntersectionObserverInit = { threshold: 0.1 },
) => {
  if (!('IntersectionObserver' in window)) {
    // Fallback for older browsers
    callback();
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        callback();
        observer.disconnect();
      }
    });
  }, options);

  return observer;
};

// Performance monitoring utility
export const performanceMonitor = {
  startTiming: (name: string) => {
    if (typeof performance !== 'undefined') {
      performance.mark(`${name}-start`);
    }
  },
  endTiming: (name: string) => {
    if (typeof performance !== 'undefined') {
      try {
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);
      } catch (e) {
        // Ignore errors if marks are missing
        logger.warn('Performance measurement failed', { component: 'performance', name, error: e });
      }
    }
  },
};
