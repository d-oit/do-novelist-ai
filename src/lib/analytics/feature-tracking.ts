import { logger } from '@/lib/logging/logger';

import { analytics } from './analytics';

const FEATURE_MODULES = [
  'analytics',
  'characters',
  'editor',
  'gamification',
  'generation',
  'projects',
  'publishing',
  'settings',
  'timeline',
  'versioning',
  'world-building',
  'writing-assistant',
] as const;

export type FeatureModule = (typeof FEATURE_MODULES)[number];

class FeatureTrackingService {
  private activeFeatures: Map<string, number> = new Map();

  private isValidFeature(feature: string): feature is FeatureModule {
    return FEATURE_MODULES.includes(feature as FeatureModule);
  }

  trackFeatureUsage(
    feature: FeatureModule,
    action: string,
    metadata?: Record<string, unknown>,
  ): void {
    if (!this.isValidFeature(feature)) {
      logger.warn('Invalid feature module', {
        service: 'FeatureTrackingService',
        feature,
        action,
      });
      return;
    }
    const startTime = performance.now();
    try {
      analytics.capture({
        event: 'feature_used',
        properties: {
          feature,
          action,
          ...metadata,
        },
      });

      const duration = performance.now() - startTime;
      if (duration > 50) {
        logger.warn('Feature tracking performance issue', {
          service: 'FeatureTrackingService',
          feature,
          duration_ms: duration.toFixed(2),
        });
      }
    } catch (err) {
      logger.error('Failed to track feature usage', {
        service: 'FeatureTrackingService',
        feature,
        action,
        error: err,
      });
    }
  }

  startFeatureTimer(feature: FeatureModule, metadata?: Record<string, unknown>): void {
    this.activeFeatures.set(feature, performance.now());
    analytics.capture({
      event: 'feature_entered',
      properties: {
        feature,
        ...metadata,
      },
    });
  }

  endFeatureTimer(feature: FeatureModule, metadata?: Record<string, unknown>): void {
    const startTime = this.activeFeatures.get(feature);
    if (!startTime) {
      logger.warn('No active timer found for feature', {
        service: 'FeatureTrackingService',
        feature,
      });
      return;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    analytics.capture({
      event: 'feature_exited',
      properties: {
        feature,
        duration_ms: Math.round(duration),
        duration_seconds: Math.round(duration / 1000),
        ...metadata,
      },
    });

    this.activeFeatures.delete(feature);
  }

  trackFeatureFlow(
    flowName: string,
    steps: Array<{ step: string; duration: number; success: boolean }>,
  ): void {
    const totalDuration = steps.reduce((sum, step) => sum + step.duration, 0);
    const successRate = steps.filter(s => s.success).length / steps.length;

    analytics.capture({
      event: 'feature_flow_completed',
      properties: {
        flow_name: flowName,
        total_steps: steps.length,
        total_duration_ms: Math.round(totalDuration),
        success_rate: Math.round(successRate * 100) / 100,
        steps,
      },
    });
  }

  trackError(feature: FeatureModule, error: Error, context?: Record<string, unknown>): void {
    analytics.capture({
      event: 'feature_error',
      properties: {
        feature,
        error_name: error.name,
        error_message: error.message,
        error_stack: error.stack,
        ...context,
      },
    });
  }

  trackConversion(
    feature: FeatureModule,
    action: string,
    metadata?: Record<string, unknown>,
  ): void {
    analytics.capture({
      event: 'conversion',
      properties: {
        feature,
        action,
        ...metadata,
      },
    });
  }

  trackRetention(feature: FeatureModule, daysSinceLastUse: number): void {
    analytics.capture({
      event: 'feature_retention',
      properties: {
        feature,
        days_since_last_use: daysSinceLastUse,
      },
    });
  }

  getActiveFeatures(): string[] {
    return Array.from(this.activeFeatures.keys());
  }

  clearFeatureTimers(): void {
    this.activeFeatures.clear();
  }
}

export const featureTracking = new FeatureTrackingService();
