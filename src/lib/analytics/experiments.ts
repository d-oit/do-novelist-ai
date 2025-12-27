import posthog from 'posthog-js';

import { logger } from '@/lib/logging/logger';

import type { FeatureFlag } from './types';

class ExperimentService {
  private loaded: boolean = false;

  async init(): Promise<void> {
    if (this.loaded) {
      return;
    }

    try {
      posthog.reloadFeatureFlags();
      this.loaded = true;
      logger.info('Experiment service initialized', { component: 'Experiments' });
    } catch (err) {
      logger.error('Failed to initialize experiment service', {
        component: 'Experiments',
        error: err,
      });
    }
  }

  isFeatureEnabled(flag: FeatureFlag, defaultValue = false): boolean {
    try {
      const result = posthog.isFeatureEnabled(flag, { send_event: true });
      return result ?? defaultValue;
    } catch (err) {
      logger.warn('Failed to check feature flag', { component: 'Experiments', flag, error: err });
      return defaultValue;
    }
  }

  getFeatureFlag(flag: FeatureFlag): unknown {
    try {
      return posthog.getFeatureFlag(flag);
    } catch (err) {
      logger.warn('Failed to get feature flag', { component: 'Experiments', flag, error: err });
      return null;
    }
  }

  getAllFeatureFlags(): unknown {
    try {
      return posthog.featureFlags.getFlags();
    } catch (err) {
      logger.error('Failed to get all feature flags', { component: 'Experiments', error: err });
      return {};
    }
  }

  isInExperiment(experimentKey: string): boolean {
    try {
      const flagValue = posthog.getFeatureFlag(experimentKey);
      return flagValue !== null && flagValue !== false && flagValue !== undefined;
    } catch (err) {
      logger.warn('Failed to check experiment enrollment', {
        component: 'Experiments',
        experimentKey,
        error: err,
      });
      return false;
    }
  }

  getExperimentVariant(experimentKey: string): string | null {
    try {
      const flagValue = posthog.getFeatureFlag(experimentKey);
      return typeof flagValue === 'string' ? flagValue : null;
    } catch (err) {
      logger.warn('Failed to get experiment variant', {
        component: 'Experiments',
        experimentKey,
        error: err,
      });
      return null;
    }
  }

  trackExperimentEvent(
    experimentKey: string,
    eventName: string,
    properties?: Record<string, unknown>,
  ): void {
    try {
      const variant = this.getExperimentVariant(experimentKey);
      if (!variant) {
        logger.warn('Cannot track experiment event - user not in experiment', {
          component: 'Experiments',
          experimentKey,
        });
        return;
      }

      posthog.capture(eventName, {
        $experiment: experimentKey,
        $variant: variant,
        ...properties,
      });
    } catch (err) {
      logger.error('Failed to track experiment event', {
        component: 'Experiments',
        experimentKey,
        eventName,
        error: err,
      });
    }
  }

  async reloadFeatureFlags(): Promise<void> {
    try {
      posthog.reloadFeatureFlags();
      logger.debug('Feature flags reloaded', { component: 'Experiments' });
    } catch (err) {
      logger.error('Failed to reload feature flags', { component: 'Experiments', error: err });
    }
  }

  waitForFeatureFlag(flag: FeatureFlag, timeout = 5000): Promise<boolean | string | null> {
    return new Promise(resolve => {
      const checkFlag = (): void => {
        const value = posthog.getFeatureFlag(flag);
        if (value !== null && value !== undefined) {
          resolve(value);
          return;
        }
        setTimeout(checkFlag, 100);
      };

      const timer = setTimeout(() => {
        resolve(null);
      }, timeout);

      checkFlag();

      return (): void => {
        clearTimeout(timer);
      };
    });
  }
}

export const experiments = new ExperimentService();
