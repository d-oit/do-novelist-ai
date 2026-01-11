import { useEffect } from 'react';

import { analytics, experiments } from '@/lib/analytics';
import { logger } from '@/lib/logging/logger';

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
      logger.warn('Analytics disabled or API key not provided', {
        component: 'AnalyticsProvider',
        enabled,
        hasApiKey: !!apiKey,
      });
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
      logger.error('Failed to initialize analytics', {
        component: 'AnalyticsProvider',
        error: err,
      });
    }
  }, [apiKey, apiHost]);

  return children;
}
