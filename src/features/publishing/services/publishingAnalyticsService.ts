import {
  Publication,
  PublishedInstance,
  PlatformAnalytics,
  ReaderFeedback,
  EngagementMetrics,
  PublishingGoals,
  ReaderInsights,
  PublishingTrends,
  PublishingAlert,
  PublishingPlatform
} from '../types';
import { Project } from '../../../types';

class PublishingAnalyticsService {
  private static instance: PublishingAnalyticsService;
  private dbName = 'novelist-publishing';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;
  
  // Mock data for platforms (in real app, this would come from API integrations)
  private mockPlatforms: PublishingPlatform[] = [
    {
      id: 'wattpad',
      name: 'Wattpad',
      type: 'social',
      isConnected: false,
      supportedFormats: ['html', 'markdown'],
    },
    {
      id: 'ao3',
      name: 'Archive of Our Own',
      type: 'social',
      isConnected: false,
      supportedFormats: ['html', 'markdown'],
    },
    {
      id: 'kindle',
      name: 'Amazon Kindle Direct Publishing',
      type: 'marketplace',
      isConnected: false,
      supportedFormats: ['epub', 'mobi', 'pdf'],
    },
    {
      id: 'personal',
      name: 'Personal Website',
      type: 'self_hosted',
      isConnected: true,
      supportedFormats: ['html', 'epub', 'pdf'],
    },
  ];

  static getInstance(): PublishingAnalyticsService {
    if (!PublishingAnalyticsService.instance) {
      PublishingAnalyticsService.instance = new PublishingAnalyticsService();
    }
    return PublishingAnalyticsService.instance;
  }

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Publications store
        if (!db.objectStoreNames.contains('publications')) {
          const pubStore = db.createObjectStore('publications', { keyPath: 'id' });
          pubStore.createIndex('projectId', 'projectId');
          pubStore.createIndex('status', 'status');
          pubStore.createIndex('publishedAt', 'publishedAt');
        }
        
        // Feedback store
        if (!db.objectStoreNames.contains('feedback')) {
          const feedbackStore = db.createObjectStore('feedback', { keyPath: 'id' });
          feedbackStore.createIndex('publicationId', 'publicationId');
          feedbackStore.createIndex('type', 'type');
          feedbackStore.createIndex('timestamp', 'timestamp');
        }
        
        // Goals store
        if (!db.objectStoreNames.contains('publishingGoals')) {
          const goalsStore = db.createObjectStore('publishingGoals', { keyPath: 'id' });
          goalsStore.createIndex('publicationId', 'publicationId');
          goalsStore.createIndex('type', 'type');
        }
        
