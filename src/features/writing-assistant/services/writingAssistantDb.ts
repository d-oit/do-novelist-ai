/**
 * Writing Assistant Database Service
 * Hybrid approach: localStorage for UI state, Turso DB for persistent analytics
 */

// import { db } from '../../../lib/db'; // Will be used when implementing actual DB queries
import {
  type ContentAnalysis,
  type WritingSuggestion,
  type WritingAssistantConfig,
} from '../types';

// Database schema types for Writing Assistant
export interface AnalysisHistory {
  id: string;
  userId: string;
  chapterId: string;
  projectId: string;
  readabilityScore: number;
  engagementScore: number;
  sentimentScore: number;
  paceScore: number;
  suggestionCount: number;
  suggestionCategories: string[]; // JSON array
  acceptedSuggestions: number;
  dismissedSuggestions: number;
  analysisDepth: 'basic' | 'standard' | 'comprehensive';
  contentWordCount: number;
  timestamp: Date;
  createdAt: Date;
}

export interface UserWritingPreferences {
  id: string;
  userId: string;
  preferences: WritingAssistantConfig;
  lastSyncedAt: Date;
  deviceId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SuggestionFeedback {
  id: string;
  userId: string;
  suggestionType: string;
  suggestionCategory: string;
  action: 'accepted' | 'dismissed' | 'ignored';
  originalText?: string;
  appliedText?: string;
  confidence: number;
  contextWordCount: number;
  chapterId: string;
  projectId: string;
  timestamp: Date;
}

export interface WritingProgressMetrics {
  id: string;
  userId: string;
  projectId: string;
  date: string; // YYYY-MM-DD
  wordsWritten: number;
  timeSpent: number; // minutes
  suggestionsReceived: number;
  suggestionsAccepted: number;
  averageReadability: number;
  averageEngagement: number;
  chaptersWorkedOn: number;
  createdAt: Date;
}

class WritingAssistantDb {
  private static instance: WritingAssistantDb;
  private userId: string | null = null;
  private readonly deviceId: string;

  private constructor() {
    this.deviceId = this.getOrCreateDeviceId();
    this.initializeUserId();
  }

  static getInstance(): WritingAssistantDb {
    if (!WritingAssistantDb.instance) {
      WritingAssistantDb.instance = new WritingAssistantDb();
    }
    return WritingAssistantDb.instance;
  }

  private getOrCreateDeviceId(): string {
    let deviceId = localStorage.getItem('novelist_device_id');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('novelist_device_id', deviceId);
    }
    return deviceId;
  }

