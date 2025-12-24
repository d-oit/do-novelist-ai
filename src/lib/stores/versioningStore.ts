import { create } from 'zustand';

import { versioningService } from '@/features/versioning/services/versioningService';
import type {
  Branch,
  ChapterVersion,
  SortOrder,
  VersionCompareResult,
  VersionFilter,
} from '@/features/versioning/types';
import { logger } from '@/lib/logging/logger';
import type { Chapter } from '@/types';

interface VersioningState {
  // State
  versions: ChapterVersion[];
  branches: Branch[];
  currentBranch: Branch | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadVersionHistory: (chapterId: string) => Promise<void>;
  loadBranches: (chapterId: string) => Promise<void>;
  saveVersion: (
    chapter: Chapter,
    message?: string,
    type?: ChapterVersion['type'],
  ) => Promise<ChapterVersion>;
  restoreVersion: (versionId: string) => Promise<Chapter | null>;
  deleteVersion: (versionId: string) => Promise<boolean>;
  compareVersions: (versionId1: string, versionId2: string) => Promise<VersionCompareResult | null>;

  createBranch: (
    chapterId: string,
    name: string,
    description: string,
    parentVersionId: string,
  ) => Promise<Branch>;
  switchBranch: (branchId: string) => boolean;
  mergeBranch: (sourceBranchId: string, targetBranchId: string) => boolean;
  deleteBranch: (branchId: string) => Promise<boolean>;

  getFilteredVersions: (filter: VersionFilter, sortOrder: SortOrder) => ChapterVersion[];
  searchVersions: (query: string) => ChapterVersion[];

  getVersionHistory: (chapterId: string) => Promise<ChapterVersion[]>;
  exportVersionHistory: (chapterId: string, format: 'json' | 'csv') => Promise<string>;
}

export const useVersioningStore = create<VersioningState>((set, get) => ({
  // Initial State
  versions: [],
  branches: [],
  currentBranch: null,
  isLoading: false,
  error: null,

  // Actions
  loadVersionHistory: async (chapterId: string): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      const history = await versioningService.getVersionHistory(chapterId);
      set({ versions: history, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load version history',
        isLoading: false,
      });
    }
  },

  loadBranches: async (chapterId: string): Promise<void> => {
    try {
      const branchList = await versioningService.getBranches(chapterId);
      const active = branchList.find(b => b.isActive) ?? branchList[0] ?? null;
      set({ branches: branchList, currentBranch: active });
    } catch (err) {
      logger.error('Failed to load branches', {
        component: 'VersioningStore',
        error: err,
        chapterId,
      });
    }
  },

  saveVersion: async (
    chapter: Chapter,
    message?: string,
    type: ChapterVersion['type'] = 'manual',
  ): Promise<ChapterVersion> => {
    set({ isLoading: true, error: null });
    try {
      const version = await versioningService.saveVersion(chapter, message, type);
      set(state => ({
        versions: [version, ...state.versions],
        isLoading: false,
      }));
      return version;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save version';
      set({ error: errorMsg, isLoading: false });
      throw new Error(errorMsg);
    }
  },

  restoreVersion: async (versionId: string): Promise<Chapter | null> => {
    set({ isLoading: true, error: null });
    try {
      const chapter = await versioningService.restoreVersion(versionId);
      set({ isLoading: false });
      return chapter;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to restore version',
        isLoading: false,
      });
      return null;
    }
  },

  deleteVersion: async (versionId: string): Promise<boolean> => {
    try {
      const success = await versioningService.deleteVersion(versionId);
      if (success) {
        set(state => ({
          versions: state.versions.filter(v => v.id !== versionId),
        }));
      }
      return success;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to delete version' });
      return false;
    }
  },

  compareVersions: async (
    versionId1: string,
    versionId2: string,
  ): Promise<VersionCompareResult | null> => {
    try {
      return await versioningService.compareVersions(versionId1, versionId2);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to compare versions' });
      return null;
    }
  },

  createBranch: async (
    chapterId: string,
    name: string,
    description: string,
    parentVersionId: string,
  ): Promise<Branch> => {
    try {
      const branch = await versioningService.createBranch(
        chapterId,
        name,
        description,
        parentVersionId,
      );
      set(state => ({ branches: [...state.branches, branch] }));
      return branch;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create branch';
      set({ error: errorMsg });
      throw new Error(errorMsg);
    }
  },

  switchBranch: (branchId: string): boolean => {
    try {
      const success = versioningService.switchBranch(branchId);
      if (success) {
        set(state => {
          const updatedBranches = state.branches.map(b => ({ ...b, isActive: b.id === branchId }));
          const newBranch = updatedBranches.find(b => b.id === branchId) ?? null;
          return { branches: updatedBranches, currentBranch: newBranch };
        });
      }
      return success;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to switch branch' });
      return false;
    }
  },

  mergeBranch: (sourceBranchId: string, targetBranchId: string): boolean => {
    try {
      return versioningService.mergeBranch(sourceBranchId, targetBranchId);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to merge branch' });
      return false;
    }
  },

  deleteBranch: async (branchId: string): Promise<boolean> => {
    try {
      const success = await versioningService.deleteBranch(branchId);
      if (success) {
        set(state => ({
          branches: state.branches.filter(b => b.id !== branchId),
        }));
      }
      return success;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to delete branch' });
      return false;
    }
  },

  getFilteredVersions: (filter: VersionFilter, sortOrder: SortOrder): ChapterVersion[] => {
    const { versions } = get();
    const filtered = filter === 'all' ? versions : versions.filter(v => v.type === filter);

    return filtered.sort((a, b) => {
      switch (sortOrder) {
        case 'newest':
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        case 'oldest':
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        case 'author':
          return a.authorName.localeCompare(b.authorName);
        case 'wordCount':
          return b.wordCount - a.wordCount;
        default:
          return 0;
      }
    });
  },

  searchVersions: (query: string): ChapterVersion[] => {
    const { versions } = get();
    const lowercaseQuery = query.toLowerCase();
    return versions.filter(
      version =>
        version.message.toLowerCase().includes(lowercaseQuery) ||
        version.authorName.toLowerCase().includes(lowercaseQuery) ||
        version.content.toLowerCase().includes(lowercaseQuery) ||
        version.title.toLowerCase().includes(lowercaseQuery),
    );
  },

  getVersionHistory: async (chapterId: string): Promise<ChapterVersion[]> => {
    return await versioningService.getVersionHistory(chapterId);
  },

  exportVersionHistory: async (chapterId: string, format: 'json' | 'csv'): Promise<string> => {
    return await versioningService.exportVersionHistory(chapterId, format);
  },
}));
