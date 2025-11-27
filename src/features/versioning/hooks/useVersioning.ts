import { useEffect } from 'react';
import { useVersioningStore } from '../../../lib/stores/versioningStore';
import { ChapterVersion, Branch, VersionCompareResult, VersionFilter, SortOrder } from '../types';
import { Chapter } from '../../../types';

export interface UseVersioningReturn {
  // State
  versions: ChapterVersion[];
  branches: Branch[];
  currentBranch: Branch | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  saveVersion: (chapter: Chapter, message?: string, type?: ChapterVersion['type']) => Promise<ChapterVersion>;
  restoreVersion: (versionId: string) => Promise<Chapter | null>;
  deleteVersion: (versionId: string) => Promise<boolean>;
  compareVersions: (versionId1: string, versionId2: string) => Promise<VersionCompareResult | null>;

  // Branch management
  createBranch: (name: string, description: string, parentVersionId: string) => Promise<Branch>;
  switchBranch: (branchId: string) => Promise<boolean>;
  mergeBranch: (sourceBranchId: string, targetBranchId: string) => Promise<boolean>;
  deleteBranch: (branchId: string) => Promise<boolean>;

  // Filtering & sorting
  getFilteredVersions: (filter: VersionFilter, sortOrder: SortOrder) => ChapterVersion[];
  searchVersions: (query: string) => ChapterVersion[];

  // Utilities
  getVersionHistory: (chapterId: string) => Promise<ChapterVersion[]>;
  exportVersionHistory: (chapterId: string, format: 'json' | 'csv') => Promise<string>;
}

export const useVersioning = (chapterId?: string): UseVersioningReturn => {
  const store = useVersioningStore();

  // Extract stable function references to avoid dependency array issues
  const loadVersionHistory = store.loadVersionHistory;
  const loadBranches = store.loadBranches;

  // Load initial data with cleanup
  useEffect(() => {
    const controller = new AbortController();

    if (chapterId) {
      Promise.all([
        loadVersionHistory(chapterId),
        loadBranches(chapterId)
      ]).catch(err => {
        if (err.name === 'AbortError') return;
        console.error('Failed to load versioning data:', err);
      });
    }

    return () => {
      controller.abort();
    };
  }, [chapterId, loadVersionHistory, loadBranches]);

  return {
    versions: store.versions,
    branches: store.branches,
    currentBranch: store.currentBranch,
    isLoading: store.isLoading,
    error: store.error,
    saveVersion: store.saveVersion,
    restoreVersion: store.restoreVersion,
    deleteVersion: store.deleteVersion,
    compareVersions: store.compareVersions,
    createBranch: store.createBranch,
    switchBranch: store.switchBranch,
    mergeBranch: store.mergeBranch,
    deleteBranch: store.deleteBranch,
    getFilteredVersions: store.getFilteredVersions,
    searchVersions: store.searchVersions,
    getVersionHistory: store.getVersionHistory,
    exportVersionHistory: store.exportVersionHistory,
  };
};