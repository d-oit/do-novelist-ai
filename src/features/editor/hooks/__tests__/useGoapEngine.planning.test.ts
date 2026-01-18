import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useGoapEngine } from '@/features/editor/hooks/useGoapEngine';
import * as ai from '@/lib/ai';
import type { Project } from '@/types';
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

describe('useGoapEngine Hook - Planning Logic', () => {
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

  describe('Action Execution - write_chapter_parallel', () => {
    it('should execute write_chapter_parallel action successfully', async () => {
      project.worldState.hasOutline = true;
      project.worldState.chaptersCount = 2;
      project.worldState.chaptersCompleted = 0;
      project.chapters = [
        createChapter({
          id: 'c1',
          orderIndex: 1,
          title: 'Ch 1',
          summary: 'Sum 1',
          status: ChapterStatus.PENDING as ChapterStatus,
        }),
        createChapter({
          id: 'c2',
          orderIndex: 2,
          title: 'Ch 2',
          summary: 'Sum 2',
          status: ChapterStatus.PENDING as ChapterStatus,
        }),
      ];

      const { result } = renderHook(() => useGoapEngine(project, setProject, setSelectedChapterId));

      vi.mocked(ai.writeChapterContent).mockResolvedValue('# Content');

      const action = result.current.availableActions.find(a => a.name === 'write_chapter_parallel');
      if (!action) throw new Error('Action not found');

      await act(async () => {
        await result.current.executeAction(action);
      });

      expect(ai.writeChapterContent).toHaveBeenCalledTimes(2);
      expect(project.chapters[0]?.status).toBe(ChapterStatus.COMPLETE);
      expect(project.chapters[0]?.content).toBe('# Content');
      expect(project.worldState.chaptersCompleted).toBe(2);
    });

    it('should handle no pending chapters gracefully', async () => {
      project.worldState.hasOutline = true;
      project.worldState.chaptersCount = 1;
      project.worldState.chaptersCompleted = 1;
      project.chapters = [
        createChapter({
          id: 'c1',
          orderIndex: 1,
          title: 'Ch 1',
          summary: 'Sum 1',
          status: ChapterStatus.COMPLETE as ChapterStatus,
        }),
      ];

      const { result } = renderHook(() => useGoapEngine(project, setProject, setSelectedChapterId));

      const action = result.current.availableActions.find(a => a.name === 'write_chapter_parallel');
      if (!action) throw new Error('Action not found');

      await act(async () => {
        await result.current.executeAction(action);
      });

      expect(ai.writeChapterContent).not.toHaveBeenCalled();
      expect(result.current.logs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            agentName: 'Planner',
            message: 'No pending chapters found.',
            type: 'warning',
          }),
        ]),
      );
    });

    it('should handle partial failures in parallel chapter writing', async () => {
      project.worldState.hasOutline = true;
      project.worldState.chaptersCount = 2;
      project.worldState.chaptersCompleted = 0;
      project.chapters = [
        createChapter({
          id: 'c1',
          orderIndex: 1,
          title: 'Ch 1',
          summary: 'Sum 1',
          status: ChapterStatus.PENDING as ChapterStatus,
        }),
        createChapter({
          id: 'c2',
          orderIndex: 2,
          title: 'Ch 2',
          summary: 'Sum 2',
          status: ChapterStatus.PENDING as ChapterStatus,
        }),
      ];

      const { result } = renderHook(() => useGoapEngine(project, setProject, setSelectedChapterId));

      vi.mocked(ai.writeChapterContent)
        .mockResolvedValueOnce('# Success content')
        .mockRejectedValueOnce(new Error('Failed to write'));

      const action = result.current.availableActions.find(a => a.name === 'write_chapter_parallel');
      if (!action) throw new Error('Action not found');

      await act(async () => {
        await result.current.executeAction(action);
      });

      expect(project.chapters[0]?.status).toBe(ChapterStatus.COMPLETE);
      expect(project.chapters[1]?.status).toBe(ChapterStatus.PENDING);
      expect(project.worldState.chaptersCompleted).toBe(1);
    });
  });

  describe('Action Execution - editor_review', () => {
    it('should execute editor_review action successfully', async () => {
      project.worldState.hasOutline = true;
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

      vi.mocked(ai.analyzeConsistency).mockResolvedValue('No issues found');

      const action = result.current.availableActions.find(a => a.name === 'editor_review');
      if (!action) throw new Error('Action not found');

      await act(async () => {
        await result.current.executeAction(action);
      });

      expect(ai.analyzeConsistency).toHaveBeenCalledWith(project.chapters, project.style);
      expect(result.current.logs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            agentName: 'Editor',
            message: expect.stringContaining('Review Complete'),
            type: 'success',
          }),
        ]),
      );
    });
  });

  describe('Action Execution - Error Handling', () => {
    it('should handle action execution errors gracefully', async () => {
      const { result } = renderHook(() => useGoapEngine(project, setProject, setSelectedChapterId));

      vi.mocked(ai.generateOutline).mockRejectedValue(new Error('AI service unavailable'));

      const action = result.current.availableActions.find(a => a.name === 'create_outline');

      await act(async () => {
        await result.current.executeAction(action!);
      });

      expect(result.current.logs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            agentName: 'System',
            type: 'error',
            message: expect.stringContaining('Action Failed'),
          }),
        ]),
      );
      expect(project.isGenerating).toBe(false);
      expect(result.current.currentAction).toBeNull();
    });

    it('should return early if project is already generating', async () => {
      project.isGenerating = true;
      const { result } = renderHook(() => useGoapEngine(project, setProject, setSelectedChapterId));

      const action = result.current.availableActions.find(a => a.name === 'create_outline');

      await act(async () => {
        await result.current.executeAction(action!);
      });

      expect(ai.generateOutline).not.toHaveBeenCalled();
    });

    it('should reset currentAction after execution completes', async () => {
      const { result } = renderHook(() => useGoapEngine(project, setProject, setSelectedChapterId));

      vi.mocked(ai.generateOutline).mockResolvedValue({
        title: 'Test',
        chapters: [],
      });

      const action = result.current.availableActions.find(a => a.name === 'create_outline');

      await act(async () => {
        await result.current.executeAction(action!);
      });

      expect(result.current.currentAction).toBeNull();
    });

    it('should reset isGenerating after execution completes', async () => {
      const { result } = renderHook(() => useGoapEngine(project, setProject, setSelectedChapterId));

      vi.mocked(ai.generateOutline).mockResolvedValue({
        title: 'Test',
        chapters: [],
      });

      const action = result.current.availableActions.find(a => a.name === 'create_outline');

      await act(async () => {
        await result.current.executeAction(action!);
      });

      expect(project.isGenerating).toBe(false);
    });
  });
});
