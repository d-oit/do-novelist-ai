export enum AgentMode {
  SINGLE = 'SINGLE',
  PARALLEL = 'PARALLEL',
  HYBRID = 'HYBRID',
  SWARM = 'SWARM'
}

export enum ChapterStatus {
  PENDING = 'pending',
  DRAFTING = 'drafting',
  REVIEW = 'review',
  COMPLETE = 'complete'
}

export enum PublishStatus {
  DRAFT = 'Draft',
  EDITING = 'Editing',
  REVIEW = 'Review',
  PUBLISHED = 'Published'
}

export interface Chapter {
  id: string;
  orderIndex: number;
  title: string;
  summary: string;
  content: string;
  status: ChapterStatus;
}

export interface WorldState {
  hasTitle: boolean;
  hasOutline: boolean;
  chaptersCount: number;
  chaptersCompleted: number;
  styleDefined: boolean;
  isPublished: boolean;
}

export interface ProjectSettings {
  enableDropCaps: boolean;
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
