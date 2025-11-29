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
  hasCharacters?: boolean;
  hasWorldBuilding?: boolean;
  hasThemes?: boolean;
  plotStructureDefined?: boolean;
  targetAudienceDefined?: boolean;
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
  style: string;
  coverImage?: string; // Base64 string from Imagen
  chapters: Chapter[];
  worldState: WorldState;
  isGenerating: boolean;

  // Publishing Metadata
  status: PublishStatus;
  language: string;
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
  authors: {
    id: string;
    name: string;
    email: string;
    role: 'owner' | 'collaborator' | 'editor' | 'viewer';
  }[];

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
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  agentName: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'thought';
}

export interface StatPoint {
  name: string;
  value: number;
}

export interface RefineOptions {
  model: string;
  temperature: number;
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
  data?: any;
  error?: Error;
}
