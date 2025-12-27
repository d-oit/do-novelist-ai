import { useEffect } from 'react';

import { featureTracking, type FeatureModule } from '@/lib/analytics';

export interface UseAnalyticsOptions {
  feature: FeatureModule;
  trackTimeInFeature?: boolean;
  metadata?: Record<string, unknown>;
}

export function useAnalytics(options: UseAnalyticsOptions): void {
  const { feature, trackTimeInFeature = true, metadata } = options;

  useEffect(() => {
    if (trackTimeInFeature) {
      featureTracking.startFeatureTimer(feature, metadata);
    }

    return (): void => {
      if (trackTimeInFeature) {
        featureTracking.endFeatureTimer(feature, metadata);
      }
    };
  }, [feature, trackTimeInFeature, metadata]);
}

export function useFeatureAction(feature: FeatureModule) {
  return {
    trackAction: (action: string, metadata?: Record<string, unknown>): void => {
      featureTracking.trackFeatureUsage(feature, action, metadata);
    },
    trackError: (error: Error, context?: Record<string, unknown>): void => {
      featureTracking.trackError(feature, error, context);
    },
    trackConversion: (action: string, metadata?: Record<string, unknown>): void => {
      featureTracking.trackConversion(feature, action, metadata);
    },
  };
}
