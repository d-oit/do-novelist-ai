import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useVersioning } from './useVersioning';
import { versioningService } from '../services/versioningService';
import { Chapter, ChapterStatus } from '../../../types';

// Mock the versioning service
vi.mock('../services/versioningService');
const mockVersioningService = vi.mocked(versioningService);

const mockChapter: Chapter = {
  id: 'test-chapter',
  title: 'Test Chapter',
  summary: 'A test chapter',
  content: 'This is test content.',
  status: ChapterStatus.DRAFTING,
  orderIndex: 1,
};

const mockVersion = {
  id: 'version-1',
  chapterId: 'test-chapter',
  title: 'Test Chapter',
  summary: 'A test chapter',
  content: 'This is test content.',
  status: ChapterStatus.DRAFTING,
  timestamp: new Date('2024-01-01T10:00:00Z'),
  authorName: 'Test Author',
  message: 'Initial version',
  type: 'manual' as const,
  contentHash: 'hash1',
  wordCount: 4,
  charCount: 20,
};

describe('useVersioning', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVersioningService.getVersionHistory.mockResolvedValue([mockVersion]);
    mockVersioningService.getBranches.mockResolvedValue([]);
  });

  it('loads version history on mount when chapterId is provided', async () => {
    renderHook(() => useVersioning('test-chapter'));

    await waitFor(() => {
      expect(mockVersioningService.getVersionHistory).toHaveBeenCalledWith('test-chapter');
    });
  });

  it('does not load version history when chapterId is not provided', () => {
    renderHook(() => useVersioning());

    expect(mockVersioningService.getVersionHistory).not.toHaveBeenCalled();
  });

  it('saves a version successfully', async () => {
    mockVersioningService.saveVersion.mockResolvedValue(mockVersion);

    const { result } = renderHook(() => useVersioning('test-chapter'));

    await act(async () => {
      const savedVersion = await result.current.saveVersion(mockChapter, 'Test save', 'manual');
      expect(savedVersion).toEqual(mockVersion);
    });

    expect(mockVersioningService.saveVersion).toHaveBeenCalledWith(
      mockChapter,
      'Test save',
      'manual'
    );
  });

  it('restores a version successfully', async () => {
    mockVersioningService.restoreVersion.mockResolvedValue(mockChapter);

    const { result } = renderHook(() => useVersioning('test-chapter'));

    await act(async () => {
      const restoredChapter = await result.current.restoreVersion('version-1');
      expect(restoredChapter).toEqual(mockChapter);
    });

    expect(mockVersioningService.restoreVersion).toHaveBeenCalledWith('version-1');
  });

  it('deletes a version successfully', async () => {
    mockVersioningService.deleteVersion.mockResolvedValue(true);
    mockVersioningService.getVersionHistory.mockResolvedValue([mockVersion]);

    const { result } = renderHook(() => useVersioning('test-chapter'));

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.versions).toHaveLength(1);
    });

    await act(async () => {
      const success = await result.current.deleteVersion('version-1');
      expect(success).toBe(true);
    });

    expect(mockVersioningService.deleteVersion).toHaveBeenCalledWith('version-1');
    
    // Version should be removed from local state
    expect(result.current.versions).toHaveLength(0);
  });

  it('compares versions successfully', async () => {
    const mockComparison = {
      diffs: [],
      wordCountChange: 5,
      charCountChange: 10,
      additionsCount: 1,
      deletionsCount: 0,
      modificationsCount: 0,
    };
    
    mockVersioningService.compareVersions.mockResolvedValue(mockComparison);

    const { result } = renderHook(() => useVersioning('test-chapter'));

    await act(async () => {
      const comparison = await result.current.compareVersions('version-1', 'version-2');
      expect(comparison).toEqual(mockComparison);
    });

    expect(mockVersioningService.compareVersions).toHaveBeenCalledWith('version-1', 'version-2');
  });

  it('filters versions by type and sorts them', async () => {
    const versions = [
      { ...mockVersion, id: 'v1', type: 'manual' as const, timestamp: new Date('2024-01-01') },
      { ...mockVersion, id: 'v2', type: 'auto' as const, timestamp: new Date('2024-01-02') },
      { ...mockVersion, id: 'v3', type: 'manual' as const, timestamp: new Date('2024-01-03') },
    ];
    
    mockVersioningService.getVersionHistory.mockResolvedValue(versions);

    const { result } = renderHook(() => useVersioning('test-chapter'));

    await waitFor(() => {
      expect(result.current.versions).toHaveLength(3);
    });

    // Filter by manual versions
    const manualVersions = result.current.getFilteredVersions('manual', 'newest');
    expect(manualVersions).toHaveLength(2);
    expect(manualVersions[0].id).toBe('v3'); // newest first
    expect(manualVersions[1].id).toBe('v1');

    // Filter by auto versions
    const autoVersions = result.current.getFilteredVersions('auto', 'newest');
    expect(autoVersions).toHaveLength(1);
    expect(autoVersions[0].id).toBe('v2');
  });

  it('searches versions by query', async () => {
    const versions = [
      { ...mockVersion, id: 'v1', message: 'Initial setup', content: 'Setup content' },
      { ...mockVersion, id: 'v2', message: 'Bug fix', content: 'Fixed the issue' },
      { ...mockVersion, id: 'v3', message: 'Feature update', content: 'Added new feature' },
    ];
    
    mockVersioningService.getVersionHistory.mockResolvedValue(versions);

    const { result } = renderHook(() => useVersioning('test-chapter'));

    await waitFor(() => {
      expect(result.current.versions).toHaveLength(3);
    });

    const searchResults = result.current.searchVersions('setup');
    expect(searchResults).toHaveLength(1);
    expect(searchResults[0].id).toBe('v1');
  });

  it('handles errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockVersioningService.getVersionHistory.mockRejectedValue(new Error('Database error'));

    const { result } = renderHook(() => useVersioning('test-chapter'));

    await waitFor(() => {
      expect(result.current.error).toBe('Database error');
      expect(result.current.isLoading).toBe(false);
    });

    consoleErrorSpy.mockRestore();
  });

  it('exports version history in JSON format', async () => {
    const mockExportData = JSON.stringify([mockVersion], null, 2);
    mockVersioningService.exportVersionHistory.mockResolvedValue(mockExportData);

    const { result } = renderHook(() => useVersioning('test-chapter'));

    await act(async () => {
      const exportData = await result.current.exportVersionHistory('test-chapter', 'json');
      expect(exportData).toBe(mockExportData);
    });

    expect(mockVersioningService.exportVersionHistory).toHaveBeenCalledWith('test-chapter', 'json');
  });

  it('creates a new branch successfully', async () => {
    const mockBranch = {
      id: 'branch-1',
      name: 'feature-branch',
      description: 'A new feature branch',
      parentVersionId: 'version-1',
      createdAt: new Date(),
      isActive: false,
      color: '#3B82F6',
    };
    
    mockVersioningService.createBranch.mockResolvedValue(mockBranch);

    const { result } = renderHook(() => useVersioning('test-chapter'));

    await act(async () => {
      const branch = await result.current.createBranch(
        'feature-branch',
        'A new feature branch',
        'version-1'
      );
      expect(branch).toEqual(mockBranch);
    });

    expect(mockVersioningService.createBranch).toHaveBeenCalledWith(
      'feature-branch',
      'A new feature branch',
      'version-1'
    );
  });
});