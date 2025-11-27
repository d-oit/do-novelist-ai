/**
 * Publishing Analytics Types
 * Tracks reader engagement, feedback, and publication performance
 */

export interface PublishingPlatform {
  id: string;
  name: string;
  type: 'self_hosted' | 'marketplace' | 'social' | 'subscription';
  apiEndpoint?: string;
  isConnected: boolean;
  credentials?: {
    apiKey?: string;
    username?: string;
    token?: string;
  };
  supportedFormats: PublishingFormat[];
}

export type PublishingFormat = 'epub' | 'pdf' | 'html' | 'markdown' | 'docx' | 'mobi';

export interface Publication {
  id: string;
  projectId: string;
  title: string;
  description: string;
  coverImageUrl?: string;
  publishedAt: Date;
  platforms: PublishedInstance[];
  status: 'draft' | 'published' | 'updated' | 'archived';
  metadata: {
    isbn?: string;
    genre: string[];
    tags: string[];
    language: string;
    mature: boolean;
    wordCount: number;
    chapterCount: number;
    price?: number;
    currency?: string;
  };
}

export interface PublishedInstance {
  id: string;
  platformId: string;
  platformName: string;
  publicationUrl: string;
  publishedAt: Date;
  lastUpdated: Date;
  status: 'active' | 'pending' | 'rejected' | 'archived';
  analytics: PlatformAnalytics;
}

export interface PlatformAnalytics {
  views: number;
  uniqueVisitors: number;
  downloads: number;
  bookmarks: number;
  shares: number;
  rating: {
    average: number;
    count: number;
    distribution: Record<number, number>; // star -> count
  };
  revenue?: {
    total: number;
    currency: string;
    salesCount: number;
  };
  geographics: Record<string, number>; // country -> count
  demographics: {
    ageGroups: Record<string, number>;
    genderDistribution: Record<string, number>;
  };
  lastUpdated: Date;
}

export interface ReaderFeedback {
  id: string;
  publicationId: string;
  platformId: string;
  type: 'review' | 'comment' | 'rating' | 'bookmark' | 'share';
  content?: string;
  rating?: number; // 1-5 stars
  author: {
    id: string;
    name: string;
    avatar?: string;
    isVerified?: boolean;
  };
  timestamp: Date;
  likes: number;
  replies: ReaderFeedback[];
  isPublic: boolean;
  sentiment: 'positive' | 'neutral' | 'negative';
  topics: string[]; // extracted topics/themes
  chapterReference?: string;
}

export interface EngagementMetrics {
  publicationId: string;
  timeframe: {
    start: Date;
    end: Date;
  };
  totalViews: number;
  uniqueReaders: number;
  averageReadingTime: number; // minutes
  completionRate: number; // percentage who finish
  dropOffPoints: Array<{
    chapterIndex: number;
    dropOffRate: number;
  }>;
  peakReadingTimes: Array<{
    hour: number;
    dayOfWeek: number;
    activityLevel: number;
  }>;
  readerRetention: {
    day1: number;
    day7: number;
    day30: number;
  };
  socialEngagement: {
    shares: number;
    discussions: number;
    fanArt: number;
    communityPosts: number;
  };
}

export interface PublishingGoals {
  id: string;
  publicationId: string;
  type: 'views' | 'downloads' | 'rating' | 'revenue' | 'engagement';
  target: number;
  current: number;
  timeframe: {
    start: Date;
    end: Date;
  };
  isActive: boolean;
  milestones: Array<{
    value: number;
    achievedAt?: Date;
    reward?: string;
  }>;
}

export interface ReaderInsights {
  publicationId: string;
  audienceProfile: {
    primaryDemographic: string;
    topCountries: string[];
    peakReadingTimes: string[];
    averageSessionDuration: number;
  };
  contentPerformance: {
    mostPopularChapters: Array<{
      chapterIndex: number;
      title: string;
      engagementScore: number;
    }>;
    sentimentTrends: Array<{
      chapter: number;
      sentiment: number; // -1 to 1
      topics: string[];
    }>;
    dropOffAnalysis: Array<{
      chapter: number;
      dropOffRate: number;
      commonFeedback: string[];
    }>;
  };
  marketInsights: {
    competitorComparison: Array<{
      title: string;
      rating: number;
      views: number;
      similarityScore: number;
    }>;
    genrePerformance: {
      ranking: number;
      percentile: number;
      trendingTopics: string[];
    };
    recommendations: Array<{
      type: 'content' | 'marketing' | 'pricing' | 'timing';
      priority: 'high' | 'medium' | 'low';
      suggestion: string;
      expectedImpact: string;
    }>;
  };
}

export interface PublishingCampaign {
  id: string;
  publicationId: string;
  name: string;
  type: 'launch' | 'promotion' | 'update' | 'season';
  status: 'planning' | 'active' | 'completed' | 'paused';
  timeline: {
    start: Date;
    end: Date;
    milestones: Array<{
      date: Date;
      title: string;
      description: string;
      completed: boolean;
    }>;
  };
  channels: Array<{
    platform: string;
    content: string;
    scheduledAt: Date;
    metrics?: {
      reach: number;
      engagement: number;
      clicks: number;
    };
  }>;
  budget?: {
    total: number;
    spent: number;
    currency: string;
  };
  results: {
    viewsGained: number;
    newFollowers: number;
    conversions: number;
    roi?: number;
  };
}

export interface PublishingTrends {
  timeframe: {
    start: Date;
    end: Date;
  };
  metrics: Array<{
    date: string;
    views: number;
    engagement: number;
    rating: number;
    revenue?: number;
  }>;
  seasonality: Array<{
    period: string; // 'Q1', 'summer', 'holiday', etc.
    multiplier: number;
    confidence: number;
  }>;
  predictions: Array<{
    metric: string;
    nextPeriod: number;
    confidence: number;
    factors: string[];
  }>;
}

export interface PublishingAlert {
  id: string;
  type: 'milestone' | 'negative_feedback' | 'opportunity' | 'issue';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  actionRequired: boolean;
  suggestedActions?: string[];
  relatedMetric?: string;
  timestamp: Date;
  isRead: boolean;
  publicationId?: string;
}

export type PublishingAnalyticsFilter = {
  dateRange: {
    start: Date;
    end: Date;
  };
  platforms?: string[];
  metrics?: string[];
  granularity: 'hour' | 'day' | 'week' | 'month';
  compareWith?: {
    start: Date;
    end: Date;
  };
};

export interface PublishingExport {
  format: 'json' | 'csv' | 'pdf' | 'xlsx';
  dateRange: {
    start: Date;
    end: Date;
  };
  includeCharts: boolean;
  sections: Array<'overview' | 'engagement' | 'feedback' | 'revenue' | 'insights'>;
  publicationIds: string[];
}