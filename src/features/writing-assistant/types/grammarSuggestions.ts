/**
 * Grammar & Clarity Suggestion Types
 * AI-powered grammar and clarity improvements
 */

import { z } from 'zod';

// ============================================================================
// Grammar Suggestion
// ============================================================================

export interface GrammarSuggestion {
  id: string;
  type: GrammarSuggestionType;
  severity: 'error' | 'warning' | 'suggestion' | 'info';
  category: GrammarCategory;

  // Location
  position: {
    start: number;
    end: number;
    line?: number;
    column?: number;
  };

  // Content
  originalText: string;
  suggestedText?: string;
  message: string;
  explanation: string;
  ruleReference?: string;

  // Metadata
  confidence: number; // 0-1
  aiGenerated: boolean;
  timestamp: Date;
}

// ============================================================================
// Suggestion Types
// ============================================================================

export type GrammarSuggestionType =
  | 'grammar'
  | 'spelling'
  | 'punctuation'
  | 'syntax'
  | 'word_choice'
  | 'redundancy'
  | 'passive_voice'
  | 'clarity'
  | 'conciseness'
  | 'parallelism'
  | 'article_usage'
  | 'subject_verb_agreement'
  | 'pronoun_reference'
  | 'modifier_placement'
  | 'mixed_constructions'
  | 'dangling_modifiers'
  | 'run_on_sentences'
  | 'fragment';

export type GrammarCategory =
  | 'mechanical'
  | 'clarity'
  | 'style'
  | 'convention'
  | 'usage'
  | 'conciseness';

// ============================================================================
// Grammar Analysis Result
// ============================================================================

export interface GrammarAnalysisResult {
  id: string;
  timestamp: Date;
  content: string;
  suggestions: GrammarSuggestion[];
  stats: {
    totalIssues: number;
    errorCount: number;
    warningCount: number;
    suggestionCount: number;
    infoCount: number;
  };
  readabilityImpact: number; // 0-100
}

// ============================================================================
// Grammar Configuration
// ============================================================================

export const GrammarConfigSchema = z.object({
  enabled: z.boolean().default(true),
  checkGrammar: z.boolean().default(true),
  checkSpelling: z.boolean().default(true),
  checkPunctuation: z.boolean().default(true),
  checkClarity: z.boolean().default(true),
  checkStyle: z.boolean().default(true),
  checkRedundancy: z.boolean().default(true),
  checkPassiveVoice: z.boolean().default(true),
  minimumConfidence: z.number().min(0).max(1).default(0.7),
  maxSuggestions: z.number().min(1).max(100).default(20),
  autoFix: z.boolean().default(false),
  explainSuggestions: z.boolean().default(true),
});

export type GrammarConfig = z.infer<typeof GrammarConfigSchema>;

export const DEFAULT_GRAMMAR_CONFIG: GrammarConfig = {
  enabled: true,
  checkGrammar: true,
  checkSpelling: true,
  checkPunctuation: true,
  checkClarity: true,
  checkStyle: true,
  checkRedundancy: true,
  checkPassiveVoice: true,
  minimumConfidence: 0.7,
  maxSuggestions: 20,
  autoFix: false,
  explainSuggestions: true,
};

// ============================================================================
// Grammar Rule Reference
// ============================================================================

export interface GrammarRuleReference {
  ruleId: string;
  ruleName: string;
  category: GrammarCategory;
  description: string;
  examples: {
    incorrect: string;
    correct: string;
  }[];
  referenceUrl?: string;
}

// ============================================================================
// Clarity Metrics
// ============================================================================

export interface ClarityMetrics {
  clarityScore: number; // 0-100
  sentenceComplexity: number; // 0-100
  wordinessScore: number; // 0-100
  passiveVoiceRatio: number; // 0-100
  averageWordsPerSentence: number;
  complexWordRatio: number; // 0-100
  suggestions: ClaritySuggestion[];
}

export interface ClaritySuggestion {
  type: 'simplification' | 'concision' | 'active_voice' | 'clarification';
  description: string;
  originalText: string;
  suggestedText?: string;
  impact: 'high' | 'medium' | 'low';
}

// ============================================================================
// Type Guards
// ============================================================================

export function isGrammarSuggestion(value: unknown): value is GrammarSuggestion {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'type' in value &&
    'severity' in value &&
    'message' in value
  );
}

export function isGrammarAnalysisResult(value: unknown): value is GrammarAnalysisResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'suggestions' in value &&
    Array.isArray((value as GrammarAnalysisResult).suggestions)
  );
}

// ============================================================================
// Common Grammar Rules
// ============================================================================

export const COMMON_GRAMMAR_RULES: GrammarRuleReference[] = [
  {
    ruleId: 'PV001',
    ruleName: 'Passive Voice',
    category: 'style',
    description: 'Passive voice can make sentences weaker and less direct.',
    examples: [{ incorrect: 'The ball was hit by John.', correct: 'John hit the ball.' }],
  },
  {
    ruleId: 'RD001',
    ruleName: 'Redundancy',
    category: 'clarity',
    description: 'Avoid using words that repeat meaning.',
    examples: [{ incorrect: 'Advance planning is necessary.', correct: 'Planning is necessary.' }],
  },
  {
    ruleId: 'WW001',
    ruleName: 'Wordy Phrases',
    category: 'conciseness',
    description: 'Replace wordy phrases with concise alternatives.',
    examples: [{ incorrect: 'At this point in time', correct: 'Now' }],
  },
];
