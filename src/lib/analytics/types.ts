export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, unknown>;
  options?: {
    timestamp?: number;
    send_instantly?: boolean;
  };
}

export interface UserProperties {
  id?: string;
  email?: string;
  name?: string;
  plan?: string;
  signupDate?: string;
  [key: string]: unknown;
}

export interface FeatureUsage {
  feature: string;
  action: string;
  metadata?: Record<string, unknown>;
}

export interface PageView {
  path: string;
  title?: string;
  referrer?: string;
}

export interface Experiment {
  key: string;
  variant: string;
  enrolled: boolean;
}

export type FeatureFlag = string;

export interface FeedbackSurvey {
  id: string;
  type: 'nps' | 'csat' | 'rating' | 'custom';
  question: string;
  options?: string[];
  minRating?: number;
  maxRating?: number;
  context?: Record<string, unknown>;
}

export interface FeedbackResponse {
  surveyId: string;
  response: number | string;
  comment?: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

export interface TimeInFeature {
  feature: string;
  startTime: number;
  endTime: number;
  metadata?: Record<string, unknown>;
}
