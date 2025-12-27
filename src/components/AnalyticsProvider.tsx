import { useEffect } from 'react';

import { analytics, experiments } from '@/lib/analytics';

interface AnalyticsProviderProps {
  children: React.ReactNode;
  apiKey?: string;
  apiHost?: string;
}

export function AnalyticsProvider({
  children,
  apiKey,
  apiHost,
}: AnalyticsProviderProps): React.ReactNode {
  useEffect(() => {
    const enabled = import.meta.env?.VITE_POSTHOG_ENABLED === 'true';

    if (!enabled || !apiKey) {
      console.warn('Analytics disabled or API key not provided');
      return;
    }

    try {
      analytics.init(apiKey, {
        apiHost,
        capturePageview: true,
        capturePageleave: true,
      });

      void experiments.init();
    } catch (err) {
      console.error('Failed to initialize analytics', err);
    }
  }, [apiKey, apiHost]);

  return children;
}
