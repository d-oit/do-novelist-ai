import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useGoapEngine } from '@/features/editor/hooks/useGoapEngine';
import * as ai from '@/lib/ai';
import type { Project, RefineOptions } from '@/types';
import { PublishStatus, ChapterStatus } from '@/types';

import { createChapter } from '@shared/utils';

// Mock AI functions
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

describe('useGoapEngine Hook', () => {
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

  describe('Action Execution - create_outline', () => {
    it('should execute create_outline action successfully', async () => {
      const { result } = renderHook(() => useGoapEngine(project, setProject, setSelectedChapterId));

      const mockOutline = {
        title: 'Generated Title',
        chapters: [
          { orderIndex: 1, title: 'Ch 1', summary: 'Sum 1' },
          { orderIndex: 2, title: 'Ch 2', summary: 'Sum 2' },
        ],
      };
      vi.mocked(ai.generateOutline).mockResolvedValue(mockOutline);

      const action = result.current.availableActions.find(a => a.name === 'create_outline');
      expect(action).toBeDefined();

      await act(async () => {
        await result.current.executeAction(action!);
      });

      expect(ai.generateOutline).toHaveBeenCalledWith(project.idea, project.style);
      expect(setProject).toHaveBeenCalled();
      expect(project.title).toBe('Generated Title');
      expect(project.chapters).toHaveLength(2);
      expect(project.worldState.hasOutline).toBe(true);
      expect(project.worldState.chaptersCount).toBe(2);
      expect(result.current.logs).toEqual(
        expect.arrayContaining([expect.objectContaining({ agentName: 'Architect', type: 'success' })]),
      );
    });

    it('should create proper chapter objects from outline', async () => {
      const { result } = renderHook(() => useGoapEngine(project, setProject, setSelectedChapterId));

      const mockOutline = {
        title: 'Test Book',
        chapters: [{ orderIndex: 1, title: 'Chapter One', summary: 'First chapter' }],
      };
      vi.mocked(ai.generateOutline).mockResolvedValue(mockOutline);

      const action = result.current.availableActions.find(a => a.name === 'create_outline');

      await act(async () => {
        await result.current.executeAction(action!);
      });

      expect(project.chapters[0]).toMatchObject({
        id: expect.stringContaining('p1_ch_'),
        orderIndex: 1,
        title: 'Chapter One',
        summary: 'First chapter',
        content: '',
        status: ChapterStatus.PENDING,
        wordCount: 0,
        characterCount: 0,
        estimatedReadingTime: 0,
        tags: [],
        notes: '',
      });
    });
  });

  describe('Action Execution - deepen_plot', () => {
    it('should execute deepen_plot action successfully', async () => {
      const { result } = renderHook(() => useGoapEngine(project, setProject, setSelectedChapterId));

      const originalIdea = project.idea;
      vi.mocked(ai.buildWorld).mockResolvedValue('Enhanced plot beats...');

      const action = result.current.availableActions.find(a => a.name === 'deepen_plot');
      expect(action).toBeDefined();

      await act(async () => {
        await result.current.executeAction(action!);
      });

      expect(ai.buildWorld).toHaveBeenCalledWith(originalIdea, project.style);
      expect(project.idea).toContain('--- PLOT ENHANCEMENTS ---');
      expect(project.idea).toContain('Enhanced plot beats...');
      expect(result.current.logs).toEqual(
        expect.arrayContaining([expect.objectContaining({ agentName: 'Architect' })]),
      );
    });
  });

  describe('Action Execution - develop_characters', () => {
    it('should execute develop_characters action successfully', async () => {
      const { result } = renderHook(() => useGoapEngine(project, setProject, setSelectedChapterId));

      const originalIdea = project.idea;
      vi.mocked(ai.developCharacters).mockResolvedValue('Hero: John Doe\nVillain: Jane Smith');

      const action = result.current.availableActions.find(a => a.name === 'develop_characters');
      expect(action).toBeDefined();

      await act(async () => {
        await result.current.executeAction(action!);
      });

      expect(ai.developCharacters).toHaveBeenCalledWith(originalIdea, project.style);
      expect(project.idea).toContain('--- CHARACTER PROFILES ---');
      expect(project.idea).toContain('Hero: John Doe');
      expect(result.current.logs).toEqual(expect.arrayContaining([expect.objectContaining({ agentName: 'Profiler' })]));
    });
  });

  describe('Action Execution - build_world', () => {
    it('should execute build_world action successfully', async () => {
      const { result } = renderHook(() => useGoapEngine(project, setProject, setSelectedChapterId));

      const originalIdea = project.idea;
      vi.mocked(ai.buildWorld).mockResolvedValue('Magic system: Elemental\nWorld: Earth 2.0');

      const action = result.current.availableActions.find(a => a.name === 'build_world');
      expect(action).toBeDefined();

      await act(async () => {
        await result.current.executeAction(action!);
      });

      expect(ai.buildWorld).toHaveBeenCalledWith(originalIdea, project.style);
      expect(project.idea).toContain('--- WORLD BIBLE ---');
      expect(project.idea).toContain('Magic system: Elemental');
      expect(result.current.logs).toEqual(expect.arrayContaining([expect.objectContaining({ agentName: 'Builder' })]));
    });
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

  describe('Action Execution - dialogue_doctor', () => {
    it('should execute dialogue_doctor action successfully', async () => {
      project.worldState.hasOutline = true;
      project.worldState.chaptersCount = 1;
      project.worldState.chaptersCompleted = 1;
      project.chapters = [
        createChapter({
          id: 'c1',
          orderIndex: 1,
          title: 'Ch 1',
          summary: 'Sum 1',
          content: 'Original dialogue',
          status: ChapterStatus.COMPLETE as ChapterStatus,
        }),
      ];

      const { result } = renderHook(() => useGoapEngine(project, setProject, setSelectedChapterId));

      vi.mocked(ai.polishDialogue).mockResolvedValue('Polished dialogue');

      const action = result.current.availableActions.find(a => a.name === 'dialogue_doctor');
      if (!action) throw new Error('Action not found');

      await act(async () => {
        await result.current.executeAction(action);
      });

      expect(ai.polishDialogue).toHaveBeenCalledWith('Original dialogue', project.style);
      expect(project.chapters[0]?.content).toBe('Polished dialogue');
      expect(setSelectedChapterId).toHaveBeenCalledWith('c1');
      expect(result.current.logs).toEqual(expect.arrayContaining([expect.objectContaining({ agentName: 'Doctor' })]));
    });

    it('should handle dialogue_doctor with no content available', async () => {
      project.worldState.hasOutline = true;
      project.worldState.chaptersCount = 1;
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

      const action = result.current.availableActions.find(a => a.name === 'dialogue_doctor');
      if (!action) throw new Error('Action not found');

      await act(async () => {
        await result.current.executeAction(action);
      });

      expect(ai.polishDialogue).not.toHaveBeenCalled();
      expect(result.current.logs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            agentName: 'Planner',
            message: 'No content available to polish dialogue.',
            type: 'warning',
          }),
        ]),
      );
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
