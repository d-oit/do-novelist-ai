/**
 * Version History & Collaboration Types
 * Provides comprehensive versioning capabilities for chapters and projects
 */

export interface Version {
  id: string;
  timestamp: Date;
  authorName: string;
  message: string;
  type: 'manual' | 'auto' | 'ai-generated' | 'restore';
  contentHash: string;
  wordCount: number;
  charCount: number;
}

export interface ChapterVersion extends Version {
  chapterId: string;
  title: string;
  summary: string;
  content: string;
  status: import('../../../types/index').ChapterStatus;
}

import { WorldState, ProjectSettings } from '../../../types/schemas';

export interface ProjectVersion extends Version {
  projectId: string;
  title: string;
  idea: string;
  style: string;
  chapterIds: string[];
  worldState: WorldState;
  settings: ProjectSettings;
}

export interface VersionDiff {
  type: 'addition' | 'deletion' | 'modification';
  lineNumber: number;
  oldContent?: string;
  newContent?: string;
  context: string;
}

export interface Branch {
  id: string;
  name: string;
  description: string;
  parentVersionId: string;
  createdAt: Date;
  isActive: boolean;
  color: string;
}

export interface VersionCompareResult {
  diffs: VersionDiff[];
  wordCountChange: number;
  charCountChange: number;
  additionsCount: number;
  deletionsCount: number;
  modificationsCount: number;
}

export interface VersioningState {
  currentBranch: Branch;
  branches: Branch[];
  versions: ChapterVersion[];
  isTrackingChanges: boolean;
  autoSaveInterval: number;
  maxVersionsToKeep: number;
}

export type VersionFilter = 'all' | 'manual' | 'auto' | 'ai-generated' | 'restore';
export type SortOrder = 'newest' | 'oldest' | 'author' | 'wordCount';
