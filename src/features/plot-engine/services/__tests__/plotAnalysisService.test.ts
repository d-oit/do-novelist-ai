import { describe, it, expect, beforeEach } from 'vitest';

import { plotAnalysisService } from '@/features/plot-engine';
import type { Chapter } from '@/shared/types';
import { ChapterStatus } from '@/shared/types';

describe('PlotAnalysisService', () => {
  const mockChapters: Chapter[] = [
    {
      id: 'ch-1',
      projectId: 'p1',
      title: 'Chapter 1',
      content: 'The hero begins their journey. They face a small challenge but overcome it with courage.',
      summary: 'Beginning',
      orderIndex: 0,
      status: ChapterStatus.DRAFTING,
      wordCount: 100,
      characterCount: 10,
      estimatedReadingTime: 1,
      tags: [],
      notes: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'ch-2',
      projectId: 'p1',
      title: 'Chapter 2',
      content: 'Complications arise. The hero faces danger and must fight to survive. The tension increases.',
      summary: 'Rising action',
      orderIndex: 1,
      status: ChapterStatus.DRAFTING,
      wordCount: 100,
      characterCount: 10,
      estimatedReadingTime: 1,
      tags: [],
      notes: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'ch-3',
      projectId: 'p1',
      title: 'Chapter 3',
      content: 'The climax arrives. The hero confronts the enemy in a final battle. Everything is at stake.',
      summary: 'Climax',
      orderIndex: 2,
      status: ChapterStatus.DRAFTING,
      wordCount: 100,
      characterCount: 10,
      estimatedReadingTime: 1,
      tags: [],
      notes: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'ch-4',
      projectId: 'p1',
      title: 'Chapter 4',
      content: 'Peace returns. The hero rests and reflects on their journey. All is calm.',
      summary: 'Resolution',
      orderIndex: 3,
      status: ChapterStatus.DRAFTING,
      wordCount: 100,
      characterCount: 10,
      estimatedReadingTime: 1,
      tags: [],
      notes: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(() => {
    // Reset any state if needed
  });

  describe('analyzeProject', () => {
    it('should analyze story structure successfully', async () => {
      const result = await plotAnalysisService.analyzeProject('p1', mockChapters, {
        projectId: 'p1',
        includeStoryArc: true,
        includePacing: true,
      });

      expect(result).toBeDefined();
      expect(result.projectId).toBe('p1');
      expect(result.analyzedAt).toBeInstanceOf(Date);
      expect(result.storyArc).toBeDefined();
    });

    it('should detect 3-act structure for short stories', async () => {
      const result = await plotAnalysisService.analyzeProject('p1', mockChapters, {
        projectId: 'p1',
        includeStoryArc: true,
      });

      expect(result.storyArc?.structure).toBe('3-act');
    });

    it('should calculate coherence score', async () => {
      const result = await plotAnalysisService.analyzeProject('p1', mockChapters, {
        projectId: 'p1',
        includeStoryArc: true,
      });

      expect(result.storyArc?.coherence).toBeGreaterThan(0);
      expect(result.storyArc?.coherence).toBeLessThanOrEqual(1);
    });

    it('should analyze pacing across chapters', async () => {
      const result = await plotAnalysisService.analyzeProject('p1', mockChapters, {
        projectId: 'p1',
        includePacing: true,
      });

      expect(result.storyArc?.pacing).toBeDefined();
      expect(result.storyArc?.pacing.byChapter).toHaveLength(mockChapters.length);
      expect(result.storyArc?.pacing.overall).toMatch(/slow|moderate|fast/);
    });

    it('should generate tension curve', async () => {
      const result = await plotAnalysisService.analyzeProject('p1', mockChapters, {
        projectId: 'p1',
        includeStoryArc: true,
      });

      expect(result.storyArc?.tension).toBeDefined();
      expect(result.storyArc?.tension).toHaveLength(mockChapters.length);

      // Check tension increases toward middle
      const tensions = result.storyArc?.tension.map(t => t.tensionLevel) || [];
      expect(tensions[2]).toBeGreaterThan(tensions[0] ?? 0); // Climax > Beginning
    });

    it('should provide recommendations', async () => {
      const result = await plotAnalysisService.analyzeProject('p1', mockChapters, {
        projectId: 'p1',
        includeStoryArc: true,
      });

      expect(result.storyArc?.recommendations).toBeDefined();
      expect(Array.isArray(result.storyArc?.recommendations)).toBe(true);
    });

    it('should handle empty chapter list', async () => {
      const result = await plotAnalysisService.analyzeProject('p1', [], {
        projectId: 'p1',
        includeStoryArc: true,
      });

      expect(result).toBeDefined();
      expect(result.storyArc?.coherence).toBe(0);
    });

    it('should detect dialogue-heavy chapters as faster paced', async () => {
      const dialogueChapter: Chapter = {
        id: 'ch-dialogue',
        projectId: 'p1',
        title: 'Dialogue Chapter',
        content: '"Hello," she said. "How are you?" "I am fine," he replied. "What about you?" "Good, thanks."',
        summary: 'Lots of dialogue',
        orderIndex: 0,
        status: ChapterStatus.DRAFTING,
        wordCount: 100,
        characterCount: 10,
        estimatedReadingTime: 1,
        tags: [],
        notes: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await plotAnalysisService.analyzeProject('p1', [dialogueChapter], {
        projectId: 'p1',
        includePacing: true,
      });

      const chapterPace = result.storyArc?.pacing.byChapter[0]?.pace ?? 0;
      expect(chapterPace).toBeGreaterThan(50); // Should be faster than baseline
    });

    it('should detect action-heavy chapters as faster paced', async () => {
      const actionChapter: Chapter = {
        id: 'ch-action',
        projectId: 'p1',
        title: 'Action Chapter',
        content: 'He ran and jumped over the fence. She fought back and kicked the attacker. They rushed to escape.',
        summary: 'Action sequence',
        orderIndex: 0,
        status: ChapterStatus.DRAFTING,
        wordCount: 100,
        characterCount: 10,
        estimatedReadingTime: 1,
        tags: [],
        notes: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await plotAnalysisService.analyzeProject('p1', [actionChapter], {
        projectId: 'p1',
        includePacing: true,
      });

      const chapterPace = result.storyArc?.pacing.byChapter[0]?.pace ?? 0;
      expect(chapterPace).toBeGreaterThan(50); // Should be faster than baseline
    });
  });
});
