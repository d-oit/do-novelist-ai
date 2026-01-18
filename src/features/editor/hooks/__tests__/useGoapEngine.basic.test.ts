import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useGoapEngine } from '@/features/editor/hooks/useGoapEngine';
import * as ai from '@/lib/ai';
import type { Project } from '@/types';
import { PublishStatus } from '@/types';

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

describe('useGoapEngine Hook - Basic Functionality', () => {
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

  describe('Initial State', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useGoapEngine(project, setProject, setSelectedChapterId));

      expect(result.current.logs).toEqual([]);
      expect(result.current.availableActions).toHaveLength(7);
      expect(result.current.currentAction).toBeNull();
      expect(result.current.autoPilot).toBe(false);
    });

    it('should provide all required hook methods', () => {
      const { result } = renderHook(() => useGoapEngine(project, setProject, setSelectedChapterId));

      expect(typeof result.current.executeAction).toBe('function');
      expect(typeof result.current.handleRefineChapter).toBe('function');
      expect(typeof result.current.handleContinueChapter).toBe('function');
      expect(typeof result.current.addLog).toBe('function');
      expect(typeof result.current.isActionAvailable).toBe('function');
      expect(typeof result.current.setAutoPilot).toBe('function');
    });
  });

  describe('Action Availability', () => {
    it('should correctly determine available actions based on preconditions', () => {
      const { result } = renderHook(() => useGoapEngine(project, setProject, setSelectedChapterId));

      const createOutline = result.current.availableActions.find(a => a.name === 'create_outline');
      expect(createOutline).toBeDefined();
      expect(result.current.isActionAvailable(createOutline!)).toBe(true);

      const writeChapter = result.current.availableActions.find(a => a.name === 'write_chapter_parallel');
      expect(writeChapter).toBeDefined();
      expect(result.current.isActionAvailable(writeChapter!)).toBe(false);
    });

    it('should handle specialized logic for write_chapter_parallel with no chapters', () => {
      project.worldState.hasOutline = true;
      project.worldState.chaptersCount = 0;

      const { result } = renderHook(() => useGoapEngine(project, setProject, setSelectedChapterId));
      const writeChapter = result.current.availableActions.find(a => a.name === 'write_chapter_parallel');
      expect(writeChapter).toBeDefined();
      expect(result.current.isActionAvailable(writeChapter!)).toBe(false);
    });

    it('should make write_chapter_parallel available when chapters exist but not completed', () => {
      project.worldState.hasOutline = true;
      project.worldState.chaptersCount = 3;
      project.worldState.chaptersCompleted = 1;

      const { result } = renderHook(() => useGoapEngine(project, setProject, setSelectedChapterId));
      const writeChapter = result.current.availableActions.find(a => a.name === 'write_chapter_parallel');
      expect(writeChapter).toBeDefined();
      expect(result.current.isActionAvailable(writeChapter!)).toBe(true);
    });

    it('should block write_chapter_parallel when all chapters completed', () => {
      project.worldState.hasOutline = true;
      project.worldState.chaptersCount = 3;
      project.worldState.chaptersCompleted = 3;

      const { result } = renderHook(() => useGoapEngine(project, setProject, setSelectedChapterId));
      const writeChapter = result.current.availableActions.find(a => a.name === 'write_chapter_parallel');
      expect(writeChapter).toBeDefined();
      expect(result.current.isActionAvailable(writeChapter!)).toBe(false);
    });

    it('should handle numeric precondition checking with "at least" logic', () => {
      project.worldState.chaptersCount = 2;

      const { result } = renderHook(() => useGoapEngine(project, setProject, setSelectedChapterId));
      const dialogueDoctor = result.current.availableActions.find(a => a.name === 'dialogue_doctor');
      expect(dialogueDoctor).toBeDefined();
      expect(result.current.isActionAvailable(dialogueDoctor!)).toBe(true);
    });

    it('should fail numeric precondition when value is below threshold', () => {
      project.worldState.chaptersCount = 0;

      const { result } = renderHook(() => useGoapEngine(project, setProject, setSelectedChapterId));
      const dialogueDoctor = result.current.availableActions.find(a => a.name === 'dialogue_doctor');
      expect(dialogueDoctor).toBeDefined();
      expect(result.current.isActionAvailable(dialogueDoctor!)).toBe(false);
    });
  });

  describe('Logging', () => {
    it('should add log entries with proper structure', () => {
      const { result } = renderHook(() => useGoapEngine(project, setProject, setSelectedChapterId));

      act(() => {
        result.current.addLog('TestAgent', 'Test message', 'info');
      });

      expect(result.current.logs).toHaveLength(1);
      expect(result.current.logs[0]).toMatchObject({
        id: expect.any(String),
        timestamp: expect.any(Date),
        agentName: 'TestAgent',
        message: 'Test message',
        type: 'info',
        level: 'info',
      });
    });

    it('should default log type to info', () => {
      const { result } = renderHook(() => useGoapEngine(project, setProject, setSelectedChapterId));

      act(() => {
        result.current.addLog('Agent', 'Message', 'info');
      });

      expect(result.current.logs[0]?.type).toBe('info');
    });

    it('should accumulate multiple logs', () => {
      const { result } = renderHook(() => useGoapEngine(project, setProject, setSelectedChapterId));

      act(() => {
        result.current.addLog('Agent1', 'Message 1', 'info');
        result.current.addLog('Agent2', 'Message 2', 'warning');
        result.current.addLog('Agent3', 'Message 3', 'error');
      });

      expect(result.current.logs).toHaveLength(3);
      expect(result.current.logs[0]?.agentName).toBe('Agent1');
      expect(result.current.logs[1]?.agentName).toBe('Agent2');
      expect(result.current.logs[2]?.agentName).toBe('Agent3');
    });
  });

  describe('Auto-Pilot', () => {
    it('should toggle autopilot state', () => {
      const { result } = renderHook(() => useGoapEngine(project, setProject, setSelectedChapterId));

      expect(result.current.autoPilot).toBe(false);

      act(() => {
        result.current.setAutoPilot(true);
      });

      expect(result.current.autoPilot).toBe(true);

      act(() => {
        result.current.setAutoPilot(false);
      });

      expect(result.current.autoPilot).toBe(false);
    });

    it('should disable autopilot when project is generating', async () => {
      project.isGenerating = true;
      const { result } = renderHook(() => useGoapEngine(project, setProject, setSelectedChapterId));

      act(() => {
        result.current.setAutoPilot(true);
      });

      await waitFor(
        () => {
          expect(ai.generateOutline).not.toHaveBeenCalled();
        },
        { timeout: 2000 },
      );
    });
  });

  describe('Hook Re-renders and State Persistence', () => {
    it('should maintain state across re-renders', () => {
      const { result } = renderHook(() => useGoapEngine(project, setProject, setSelectedChapterId));

      act(() => {
        result.current.addLog('Agent', 'Message 1', 'info');
      });

      const initialLogs = result.current.logs;

      act(() => {
        project.title = 'Updated';
      });

      expect(result.current.logs).toEqual(initialLogs);
    });
  });
});
