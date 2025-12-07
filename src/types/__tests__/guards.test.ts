/**
 * Tests for type guards and runtime type checking
 * Ensures proper type safety at runtime
 */

import { describe, it, expect } from 'vitest';

import {
  isProject,
  isChapter,
  isProjectId,
  isChapterId,
  isLogId,
  isBase64Image,
  isWordCount,
  isTemperature,
  createProjectId,
  createChapterId,
  createLogId,
  createWordCount,
  createTemperature,
  isProjectArray,
  isChapterArray,
  isNotNull,
  isNotUndefined,
  isNotNullish,
  isString,
  isNonEmptyString,
  isNumber,
  isPositiveNumber,
  isInteger,
  isPositiveInteger,
  isBoolean,
  isDate,
  isDateString,
  isObject,
  isPlainObject,
  isFunction,
  assertType,
  safeCast,
  hasKeys,
  hasAnyKey,
  allMatch,
  someMatch,
  createEnumGuard,
  isEnumValue,
} from '../guards';
import { ProjectSchema, ChapterSchema } from '../schemas';

describe('Type Guards Tests', () => {
  describe('Schema-based Type Guards', () => {
    it('should correctly identify valid projects', () => {
      const validProject = {
        id: 'proj_1234567890',
        title: 'Test Novel',
        idea: 'A great story',
        style: 'General Fiction',
        chapters: [],
        worldState: {
          hasTitle: true,
          hasOutline: false,
          chaptersCount: 0,
          chaptersCompleted: 0,
          styleDefined: true,
          isPublished: false,
        },
        isGenerating: false,
        status: 'Draft',
        language: 'en',
        targetWordCount: 50000,
        settings: {
          enableDropCaps: true,
        },
        genre: ['fiction'],
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
          id: '550e8400-e29b-41d4-a716-446655440001',
          projectId: 'proj_123',
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

      expect(isProject(validProject)).toBe(true);
    });

    it('should reject invalid projects', () => {
      const invalidProject = {
        id: 'invalid_id',
        title: 'Test',
        // Missing required fields
      };

      expect(isProject(invalidProject)).toBe(false);
    });

    it('should correctly identify valid chapters', () => {
      const validChapter = {
        id: 'proj_123_ch_manual_456',
        orderIndex: 1,
        title: 'Chapter 1',
        summary: 'First chapter',
        content: 'Chapter content',
        status: 'pending',
        wordCount: 100,
        characterCount: 500,
        estimatedReadingTime: 1,
        tags: [],
        notes: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(isChapter(validChapter)).toBe(true);
    });

    it('should reject invalid chapters', () => {
      const invalidChapter = {
        id: 'invalid_format',
        title: 'Chapter',
        // Missing required fields
      };

      expect(isChapter(invalidChapter)).toBe(false);
    });
  });

  describe('Branded Type Guards', () => {
    describe('ProjectId', () => {
      it('should validate correct project ID format', () => {
        expect(isProjectId('proj_1234567890')).toBe(true);
        expect(isProjectId('proj_0')).toBe(true);
      });

      it('should reject invalid project ID formats', () => {
        expect(isProjectId('project_123')).toBe(false);
        expect(isProjectId('proj_')).toBe(false);
        expect(isProjectId('proj_abc')).toBe(false);
        expect(isProjectId('123')).toBe(false);
        expect(isProjectId('')).toBe(false);
        expect(isProjectId(null)).toBe(false);
      });

      it('should create valid project IDs', () => {
        const projectId = createProjectId();
        expect(isProjectId(projectId)).toBe(true);
        expect(projectId).toMatch(/^proj_\d+$/);
      });
    });

    describe('ChapterId', () => {
      it('should validate correct chapter ID format', () => {
        expect(isChapterId('proj_123_ch_manual_456')).toBe(true);
        expect(isChapterId('proj_123_ch_auto_789')).toBe(true);
        expect(isChapterId('project_456_ch_test_101112')).toBe(true);
      });

      it('should reject invalid chapter ID formats', () => {
        expect(isChapterId('proj_123')).toBe(false);
        expect(isChapterId('ch_manual_456')).toBe(false);
        expect(isChapterId('proj_123_ch_')).toBe(false);
        expect(isChapterId('invalid')).toBe(false);
        expect(isChapterId('')).toBe(false);
        expect(isChapterId(null)).toBe(false);
      });

      it('should create valid chapter IDs', () => {
        const projectId = createProjectId();
        const chapterId = createChapterId(projectId);
        expect(isChapterId(chapterId)).toBe(true);
        expect(chapterId).toMatch(new RegExp(`^${projectId}_ch_manual_\\d+$`));
      });
    });

    describe('LogId', () => {
      it('should validate UUID format', () => {
        const uuid = '550e8400-e29b-41d4-a716-446655440000';
        expect(isLogId(uuid)).toBe(true);
      });

      it('should reject invalid UUID formats', () => {
        expect(isLogId('not-a-uuid')).toBe(false);
        expect(isLogId('550e8400-e29b-41d4-a716')).toBe(false);
        expect(isLogId('')).toBe(false);
        expect(isLogId(null)).toBe(false);
      });

      it('should create valid log IDs', () => {
        const logId = createLogId();
        expect(isLogId(logId)).toBe(true);
      });
    });

    describe('Base64Image', () => {
      it('should validate correct base64 image format', () => {
        expect(isBase64Image('data:image/png;base64,iVBORw0KGgoAAAANSU')).toBe(true);
        expect(isBase64Image('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ')).toBe(true);
        expect(isBase64Image('data:image/gif;base64,R0lGODlhAQABAIAA')).toBe(true);
      });

      it('should reject invalid formats', () => {
        expect(isBase64Image('data:text/plain;base64,SGVsbG8=')).toBe(false);
        expect(isBase64Image('base64,iVBORw0KGgoAAAANSU')).toBe(false);
        expect(isBase64Image('not-an-image')).toBe(false);
        expect(isBase64Image('')).toBe(false);
        expect(isBase64Image(null)).toBe(false);
      });
    });

    describe('WordCount', () => {
      it('should validate correct word count ranges', () => {
        expect(isWordCount(1000)).toBe(true);
        expect(isWordCount(50000)).toBe(true);
        expect(isWordCount(500000)).toBe(true);
      });

      it('should reject invalid word counts', () => {
        expect(isWordCount(999)).toBe(false); // Below minimum
        expect(isWordCount(500001)).toBe(false); // Above maximum
        expect(isWordCount(1000.5)).toBe(false); // Not integer
        expect(isWordCount('1000')).toBe(false); // Wrong type
        expect(isWordCount(null)).toBe(false);
      });

      it('should create valid word counts', () => {
        expect(createWordCount(5000)).toBe(5000);
        expect(createWordCount(500)).toBe(null); // Below minimum
        expect(createWordCount(1000000)).toBe(null); // Above maximum
      });
    });

    describe('Temperature', () => {
      it('should validate correct temperature ranges', () => {
        expect(isTemperature(0)).toBe(true);
        expect(isTemperature(0.7)).toBe(true);
        expect(isTemperature(2)).toBe(true);
      });

      it('should reject invalid temperatures', () => {
        expect(isTemperature(-0.1)).toBe(false); // Below minimum
        expect(isTemperature(2.1)).toBe(false); // Above maximum
        expect(isTemperature('0.7')).toBe(false); // Wrong type
        expect(isTemperature(null)).toBe(false);
      });

      it('should create valid temperatures', () => {
        expect(createTemperature(0.8)).toBe(0.8);
        expect(createTemperature(-1)).toBe(null); // Below minimum
        expect(createTemperature(3)).toBe(null); // Above maximum
      });
    });
  });

  describe('Array Type Guards', () => {
    it('should validate arrays of projects', () => {
      const validProjects = [
        ProjectSchema.parse({
          id: 'proj_1',
          title: 'Test 1',
          idea: 'Idea 1',
          style: 'General Fiction',
          chapters: [],
          worldState: {
            hasTitle: true,
            hasOutline: false,
            chaptersCount: 0,
            chaptersCompleted: 0,
            styleDefined: true,
            isPublished: false,
          },
          isGenerating: false,
          status: 'Draft',
          language: 'en',
          targetWordCount: 50000,
          settings: { enableDropCaps: true },
          genre: ['fiction'],
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
            id: '550e8400-e29b-41d4-a716-446655440002',
            projectId: 'proj_1',
            events: [],
            eras: [],
            settings: {
              viewMode: 'chronological',
              zoomLevel: 1,
              showCharacters: true,
              showImplicitEvents: false,
            },
          },
        }),
      ];

      expect(isProjectArray(validProjects)).toBe(true);
      expect(isProjectArray([])).toBe(true); // Empty array is valid
      expect(isProjectArray([{ invalid: 'project' }])).toBe(false);
      expect(isProjectArray('not an array')).toBe(false);
    });

    it('should validate arrays of chapters', () => {
      const validChapters = [
        ChapterSchema.parse({
          id: 'proj_123_ch_manual_456',
          orderIndex: 1,
          title: 'Chapter 1',
          summary: 'Summary',
          content: 'Content',
          status: 'pending',
        }),
      ];

      expect(isChapterArray(validChapters)).toBe(true);
      expect(isChapterArray([])).toBe(true);
      expect(isChapterArray([{ invalid: 'chapter' }])).toBe(false);
    });
  });

  describe('Utility Type Guards', () => {
    it('should check for non-null values', () => {
      expect(isNotNull('value')).toBe(true);
      expect(isNotNull(0)).toBe(true);
      expect(isNotNull(false)).toBe(true);
      expect(isNotNull(null)).toBe(false);
      expect(isNotNull(undefined)).toBe(true); // undefined is not null
    });

    it('should check for non-undefined values', () => {
      expect(isNotUndefined('value')).toBe(true);
      expect(isNotUndefined(0)).toBe(true);
      expect(isNotUndefined(false)).toBe(true);
      expect(isNotUndefined(null)).toBe(true); // null is not undefined
      expect(isNotUndefined(undefined)).toBe(false);
    });

    it('should check for non-nullish values', () => {
      expect(isNotNullish('value')).toBe(true);
      expect(isNotNullish(0)).toBe(true);
      expect(isNotNullish(false)).toBe(true);
      expect(isNotNullish(null)).toBe(false);
      expect(isNotNullish(undefined)).toBe(false);
    });

    it('should check for strings', () => {
      expect(isString('hello')).toBe(true);
      expect(isString('')).toBe(true);
      expect(isString(123)).toBe(false);
      expect(isString(null)).toBe(false);
    });

    it('should check for non-empty strings', () => {
      expect(isNonEmptyString('hello')).toBe(true);
      expect(isNonEmptyString(' ')).toBe(true); // Space counts as non-empty
      expect(isNonEmptyString('')).toBe(false);
      expect(isNonEmptyString(123)).toBe(false);
    });

    it('should check for numbers', () => {
      expect(isNumber(123)).toBe(true);
      expect(isNumber(0)).toBe(true);
      expect(isNumber(-45.67)).toBe(true);
      expect(isNumber(NaN)).toBe(false); // NaN is not a valid number
      expect(isNumber('123')).toBe(false);
    });

    it('should check for positive numbers', () => {
      expect(isPositiveNumber(123)).toBe(true);
      expect(isPositiveNumber(0.1)).toBe(true);
      expect(isPositiveNumber(0)).toBe(false);
      expect(isPositiveNumber(-1)).toBe(false);
    });

    it('should check for integers', () => {
      expect(isInteger(123)).toBe(true);
      expect(isInteger(0)).toBe(true);
      expect(isInteger(-45)).toBe(true);
      expect(isInteger(12.34)).toBe(false);
      expect(isInteger('123')).toBe(false);
    });

    it('should check for positive integers', () => {
      expect(isPositiveInteger(123)).toBe(true);
      expect(isPositiveInteger(1)).toBe(true);
      expect(isPositiveInteger(0)).toBe(false);
      expect(isPositiveInteger(-1)).toBe(false);
      expect(isPositiveInteger(12.34)).toBe(false);
    });

    it('should check for booleans', () => {
      expect(isBoolean(true)).toBe(true);
      expect(isBoolean(false)).toBe(true);
      expect(isBoolean(1)).toBe(false);
      expect(isBoolean('true')).toBe(false);
    });

    it('should check for dates', () => {
      expect(isDate(new Date())).toBe(true);
      expect(isDate(new Date('2024-01-01'))).toBe(true);
      expect(isDate(new Date('invalid'))).toBe(false); // Invalid date
      expect(isDate('2024-01-01')).toBe(false); // String, not Date object
    });

    it('should check for date strings', () => {
      expect(isDateString('2024-01-01')).toBe(true);
      expect(isDateString('January 1, 2024')).toBe(true);
      expect(isDateString('invalid date')).toBe(false);
      expect(isDateString(123)).toBe(false);
    });

    it('should check for objects', () => {
      expect(isObject({})).toBe(true);
      expect(isObject({ key: 'value' })).toBe(true);
      expect(isObject([])).toBe(false); // Arrays are not objects in this context
      expect(isObject(null)).toBe(false); // null is not an object
      expect(isObject('string')).toBe(false);
    });

    it('should check for plain objects', () => {
      expect(isPlainObject({})).toBe(true);
      expect(isPlainObject({ key: 'value' })).toBe(true);
      expect(isPlainObject(new Date())).toBe(false); // Date has different constructor
      expect(isPlainObject([])).toBe(false);
    });

    it('should check for functions', () => {
      expect(isFunction(() => {})).toBe(true);
      expect(isFunction(function () {})).toBe(true);
      expect(isFunction(Date)).toBe(true); // Constructor function
      expect(isFunction('not a function')).toBe(false);
    });
  });

  describe('Validation Helpers', () => {
    it('should assert types correctly', () => {
      const value: unknown = 'hello';

      expect(() => {
        assertType(value, isString);
        // At this point, TypeScript knows value is a string
      }).not.toThrow();

      expect(() => {
        assertType(123, isString, 'Expected string');
      }).toThrow('Expected string');
    });

    it('should safely cast values', () => {
      expect(safeCast('hello', isString)).toBe('hello');
      expect(safeCast(123, isString)).toBe(null);
      expect(safeCast(true, isBoolean)).toBe(true);
      expect(safeCast('true', isBoolean)).toBe(null);
    });

    it('should check for required keys', () => {
      const obj = { name: 'John', age: 30 };

      expect(hasKeys(obj, ['name'])).toBe(true);
      expect(hasKeys(obj, ['name', 'age'])).toBe(true);
      expect(hasKeys(obj, ['name', 'email'])).toBe(false);
      expect(hasKeys('not an object', ['key'])).toBe(false);
    });

    it('should check for any required key', () => {
      const obj = { name: 'John' };

      expect(hasAnyKey(obj, ['name', 'email'])).toBe(true);
      expect(hasAnyKey(obj, ['email', 'phone'])).toBe(false);
      expect(hasAnyKey('not an object', ['key'])).toBe(false);
    });

    it('should check if all items match', () => {
      const numbers = [1, 2, 3, 4, 5];
      const mixed = [1, '2', 3];

      expect(allMatch(numbers, isNumber)).toBe(true);
      expect(allMatch(mixed, isNumber)).toBe(false);
      expect(allMatch([], isNumber)).toBe(true); // Empty array matches
    });

    it('should check if some items match', () => {
      const mixed = [1, '2', true];
      const strings = ['a', 'b', 'c'];
      const numbers = [1, 2, 3];

      expect(someMatch(mixed, isString)).toBe(true);
      expect(someMatch(strings, isNumber)).toBe(false);
      expect(someMatch(numbers, isNumber)).toBe(true);
    });
  });

  describe('Enum Validation', () => {
    enum TestEnum {
      VALUE1 = 'value1',
      VALUE2 = 'value2',
      VALUE3 = 'value3',
    }

    it('should create enum guards', () => {
      const isTestEnum = createEnumGuard(TestEnum);

      expect(isTestEnum('value1')).toBe(true);
      expect(isTestEnum('value2')).toBe(true);
      expect(isTestEnum('invalid')).toBe(false);
      expect(isTestEnum(123)).toBe(false);
    });

    it('should validate enum values directly', () => {
      expect(isEnumValue(TestEnum, 'value1')).toBe(true);
      expect(isEnumValue(TestEnum, 'value2')).toBe(true);
      expect(isEnumValue(TestEnum, 'invalid')).toBe(false);
      expect(isEnumValue(TestEnum, null)).toBe(false);
    });
  });
});
