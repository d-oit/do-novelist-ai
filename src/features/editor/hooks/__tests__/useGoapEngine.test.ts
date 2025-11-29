
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGoapEngine } from '../useGoapEngine';
import { Project, PublishStatus, ChapterStatus } from '../../../../types';
import * as ai from '../../../../lib/ai';
import { createChapter } from '../../../../shared/utils';

// Mock AI functions
vi.mock('../../../../lib/ai');

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
    targetAudienceDefined: false
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
    editorTheme: 'default'
  },
  chapters: [],
  // Additional properties to satisfy Project interface
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
    editingRounds: 0
  },
  version: '1.0.0',
  changeLog: []
};

describe('useGoapEngine Hook', () => {
  let project: Project;
  let setProject: any;
  let setSelectedChapterId: any;

  beforeEach(() => {
    vi.clearAllMocks();
    project = { ...mockProject };
    setProject = vi.fn((update) => {
      if (typeof update === 'function') {
        project = update(project);
      } else {
        project = update;
      }
    });
    setSelectedChapterId = vi.fn();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useGoapEngine(project, setProject, setSelectedChapterId));

    expect(result.current.logs).toEqual([]);
    expect(result.current.availableActions).toHaveLength(7);
    expect(result.current.currentAction).toBeNull();
    expect(result.current.autoPilot).toBe(false);
  });

  describe('Action Availability', () => {
    it('should correctly determine available actions based on preconditions', () => {
      const { result } = renderHook(() => useGoapEngine(project, setProject, setSelectedChapterId));

      // Initially, hasOutline is false, so create_outline should be available
      const createOutline = result.current.availableActions.find(a => a.name === 'create_outline');
      expect(result.current.isActionAvailable(createOutline!)).toBe(true);

      // write_chapter_parallel requires hasOutline: true
      const writeChapter = result.current.availableActions.find(a => a.name === 'write_chapter_parallel');
      expect(result.current.isActionAvailable(writeChapter!)).toBe(false);
    });

    it('should handle specialized logic for write_chapter_parallel', () => {
      // Set state where outline exists but no chapters
      project.worldState.hasOutline = true;
      project.worldState.chaptersCount = 0;

      const { result } = renderHook(() => useGoapEngine(project, setProject, setSelectedChapterId));
      const writeChapter = result.current.availableActions.find(a => a.name === 'write_chapter_parallel');

      // Should be false because chaptersCount is 0
      expect(result.current.isActionAvailable(writeChapter!)).toBe(false);
    });
  });

  describe('Action Execution', () => {
    it('should execute create_outline action', async () => {
      const { result } = renderHook(() => useGoapEngine(project, setProject, setSelectedChapterId));

      const mockOutline = {
        title: 'Generated Title',
        chapters: [{ orderIndex: 1, title: 'Ch 1', summary: 'Sum 1' }]
      };
      vi.mocked(ai.generateOutline).mockResolvedValue(mockOutline);

      const action = result.current.availableActions.find(a => a.name === 'create_outline')!;

      await act(async () => {
        await result.current.executeAction(action);
      });

      expect(ai.generateOutline).toHaveBeenCalledWith(project.idea, project.style);
      expect(setProject).toHaveBeenCalled();
      expect(project.title).toBe('Generated Title');
      expect(project.chapters).toHaveLength(1);
      expect(project.worldState.hasOutline).toBe(true);
      expect(result.current.logs).toEqual(expect.arrayContaining([
        expect.objectContaining({ agentName: 'Architect', type: 'success' })
      ]));
    });

    it('should execute write_chapter_parallel action', async () => {
      // Setup project with pending chapters
      project.worldState.hasOutline = true;
      project.chapters = [
        createChapter({
          id: 'c1',
          orderIndex: 1,
          title: 'Ch 1',
          summary: 'Sum 1',
          status: ChapterStatus.PENDING as ChapterStatus
        }),
        createChapter({
          id: 'c2',
          orderIndex: 2,
          title: 'Ch 2',
          summary: 'Sum 2',
          status: ChapterStatus.PENDING as ChapterStatus
        })
      ];
      project.worldState.chaptersCount = 2;

      const { result } = renderHook(() => useGoapEngine(project, setProject, setSelectedChapterId));

      vi.mocked(ai.writeChapterContent).mockResolvedValue('# Content');

      const action = result.current.availableActions.find(a => a.name === 'write_chapter_parallel')!;

      await act(async () => {
        await result.current.executeAction(action);
      });

      expect(ai.writeChapterContent).toHaveBeenCalledTimes(2);
      expect(project.chapters[0]?.status).toBe(ChapterStatus.COMPLETE);
      expect(project.chapters[0]?.content).toBe('# Content');
      expect(project.worldState.chaptersCompleted).toBe(2);
    });
  });

  describe('Auto-Pilot', () => {
    it('should toggle autopilot state', () => {
      const { result } = renderHook(() => useGoapEngine(project, setProject, setSelectedChapterId));

      // Verify autopilot starts as false
      expect(result.current.autoPilot).toBe(false);

      // Enable autopilot
      act(() => {
        result.current.setAutoPilot(true);
      });

      // Verify autopilot is now enabled
      expect(result.current.autoPilot).toBe(true);

      // Disable autopilot
      act(() => {
        result.current.setAutoPilot(false);
      });

      // Verify autopilot is now disabled
      expect(result.current.autoPilot).toBe(false);
    });
  });
});
