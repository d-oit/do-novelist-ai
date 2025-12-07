export enum AgentMode {
  SINGLE = 'SINGLE',
  PARALLEL = 'PARALLEL',
  HYBRID = 'HYBRID',
  SWARM = 'SWARM',
}

/**
 * Chapter status enum
 *
 * CONVENTION: Lowercase values for database compatibility and internal state management.
 * These values are stored directly in the database and should remain stable.
 */
export enum ChapterStatus {
  PENDING = 'pending',
  DRAFTING = 'drafting',
  REVIEW = 'review',
  COMPLETE = 'complete',
}

/**
 * Publishing status enum
 *
 * CONVENTION: PascalCase values for UI display compatibility.
 * These values are user-facing and match the display strings shown in the interface.
 * Stored in database as-is; do not convert case when querying.
 */
export enum PublishStatus {
  DRAFT = 'Draft',
  EDITING = 'Editing',
  REVIEW = 'Review',
  PUBLISHED = 'Published',
}

export interface Chapter {
  id: string;
  orderIndex: number;
  title: string;
  summary: string;
  content: string;
  status: ChapterStatus;
  illustration?: string;
  wordCount: number;
  characterCount: number;
  estimatedReadingTime: number;
  tags: string[];
  notes: string;
  createdAt: Date;
  updatedAt: Date;
  generationPrompt?: string;
  aiModel?: string;
  generationSettings?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
  };
  // Optional extended metadata
  plotPoints?: string[];
  characters?: string[];
  locations?: string[];
  scenes?: string[];
}

export interface WorldState {
  hasTitle: boolean;
  hasOutline: boolean;
  chaptersCount: number;
  chaptersCompleted: number;
  styleDefined: boolean;
  isPublished: boolean;
  hasCharacters: boolean;
  hasWorldBuilding: boolean;
  hasThemes: boolean;
  plotStructureDefined: boolean;
  targetAudienceDefined: boolean;
}

export interface ProjectSettings {
  enableDropCaps?: boolean;
  autoSave?: boolean;
  autoSaveInterval?: number;
  showWordCount?: boolean;
  enableSpellCheck?: boolean;
  darkMode?: boolean;
  fontSize?: 'small' | 'medium' | 'large';
  lineHeight?: 'compact' | 'normal' | 'relaxed';
  editorTheme?: 'default' | 'minimal' | 'typewriter';
}

export interface Project {
  id: string;
  title: string;
  idea: string;
  style:
    | 'General Fiction'
    | 'Literary Fiction'
    | 'Mystery & Thriller'
    | 'Romance'
    | 'Science Fiction'
    | 'Fantasy'
    | 'Horror'
    | 'Historical Fiction'
    | 'Young Adult'
    | "Children's Literature"
    | 'Non-Fiction'
    | 'Biography & Memoir'
    | 'Self-Help'
    | 'Business & Economics'
    | 'Technical Writing';
  coverImage?: string; // Base64 string from Imagen
  chapters: Chapter[];
  worldState: WorldState;
  isGenerating: boolean;

  // Publishing Metadata
  status: PublishStatus;
  language: 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ja' | 'ko' | 'zh';
  targetWordCount: number;
  settings: ProjectSettings;

  // Enhanced project metadata
  genre: string[];
  targetAudience: 'children' | 'young_adult' | 'adult' | 'all_ages';
  contentWarnings: string[];
  keywords: string[];
  synopsis: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;

  // Collaboration
  authors: Array<{
    id: string;
    name: string;
    email: string;
    role: 'owner' | 'collaborator' | 'editor' | 'viewer';
  }>;

  // Analytics
  analytics: {
    totalWordCount: number;
    averageChapterLength: number;
    estimatedReadingTime: number;
    generationCost: number;
    editingRounds: number;
  };

  // Version control
  version: string;
  changeLog: {
    version: string;
    changes: string[];
    timestamp: Date;
  }[];
  // Timeline
  timeline: Timeline;
}

export interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  chronologicalIndex: number; // Absolute time order key
  date?: string; // Narrative date (e.g. "Year 2045", "October 12")
  relatedChapterId?: string; // Link to narrative
  charactersInvolved: string[];
  locationId?: string;
  tags: string[]; // e.g., "Flashback", "Climax"
  importance: 'major' | 'minor' | 'background';
}

export interface TimelineEra {
  id: string;
  name: string;
  startRange: number; // chronologicalIndex start
  endRange: number; // chronologicalIndex end
  description?: string;
  color?: string;
}

export interface Timeline {
  id: string;
  projectId: string;
  events: TimelineEvent[];
  eras: TimelineEra[];
  settings: {
    viewMode: 'chronological' | 'narrative';
    zoomLevel: number;
    showCharacters: boolean;
    showImplicitEvents: boolean;
  };
}

export interface AgentAction {
  name: string;
  label: string;
  description: string;
  cost: number; // Abstract "token/time" cost
  preconditions: Partial<WorldState>;
  effects: Partial<WorldState>;
  agentMode: AgentMode;
  promptTemplate: string;
  category: 'generation' | 'editing' | 'analysis' | 'publishing';
  estimatedDuration: number; // milliseconds
  requiredPermissions: string[];
  tags: string[];
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  agentName: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'thought';
  // Enhanced logging for debugging
  level?: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  context?: Record<string, unknown>;
  duration?: number; // milliseconds
  actionName?: string;
  decisionReason?: string;
  rejectedActions?: RejectedAction[];
  preconditionFailures?: PreconditionFailure[];
  actionTrace?: ActionTraceStep[];
}

export interface RejectedAction {
  action: AgentAction;
  reason: 'precondition_failed' | 'cost_too_high' | 'already_completed' | 'conflict';
  details: string;
  timestamp: Date;
}

export interface PreconditionFailure {
  actionName: string;
  precondition: string;
  currentValue: unknown;
  requiredValue: unknown;
  timestamp: Date;
}

export interface ActionTraceStep {
  step: number;
  action: AgentAction;
  timestamp: Date;
  state: WorldState;
  decision: 'selected' | 'rejected' | 'executed';
  reason?: string;
}

export interface AgentDecision {
  id: string;
  timestamp: Date;
  selectedAction: AgentAction | null;
  rejectedActions: RejectedAction[];
  preconditionFailures: PreconditionFailure[];
  reasoning: string;
  confidence: number; // 0-1
  executionTime: number; // milliseconds
}

export interface GoapDebugInfo {
  currentDecisions: AgentDecision[];
  actionTraces: ActionTraceStep[];
  performanceMetrics: {
    totalDecisions: number;
    averageDecisionTime: number;
    successRate: number;
    mostRejectedAction: string;
  };
  stateHistory: Array<{
    timestamp: Date;
    worldState: WorldState;
    availableActions: AgentAction[];
    selectedAction?: AgentAction;
  }>;
}

export interface StatPoint {
  name: string;
  value: number;
}

export interface RefineOptions {
  model: 'gemini-2.5-flash' | 'gemini-2.0-flash-exp' | 'gemini-1.5-pro' | 'gemini-1.5-flash';
  temperature: number;
  maxTokens: number;
  topP: number;
  focusAreas: (
    | 'grammar'
    | 'style'
    | 'pacing'
    | 'character_development'
    | 'dialogue'
    | 'description'
    | 'plot_consistency'
    | 'tone'
  )[];
  preserveLength: boolean;
  targetTone?: 'formal' | 'casual' | 'dramatic' | 'humorous' | 'mysterious';
}
/**
 * Processed Action Types
 * Used in the GOAP action execution pipeline
 */
export interface ProcessedAction {
  action: AgentAction;
  project: Project;
  pendingChapters?: Chapter[];
}

export interface ActionResult {
  success: boolean;
  data?: unknown;
  error?: Error;
}

// Re-export types from schemas for backward compatibility
export type { WritingStyle } from '../../types/schemas';
