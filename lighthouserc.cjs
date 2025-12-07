module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:4173'],
      startServerCommand: 'npm run preview',
      startServerReadyPattern: 'Local:.*:4173',
      startServerReadyTimeout: 30000,
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --disable-gpu --disable-dev-shm-usage',
        // Emulate slower mobile device for realistic testing
        emulatedFormFactor: 'mobile',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0,
        },
      },
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        // Performance thresholds
        'first-contentful-paint': ['error', { minScore: 0.8 }],
        'largest-contentful-paint': ['error', { minScore: 0.8 }],
        'cumulative-layout-shift': ['error', { minScore: 0.9 }],
        'total-blocking-time': ['error', { minScore: 0.8 }],

        // Core Web Vitals
        'speed-index': ['warn', { minScore: 0.8 }],
        interactive: ['warn', { minScore: 0.8 }],

        // Bundle size related
        'unused-javascript': ['warn', { minScore: 0.8 }],
        'unused-css-rules': ['warn', { minScore: 0.8 }],
        'render-blocking-resources': ['warn', { minScore: 0.8 }],

        // Accessibility (minimum standards)
        'color-contrast': 'error',
        'image-alt': 'error',
        label: 'error',
        'link-name': 'error',

        // Best practices for performance
        'uses-optimized-images': ['warn', { minScore: 0.8 }],
        'uses-webp-images': ['warn', { minScore: 0.6 }],
        'uses-responsive-images': ['warn', { minScore: 0.8 }],
        'efficient-animated-content': ['warn', { minScore: 0.8 }],

        // Modern web standards
        'uses-http2': ['warn', { minScore: 0.8 }],
        'uses-rel-preconnect': ['warn', { minScore: 0.8 }],

        // Categories minimum scores
        'categories:performance': ['error', { minScore: 0.85 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
