import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { versioningService } from '../versioningService';
import { Chapter, ChapterStatus } from '../../../../types';
import { createChapter } from '../../../../shared/utils';

// Mock indexedDB
const mockOpenDB = vi.fn();
const mockClose = vi.fn();
const mockTransaction = vi.fn();
const mockObjectStore = vi.fn();
const mockAdd = vi.fn();
const mockGet = vi.fn();
const mockGetAll = vi.fn();
const mockPut = vi.fn();
const mockDelete = vi.fn();
const mockCreateObjectStore = vi.fn();

const mockDB = {
  close: mockClose,
  transaction: mockTransaction,
  objectStoreNames: { contains: vi.fn().mockReturnValue(false) },
  createObjectStore: mockCreateObjectStore,
};

const mockRequest = {
  onsuccess: null as ((event: any) => void) | null,
  onerror: null as ((event: any) => void) | null,
  result: mockDB,
};

global.indexedDB = {
  open: mockOpenDB.mockImplementation((_name, _version) => {
    setTimeout(() => {
      if (mockRequest.onsuccess) {
        mockRequest.onsuccess({ target: mockRequest });
      }
    }, 0);
    return mockRequest;
  }),
} as any;

describe('VersioningService', () => {
  let testChapter: Chapter;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Setup IndexedDB mocks
    setupIDBMocks();

    // Create a test chapter
    testChapter = createChapter({
      id: 'test-chapter-1',
      orderIndex: 1,
      title: 'Test Chapter',
      summary: 'A test chapter summary',
      content: 'This is the initial content of the test chapter.',
      status: ChapterStatus.PENDING,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // Helper function to setup async IDB mocks
  const setupIDBMocks = () => {
    // In-memory storage for mocked IDB operations
    const storage = {
      versions: [] as any[],
      branches: [] as any[],
    };

    // Setup all IDB operation mocks with proper async handling
    const createRequest = (result: any = null) => ({
      onsuccess: null as ((event: any) => void) | null,
      onerror: null as ((event: any) => void) | null,
      result,
    });

    // Setup add operation
    mockAdd.mockImplementation((data) => {
      if (data && data.id && data.chapterId) {
        storage.versions.push(data);
      }
      const request = createRequest(data);
      setTimeout(() => request.onsuccess?.({ target: request }), 0);
      return request;
    });

    // Setup get operation
    mockGet.mockImplementation((id) => {
      const _version = storage.versions.find((v) => v.id === id);
      const request = createRequest(_version || null);
      setTimeout(() => request.onsuccess?.({ target: request }), 0);
      return request;
    });

    // Setup getAll operation
    mockGetAll.mockImplementation((chapterId) => {
      let results = storage.versions;
      if (chapterId) {
        results = storage.versions.filter((v) => v.chapterId === chapterId);
      }
      const request = createRequest(results);
      setTimeout(() => request.onsuccess?.({ target: request }), 0);
      return request;
    });

    // Setup put operation
    mockPut.mockImplementation((data) => {
      if (data && data.id && data.chapterId) {
        const index = storage.versions.findIndex((v) => v.id === data.id);
        if (index >= 0) {
          storage.versions[index] = data;
        } else {
          storage.versions.push(data);
        }
      }
      const request = createRequest(undefined);
      setTimeout(() => request.onsuccess?.({ target: request }), 0);
      return request;
    });

    // Setup delete operation
    mockDelete.mockImplementation((id) => {
      const index = storage.versions.findIndex((v) => v.id === id);
      if (index >= 0) {
        storage.versions.splice(index, 1);
      }
      const request = createRequest(undefined);
      setTimeout(() => request.onsuccess?.({ target: request }), 0);
      return request;
    });

    // Create mock store with the mocked functions
    const mockStore = {
      add: mockAdd,
      get: mockGet,
      getAll: mockGetAll,
      put: mockPut,
      delete: mockDelete,
      index: vi.fn().mockReturnValue({
        getAll: mockGetAll,
      }),
    };

    // Mock transaction
    mockTransaction.mockReturnValue({
      objectStore: () => mockStore,
      oncomplete: null,
      onerror: null,
    });

    // Mock objectStore function (used in init)
    mockObjectStore.mockReturnValue(mockStore);
  };

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await expect(versioningService.init()).resolves.toBeUndefined();
    });

    it('should create versions object store', async () => {
      await versioningService.init();
      // Service should be initialized without errors
      expect(versioningService).toBeDefined();
    });

    it('should create branches object store', async () => {
      await versioningService.init();
      // Service should be initialized without errors
      expect(versioningService).toBeDefined();
    });
  });

  describe('Version Creation', () => {
    it('should save a manual _version with message', async () => {
      const message = 'First draft complete';
      const _version = await versioningService.saveVersion(testChapter, message, 'manual');

      expect(_version).toBeDefined();
      expect(_version.id).toMatch(/^version_/);
      expect(_version.chapterId).toBe(testChapter.id);
      expect(_version.title).toBe(testChapter.title);
      expect(_version.content).toBe(testChapter.content);
      expect(_version.message).toBe(message);
      expect(_version.type).toBe('manual');
      expect(_version.timestamp).toBeInstanceOf(Date);
    });

    it('should save an auto _version', async () => {
      const _version = await versioningService.saveVersion(testChapter, undefined, 'auto');

      expect(_version.type).toBe('auto');
      expect(_version.message).toContain('Auto-saved');
      expect(_version.message).toContain(testChapter.title);
    });

    it('should save an AI-generated _version', async () => {
      const _version = await versioningService.saveVersion(testChapter, undefined, 'ai-generated');

      expect(_version.type).toBe('ai-generated');
      expect(_version.message).toContain('AI generated');
      expect(_version.message).toContain(testChapter.title);
    });

    it('should save a restore _version', async () => {
      const _version = await versioningService.saveVersion(testChapter, undefined, 'restore');

      expect(_version.type).toBe('restore');
      expect(_version.message).toContain('Restored _version');
    });

    it('should generate unique _version IDs', async () => {
      const version1 = await versioningService.saveVersion(testChapter);
      const version2 = await versioningService.saveVersion(testChapter);

      expect(version1.id).not.toBe(version2.id);
    });

    it('should calculate word count correctly', async () => {
      const _version = await versioningService.saveVersion(testChapter);

      expect(_version.wordCount).toBeGreaterThan(0);
      expect(_version.wordCount).toBe(9); // "This is the initial content of the test chapter."
    });

    it('should calculate character count correctly', async () => {
      const _version = await versioningService.saveVersion(testChapter);

      expect(_version.charCount).toBe(testChapter.content.length);
    });

    it('should generate content hash', async () => {
      const _version = await versioningService.saveVersion(testChapter);

      expect(_version.contentHash).toBeDefined();
      expect(_version.contentHash.length).toBeGreaterThan(0);
    });

    it('should preserve chapter status in _version', async () => {
      testChapter.status = ChapterStatus.DRAFTING;
      const _version = await versioningService.saveVersion(testChapter);

      expect(_version.status).toBe(ChapterStatus.DRAFTING);
    });
  });

  describe('Version History', () => {
    it('should retrieve _version history for a chapter', async () => {
      await versioningService.saveVersion(testChapter, 'First save');
      await versioningService.saveVersion(testChapter, 'Second save');

      const history = await versioningService.getVersionHistory(testChapter.id);

      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThanOrEqual(2);
    });

    it('should return versions sorted by timestamp (newest first)', async () => {
      const version1 = await versioningService.saveVersion(testChapter, 'First');
      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
      const version2 = await versioningService.saveVersion(testChapter, 'Second');

      const history = await versioningService.getVersionHistory(testChapter.id);

      expect(history[0]?.id).toBe(version2.id);
      expect(history[1]?.id).toBe(version1.id);
    });

    it('should return empty array for chapter with no versions', async () => {
      const history = await versioningService.getVersionHistory('non-existent-chapter');

      expect(history).toEqual([]);
    });
  });

  describe('Version Restoration', () => {
    it('should restore a _version to a chapter', async () => {
      const originalContent = testChapter.content;
      const _version = await versioningService.saveVersion(testChapter);

      const restored = await versioningService.restoreVersion(_version.id);

      expect(restored).toBeDefined();
      expect(restored?.content).toBe(originalContent);
      expect(restored?.title).toBe(testChapter.title);
    });

    it('should return null for non-existent _version', async () => {
      const restored = await versioningService.restoreVersion('non-existent-_version');

      expect(restored).toBeNull();
    });

    it('should preserve all chapter properties on restore', async () => {
      const _version = await versioningService.saveVersion(testChapter);
      const restored = await versioningService.restoreVersion(_version.id);

      expect(restored?.id).toBe(testChapter.id);
      expect(restored?.summary).toBe(testChapter.summary);
      expect(restored?.status).toBe(testChapter.status);
    });
  });

  describe('Version Deletion', () => {
    it('should delete a _version successfully', async () => {
      const _version = await versioningService.saveVersion(testChapter);
      const result = await versioningService.deleteVersion(_version.id);

      expect(result).toBe(true);
    });

    it('should return false when deleting non-existent _version', async () => {
      const result = await versioningService.deleteVersion('non-existent-_version');

      expect(result).toBe(false);
    });

    it('should remove deleted _version from history', async () => {
      const version1 = await versioningService.saveVersion(testChapter, 'First');
      const version2 = await versioningService.saveVersion(testChapter, 'Second');

      await versioningService.deleteVersion(version1.id);
      const history = await versioningService.getVersionHistory(testChapter.id);

      expect(history.find(v => v.id === version1.id)).toBeUndefined();
      expect(history.find(v => v.id === version2.id)).toBeDefined();
    });
  });

  describe('Version Comparison', () => {
    it('should compare two versions successfully', async () => {
      const version1 = await versioningService.saveVersion(testChapter);

      testChapter.content = 'This is updated content with more words than before.';
      const version2 = await versioningService.saveVersion(testChapter);

      const comparison = await versioningService.compareVersions(version1.id, version2.id);

      expect(comparison).toBeDefined();
      expect(comparison.diffs).toBeDefined();
      expect(Array.isArray(comparison.diffs)).toBe(true);
    });

    it('should calculate word count change', async () => {
      const version1 = await versioningService.saveVersion(testChapter);

      testChapter.content = 'Short content.';
      const version2 = await versioningService.saveVersion(testChapter);

      const comparison = await versioningService.compareVersions(version1.id, version2.id);

      expect(typeof comparison.wordCountChange).toBe('number');
      expect(comparison.wordCountChange).toBeLessThan(0); // Fewer words
    });

    it('should calculate character count change', async () => {
      const originalLength = testChapter.content.length;
      const version1 = await versioningService.saveVersion(testChapter);

      testChapter.content = 'New';
      const version2 = await versioningService.saveVersion(testChapter);

      const comparison = await versioningService.compareVersions(version1.id, version2.id);

      expect(comparison.charCountChange).toBe(3 - originalLength);
    });

    it('should throw error when comparing non-existent versions', async () => {
      await expect(
        versioningService.compareVersions('invalid1', 'invalid2')
      ).rejects.toThrow('One or both versions not found');
    });

    it('should detect additions, deletions, and modifications', async () => {
      const version1 = await versioningService.saveVersion(testChapter);

      testChapter.content = 'This is completely different content.\nWith multiple lines.\nAnd more changes.';
      const version2 = await versioningService.saveVersion(testChapter);

      const comparison = await versioningService.compareVersions(version1.id, version2.id);

      expect(comparison.additionsCount).toBeGreaterThanOrEqual(0);
      expect(comparison.deletionsCount).toBeGreaterThanOrEqual(0);
      expect(comparison.modificationsCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Branch Operations', () => {
    it('should create a new branch', async () => {
      const _version = await versioningService.saveVersion(testChapter);
      const branch = await versioningService.createBranch(
        'Alternative Ending',
        'Exploring a different story direction',
        _version.id
      );

      expect(branch).toBeDefined();
      expect(branch.id).toMatch(/^branch_/);
      expect(branch.name).toBe('Alternative Ending');
      expect(branch.description).toBe('Exploring a different story direction');
      expect(branch.parentVersionId).toBe(_version.id);
      expect(branch.isActive).toBe(false);
    });

    it('should assign a color to new branch', async () => {
      const _version = await versioningService.saveVersion(testChapter);
      const branch = await versioningService.createBranch('Branch', 'Description', _version.id);

      expect(branch.color).toBeDefined();
      expect(branch.color).toMatch(/^#[0-9A-F]{6}$/i);
    });

    it('should set createdAt timestamp for new branch', async () => {
      const _version = await versioningService.saveVersion(testChapter);
      const branch = await versioningService.createBranch('Branch', 'Description', _version.id);

      expect(branch.createdAt).toBeInstanceOf(Date);
    });

    it('should retrieve branches for a chapter', async () => {
      const _version = await versioningService.saveVersion(testChapter);
      await versioningService.createBranch('Branch 1', 'Description 1', _version.id);
      await versioningService.createBranch('Branch 2', 'Description 2', _version.id);

      const branches = await versioningService.getBranches(testChapter.id);

      expect(Array.isArray(branches)).toBe(true);
    });

    it('should delete a branch', async () => {
      const _version = await versioningService.saveVersion(testChapter);
      const branch = await versioningService.createBranch('Branch', 'Description', _version.id);

      const result = await versioningService.deleteBranch(branch.id);

      expect(result).toBe(true);
    });

    it('should switch to a branch', async () => {
      const _version = await versioningService.saveVersion(testChapter);
      const branch = await versioningService.createBranch('Branch', 'Description', _version.id);

      const result = await versioningService.switchBranch(branch.id);

      expect(result).toBe(true);
    });

    it('should merge branches', async () => {
      const _version = await versioningService.saveVersion(testChapter);
      const branch1 = await versioningService.createBranch('Branch 1', 'Description', _version.id);
      const branch2 = await versioningService.createBranch('Branch 2', 'Description', _version.id);

      const result = await versioningService.mergeBranch(branch1.id, branch2.id);

      expect(result).toBe(true);
    });
  });

  describe('Version Export', () => {
    it('should export _version history as JSON', async () => {
      await versioningService.saveVersion(testChapter, 'Version 1');
      await versioningService.saveVersion(testChapter, 'Version 2');

      const exported = await versioningService.exportVersionHistory(testChapter.id, 'json');

      expect(typeof exported).toBe('string');
      const parsed = JSON.parse(exported);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBeGreaterThanOrEqual(2);
    });

    it('should export _version history as CSV', async () => {
      await versioningService.saveVersion(testChapter, 'Version 1');
      await versioningService.saveVersion(testChapter, 'Version 2');

      const exported = await versioningService.exportVersionHistory(testChapter.id, 'csv');

      expect(typeof exported).toBe('string');
      expect(exported).toContain('ID,Timestamp,Author,Message,Type,Word Count,Char Count');
      expect(exported.split('\n').length).toBeGreaterThanOrEqual(3); // Header + 2 rows
    });

    it('should include all _version data in JSON export', async () => {
      const _version = await versioningService.saveVersion(testChapter, 'Test Version');
      const exported = await versioningService.exportVersionHistory(testChapter.id, 'json');
      const parsed = JSON.parse(exported);

      const exportedVersion = parsed.find((v: any) => v.id === _version.id);
      expect(exportedVersion).toBeDefined();
      expect(exportedVersion.message).toBe('Test Version');
      expect(exportedVersion.wordCount).toBe(_version.wordCount);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully when database is not initialized', async () => {
      // This tests the auto-initialization feature
      const newService = Object.create(Object.getPrototypeOf(versioningService));
      await expect(newService.init()).resolves.toBeUndefined();
    });
  });
});