  private initializeUserId(): void {
    // In a real app, this would come from authentication
    // For now, create a persistent anonymous user ID
    let userId = localStorage.getItem('novelist_user_id');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('novelist_user_id', userId);
    }
    this.userId = userId;
  }

  /**
   * Save analysis results to database for historical tracking
   */
  public saveAnalysisHistory(
    analysis: ContentAnalysis,
    projectId: string,
    acceptedCount = 0,
    dismissedCount = 0,
  ): void {
    if (!this.userId) return;

    try {
      const analysisRecord: Omit<AnalysisHistory, 'createdAt'> = {
        id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: this.userId,
        chapterId: analysis.chapterId,
        projectId,
        readabilityScore: analysis.readabilityScore,
        engagementScore: analysis.engagementScore,
        sentimentScore: analysis.sentimentScore,
        paceScore: analysis.paceScore,
        suggestionCount: analysis.suggestions.length,
        suggestionCategories: [...new Set(analysis.suggestions.map(s => s.category))],
        acceptedSuggestions: acceptedCount,
        dismissedSuggestions: dismissedCount,
        analysisDepth: 'standard', // Would come from config
        contentWordCount: this.countWords(analysis.content),
        timestamp: analysis.timestamp,
      };

      // Save to database (would be actual DB call)
      this.insertAnalysisHistory(analysisRecord);

      // Update daily progress metrics
      this.updateDailyProgress(projectId, analysis);
    } catch (error) {
      console.error('Failed to save analysis history:', error);
      // Fail gracefully - don't break the user experience
    }
  }

  /**
   * Record user feedback on suggestions for machine learning
   */
  public recordSuggestionFeedback(
    suggestion: WritingSuggestion,
    action: 'accepted' | 'dismissed' | 'ignored',
    chapterId: string,
    projectId: string,
    appliedText?: string,
  ): void {
    if (!this.userId) return;

    try {
      const feedback: SuggestionFeedback = {
        id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: this.userId,
        suggestionType: suggestion.type,
        suggestionCategory: suggestion.category,
        action,
        originalText: suggestion.originalText,
        appliedText,
        confidence: suggestion.confidence,
        contextWordCount: suggestion.originalText?.split(/\s+/).length ?? 0,
        chapterId,
        projectId,
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.insertSuggestionFeedback(feedback);
    } catch (error) {
      console.error('Failed to record suggestion feedback:', error);
    }
  }

  /**
   * Sync user preferences across devices (optional)
   */
  public syncPreferences(config: WritingAssistantConfig): void {
    if (!this.userId) return;

    try {
      const preferences: UserWritingPreferences = {
        id: `pref_${this.userId}_${this.deviceId}`,
        userId: this.userId,
        preferences: config,
        lastSyncedAt: new Date(),
        deviceId: this.deviceId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.upsertUserPreferences(preferences);
    } catch (error) {
      console.error('Failed to sync preferences:', error);
    }
  }

  /**
   * Load preferences from database (fallback if localStorage is empty)
   */
  public loadPreferences(): WritingAssistantConfig | null {
    if (!this.userId) return null;

    try {
      const preferences = this.getUserPreferences(this.userId);
      return preferences?.preferences ?? null;
    } catch (error) {
      console.error('Failed to load preferences:', error);
      return null;
    }
  }

  /**
   * Get writing analytics for progress tracking
   */
  public getWritingAnalytics(
    projectId: string,
    timeRange: 'week' | 'month' | 'year' = 'month',
  ): {
    progressMetrics: WritingProgressMetrics[];
    improvementTrends: {
      readabilityTrend: number;
      engagementTrend: number;
      productivityTrend: number;
    };
    suggestionInsights: {
      mostHelpfulCategories: string[];
      acceptanceRate: number;
      commonPatterns: string[];
    };
  } {
    if (!this.userId) {
      return {
        progressMetrics: [],
        improvementTrends: { readabilityTrend: 0, engagementTrend: 0, productivityTrend: 0 },
        suggestionInsights: { mostHelpfulCategories: [], acceptanceRate: 0, commonPatterns: [] },
      };
    }

    try {
      const progressMetrics = this.getProgressMetrics(this.userId, projectId, timeRange);
      const analysisHistory = this.getAnalysisHistory(this.userId, projectId, timeRange);
      const suggestionFeedback = this.getSuggestionFeedback(this.userId, projectId, timeRange);

      // Calculate trends
      const improvementTrends = this.calculateImprovementTrends(analysisHistory);
      const suggestionInsights = this.analyzeSuggestionPatterns(suggestionFeedback);

      return {
        progressMetrics,
        improvementTrends,
        suggestionInsights,
      };
    } catch (error) {
      console.error('Failed to get writing analytics:', error);
      return {
        progressMetrics: [],
        improvementTrends: { readabilityTrend: 0, engagementTrend: 0, productivityTrend: 0 },
        suggestionInsights: { mostHelpfulCategories: [], acceptanceRate: 0, commonPatterns: [] },
      };
    }
  }

  /**
   * Clean up old data (privacy-friendly)
   */
  public cleanupOldData(retentionDays = 365): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    try {
      this.deleteOldAnalysisHistory(cutoffDate);
      this.deleteOldSuggestionFeedback(cutoffDate);
      this.deleteOldProgressMetrics(cutoffDate);
    } catch (error) {
      console.error('Failed to cleanup old data:', error);
    }
  }

  // Private helper methods
  private countWords(text: string): number {
    return text
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0).length;
  }

  private calculateImprovementTrends(history: AnalysisHistory[]) {
    if (history.length < 2) {
      return { readabilityTrend: 0, engagementTrend: 0, productivityTrend: 0 };
    }

    const sorted = history.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    if (!first || !last) {
      return { readabilityTrend: 0, engagementTrend: 0, productivityTrend: 0 };
    }

    return {
      readabilityTrend: last.readabilityScore - first.readabilityScore,
      engagementTrend: last.engagementScore - first.engagementScore,
      productivityTrend: last.contentWordCount / sorted.length - first.contentWordCount,
    };
  }

  private analyzeSuggestionPatterns(feedback: SuggestionFeedback[]) {
    if (feedback.length === 0) {
      return { mostHelpfulCategories: [], acceptanceRate: 0, commonPatterns: [] };
    }

    const accepted = feedback.filter(f => f.action === 'accepted');
    const acceptanceRate = accepted.length / feedback.length;

    // Find most helpful categories
    const categoryStats = feedback.reduce<Record<string, number>>((acc, f) => {
      if (f.action === 'accepted') {
        acc[f.suggestionCategory] = (acc[f.suggestionCategory] ?? 0) + 1;
      }
      return acc;
    }, {});

    const mostHelpfulCategories = Object.entries(categoryStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category);

    return {
      mostHelpfulCategories,
      acceptanceRate,
      commonPatterns: [], // Would implement pattern detection
    };
  }

  private updateDailyProgress(_projectId: string, _analysis: ContentAnalysis): void {
    // This would be actual database operations
    // For now, we'll implement mock versions
  }

  // Mock database operations (would be replaced with actual Turso queries)
  private insertAnalysisHistory(record: Omit<AnalysisHistory, 'createdAt'>): void {
    // await db.insert(analysisHistoryTable).values(record);
    console.log('Saving analysis history:', record.id);
  }

  private insertSuggestionFeedback(record: Omit<SuggestionFeedback, 'id'>): void {
    // await db.insert(suggestionFeedbackTable).values(record);
    console.log('Recording suggestion feedback:', record.suggestionType, record.action);
  }

  private upsertUserPreferences(
    record: Omit<UserWritingPreferences, 'createdAt' | 'updatedAt'>,
  ): void {
    // await db.insert(userPreferencesTable).values(record).onConflictDoUpdate(...);
    console.log('Syncing preferences for user:', record.userId);
  }

  private getUserPreferences(userId: string): UserWritingPreferences | null {
    // return await db.select().from(userPreferencesTable).where(eq(userPreferencesTable.userId, userId));
    console.log('Loading preferences for user:', userId);
    return null;
  }

  private getProgressMetrics(
    userId: string,
    projectId: string,
    timeRange: string,
  ): WritingProgressMetrics[] {
    console.log('Loading progress metrics:', userId, projectId, timeRange);
    return [];
  }

  private getAnalysisHistory(
    userId: string,
    projectId: string,
    timeRange: string,
  ): AnalysisHistory[] {
    console.log('Loading analysis history:', userId, projectId, timeRange);
    return [];
  }

  private getSuggestionFeedback(
    userId: string,
    projectId: string,
    timeRange: string,
  ): SuggestionFeedback[] {
    console.log('Loading suggestion feedback:', userId, projectId, timeRange);
    return [];
  }

  private deleteOldAnalysisHistory(cutoffDate: Date): void {
    console.log('Cleaning up analysis history older than:', cutoffDate);
  }

  private deleteOldSuggestionFeedback(cutoffDate: Date): void {
    console.log('Cleaning up suggestion feedback older than:', cutoffDate);
  }

  private deleteOldProgressMetrics(cutoffDate: Date): void {
    console.log('Cleaning up progress metrics older than:', cutoffDate);
  }
}

export const writingAssistantDb = WritingAssistantDb.getInstance();
