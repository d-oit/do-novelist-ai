/**
 * Performance optimization utilities for Novelist.ai
 */

// Preload critical resources
export const preloadCriticalResources = (): void => {
  // Preload fonts that are critical for first paint
  const fontPreloads = [
    'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap',
    'https://fonts.googleapis.com/css2?family=Inter+Tight:wght@100..900&display=swap',
  ];

  fontPreloads.forEach(href => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = href;
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
  const hints = [
    { rel: 'dns-prefetch', href: '//fonts.googleapis.com' },
    { rel: 'dns-prefetch', href: '//ai-gateway.vercel.sh' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: true },
  ];

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
