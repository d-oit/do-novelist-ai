import { describe, it, expect, beforeEach } from 'vitest';

import type { Chapter } from '@/types';
import { ChapterStatus } from '@/types';

import {
  createChapter,
  updateChapter,
  calculateWordCount,
  calculateCharacterCount,
  calculateEstimatedReadingTime,
  updateChapterMetrics,
} from './chapter';

describe('chapter utilities', () => {
  describe('createChapter', () => {
    it('should create a chapter with required fields', () => {
      const chapter = createChapter({
        id: 'test-chapter-1',
        orderIndex: 1,
        title: 'Test Chapter',
      });

      expect(chapter.id).toBe('test-chapter-1');
      expect(chapter.orderIndex).toBe(1);
      expect(chapter.title).toBe('Test Chapter');
      expect(chapter.status).toBe('pending');
      expect(chapter.content).toBe('');
      expect(chapter.summary).toBe('');
    });

    it('should set default values for optional fields', () => {
      const chapter = createChapter({
        id: 'test-chapter-1',
        orderIndex: 1,
        title: 'Test Chapter',
      });

      expect(chapter.wordCount).toBe(0);
      expect(chapter.characterCount).toBe(0);
      expect(chapter.estimatedReadingTime).toBe(0);
      expect(chapter.tags).toEqual([]);
      expect(chapter.notes).toBe('');
      expect(chapter.createdAt).toBeInstanceOf(Date);
      expect(chapter.updatedAt).toBeInstanceOf(Date);
    });

    it('should accept and use provided optional fields', () => {
      const customDate = new Date('2026-01-15T10:00:00Z');

      const chapter = createChapter({
        id: 'test-chapter-2',
        orderIndex: 2,
        title: 'Custom Chapter',
        summary: 'A custom summary',
        content: 'Custom content here',
        status: ChapterStatus.DRAFTING,
        wordCount: 100,
        characterCount: 500,
        estimatedReadingTime: 5,
        tags: ['action', 'drama'],
        notes: 'Important notes',
        createdAt: customDate,
        updatedAt: customDate,
      });

      expect(chapter.summary).toBe('A custom summary');
      expect(chapter.content).toBe('Custom content here');
      expect(chapter.status).toBe('drafting'); // Status is stored as string value
      expect(chapter.wordCount).toBe(100);
      expect(chapter.characterCount).toBe(500);
      expect(chapter.estimatedReadingTime).toBe(5);
      expect(chapter.tags).toEqual(['action', 'drama']);
      expect(chapter.notes).toBe('Important notes');
      expect(chapter.createdAt).toEqual(customDate);
      expect(chapter.updatedAt).toEqual(customDate);
    });

    it('should accept AI generation metadata', () => {
      const chapter = createChapter({
        id: 'test-chapter-3',
        orderIndex: 3,
        title: 'AI Generated Chapter',
        generationPrompt: 'Write a chapter about adventure',
        aiModel: 'gpt-4',
        generationSettings: { temperature: 0.7, maxTokens: 2000 },
      });

      expect(chapter.generationPrompt).toBe('Write a chapter about adventure');
      expect(chapter.aiModel).toBe('gpt-4');
      expect(chapter.generationSettings).toEqual({ temperature: 0.7, maxTokens: 2000 });
    });

    it('should accept extended metadata', () => {
      const chapter = createChapter({
        id: 'test-chapter-4',
        orderIndex: 4,
        title: 'Extended Metadata Chapter',
        plotPoints: ['Hero meets mentor', 'Call to adventure'],
        characters: ['hero-1', 'mentor-1'],
        locations: ['tavern', 'castle'],
        scenes: ['scene-1', 'scene-2'],
      });

      expect(chapter.plotPoints).toEqual(['Hero meets mentor', 'Call to adventure']);
      expect(chapter.characters).toEqual(['hero-1', 'mentor-1']);
      expect(chapter.locations).toEqual(['tavern', 'castle']);
      expect(chapter.scenes).toEqual(['scene-1', 'scene-2']);
    });

    it('should handle illustration field', () => {
      const chapter = createChapter({
        id: 'test-chapter-5',
        orderIndex: 5,
        title: 'Illustrated Chapter',
        illustration: 'https://example.com/image.jpg',
      });

      expect(chapter.illustration).toBe('https://example.com/image.jpg');
    });
  });

  describe('updateChapter', () => {
    let existingChapter: Chapter;

    beforeEach(() => {
      existingChapter = createChapter({
        id: 'existing-chapter',
        orderIndex: 1,
        title: 'Existing Chapter',
        content: 'Original content',
        status: ChapterStatus.PENDING,
      });
    });

    it('should update chapter fields', () => {
      const updated = updateChapter(existingChapter, {
        title: 'Updated Title',
        content: 'Updated content',
      });

      expect(updated.title).toBe('Updated Title');
      expect(updated.content).toBe('Updated content');
      expect(updated.id).toBe(existingChapter.id);
      expect(updated.orderIndex).toBe(existingChapter.orderIndex);
    });

    it('should update the updatedAt timestamp', () => {
      const originalUpdatedAt = existingChapter.updatedAt;

      // Wait a tiny bit to ensure timestamp difference
      const updated = updateChapter(existingChapter, { title: 'New Title' });

      expect(updated.updatedAt).toBeInstanceOf(Date);
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
    });

    it('should preserve unchanged fields', () => {
      const updated = updateChapter(existingChapter, { status: ChapterStatus.COMPLETE });

      expect(updated.id).toBe(existingChapter.id);
      expect(updated.title).toBe(existingChapter.title);
      expect(updated.content).toBe(existingChapter.content);
      expect(updated.status).toBe('complete');
    });

    it('should allow updating multiple fields at once', () => {
      const updated = updateChapter(existingChapter, {
        title: 'New Title',
        summary: 'New Summary',
        content: 'New Content',
        status: ChapterStatus.DRAFTING,
        tags: ['updated'],
      });

      expect(updated.title).toBe('New Title');
      expect(updated.summary).toBe('New Summary');
      expect(updated.content).toBe('New Content');
      expect(updated.status).toBe('drafting');
      expect(updated.tags).toEqual(['updated']);
    });
  });

  describe('calculateWordCount', () => {
    it('should count words correctly', () => {
      expect(calculateWordCount('Hello world')).toBe(2);
      expect(calculateWordCount('The quick brown fox jumps')).toBe(5);
    });

    it('should handle multiple spaces', () => {
      expect(calculateWordCount('Hello    world')).toBe(2);
      expect(calculateWordCount('Multiple   spaces   between')).toBe(3);
    });

    it('should handle leading and trailing spaces', () => {
      expect(calculateWordCount('  Hello world  ')).toBe(2);
      expect(calculateWordCount('   Trimmed   ')).toBe(1);
    });

    it('should return 0 for empty strings', () => {
      expect(calculateWordCount('')).toBe(0);
      expect(calculateWordCount('   ')).toBe(0);
    });

    it('should handle newlines and tabs', () => {
      expect(calculateWordCount('Hello\nworld')).toBe(2);
      expect(calculateWordCount('Hello\tworld')).toBe(2);
      expect(calculateWordCount('Line one\nLine two\nLine three')).toBe(6);
    });

    it('should count single word', () => {
      expect(calculateWordCount('Hello')).toBe(1);
    });

    it('should handle punctuation', () => {
      expect(calculateWordCount('Hello, world!')).toBe(2);
      expect(calculateWordCount("It's a beautiful day.")).toBe(4);
    });
  });

  describe('calculateCharacterCount', () => {
    it('should count characters excluding whitespace', () => {
      expect(calculateCharacterCount('Hello world')).toBe(10);
      expect(calculateCharacterCount('abc def')).toBe(6);
    });

    it('should exclude all types of whitespace', () => {
      expect(calculateCharacterCount('Hello\nworld')).toBe(10);
      expect(calculateCharacterCount('Hello\tworld')).toBe(10);
      expect(calculateCharacterCount('Hello   world')).toBe(10);
    });

    it('should return 0 for empty strings', () => {
      expect(calculateCharacterCount('')).toBe(0);
      expect(calculateCharacterCount('   ')).toBe(0);
    });

    it('should count punctuation and special characters', () => {
      expect(calculateCharacterCount('Hello, world!')).toBe(12);
      expect(calculateCharacterCount('Test@123')).toBe(8);
    });

    it('should handle Unicode characters', () => {
      expect(calculateCharacterCount('Hello 世界')).toBe(7);
      expect(calculateCharacterCount('Emoji 😀')).toBe(7); // Emoji counts as 2 characters in JavaScript
    });
  });

  describe('calculateEstimatedReadingTime', () => {
    it('should calculate reading time based on 200 WPM', () => {
      expect(calculateEstimatedReadingTime(200)).toBe(1); // 1 minute
      expect(calculateEstimatedReadingTime(400)).toBe(2); // 2 minutes
      expect(calculateEstimatedReadingTime(1000)).toBe(5); // 5 minutes
    });

    it('should round up for partial minutes', () => {
      expect(calculateEstimatedReadingTime(250)).toBe(2); // 1.25 minutes -> 2
      expect(calculateEstimatedReadingTime(150)).toBe(1); // 0.75 minutes -> 1
      expect(calculateEstimatedReadingTime(50)).toBe(1); // 0.25 minutes -> 1
    });

    it('should return 0 for 0 words', () => {
      expect(calculateEstimatedReadingTime(0)).toBe(0);
    });

    it('should handle large word counts', () => {
      expect(calculateEstimatedReadingTime(10000)).toBe(50); // 50 minutes
      expect(calculateEstimatedReadingTime(20000)).toBe(100); // 100 minutes
    });
  });

  describe('updateChapterMetrics', () => {
    it('should calculate and update all metrics based on content', () => {
      const chapter = createChapter({
        id: 'test-chapter',
        orderIndex: 1,
        title: 'Test Chapter',
        content: 'The quick brown fox jumps over the lazy dog.',
      });

      const updated = updateChapterMetrics(chapter);

      expect(updated.wordCount).toBe(9);
      expect(updated.characterCount).toBe(36); // "Thequickbrownfoxjumpsoverthelazydog." (36 chars without spaces)
      expect(updated.estimatedReadingTime).toBe(1); // 9 words -> 1 minute
    });

    it('should update metrics for empty content', () => {
      const chapter = createChapter({
        id: 'test-chapter',
        orderIndex: 1,
        title: 'Empty Chapter',
        content: '',
      });

      const updated = updateChapterMetrics(chapter);

      expect(updated.wordCount).toBe(0);
      expect(updated.characterCount).toBe(0);
      expect(updated.estimatedReadingTime).toBe(0);
    });

    it('should update the updatedAt timestamp', () => {
      const chapter = createChapter({
        id: 'test-chapter',
        orderIndex: 1,
        title: 'Test Chapter',
        content: 'Some content here',
      });

      const originalUpdatedAt = chapter.updatedAt;
      const updated = updateChapterMetrics(chapter);

      expect(updated.updatedAt).toBeInstanceOf(Date);
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
    });

    it('should handle long content correctly', () => {
      const longContent = 'word '.repeat(1000).trim(); // 1000 words
      const chapter = createChapter({
        id: 'test-chapter',
        orderIndex: 1,
        title: 'Long Chapter',
        content: longContent,
      });

      const updated = updateChapterMetrics(chapter);

      expect(updated.wordCount).toBe(1000);
      expect(updated.estimatedReadingTime).toBe(5); // 1000 / 200 = 5 minutes
    });

    it('should preserve other chapter fields', () => {
      const chapter = createChapter({
        id: 'test-chapter',
        orderIndex: 1,
        title: 'Test Chapter',
        content: 'Test content',
        status: ChapterStatus.DRAFTING,
        tags: ['test', 'chapter'],
        notes: 'Test notes',
      });

      const updated = updateChapterMetrics(chapter);

      expect(updated.id).toBe(chapter.id);
      expect(updated.title).toBe(chapter.title);
      expect(updated.status).toBe('drafting');
      expect(updated.tags).toEqual(chapter.tags);
      expect(updated.notes).toBe(chapter.notes);
    });

    it('should handle content with mixed whitespace', () => {
      const chapter = createChapter({
        id: 'test-chapter',
        orderIndex: 1,
        title: 'Test Chapter',
        content: '  Hello   world  \n  Test   content  ',
      });

      const updated = updateChapterMetrics(chapter);

      expect(updated.wordCount).toBe(4);
      expect(updated.characterCount).toBe(21); // "HelloworldTestcontent" actually has 21 chars
    });
  });

  describe('integration tests', () => {
    it('should work with typical chapter creation and update workflow', () => {
      // Create new chapter
      const chapter = createChapter({
        id: 'chapter-1',
        orderIndex: 1,
        title: 'The Beginning',
      });

      expect(chapter.wordCount).toBe(0);
      expect(chapter.status).toBe('pending');

      // Add content
      const withContent = updateChapter(chapter, {
        content: 'This is the beginning of our story. It was a dark and stormy night.',
        status: ChapterStatus.DRAFTING,
      });

      // Update metrics
      const withMetrics = updateChapterMetrics(withContent);

      expect(withMetrics.wordCount).toBe(14);
      expect(withMetrics.characterCount).toBeGreaterThan(0);
      expect(withMetrics.estimatedReadingTime).toBe(1);
      expect(withMetrics.status).toBe('drafting');

      // Mark complete
      const completed = updateChapter(withMetrics, {
        status: ChapterStatus.COMPLETE,
      });

      expect(completed.status).toBe('complete');
      expect(completed.wordCount).toBe(14); // Metrics preserved
    });

    it('should handle chapter with all optional fields', () => {
      const fullChapter = createChapter({
        id: 'full-chapter',
        orderIndex: 5,
        title: 'Full Featured Chapter',
        summary: 'A chapter with all features',
        content: 'Complete content with all metadata',
        status: ChapterStatus.COMPLETE,
        illustration: 'https://example.com/image.jpg',
        tags: ['adventure', 'action'],
        notes: 'Editor notes here',
        generationPrompt: 'Generate an exciting chapter',
        aiModel: 'gpt-4',
        generationSettings: { temperature: 0.8 },
        plotPoints: ['Climax', 'Resolution'],
        characters: ['hero-1', 'villain-1'],
        locations: ['castle'],
        scenes: ['final-battle'],
      });

      const updated = updateChapterMetrics(fullChapter);

      expect(updated.wordCount).toBe(5);
      expect(updated.characterCount).toBe(30); // "Completecontentwithalmetadata" (30 chars without spaces)
      expect(updated.plotPoints).toEqual(['Climax', 'Resolution']);
      expect(updated.generationSettings).toEqual({ temperature: 0.8 });
    });
  });
});
