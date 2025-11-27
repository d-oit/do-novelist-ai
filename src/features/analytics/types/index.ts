/**
 * Analytics & Insights Dashboard Types
 * Provides comprehensive writing analytics and productivity insights
 */

export interface WritingSession {
  id: string;
  projectId: string;
  chapterId?: string;
  startTime: Date;
  endTime: Date;
  duration: number; // milliseconds
  wordsAdded: number;
  wordsRemoved: number;
  netWordCount: number;
  charactersTyped: number;
  backspacesPressed: number;
  aiAssistanceUsed: boolean;
  aiWordsGenerated: number;
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  totalWritingTime: number; // minutes
  wordsWritten: number;
  sessionsCount: number;
  averageSessionLength: number; // minutes
  peakWritingHour: number; // 0-23
  productivity: number; // words per minute
  aiAssistancePercentage: number;
}

export interface WeeklyStats {
  weekStart: string; // YYYY-MM-DD (Monday)
  totalWords: number;
  totalTime: number; // minutes
  averageDailyWords: number;
  mostProductiveDay: string;
  streak: number; // consecutive writing days
  goals: {
    wordsTarget: number;
    timeTarget: number; // minutes
    wordsAchieved: number;
    timeAchieved: number;
  };
}

export interface MonthlyStats {
  month: string; // YYYY-MM
  totalWords: number;
  totalChapters: number;
  completedChapters: number;
  averageDailyWords: number;
  longestStreak: number;
  mostProductiveWeek: string;
  genres: Record<string, number>; // genre -> word count
  writingVelocity: number[]; // daily words for the month
}

export interface ProjectAnalytics {
  projectId: string;
  title: string;
  createdAt: Date;
  totalWords: number;
  totalChapters: number;
  completedChapters: number;
  estimatedReadingTime: number; // minutes
  averageChapterLength: number;
  writingProgress: number; // 0-100 percentage
  timeSpent: number; // total minutes
  lastActivity: Date;
  wordCountHistory: Array<{
    date: string;
    wordCount: number;
  }>;
  chapterProgress: Array<{
    chapterId: string;
    title: string;
    wordCount: number;
    status: string;
    completionDate?: Date;
  }>;
}

export interface WritingGoals {
  id: string;
  type: 'daily' | 'weekly' | 'monthly' | 'project';
  target: {
    words?: number;
    time?: number; // minutes
    chapters?: number;
  };
  current: {
    words: number;
    time: number;
    chapters: number;
  };
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  projectId?: string;
}

export interface WritingInsights {
  productivity: {
    averageWordsPerHour: number;
    peakWritingHours: number[]; // hours of day when most productive
    preferredWritingDays: string[]; // days of week
    consistencyScore: number; // 0-100
  };
  patterns: {
    averageSessionLength: number;
    sessionsPerDay: number;
    preferredChapterLength: number;
    revisionRatio: number; // deletions vs additions
  };
  aiUsage: {
    totalWordsGenerated: number;
    assistancePercentage: number;
    mostAssistedChapters: string[];
    aiDependencyTrend: number; // increasing/decreasing AI usage
  };
  streaks: {
    currentStreak: number;
    longestStreak: number;
    streakDates: string[];
  };
  milestones: Array<{
    type: 'word_count' | 'chapter_completion' | 'streak' | 'productivity';
    title: string;
    description: string;
    achievedAt: Date;
    value: number;
  }>;
}

export interface AnalyticsFilter {
  dateRange: {
    start: Date;
    end: Date;
  };
  projectIds?: string[];
  includeAI?: boolean;
  granularity: 'hour' | 'day' | 'week' | 'month';
}

export interface AnalyticsExport {
  format: 'json' | 'csv' | 'pdf';
  dateRange: {
    start: Date;
    end: Date;
  };
  includeCharts: boolean;
  sections: Array<'summary' | 'goals' | 'insights' | 'sessions' | 'projects'>;
}

export type ChartDataPoint = {
  date: string;
  value: number;
  label?: string;
};

export type AnalyticsChartType = 
  | 'line' 
  | 'bar' 
  | 'area' 
  | 'pie' 
  | 'heatmap' 
  | 'progress';

export interface ChartConfig {
  type: AnalyticsChartType;
  title: string;
  data: ChartDataPoint[];
  color?: string;
  gradient?: boolean;
  showGrid?: boolean;
  animate?: boolean;
}