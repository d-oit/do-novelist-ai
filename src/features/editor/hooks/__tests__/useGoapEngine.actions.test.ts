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

describe('useGoapEngine Hook - Action Execution', () => {
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
});
