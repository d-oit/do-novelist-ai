import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useGoapEngine } from '@/features/editor/hooks/useGoapEngine';
import * as ai from '@/lib/ai';
import type { Project, RefineOptions } from '@/types';
import { PublishStatus, ChapterStatus } from '@/types';

import { createChapter } from '@shared/utils';

vi.mock('../../../../lib/ai');
vi.mock('../../../../lib/logging/logger');

const mockProject: Project = {
  id: 'p1',
  title: 'Test Project',
  idea: 'Test Idea',
  style: 'Science Fiction',
  coverImage: '',
  worldState: {
    hasOutline: false,
    hasTitle: true,
    chaptersCount: 0,
    chaptersCompleted: 0,
    styleDefined: true,
    isPublished: false,
    hasCharacters: false,
    hasWorldBuilding: false,
    hasThemes: false,
    plotStructureDefined: false,
    targetAudienceDefined: false,
  },
  isGenerating: false,
  status: PublishStatus.DRAFT,
  language: 'en',
  targetWordCount: 50000,
  settings: {
    enableDropCaps: true,
    autoSave: true,
    autoSaveInterval: 30000,
    showWordCount: true,
    enableSpellCheck: true,
    darkMode: true,
    fontSize: 'medium',
    lineHeight: 'relaxed',
    editorTheme: 'default',
  },
  chapters: [],
  genre: ['Sci-Fi'],
  targetAudience: 'adult',
  contentWarnings: [],
  keywords: [],
  synopsis: '',
  createdAt: new Date(),
  updatedAt: new Date(),
  authors: [],
  analytics: {
    totalWordCount: 0,
    averageChapterLength: 0,
    estimatedReadingTime: 0,
    generationCost: 0,
    editingRounds: 0,
  },
  version: '1.0.0',
  changeLog: [],
  timeline: {
    id: 'test-timeline',
    projectId: 'p1',
    events: [],
    eras: [],
    settings: {
      viewMode: 'chronological',
      zoomLevel: 1,
      showCharacters: true,
      showImplicitEvents: false,
    },
  },
};

