import { analytics } from './analytics';
import type { FeedbackResponse } from './types';

class FeedbackService {
  private surveyHistory: Map<string, string[]> = new Map();
  private lastSurveyTime: Map<string, number> = new Map();
  private readonly SURVEY_COOLDOWN = 30 * 24 * 60 * 60 * 1000;

  submitFeedback(response: FeedbackResponse): void {
    analytics.capture({
      event: 'feedback_submitted',
      properties: {
        survey_id: response.surveyId,
        response: response.response,
        comment: response.comment,
        timestamp: response.timestamp,
        context: response.context,
      },
    });
  }

  trackNPS(rating: number, comment?: string): void {
    analytics.capture({
      event: 'nps_submitted',
      properties: {
        rating,
        comment,
        survey_type: 'nps',
      },
    });
  }

  trackCSAT(rating: number, feature?: string, comment?: string): void {
    analytics.capture({
      event: 'csat_submitted',
      properties: {
        rating,
        feature,
        comment,
        survey_type: 'csat',
      },
    });
  }

  trackFeatureRating(
    feature: string,
    rating: number,
    metadata?: {
      version?: string;
      improvement_areas?: string[];
      liked_aspects?: string[];
    },
  ): void {
    analytics.capture({
      event: 'feature_rated',
      properties: {
        feature,
        rating,
        ...metadata,
      },
    });
  }

  shouldShowSurvey(surveyId: string, userId?: string): boolean {
    const userKey = userId ?? 'anonymous';
    const userHistory = this.surveyHistory.get(userKey) ?? [];
    const lastTime = this.lastSurveyTime.get(surveyId) ?? 0;
    const now = Date.now();

    if (now - lastTime < this.SURVEY_COOLDOWN) {
      return false;
    }

    if (userHistory.includes(surveyId)) {
      return false;
    }

    return true;
  }

  recordSurveyShown(surveyId: string, userId?: string): void {
    const userKey = userId ?? 'anonymous';
    const history = this.surveyHistory.get(userKey) ?? [];
    this.surveyHistory.set(userKey, [...history, surveyId]);
    this.lastSurveyTime.set(surveyId, Date.now());

    analytics.capture({
      event: 'survey_shown',
      properties: {
        survey_id: surveyId,
        user_id: userKey,
      },
    });
  }

  recordSurveyDismissed(surveyId: string, reason?: string): void {
    analytics.capture({
      event: 'survey_dismissed',
      properties: {
        survey_id: surveyId,
        reason,
      },
    });
  }

  trackBugReport(description: string, category: string, metadata?: Record<string, unknown>): void {
    analytics.capture({
      event: 'bug_reported',
      properties: {
        description,
        category,
        ...metadata,
      },
    });
  }

  trackFeatureRequest(feature: string, description: string, priority?: number): void {
    analytics.capture({
      event: 'feature_requested',
      properties: {
        feature,
        description,
        priority: priority ?? 'medium',
      },
    });
  }

  getUserSurveyHistory(userId?: string): string[] {
    const userKey = userId ?? 'anonymous';
    return this.surveyHistory.get(userKey) ?? [];
  }

  clearSurveyHistory(userId?: string): void {
    const userKey = userId ?? 'anonymous';
    this.surveyHistory.delete(userKey);
  }
}

export const feedbackService = new FeedbackService();
