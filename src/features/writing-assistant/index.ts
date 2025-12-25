/**
 * Writing Assistant Feature Exports
 * AI-powered writing suggestions and content analysis
 */

// Components
export { WritingAssistantPanel } from './components/WritingAssistantPanel';
export { WritingAssistantSettings } from './components/WritingAssistantSettings';
export { WritingAnalyticsDashboard } from './components/WritingAnalyticsDashboard';
export {
  InlineSuggestionTooltip,
  SuggestionCountBadge,
} from './components/InlineSuggestionTooltip';
export { WritingGoalsPanel } from './components/WritingGoalsPanel';
export { StyleAnalysisCard } from './components/StyleAnalysisCard';

// Hooks
export { default as useWritingAssistant } from './hooks/useWritingAssistant';
export {
  useRealTimeAnalysis,
  useStyleAnalysis,
  useGrammarAnalysis,
} from './hooks/useRealTimeAnalysis';
export { useWritingGoals } from './hooks/useWritingGoals';
export { useInlineSuggestions, useSuggestionSelection } from './hooks/useInlineSuggestions';

// Services
export { writingAssistantService } from './services/writingAssistantService';
export { writingAssistantDb } from './services/writingAssistantDb';
export { styleAnalysisService } from './services/styleAnalysisService';
export { grammarSuggestionService } from './services/grammarSuggestionService';
export { goalsService } from './services/goalsService';
export { realTimeAnalysisService } from './services/realTimeAnalysisService';

// Types - Original
export type {
  WritingAssistantConfig,
  WritingAssistantState,
  WritingAssistantActions,
  ContentAnalysis,
  WritingSuggestion,
  WritingSuggestionCategory,
  PlotHoleDetection,
  CharacterConsistencyIssue,
  DialogueAnalysis,
  StyleProfile,
  ToneAnalysis,
  WordUsageAnalysis,
} from './types';

// Types - Style Analysis
export type {
  StyleAnalysisResult,
  ConsistencyIssue,
  StyleRecommendation,
  StyleAnalysisConfig,
  ReadabilityMetrics,
  ToneAnalysisDetail,
  VoiceAnalysisDetail,
} from './types';

// Types - Grammar Suggestions
export type {
  GrammarSuggestion,
  GrammarSuggestionType,
  GrammarCategory,
  GrammarAnalysisResult,
  GrammarConfig,
  GrammarRuleReference,
  ClarityMetrics,
  ClaritySuggestion,
} from './types';

// Types - Writing Goals
export type {
  WritingGoal,
  GoalProgress,
  GoalMetricProgress,
  GoalPreset,
  WritingGoalsConfig,
  GoalAchievementStatus,
  GoalWithStatus,
} from './types';

// Types - Real-Time Feedback
export type {
  InlineSuggestion,
  RealTimeAnalysisState,
  ContentEditorState,
  SuggestionAction,
  AnalysisBatch,
  AnalysisType,
  RealTimeConfig,
  SuggestionHighlight,
  FeedbackPanelState,
  AnalysisMetrics,
  RealTimeEvent,
  RealTimeEventType,
} from './types';

// Config - Original
export { DEFAULT_WRITING_ASSISTANT_CONFIG, WritingAssistantConfigSchema } from './types';

// Config - Style Analysis
export { DEFAULT_STYLE_ANALYSIS_CONFIG, StyleAnalysisConfigSchema } from './types';

// Config - Grammar Suggestions
export { DEFAULT_GRAMMAR_CONFIG, GrammarConfigSchema } from './types';

// Config - Writing Goals
export {
  DEFAULT_WRITING_GOALS_CONFIG,
  WritingGoalsConfigSchema,
  GOAL_PRESETS,
  GOAL_TEMPLATES,
} from './types';

// Config - Real-Time Feedback
export { DEFAULT_REAL_TIME_CONFIG, RealTimeConfigSchema } from './types';
