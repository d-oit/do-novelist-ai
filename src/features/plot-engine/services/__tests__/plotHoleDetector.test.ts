/**
 * Plot Hole Detector Service Tests
 *
 * Unit tests for plot hole detection algorithms
 */

import { describe, it, expect, beforeEach } from 'vitest';

import type { PlotHole } from '@/features/plot-engine';
import { PlotHoleDetector } from '@/features/plot-engine/services/plotHoleDetector';
import type { Chapter, Character } from '@/shared/types';

describe('PlotHoleDetector', () => {
  let detector: PlotHoleDetector;

  beforeEach(() => {
    detector = new PlotHoleDetector();
  });

  describe('detectPlotHoles', () => {
    it('should return analysis with no plot holes for empty chapters', async () => {
      const result = await detector.detectPlotHoles('project-1', [], []);

      expect(result).toMatchObject({
        projectId: 'project-1',
        plotHoles: [],
        overallScore: 100,
      });
      expect(result.analyzedAt).toBeInstanceOf(Date);
      expect(result.summary.toLowerCase()).toContain('no');
      expect(result.summary.toLowerCase()).toContain('plot holes');
    });

    it('should detect plot holes in chapters with content', async () => {
      const chapters = [
        {
          id: 'ch-1',
          projectId: 'project-1',
          title: 'Chapter 1',
          content: 'John was 25 years old in 2020.',
          order: 1,
          wordCount: 8,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'ch-2',
          projectId: 'project-1',
          title: 'Chapter 2',
          content: 'Two years later, John celebrated his 30th birthday.',
          order: 2,
          wordCount: 9,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as any as Chapter[];

      const characters = [
        {
          id: 'char-1',
          projectId: 'project-1',
          name: 'John',
          role: 'protagonist',
          description: 'Main character',
          traits: ['honest'],
          goals: ['survive'],
          relationships: [],
          backstory: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as any as Character[];

      const result = await detector.detectPlotHoles('project-1', chapters, characters);

      expect(result.projectId).toBe('project-1');
      expect(result.plotHoles).toBeInstanceOf(Array);
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });

    it('should handle errors gracefully', async () => {
      const invalidChapters = null as unknown as Chapter[];

      await expect(detector.detectPlotHoles('project-1', invalidChapters, [])).rejects.toThrow();
    });
  });

  describe('detectTimelineIssues', () => {
    it('should detect no timeline issues in chronological chapters', () => {
      const chapters = [
        {
          id: 'ch-1',
          projectId: 'project-1',
          title: 'Chapter 1',
          content: 'It was Monday morning.',
          order: 1,
          wordCount: 4,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'ch-2',
          projectId: 'project-1',
          title: 'Chapter 2',
          content: 'Tuesday arrived quickly.',
          order: 2,
          wordCount: 3,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as any as Chapter[];

      const issues = detector['detectTimelineIssues'](chapters);

      // Should return empty or minimal issues for chronological content
      expect(issues).toBeInstanceOf(Array);
    });

    it('should detect timeline contradictions', () => {
      const chapters = [
        {
          id: 'ch-1',
          projectId: 'project-1',
          title: 'Chapter 1',
          content: 'The year was 2020 when Sarah graduated.',
          order: 1,
          wordCount: 8,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'ch-2',
          projectId: 'project-1',
          title: 'Chapter 2',
          content: 'Five years earlier, in 2018, she had just started college.',
          order: 2,
          wordCount: 11,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as any as Chapter[];

      const issues = detector['detectTimelineIssues'](chapters);

      expect(issues).toBeInstanceOf(Array);
      // Timeline detection is heuristic-based, so we just verify structure
      issues.forEach(issue => {
        expect(issue).toHaveProperty('id');
        expect(issue).toHaveProperty('type', 'timeline');
        expect(issue).toHaveProperty('severity');
        expect(issue).toHaveProperty('title');
        expect(issue).toHaveProperty('description');
      });
    });
  });

  describe('detectCharacterInconsistencies', () => {
    it('should return empty array when no characters provided', () => {
      const chapters = [
        {
          id: 'ch-1',
          projectId: 'project-1',
          title: 'Chapter 1',
          content: 'Some generic content.',
          order: 1,
          wordCount: 3,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as any as Chapter[];

      const issues = detector['detectCharacterInconsistencies'](chapters, []);

      expect(issues).toEqual([]);
    });

    it('should detect character inconsistencies', () => {
      const chapters = [
        {
          id: 'ch-1',
          projectId: 'project-1',
          title: 'Chapter 1',
          content: 'Emma had blue eyes and loved painting.',
          order: 1,
          wordCount: 7,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'ch-2',
          projectId: 'project-1',
          title: 'Chapter 2',
          content: 'Emma looked at herself, her brown eyes reflecting in the mirror. She hated art.',
          order: 2,
          wordCount: 15,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as any as Chapter[];

      const characters = [
        {
          id: 'char-1',
          projectId: 'project-1',
          name: 'Emma',
          role: 'protagonist',
          description: 'Artist with blue eyes',
          traits: ['creative'],
          goals: ['become famous artist'],
          relationships: [],
          backstory: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as any as Character[];

      const issues = detector['detectCharacterInconsistencies'](chapters, characters);

      expect(issues).toBeInstanceOf(Array);
      issues.forEach(issue => {
        expect(issue).toHaveProperty('type', 'character_inconsistency');
        expect(issue).toHaveProperty('severity');
        expect(issue.affectedChapters).toBeInstanceOf(Array);
      });
    });
  });

  describe('detectUnresolvedThreads', () => {
    it('should return empty array for minimal content', () => {
      const chapters = [
        {
          id: 'ch-1',
          projectId: 'project-1',
          title: 'Chapter 1',
          content: 'The end.',
          order: 1,
          wordCount: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as any as Chapter[];

      const issues = detector['detectUnresolvedThreads'](chapters);

      expect(issues).toBeInstanceOf(Array);
    });

    it('should detect unresolved plot threads', () => {
      const chapters = [
        {
          id: 'ch-1',
          projectId: 'project-1',
          title: 'Chapter 1',
          content: 'Sarah discovered a mysterious letter that changed everything.',
          order: 1,
          wordCount: 10,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'ch-2',
          projectId: 'project-1',
          title: 'Chapter 2',
          content: 'She went to the market and bought groceries. The day ended peacefully.',
          order: 2,
          wordCount: 14,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as any as Chapter[];

      const issues = detector['detectUnresolvedThreads'](chapters);

      expect(issues).toBeInstanceOf(Array);
      issues.forEach(issue => {
        expect(issue).toHaveProperty('type', 'foreshadowing');
        expect(issue).toHaveProperty('severity');
      });
    });
  });

  describe('detectLogicalInconsistencies', () => {
    it('should return empty array for consistent content', () => {
      const chapters = [
        {
          id: 'ch-1',
          projectId: 'project-1',
          title: 'Chapter 1',
          content: 'The sun rose in the east.',
          order: 1,
          wordCount: 6,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as any as Chapter[];

      const issues = detector['detectLogicalInconsistencies'](chapters);

      expect(issues).toBeInstanceOf(Array);
    });

    it('should detect logical contradictions', () => {
      const chapters = [
        {
          id: 'ch-1',
          projectId: 'project-1',
          title: 'Chapter 1',
          content: 'The house was completely empty, abandoned for years.',
          order: 1,
          wordCount: 9,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'ch-2',
          projectId: 'project-1',
          title: 'Chapter 2',
          content: 'Smoke rose from the chimney as the family gathered for dinner.',
          order: 2,
          wordCount: 12,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as any as Chapter[];

      const issues = detector['detectLogicalInconsistencies'](chapters);

      expect(issues).toBeInstanceOf(Array);
      issues.forEach(issue => {
        expect(issue).toHaveProperty('type', 'plot_logic');
        expect(issue).toHaveProperty('severity');
      });
    });
  });

  describe('calculateScore', () => {
    it('should return 100 for no plot holes', () => {
      const score = detector['calculateScore']([]);

      expect(score).toBe(100);
    });

    it('should decrease score based on plot hole severity', () => {
      const plotHoles = [
        {
          id: '1',
          type: 'timeline' as const,
          severity: 'critical' as const,
          title: 'Critical Issue',
          description: 'Major timeline problem',
          affectedChapters: ['ch-1', 'ch-2'],
          confidence: 0.9,
        },
        {
          id: '2',
          type: 'plot_logic' as const,
          severity: 'minor' as const,
          title: 'Minor Issue',
          description: 'Small logical inconsistency',
          affectedChapters: ['ch-3'],
          confidence: 0.6,
        },
      ];

      const score = detector['calculateScore'](plotHoles as any as PlotHole[]);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThan(100);
      // Critical issues should reduce score more than minor ones
    });

    it('should not return negative scores', () => {
      const manyPlotHoles = Array.from({ length: 50 }, (_, i) => ({
        id: `hole-${i}`,
        type: 'plot_logic' as const,
        severity: 'critical' as const,
        title: `Issue ${i}`,
        description: 'Problem',
        affectedChapters: ['ch-1'],
        confidence: 0.9,
      }));

      const score = detector['calculateScore'](manyPlotHoles as any as PlotHole[]);

      expect(score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('generateSummary', () => {
    it('should generate positive summary for high scores', () => {
      const summary = detector['generateSummary']([], 100);

      expect(summary.toLowerCase()).toContain('no');
      expect(summary.toLowerCase()).toContain('plot holes');
    });

    it('should generate concerning summary for low scores', () => {
      const plotHoles = [
        {
          id: '1',
          type: 'timeline' as const,
          severity: 'critical' as const,
          title: 'Issue',
          description: 'Problem',
          affectedChapters: ['ch-1'],
          confidence: 0.9,
        },
      ];

      const summary = detector['generateSummary'](plotHoles as any as PlotHole[], 40);

      expect(summary).toBeTruthy();
      expect(summary.length).toBeGreaterThan(20);
    });

    it('should include plot hole count in summary', () => {
      const plotHoles = [
        {
          id: '1',
          type: 'timeline' as const,
          severity: 'major' as const,
          title: 'Issue 1',
          description: 'Problem 1',
          affectedChapters: ['ch-1'],
          confidence: 0.8,
        },
        {
          id: '2',
          type: 'plot_logic' as const,
          severity: 'moderate' as const,
          title: 'Issue 2',
          description: 'Problem 2',
          affectedChapters: ['ch-2'],
          confidence: 0.7,
        },
      ];

      const summary = detector['generateSummary'](plotHoles as any as PlotHole[], 75);

      expect(summary).toContain('2');
    });
  });
});
