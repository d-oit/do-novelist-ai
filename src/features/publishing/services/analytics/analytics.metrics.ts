import type {
  EngagementMetrics,
  PlatformAnalytics,
  PublishingTrends,
} from '@/features/publishing/types';

/**
 * Analytics Metrics Module
 * Handles all metric calculations and data generation for publishing analytics
 */

/**
 * Generate initial analytics for a new publication
 * @returns Empty PlatformAnalytics object
 */
export function generateInitialAnalytics(): PlatformAnalytics {
  return {
    views: 0,
    uniqueVisitors: 0,
    downloads: 0,
    bookmarks: 0,
    shares: 0,
    rating: {
      average: 0,
      count: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    },
    geographics: {},
    demographics: {
      ageGroups: {},
      genderDistribution: {},
    },
    lastUpdated: new Date(),
  };
}

/**
 * Aggregate analytics from multiple platform instances
 * @param platforms - Array of platform instances with analytics
 * @returns Aggregated PlatformAnalytics object
 */
export function aggregatePlatformAnalytics(
  platforms: { analytics: PlatformAnalytics }[],
): PlatformAnalytics {
  const aggregatedAnalytics: PlatformAnalytics = {
    views: 0,
    uniqueVisitors: 0,
    downloads: 0,
    bookmarks: 0,
    shares: 0,
    rating: {
      average: 0,
      count: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    },
    geographics: {},
    demographics: {
      ageGroups: {},
      genderDistribution: {},
    },
    lastUpdated: new Date(),
  };

  // Sum up analytics from all platform instances
  platforms.forEach(instance => {
    const analytics = instance.analytics;
    aggregatedAnalytics.views += analytics.views;
    aggregatedAnalytics.uniqueVisitors += analytics.uniqueVisitors;
    aggregatedAnalytics.downloads += analytics.downloads;
    aggregatedAnalytics.bookmarks += analytics.bookmarks;
    aggregatedAnalytics.shares += analytics.shares;
    aggregatedAnalytics.rating.count += analytics.rating.count;

    // Merge geographic data
    Object.entries(analytics.geographics).forEach(([country, count]) => {
      aggregatedAnalytics.geographics[country] =
        (aggregatedAnalytics.geographics[country] ?? 0) + count;
    });
  });

  // Calculate weighted average rating
  if (aggregatedAnalytics.rating.count > 0) {
    let totalRating = 0;
    platforms.forEach(instance => {
      totalRating += instance.analytics.rating.average * instance.analytics.rating.count;
    });
    aggregatedAnalytics.rating.average = totalRating / aggregatedAnalytics.rating.count;
  }

  return aggregatedAnalytics;
}

/**
 * Generate engagement metrics for a publication
 * @param publicationId - Publication identifier
 * @param timeframe - Date range for metrics
 * @returns EngagementMetrics object
 */
export function generateEngagementMetrics(
  publicationId: string,
  timeframe: { start: Date; end: Date },
): EngagementMetrics {
  const mockMetrics: EngagementMetrics = {
    publicationId,
    timeframe,
    totalViews: Math.floor(Math.random() * 10000) + 1000,
    uniqueReaders: Math.floor(Math.random() * 5000) + 500,
    averageReadingTime: Math.floor(Math.random() * 60) + 15, // 15-75 minutes
    completionRate: Math.random() * 0.6 + 0.3, // 30-90%
    dropOffPoints: generateDropOffPoints(),
    peakReadingTimes: generatePeakReadingTimes(),
    readerRetention: {
      day1: Math.random() * 0.5 + 0.4, // 40-90%
      day7: Math.random() * 0.3 + 0.2, // 20-50%
      day30: Math.random() * 0.2 + 0.1, // 10-30%
    },
    socialEngagement: {
      shares: Math.floor(Math.random() * 200) + 50,
      discussions: Math.floor(Math.random() * 100) + 20,
      fanArt: Math.floor(Math.random() * 10) + 2,
      communityPosts: Math.floor(Math.random() * 50) + 10,
    },
  };

  return mockMetrics;
}

/**
 * Generate publishing trends for a given time period
 * @param days - Number of days to analyze
 * @returns PublishingTrends object
 */
export function generatePublishingTrends(days = 30): PublishingTrends {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  const trends: PublishingTrends = {
    timeframe: { start: startDate, end: endDate },
    metrics: generateTrendMetrics(days),
    seasonality: [
      { period: 'Q1', multiplier: 0.8, confidence: 0.75 },
      { period: 'Q2', multiplier: 1.1, confidence: 0.82 },
      { period: 'Summer', multiplier: 1.3, confidence: 0.88 },
      { period: 'Q4', multiplier: 1.2, confidence: 0.79 },
    ],
    predictions: [
      {
        metric: 'views',
        nextPeriod: Math.floor(Math.random() * 1000) + 500,
        confidence: 0.75,
        factors: ['seasonal trend', 'recent engagement', 'platform algorithm'],
      },
      {
        metric: 'rating',
        nextPeriod: 4.2 + Math.random() * 0.6,
        confidence: 0.68,
        factors: ['content quality', 'reader feedback', 'genre popularity'],
      },
    ],
  };

  return trends;
}

/**
 * Generate mock drop-off points for reader analysis
 * @returns Array of chapter drop-off rates
 */
function generateDropOffPoints(): { chapterIndex: number; dropOffRate: number }[] {
  const points: { chapterIndex: number; dropOffRate: number }[] = [];
  for (let i = 0; i < 10; i++) {
    points.push({
      chapterIndex: i,
      dropOffRate: Math.random() * 0.3 + 0.05, // 5-35% drop off rate
    });
  }
  return points;
}

/**
 * Generate mock peak reading times
 * @returns Array of peak reading time data points
 */
function generatePeakReadingTimes(): { hour: number; dayOfWeek: number; activityLevel: number }[] {
  const times: { hour: number; dayOfWeek: number; activityLevel: number }[] = [];
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      times.push({
        hour,
        dayOfWeek: day,
        activityLevel: Math.random() * 100,
      });
    }
  }
  return times.sort((a, b) => b.activityLevel - a.activityLevel).slice(0, 10);
}

/**
 * Generate trend metrics over a period
 * @param days - Number of days to generate data for
 * @returns Array of daily metrics
 */
function generateTrendMetrics(
  days: number,
): { date: string; views: number; engagement: number; rating: number }[] {
  const metrics: { date: string; views: number; engagement: number; rating: number }[] = [];
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    metrics.push({
      date: date.toISOString().split('T')[0] ?? '',
      views: Math.floor(Math.random() * 200) + 50,
      engagement: Math.random() * 100,
      rating: 3.5 + Math.random() * 1.5,
    });
  }
  return metrics.reverse();
}
