/**
 * Writing Assistant Feature Exports
 * AI-powered writing suggestions and content analysis
 */

// Components
export { WritingAssistantPanel } from './components/WritingAssistantPanel';
export { WritingAssistantSettings } from './components/WritingAssistantSettings';
export { WritingAnalyticsDashboard } from './components/WritingAnalyticsDashboard';

// Hooks
export { default as useWritingAssistant } from './hooks/useWritingAssistant';

// Services
export { writingAssistantService } from './services/writingAssistantService';
export { writingAssistantDb } from './services/writingAssistantDb';

// Types
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

export { DEFAULT_WRITING_ASSISTANT_CONFIG } from './types';