describe('useGoapEngine Hook - Integration Tests', () => {
  let project: Project;
  let setProject: any;
  let setSelectedChapterId: any;

  beforeEach(() => {
    vi.clearAllMocks();
    project = { ...mockProject };
    setProject = vi.fn(update => {
      if (typeof update === 'function') {
        project = update(project);
      } else {
        project = update;
      }
    });
    setSelectedChapterId = vi.fn();
  });

  describe('handleRefineChapter', () => {
    it('should refine chapter content successfully', async () => {
      project.chapters = [
        createChapter({
          id: 'c1',
          orderIndex: 1,
          title: 'Ch 1',
          summary: 'Sum 1',
          content: 'Original content',
          status: ChapterStatus.COMPLETE as ChapterStatus,
        }),
      ];

      const { result } = renderHook(() => useGoapEngine(project, setProject, setSelectedChapterId));

      vi.mocked(ai.refineChapterContent).mockResolvedValue('Refined content');

      const refineOptions: RefineOptions = {
        model: 'gemini-1.5-pro',
        temperature: 0.7,
        maxTokens: 1000,
        topP: 0.9,
        focusAreas: ['dialogue'],
        preserveLength: true,
        targetTone: 'dramatic',
      };

      await act(async () => {
        await result.current.handleRefineChapter('c1', refineOptions);
      });

      expect(ai.refineChapterContent).toHaveBeenCalledWith('Original content', 'Sum 1', project.style, refineOptions);
      expect(project.chapters[0]?.content).toBe('Refined content');
      expect(result.current.logs).toEqual(
        expect.arrayContaining([expect.objectContaining({ agentName: 'Editor', message: 'Refinement complete.' })]),
      );
    });

    it('should refine chapter with provided currentContent', async () => {
      project.chapters = [
        createChapter({
          id: 'c1',
          orderIndex: 1,
          title: 'Ch 1',
          summary: 'Sum 1',
          content: 'Stored content',
          status: ChapterStatus.COMPLETE as ChapterStatus,
        }),
      ];

      const { result } = renderHook(() => useGoapEngine(project, setProject, setSelectedChapterId));

      vi.mocked(ai.refineChapterContent).mockResolvedValue('Refined');

      const refineOptions: RefineOptions = {
        model: 'gemini-1.5-flash',
        temperature: 0.5,
        maxTokens: 500,
        topP: 0.8,
        focusAreas: ['style'],
        preserveLength: false,
      };

      await act(async () => {
        await result.current.handleRefineChapter('c1', refineOptions, 'Custom current content');
      });

      expect(ai.refineChapterContent).toHaveBeenCalledWith(
        'Custom current content',
        'Sum 1',
        project.style,
        refineOptions,
      );
    });

    it('should return early if project is generating', async () => {
      project.isGenerating = true;
      project.chapters = [
        createChapter({
          id: 'c1',
          orderIndex: 1,
          title: 'Ch 1',
          summary: 'Sum 1',
          content: 'Content',
          status: ChapterStatus.COMPLETE as ChapterStatus,
        }),
      ];

      const { result } = renderHook(() => useGoapEngine(project, setProject, setSelectedChapterId));

      const refineOptions: RefineOptions = {
        model: 'gemini-1.5-pro',
        temperature: 0.7,
        maxTokens: 1000,
        topP: 0.9,
        focusAreas: ['dialogue'],
        preserveLength: true,
      };

      await act(async () => {
        await result.current.handleRefineChapter('c1', refineOptions);
      });

      expect(ai.refineChapterContent).not.toHaveBeenCalled();
    });

    it('should return early if chapter not found', async () => {
      const { result } = renderHook(() => useGoapEngine(project, setProject, setSelectedChapterId));

      const refineOptions: RefineOptions = {
        model: 'gemini-1.5-pro',
        temperature: 0.7,
        maxTokens: 1000,
        topP: 0.9,
        focusAreas: ['dialogue'],
        preserveLength: true,
      };

      await act(async () => {
        await result.current.handleRefineChapter('nonexistent', refineOptions);
      });

      expect(ai.refineChapterContent).not.toHaveBeenCalled();
    });

    it('should handle refinement errors gracefully', async () => {
      project.chapters = [
        createChapter({
          id: 'c1',
          orderIndex: 1,
          title: 'Ch 1',
          summary: 'Sum 1',
          content: 'Content',
          status: ChapterStatus.COMPLETE as ChapterStatus,
        }),
      ];

      const { result } = renderHook(() => useGoapEngine(project, setProject, setSelectedChapterId));

      vi.mocked(ai.refineChapterContent).mockRejectedValue(new Error('Refinement failed'));

      const refineOptions: RefineOptions = {
        model: 'gemini-1.5-pro',
        temperature: 0.7,
        maxTokens: 1000,
        topP: 0.9,
        focusAreas: ['dialogue'],
        preserveLength: true,
      };

      await act(async () => {
        await result.current.handleRefineChapter('c1', refineOptions);
      });

      expect(result.current.logs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            agentName: 'Editor',
            type: 'error',
            message: expect.stringContaining('Refinement failed'),
          }),
        ]),
      );
      expect(project.isGenerating).toBe(false);
    });
  });

  describe('handleContinueChapter', () => {
    it('should continue chapter successfully with existing content', async () => {
      project.chapters = [
        createChapter({
          id: 'c1',
          orderIndex: 1,
          title: 'Ch 1',
          summary: 'Sum 1',
          content: 'Existing',
          status: ChapterStatus.COMPLETE as ChapterStatus,
        }),
      ];

      const { result } = renderHook(() => useGoapEngine(project, setProject, setSelectedChapterId));

      vi.mocked(ai.continueWriting).mockResolvedValue('More content');

      await act(async () => {
        await result.current.handleContinueChapter('c1');
      });

      expect(ai.continueWriting).toHaveBeenCalledWith('Existing', 'Sum 1', project.style);
      expect(project.chapters[0]?.content).toBe('Existing\n\nMore content');
      expect(project.chapters[0]?.status).toBe(ChapterStatus.DRAFTING);
      expect(result.current.logs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            agentName: 'Writer',
            message: expect.stringContaining('Added 12 chars'),
          }),
        ]),
      );
    });

    it('should continue chapter with empty content', async () => {
      project.chapters = [
        createChapter({
          id: 'c1',
          orderIndex: 1,
          title: 'Ch 1',
          summary: 'Sum 1',
          content: '',
          status: ChapterStatus.PENDING as ChapterStatus,
        }),
      ];

      const { result } = renderHook(() => useGoapEngine(project, setProject, setSelectedChapterId));

      vi.mocked(ai.continueWriting).mockResolvedValue('New content');

      await act(async () => {
        await result.current.handleContinueChapter('c1');
      });

      expect(project.chapters[0]?.content).toBe('New content');
    });

    it('should return early if project is generating', async () => {
      project.isGenerating = true;
      project.chapters = [
        createChapter({
          id: 'c1',
          orderIndex: 1,
          title: 'Ch 1',
          summary: 'Sum 1',
          content: 'Content',
          status: ChapterStatus.COMPLETE as ChapterStatus,
        }),
      ];

      const { result } = renderHook(() => useGoapEngine(project, setProject, setSelectedChapterId));

      await act(async () => {
        await result.current.handleContinueChapter('c1');
      });

      expect(ai.continueWriting).not.toHaveBeenCalled();
    });

    it('should return early if chapter not found', async () => {
      const { result } = renderHook(() => useGoapEngine(project, setProject, setSelectedChapterId));

      await act(async () => {
        await result.current.handleContinueChapter('nonexistent');
      });

      expect(ai.continueWriting).not.toHaveBeenCalled();
    });

    it('should handle continue writing errors gracefully', async () => {
      project.chapters = [
        createChapter({
          id: 'c1',
          orderIndex: 1,
          title: 'Ch 1',
          summary: 'Sum 1',
          content: 'Content',
          status: ChapterStatus.COMPLETE as ChapterStatus,
        }),
      ];

      const { result } = renderHook(() => useGoapEngine(project, setProject, setSelectedChapterId));

      vi.mocked(ai.continueWriting).mockRejectedValue(new Error('Write failed'));

      await act(async () => {
        await result.current.handleContinueChapter('c1');
      });

      expect(result.current.logs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            agentName: 'Writer',
            type: 'error',
            message: expect.stringContaining('Failed to continue chapter'),
          }),
        ]),
      );
      expect(project.isGenerating).toBe(false);
    });
  });
});
