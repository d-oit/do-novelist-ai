import posthog from 'posthog-js';

import { logger } from '@/lib/logging/logger';

import type { AnalyticsEvent, PageView, UserProperties } from './types';

class AnalyticsService {
  private initialized: boolean = false;
  private trackingEnabled: boolean = true;

  init(
    apiKey: string,
    options?: {
      apiHost?: string;
      capturePageview?: boolean;
      capturePageleave?: boolean;
      disablePersistence?: boolean;
    },
  ): void {
    if (this.initialized) {
      logger.warn('Analytics already initialized', { component: 'Analytics' });
      return;
    }

    try {
      posthog.init(apiKey, {
        api_host: options?.apiHost ?? 'https://app.posthog.com',
        capture_pageview: options?.capturePageview ?? true,
        capture_pageleave: options?.capturePageleave ?? true,
        disable_persistence: options?.disablePersistence ?? false,
        loaded: (ph): void => {
          ph.register({
            app_name: 'novelist.ai',
            app_version: import.meta.env?.VITE_APP_VERSION ?? 'unknown',
          });
        },
        before_send: (event): null | typeof event => {
          if (!this.trackingEnabled) {
            return null;
          }
          return event;
        },
      });

      this.initialized = true;
      logger.info('Analytics initialized', { component: 'Analytics', apiHost: options?.apiHost });
    } catch (err) {
      logger.error('Failed to initialize analytics', { component: 'Analytics', error: err });
    }
  }

  identify(userId: string, properties?: UserProperties): void {
    if (!this.initialized || !this.trackingEnabled) return;

    try {
      posthog.identify(userId, properties);
      logger.debug('User identified', { component: 'Analytics', userId });
    } catch (err) {
      logger.error('Failed to identify user', { component: 'Analytics', error: err, userId });
    }
  }

  reset(): void {
    if (!this.initialized) return;

    try {
      posthog.reset();
      logger.debug('Analytics reset', { component: 'Analytics' });
    } catch (err) {
      logger.error('Failed to reset analytics', { component: 'Analytics', error: err });
    }
  }

  capture(event: AnalyticsEvent): void {
    if (!this.initialized || !this.trackingEnabled) return;

    const startTime = performance.now();
    try {
      posthog.capture(event.event, {
        ...event.properties,
        timestamp: event.options?.timestamp,
      });
      const duration = performance.now() - startTime;
      if (duration > 50) {
        logger.warn('Analytics capture took longer than expected', {
          component: 'Analytics',
          event: event.event,
          duration,
        });
      }
    } catch (err) {
      logger.error('Failed to capture event', {
        component: 'Analytics',
        error: err,
        event: event.event,
      });
    }
  }

  trackPageView(pageView: PageView): void {
    if (!this.initialized || !this.trackingEnabled) return;

    try {
      posthog.capture('$pageview', {
        $current_url: pageView.path,
        $title: pageView.title,
        $referrer: pageView.referrer,
      });
      logger.debug('Page view tracked', { component: 'Analytics', path: pageView.path });
    } catch (err) {
      logger.error('Failed to track page view', {
        component: 'Analytics',
        error: err,
        path: pageView.path,
      });
    }
  }

  setUserProperties(properties: Record<string, unknown>): void {
    if (!this.initialized || !this.trackingEnabled) return;

    try {
      posthog.people.set(properties);
      logger.debug('User properties updated', { component: 'Analytics', properties });
    } catch (err) {
      logger.error('Failed to set user properties', {
        component: 'Analytics',
        error: err,
        properties,
      });
    }
  }

  enableTracking(): void {
    this.trackingEnabled = true;
    logger.info('Analytics tracking enabled', { component: 'Analytics' });
  }

  disableTracking(): void {
    this.trackingEnabled = false;
    logger.info('Analytics tracking disabled', { component: 'Analytics' });
  }

  isTrackingEnabled(): boolean {
    return this.trackingEnabled;
  }

  optOut(): void {
    if (!this.initialized) return;

    try {
      posthog.opt_out_capturing();
      this.trackingEnabled = false;
      logger.info('User opted out of analytics', { component: 'Analytics' });
    } catch (err) {
      logger.error('Failed to opt out', { component: 'Analytics', error: err });
    }
  }

  optIn(): void {
    if (!this.initialized) return;

    try {
      posthog.opt_in_capturing();
      this.trackingEnabled = true;
      logger.info('User opted in to analytics', { component: 'Analytics' });
    } catch (err) {
      logger.error('Failed to opt in', { component: 'Analytics', error: err });
    }
  }
}

export const analytics = new AnalyticsService();
