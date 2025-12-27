import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { analytics } from '@/lib/analytics/analytics';

describe('AnalyticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize analytics', () => {
    analytics.init('test-api-key', {
      apiHost: 'https://test.posthog.com',
    });

    expect(analytics.isTrackingEnabled()).toBe(true);
  });

  it('should identify user', () => {
    analytics.init('test-api-key');
    analytics.identify('user-123', { email: 'test@example.com' });

    expect(analytics.isTrackingEnabled()).toBe(true);
  });

  it('should capture events', () => {
    analytics.init('test-api-key');
    analytics.capture({
      event: 'test_event',
      properties: { test_prop: 'value' },
    });

    expect(analytics.isTrackingEnabled()).toBe(true);
  });

  it('should track page views', () => {
    analytics.init('test-api-key');
    analytics.trackPageView({
      path: '/test-page',
      title: 'Test Page',
    });

    expect(analytics.isTrackingEnabled()).toBe(true);
  });

  it('should allow opt-out', () => {
    analytics.init('test-api-key');
    analytics.optOut();

    expect(analytics.isTrackingEnabled()).toBe(false);
  });

  it('should allow opt-in after opt-out', () => {
    analytics.init('test-api-key');
    analytics.optOut();
    analytics.optIn();

    expect(analytics.isTrackingEnabled()).toBe(true);
  });
});
