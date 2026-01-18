import type {
  EngagementMetrics,
  PlatformAnalytics,
  Publication,
  PublishedInstance,
  PublishingAlert,
  PublishingExport,
  PublishingGoals,
  PublishingInsights,
  PublishingPlatform,
  PublishingTrends,
  ReaderFeedback,
  ReaderInsights,
} from '@/features/publishing/types';
import { publishingService as tursoPublishingService } from '@/lib/database/services';
import { logger } from '@/lib/logging/logger';
import type { Project } from '@/types';

import * as analyticsModules from './analytics';

/**
 * Publishing Analytics Service
 * Orchestrates publishing analytics operations by coordinating with specialized analytics modules
 */
class PublishingAnalyticsService {
  private static instance: PublishingAnalyticsService | null = null;
  private db: IDBDatabase | null = null;

  // Mock data for platforms (in real app, this would come from API integrations)
  private readonly mockPlatforms: PublishingPlatform[] = [
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

  public static getInstance(): PublishingAnalyticsService {
    PublishingAnalyticsService.instance ??= new PublishingAnalyticsService();
    return PublishingAnalyticsService.instance;
  }

  public async init(): Promise<void> {
    // Delegate to Turso service
    await tursoPublishingService.init();
  }

  // Publication Management
  /**
   * Publish a project to specified platforms
   * @param project - Project to publish
   * @param platforms - Platform IDs to publish to
   * @param metadata - Publication metadata
   * @returns Created Publication object
   */
  public async publishProject(
    project: Project,
    platforms: string[],
    metadata: Publication['metadata'],
  ): Promise<Publication> {
    const publication: Publication = {
      id: `pub_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      projectId: project.id,
      title: project.title,
      description: project.idea,
      publishedAt: new Date(),
      platforms: platforms.map(platformId => this.createPublishedInstance(platformId, project)),
      status: 'published',
      metadata: {
        ...metadata,
        genre: metadata.genre ?? ['Fiction'],
        tags: metadata.tags ?? this.extractTags(project),
        language: metadata.language ?? 'en',
        mature: metadata.mature ?? false,
        wordCount: metadata.wordCount ?? this.calculateWordCount(project),
        chapterCount: metadata.chapterCount ?? project.chapters.length,
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
      platformName: platform?.name ?? 'Unknown Platform',
      publicationUrl: baseUrl,
      publishedAt: new Date(),
      lastUpdated: new Date(),
      status: 'active',
      analytics: analyticsModules.generateInitialAnalytics(),
    };
  }

  private generatePublicationUrl(platformId: string, title: string): string {
    const slug = title
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    switch (platformId) {
      case 'wattpad':
        return `https://www.wattpad.com/story/${slug}`;
      case 'ao3':
        return `https://archiveofourown.org/works/${Math.random().toString().substring(2, 10)}`;
      case 'kindle':
        return `https://www.amazon.com/dp/B${Math.random().toString().substring(2, 11)}`;
      case 'personal':
        return `https://mywebsite.com/books/${slug}`;
      default:
        return `https://example.com/${slug}`;
    }
  }

  // Analytics Data Retrieval
  /**
   * Get aggregated analytics for a publication
   * @param publicationId - Publication identifier
   * @returns Aggregated PlatformAnalytics object
   */
  public async getPublicationAnalytics(publicationId: string): Promise<PlatformAnalytics> {
    const publication = await this.getPublication(publicationId);
    if (!publication) {
      throw new Error('Publication not found');
    }

    return analyticsModules.aggregatePlatformAnalytics(publication.platforms);
  }

  /**
   * Get engagement metrics for a publication within a timeframe
   * @param publicationId - Publication identifier
   * @param timeframe - Date range for metrics
   * @returns EngagementMetrics object
   */
  public getEngagementMetrics(
    publicationId: string,
    timeframe: { start: Date; end: Date },
  ): EngagementMetrics {
    return analyticsModules.generateEngagementMetrics(publicationId, timeframe);
  }

  /**
   * Get reader feedback for a publication
   * @param publicationId - Publication identifier
   * @param limit - Maximum number of feedback items to return
   * @returns Array of ReaderFeedback objects
   */
  public async getReaderFeedback(publicationId: string, limit = 50): Promise<ReaderFeedback[]> {
    if (!this.db) await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const db = this.db;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['feedback'], 'readonly');
      const store = transaction.objectStore('feedback');
      const index = store.index('publicationId');
      const request = index.getAll(publicationId);

      request.onsuccess = (): void => {
        const feedback = (request.result as ReaderFeedback[])
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, limit);
        resolve(feedback);
      };
      request.onerror = (): void =>
        reject(new Error(request.error?.message ?? 'Database operation failed'));
    });
  }

  /**
   * Get comprehensive reader insights for a publication
   * @param publicationId - Publication identifier
   * @returns ReaderInsights object
   */
  public async getReaderInsights(publicationId: string): Promise<ReaderInsights> {
    const analytics = await this.getPublicationAnalytics(publicationId);
    const engagement = this.getEngagementMetrics(publicationId, {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date(),
    });

    return analyticsModules.generateReaderInsights(publicationId, analytics, engagement);
  }

  // Goal Management
  /**
   * Create a new publishing goal
   * @param goal - Goal data without ID and current value
   * @returns Created PublishingGoals object
   */
  public async createPublishingGoal(
    goal: Omit<PublishingGoals, 'id' | 'current'>,
  ): Promise<PublishingGoals> {
    const newGoal: PublishingGoals = {
      ...goal,
      id: `goal_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      current: 0,
    };

    if (!this.db) await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const db = this.db;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['publishingGoals'], 'readwrite');
      const store = transaction.objectStore('publishingGoals');
      const request = store.add(newGoal);

      request.onsuccess = (): void => resolve(newGoal);
      request.onerror = (): void =>
        reject(new Error(request.error?.message ?? 'Database operation failed'));
    });
  }

  /**
   * Get all publishing goals for a publication
   * @param publicationId - Publication identifier
   * @returns Array of PublishingGoals objects
   */
  public async getPublishingGoals(publicationId: string): Promise<PublishingGoals[]> {
    if (!this.db) await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const db = this.db;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['publishingGoals'], 'readonly');
      const store = transaction.objectStore('publishingGoals');
      const index = store.index('publicationId');
      const request = index.getAll(publicationId);

      request.onsuccess = (): void => resolve(request.result);
      request.onerror = (): void =>
        reject(new Error(request.error?.message ?? 'Database operation failed'));
    });
  }

  // Trends and Predictions
  /**
   * Get publishing trends and predictions
   * @param publicationId - Publication identifier (unused in mock)
   * @param days - Number of days to analyze
   * @returns PublishingTrends object
   */
  public getPublishingTrends(_publicationId: string, days = 30): PublishingTrends {
    return analyticsModules.generatePublishingTrends(days);
  }

  // Alerts and Notifications
  /**
   * Get publishing alerts
   * @param limit - Maximum number of alerts to return
   * @returns Array of PublishingAlert objects
   */
  public async getPublishingAlerts(limit = 20): Promise<PublishingAlert[]> {
    if (!this.db) await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const db = this.db;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['alerts'], 'readonly');
      const store = transaction.objectStore('alerts');
      const index = store.index('timestamp');
      const request = index.getAll();

      request.onsuccess = (): void => {
        const alerts = (request.result as PublishingAlert[])
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, limit);
        resolve(alerts);
      };
      request.onerror = (): void =>
        reject(new Error(request.error?.message ?? 'Database operation failed'));
    });
  }

  // Data Export
  /**
   * Export publishing analytics data
   * @param publicationIds - Array of publication IDs to export
   * @param exportConfig - Export configuration
   * @returns Exported data as a string
   */
  public async exportPublishingAnalytics(
    publicationIds: string[],
    exportConfig: PublishingExport,
  ): Promise<string> {
    const publications: Publication[] = [];
    const analytics: PlatformAnalytics[] = [];
    const feedback: ReaderFeedback[] = [];

    for (const id of publicationIds) {
      const publication = await this.getPublication(id);
      const pubAnalytics = await this.getPublicationAnalytics(id);
      const pubFeedback = await this.getReaderFeedback(id);

      if (publication) {
        publications.push(publication);
        analytics.push(pubAnalytics);
        feedback.push(...pubFeedback);
      }
    }

    return analyticsModules.exportPublishingAnalytics(
      publications,
      analytics,
      feedback,
      exportConfig,
    );
  }

  // Platform Integration
  /**
   * Connect to a publishing platform
   * @param platformId - Platform identifier
   * @param credentials - Platform credentials
   * @returns True if connection successful
   */
  public connectPlatform(
    platformId: string,
    credentials: PublishingPlatform['credentials'],
  ): boolean {
    const platform = this.mockPlatforms.find(p => p.id === platformId);
    if (!platform) return false;

    // In real implementation, this would test API connection
    platform.isConnected = true;
    platform.credentials = credentials;

    return true;
  }

  /**
   * Get all connected platforms
   * @returns Array of connected PublishingPlatform objects
   */
  public getConnectedPlatforms(): PublishingPlatform[] {
    return this.mockPlatforms.filter(p => p.isConnected);
  }

  /**
   * Get all available platforms
   * @returns Array of all PublishingPlatform objects
   */
  public getAllPlatforms(): PublishingPlatform[] {
    return [...this.mockPlatforms];
  }

  // Campaign tracking
  /**
   * Track campaign performance data
   * @param campaignId - Campaign identifier
   * @param metrics - Campaign metrics to track
   */
  public trackCampaignPerformance(
    campaignId: string,
    metrics: {
      impressions: number;
      clicks: number;
      conversions: number;
      spend: number;
    },
  ): void {
    try {
      logger.info(`Tracking campaign ${campaignId}:`, { campaignId, metrics });
      // Store metrics data - implementation would go here
    } catch (error) {
      logger.error('Failed to track campaign performance', {
        component: 'PublishingAnalyticsService',
        error,
        campaignId,
      });
      throw error;
    }
  }

  /**
   * Generate publishing insights
   * @param publicationId - Publication identifier
   * @returns Array of PublishingInsights objects
   */
  public generateInsights(publicationId: string): PublishingInsights[] {
    try {
      return analyticsModules.generatePublishingInsights(publicationId);
    } catch (error) {
      logger.error('Failed to generate insights', {
        component: 'PublishingAnalyticsService',
        error,
        publicationId,
      });
      return [];
    }
  }

  /**
   * Get all publications for a project
   * @param projectId - Project identifier
   * @returns Array of Publication objects
   */
  public async getPublications(projectId: string): Promise<Publication[]> {
    try {
      if (!this.db) await this.init();
      if (!this.db) throw new Error('Database not initialized');

      const db = this.db;
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['publications'], 'readonly');
        const store = transaction.objectStore('publications');
        const index = store.index('projectId');
        const request = index.getAll(projectId);

        request.onsuccess = (): void => resolve(request.result as Publication[]);
        request.onerror = (): void =>
          reject(new Error(request.error?.message ?? 'Database operation failed'));
      });
    } catch (error) {
      logger.error('Failed to get publications', {
        component: 'PublishingAnalyticsService',
        error,
        projectId,
      });
      return [];
    }
  }

  // Private helper methods
  private async savePublication(publication: Publication): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const db = this.db;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['publications'], 'readwrite');
      const store = transaction.objectStore('publications');
      const request = store.put(publication);

      request.onsuccess = (): void => resolve();
      request.onerror = (): void =>
        reject(new Error(request.error?.message ?? 'Database operation failed'));
    });
  }

  private async getPublication(publicationId: string): Promise<Publication | null> {
    if (!this.db) await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const db = this.db;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['publications'], 'readonly');
      const store = transaction.objectStore('publications');
      const request = store.get(publicationId);

      request.onsuccess = (): void => resolve((request.result as Publication) ?? null);
      request.onerror = (): void =>
        reject(new Error(request.error?.message ?? 'Database operation failed'));
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
        content: "Amazing story! Couldn't put it down. The character development is incredible.",
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
    ];

    // Save mock feedback
    for (const feedback of mockFeedback) {
      await this.saveFeedback(feedback);
    }
  }

  private async saveFeedback(feedback: ReaderFeedback): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const db = this.db;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['feedback'], 'readwrite');
      const store = transaction.objectStore('feedback');
      const request = store.put(feedback);

      request.onsuccess = (): void => resolve();
      request.onerror = (): void =>
        reject(new Error(request.error?.message ?? 'Database operation failed'));
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
}

export const publishingAnalyticsService = PublishingAnalyticsService.getInstance();
