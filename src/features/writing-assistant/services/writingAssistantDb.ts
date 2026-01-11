/**
 * Writing Assistant Database Service
 * Now fully using Turso for persistent analytics and preferences
 */

import {
  type ContentAnalysis,
  type WritingAssistantConfig,
  type WritingSuggestion,
} from '@/features/writing-assistant/types';
import { writingAssistantService as tursoWritingAssistantService } from '@/lib/database/services';
import { logger } from '@/lib/logging/logger';

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

  private constructor() {
    this.initializeUserId();
  }

  public static getInstance(): WritingAssistantDb {
    WritingAssistantDb.instance ??= new WritingAssistantDb();
    return WritingAssistantDb.instance;
  }

  private initializeUserId(): void {
    // In a real app, this would come from authentication
    // For now, create a persistent anonymous user ID
    try {
      let userId = localStorage.getItem('novelist_user_id');
      if (userId == null) {
        const randomSuffix = window.crypto
          .getRandomValues(new Uint32Array(2))
          .reduce((acc, val) => acc + val.toString(36), '');
        userId = `user_${Date.now()}_${randomSuffix}`;
        localStorage.setItem('novelist_user_id', userId);
      }
      this.userId = userId;
    } catch {
      logger.warn('LocalStorage access denied, using temporary user ID', {
        component: 'WritingAssistantDb',
      });
      this.userId = `temp_user_${Date.now()}`;
    }
  }

  /**
   * Save analysis results to database for historical tracking
   */
  public async saveAnalysisHistory(
    analysis: ContentAnalysis,
    projectId: string,
    acceptedCount: number = 0,
    dismissedCount: number = 0,
  ): Promise<void> {
    if (this.userId == null) return;

    try {
      await tursoWritingAssistantService.saveAnalysis(
        analysis.chapterId,
        projectId,
        analysis.readabilityScore,
        analysis.engagementScore,
        analysis.sentimentScore,
        analysis.paceScore,
        analysis.suggestions.length,
        [...new Set(analysis.suggestions.map(s => s.category))],
        'standard',
        this.countWords(analysis.content),
        acceptedCount,
        dismissedCount,
      );

      // Update daily progress metrics
      this.updateDailyProgress();
    } catch (error) {
      logger.error('Failed to save analysis history', {
        component: 'WritingAssistantDb',
        error,
      });
    }
  }

  /**
   * Record user feedback on suggestions for machine learning
   */
  public async recordSuggestionFeedback(
    suggestion: WritingSuggestion,
    action: 'accepted' | 'dismissed' | 'ignored',
    chapterId: string,
    projectId: string,
    appliedText?: string,
  ): Promise<void> {
    if (this.userId == null) return;

    try {
      await tursoWritingAssistantService.recordSuggestionFeedback(
        suggestion.type,
        suggestion.category,
        action,
        appliedText || suggestion.originalText,
        chapterId,
        projectId,
      );
    } catch (error) {
      logger.error('Failed to record suggestion feedback', {
        component: 'WritingAssistantDb',
        error,
      });
    }
  }

  /**
   * Sync user preferences across devices (optional)
   */
  public async syncPreferences(config: WritingAssistantConfig): Promise<void> {
    if (this.userId == null) return;

    try {
      await tursoWritingAssistantService.savePreferences(config);
    } catch (error) {
      logger.error('Failed to sync preferences', {
        component: 'WritingAssistantDb',
        error,
      });
    }
  }

  /**
   * Load preferences from database (fallback if localStorage is empty)
   */
  public async loadPreferences(): Promise<WritingAssistantConfig | null> {
    if (this.userId == null) return null;

    try {
      const preferences = await tursoWritingAssistantService.getPreferences();
      return preferences as WritingAssistantConfig | null;
    } catch (error) {
      logger.error('Failed to load preferences', {
        component: 'WritingAssistantDb',
        error,
      });
      return null;
    }
  }

  /**
   * Get writing analytics for progress tracking
   */
  public async getWritingAnalytics(projectId: string): Promise<{
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
  }> {
    if (this.userId == null) {
      return {
        progressMetrics: [],
        improvementTrends: { readabilityTrend: 0, engagementTrend: 0, productivityTrend: 0 },
        suggestionInsights: { mostHelpfulCategories: [], acceptanceRate: 0, commonPatterns: [] },
      };
    }

    try {
      // For now, returning empty metrics as we migrate the analytics logic to Turso
      // In a later step, we'll implement these in tursoWritingAssistantService
      return {
        progressMetrics: [],
        improvementTrends: { readabilityTrend: 0, engagementTrend: 0, productivityTrend: 0 },
        suggestionInsights: { mostHelpfulCategories: [], acceptanceRate: 0, commonPatterns: [] },
      };
    } catch (error) {
      logger.error('Failed to get writing analytics', {
        component: 'WritingAssistantDb',
        error,
        projectId,
      });
      return {
        progressMetrics: [],
        improvementTrends: { readabilityTrend: 0, engagementTrend: 0, productivityTrend: 0 },
        suggestionInsights: { mostHelpfulCategories: [], acceptanceRate: 0, commonPatterns: [] },
      };
    }
  }

  // Private helper methods
  private countWords(text: string): number {
    return text
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0).length;
  }

  private updateDailyProgress(): void {
    // This would be actual database operations
  }
}

export const writingAssistantDb = WritingAssistantDb.getInstance();