        // Alerts store
        if (!db.objectStoreNames.contains('alerts')) {
          const alertsStore = db.createObjectStore('alerts', { keyPath: 'id' });
          alertsStore.createIndex('timestamp', 'timestamp');
          alertsStore.createIndex('priority', 'priority');
          alertsStore.createIndex('isRead', 'isRead');
        }
      };
    });
  }

  // Publication Management
  async publishProject(project: Project, platforms: string[], metadata: any): Promise<Publication> {
    if (!this.db) await this.init();

    const publication: Publication = {
      id: `pub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projectId: project.id,
      title: project.title,
      description: project.idea,
      publishedAt: new Date(),
      platforms: platforms.map(platformId => this.createPublishedInstance(platformId, project)),
      status: 'published',
      metadata: {
        genre: ['Fiction'], // Would be extracted from project
        tags: this.extractTags(project),
        language: 'en',
        mature: false,
        wordCount: this.calculateWordCount(project),
        chapterCount: project.chapters.length,
        ...metadata,
      },
    };

    await this.savePublication(publication);
    await this.generateMockAnalyticsData(publication.id);
    
    return publication;
  }

  private createPublishedInstance(platformId: string, project: Project): PublishedInstance {
    const platform = this.mockPlatforms.find(p => p.id === platformId);
    const baseUrl = this.generatePublicationUrl(platformId, project.title);
    
    return {
      id: `inst_${Date.now()}_${platformId}`,
      platformId,
      platformName: platform?.name || 'Unknown Platform',
      publicationUrl: baseUrl,
      publishedAt: new Date(),
      lastUpdated: new Date(),
      status: 'active',
      analytics: this.generateInitialAnalytics(),
    };
  }

  private generatePublicationUrl(platformId: string, title: string): string {
    const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    switch (platformId) {
      case 'wattpad':
        return `https://www.wattpad.com/story/${slug}`;
      case 'ao3':
        return `https://archiveofourown.org/works/${Math.random().toString().substr(2, 8)}`;
      case 'kindle':
        return `https://www.amazon.com/dp/B${Math.random().toString().substr(2, 9)}`;
      case 'personal':
        return `https://mywebsite.com/books/${slug}`;
      default:
        return `https://example.com/${slug}`;
    }
  }

  private generateInitialAnalytics(): PlatformAnalytics {
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

  // Analytics Data Retrieval
  async getPublicationAnalytics(_publicationId: string): Promise<PlatformAnalytics> {
    const publication = await this.getPublication(publicationId);
    if (!publication) throw new Error('Publication not found');

    // Aggregate analytics from all platforms
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
    publication.platforms.forEach(instance => {
      const analytics = instance.analytics;
      aggregatedAnalytics.views += analytics.views;
      aggregatedAnalytics.uniqueVisitors += analytics.uniqueVisitors;
      aggregatedAnalytics.downloads += analytics.downloads;
      aggregatedAnalytics.bookmarks += analytics.bookmarks;
      aggregatedAnalytics.shares += analytics.shares;
      aggregatedAnalytics.rating.count += analytics.rating.count;
      
      // Merge geographic data
      Object.entries(analytics.geographics).forEach(([country, count]) => {
        aggregatedAnalytics.geographics[country] = (aggregatedAnalytics.geographics[country] || 0) + count;
      });
    });

    // Calculate weighted average rating
    if (aggregatedAnalytics.rating.count > 0) {
      let totalRating = 0;
      publication.platforms.forEach(instance => {
        totalRating += instance.analytics.rating.average * instance.analytics.rating.count;
      });
      aggregatedAnalytics.rating.average = totalRating / aggregatedAnalytics.rating.count;
    }

    return aggregatedAnalytics;
  }

  async getEngagementMetrics(publicationId: string, timeframe: { start: Date; end: Date }): Promise<EngagementMetrics> {
    // In real implementation, this would fetch from various platform APIs
    const mockMetrics: EngagementMetrics = {
      publicationId,
      timeframe,
      totalViews: Math.floor(Math.random() * 10000) + 1000,
      uniqueReaders: Math.floor(Math.random() * 5000) + 500,
      averageReadingTime: Math.floor(Math.random() * 60) + 15, // 15-75 minutes
      completionRate: Math.random() * 0.6 + 0.3, // 30-90%
      dropOffPoints: this.generateDropOffPoints(),
      peakReadingTimes: this.generatePeakReadingTimes(),
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

  async getReaderFeedback(publicationId: string, limit: number = 50): Promise<ReaderFeedback[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['feedback'], 'readonly');
      const store = transaction.objectStore('feedback');
      const index = store.index('publicationId');
      const request = index.getAll(publicationId);
      
      request.onsuccess = () => {
        const feedback = request.result
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, limit);
        resolve(feedback);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getReaderInsights(_publicationId: string): Promise<ReaderInsights> {
    const analytics = await this.getPublicationAnalytics(publicationId);
    const engagement = await this.getEngagementMetrics(publicationId, {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      end: new Date(),
    });
    
    const insights: ReaderInsights = {
      publicationId,
      audienceProfile: {
        primaryDemographic: this.determinePrimaryDemographic(analytics),
        topCountries: Object.entries(analytics.geographics)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([country]) => country),
        peakReadingTimes: this.formatPeakTimes(engagement.peakReadingTimes),
        averageSessionDuration: engagement.averageReadingTime,
      },
      contentPerformance: {
        mostPopularChapters: this.generatePopularChapters(),
        sentimentTrends: this.generateSentimentTrends(),
        dropOffAnalysis: engagement.dropOffPoints.map(point => ({
          chapter: point.chapterIndex,
          dropOffRate: point.dropOffRate,
          commonFeedback: this.generateCommonFeedback(),
        })),
      },
      marketInsights: {
        competitorComparison: this.generateCompetitorComparison(),
        genrePerformance: {
          ranking: Math.floor(Math.random() * 100) + 1,
          percentile: Math.random() * 100,
          trendingTopics: ['fantasy', 'romance', 'adventure', 'magic', 'dragons'],
        },
        recommendations: this.generateRecommendations(analytics, engagement),
      },
    };

    return insights;
  }

  // Goal Management
  async createPublishingGoal(goal: Omit<PublishingGoals, 'id' | 'current'>): Promise<PublishingGoals> {
    const newGoal: PublishingGoals = {
      ...goal,
      id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      current: 0,
    };

    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['publishingGoals'], 'readwrite');
      const store = transaction.objectStore('publishingGoals');
      const request = store.add(newGoal);
      
      request.onsuccess = () => resolve(newGoal);
      request.onerror = () => reject(request.error);
    });
  }

  async getPublishingGoals(publicationId: string): Promise<PublishingGoals[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['publishingGoals'], 'readonly');
      const store = transaction.objectStore('publishingGoals');
      const index = store.index('publicationId');
      const request = index.getAll(publicationId);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Trends and Predictions
  async getPublishingTrends(publicationId: string, days: number = 30): Promise<PublishingTrends> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const trends: PublishingTrends = {
      timeframe: { start: startDate, end: endDate },
      metrics: this.generateTrendMetrics(days),
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

  // Alerts and Notifications
  async getPublishingAlerts(limit: number = 20): Promise<PublishingAlert[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['alerts'], 'readonly');
      const store = transaction.objectStore('alerts');
      const index = store.index('timestamp');
      const request = index.getAll();
      
      request.onsuccess = () => {
        const alerts = request.result
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, limit);
        resolve(alerts);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Data Export
  async exportPublishingAnalytics(publicationIds: string[], format: 'json' | 'csv' | 'xlsx'): Promise<string> {
    const exportData = {
      publications: [],
      analytics: [],
      feedback: [],
      exportedAt: new Date().toISOString(),
    };

    for (const id of publicationIds) {
      const publication = await this.getPublication(id);
      const analytics = await this.getPublicationAnalytics(id);
      const feedback = await this.getReaderFeedback(id);
      
      if (publication) {
        exportData.publications.push(publication);
        exportData.analytics.push(analytics);
        exportData.feedback.push(...feedback);
      }
    }

    if (format === 'json') {
      return JSON.stringify(exportData, null, 2);
    } else if (format === 'csv') {
      return this.convertToCSV(exportData);
    } else {
      throw new Error('XLSX format not implemented yet');
    }
  }

  // Platform Integration
  async connectPlatform(platformId: string, credentials: any): Promise<boolean> {
    const platform = this.mockPlatforms.find(p => p.id === platformId);
    if (!platform) return false;
    
    // In real implementation, this would test API connection
    platform.isConnected = true;
    platform.credentials = credentials;
    
    return true;
  }

  async getConnectedPlatforms(): Promise<PublishingPlatform[]> {
    return this.mockPlatforms.filter(p => p.isConnected);
  }

  async getAllPlatforms(): Promise<PublishingPlatform[]> {
    return [...this.mockPlatforms];
  }

  // Private helper methods
  private async savePublication(publication: Publication): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['publications'], 'readwrite');
      const store = transaction.objectStore('publications');
      const request = store.put(publication);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async getPublication(publicationId: string): Promise<Publication | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['publications'], 'readonly');
      const store = transaction.objectStore('publications');
      const request = store.get(publicationId);
      
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  private async generateMockAnalyticsData(publicationId: string): Promise<void> {
    // Generate mock feedback
    const mockFeedback: ReaderFeedback[] = [
      {
        id: `feedback_${Date.now()}_1`,
        publicationId,
        platformId: 'wattpad',
        type: 'review',
        content: 'Amazing story! Couldn\'t put it down. The character development is incredible.',
        rating: 5,
        author: {
          id: 'reader_1',
          name: 'BookLover2024',
          avatar: 'https://via.placeholder.com/32',
          isVerified: true,
        },
        timestamp: new Date(),
        likes: 15,
        replies: [],
        isPublic: true,
        sentiment: 'positive',
        topics: ['character development', 'engaging plot'],
      },
      // Add more mock feedback...
    ];

    // Save mock feedback
    for (const feedback of mockFeedback) {
      await this.saveFeedback(feedback);
    }
  }

  private async saveFeedback(feedback: ReaderFeedback): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['feedback'], 'readwrite');
      const store = transaction.objectStore('feedback');
      const request = store.put(feedback);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private extractTags(project: Project): string[] {
    // Extract tags from project content and style
    const tags = [project.style.toLowerCase()];
    
    // Add more sophisticated tag extraction based on content analysis
    if (project.idea.toLowerCase().includes('magic')) tags.push('magic');
    if (project.idea.toLowerCase().includes('romance')) tags.push('romance');
    if (project.idea.toLowerCase().includes('adventure')) tags.push('adventure');
    
    return tags;
  }

  private calculateWordCount(project: Project): number {
    return project.chapters.reduce((total, chapter) => {
      return total + chapter.content.split(/\s+/).filter(word => word.length > 0).length;
    }, 0);
  }

  private generateDropOffPoints(): Array<{ chapterIndex: number; dropOffRate: number }> {
    const points = [];
    for (let i = 0; i < 10; i++) {
      points.push({
        chapterIndex: i,
        dropOffRate: Math.random() * 0.3 + 0.05, // 5-35% drop off rate
      });
    }
    return points;
  }

  private generatePeakReadingTimes(): Array<{ hour: number; dayOfWeek: number; activityLevel: number }> {
    const times = [];
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

  private determinePrimaryDemographic(analytics: PlatformAnalytics): string {
    // Simple logic - in real app this would be more sophisticated
    const demographics = analytics.demographics.ageGroups;
    const topAge = Object.entries(demographics)
      .sort(([,a], [,b]) => b - a)[0];
    
    return topAge ? `${topAge[0]} age group` : '18-24 age group';
  }

  private formatPeakTimes(peakTimes: Array<{ hour: number; dayOfWeek: number; activityLevel: number }>): string[] {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return peakTimes.slice(0, 3).map(time => 
      `${days[time.dayOfWeek]} at ${time.hour}:00`
    );
  }

  private generatePopularChapters(): Array<{ chapterIndex: number; title: string; engagementScore: number }> {
    return [
      { chapterIndex: 0, title: 'Chapter 1: The Beginning', engagementScore: 95 },
      { chapterIndex: 5, title: 'Chapter 6: The Plot Twist', engagementScore: 92 },
      { chapterIndex: 3, title: 'Chapter 4: Character Development', engagementScore: 88 },
    ];
  }

  private generateSentimentTrends(): Array<{ chapter: number; sentiment: number; topics: string[] }> {
    return [
      { chapter: 1, sentiment: 0.8, topics: ['introduction', 'world building'] },
      { chapter: 2, sentiment: 0.7, topics: ['character development', 'plot'] },
      { chapter: 3, sentiment: 0.9, topics: ['action', 'climax'] },
    ];
  }

  private generateCommonFeedback(): string[] {
    return [
      'Pacing feels rushed',
      'Need more character backstory',
      'Great cliffhanger!',
      'Dialogue could be improved',
    ];
  }

  private generateCompetitorComparison(): Array<{ title: string; rating: number; views: number; similarityScore: number }> {
    return [
      { title: 'Similar Fantasy Epic', rating: 4.3, views: 15000, similarityScore: 0.85 },
      { title: 'Magic Academy Adventures', rating: 4.1, views: 12000, similarityScore: 0.72 },
      { title: 'Dragon Chronicles', rating: 4.5, views: 20000, similarityScore: 0.68 },
    ];
  }

  private generateRecommendations(analytics: PlatformAnalytics, engagement: EngagementMetrics): Array<{ type: 'content' | 'marketing' | 'pricing' | 'timing'; priority: 'high' | 'medium' | 'low'; suggestion: string; expectedImpact: string }> {
    const recommendations = [];
    
    if (engagement.completionRate < 0.5) {
      recommendations.push({
        type: 'content',
        priority: 'high',
        suggestion: 'Consider shorter chapters or stronger chapter endings to improve completion rates',
        expectedImpact: 'Could increase completion rate by 15-25%',
      });
    }
    
    if (analytics.rating.average < 4.0) {
      recommendations.push({
        type: 'content',
        priority: 'medium',
        suggestion: 'Focus on character development and pacing improvements',
        expectedImpact: 'Could improve rating by 0.3-0.5 stars',
      });
    }
    
    return recommendations;
  }

  private generateTrendMetrics(days: number): Array<{ date: string; views: number; engagement: number; rating: number }> {
    const metrics = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      metrics.push({
        date: date.toISOString().split('T')[0],
        views: Math.floor(Math.random() * 200) + 50,
        engagement: Math.random() * 100,
        rating: 3.5 + Math.random() * 1.5,
      });
    }
    return metrics.reverse();
  }

  private convertToCSV(data: any): string {
    // Simple CSV conversion - would be more sophisticated in real implementation
    return Object.entries(data)
      .map(([key, value]) => `${key},${JSON.stringify(value)}`)
      .join('\n');
  }

  /**
   * Track campaign performance data
   */
  public async trackCampaignPerformance(campaignId: string, metrics: {
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
  }): Promise<void> {
    try {
      console.log(`Tracking campaign ${campaignId}:`, metrics);
      // Store metrics data - implementation would go here
    } catch (error) {
      console.error('Failed to track campaign performance:', error);
      throw error;
    }
  }

  /**
   * Generate publishing insights
   */
  public async generateInsights(publicationId: string): Promise<any[]> {
    try {
      return [
        {
          type: 'content',
          priority: 'high', 
          suggestion: 'Consider updating chapter titles for better engagement',
          expectedImpact: 'Increase reader engagement by 15%'
        }
      ];
    } catch (error) {
      console.error('Failed to generate insights:', error);
      return [];
    }
  }

  /**
   * Get all publications for a project
   */
  public async getPublications(projectId: string): Promise<Publication[]> {
    try {
      const publications = this.getStoredData('publications', []) as Publication[];
      return publications.filter(pub => pub.projectId === projectId);
    } catch (error) {
      console.error('Failed to get publications:', error);
      return [];
    }
  }
}

export const publishingAnalyticsService = PublishingAnalyticsService.getInstance();